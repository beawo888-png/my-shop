#!/usr/bin/env node
/**
 * 매일 오전 9시(KST) 지점마다 크롬을 한 번 열어, 한 번 로그인한 채로 순서대로 처리한다.
 *   1. 전날 방문 예약 손님(이름·핸드폰번호, 취소는 비고 '취소') → 바탕화면 '판교점/모란점 예약고객.xlsx'의 '예약고객' 시트 맨 아래(일자 순)
 *   2. 영수증 리뷰 답글 — 별도 파이썬 프로그램(C:\클라우드\네이버플레이스 영수증 자동리뷰\daily_run.py)을 그 지점만 실행해
 *      끝날 때까지 기다린다. 그 프로그램은 자기 크롬·쿠키로 로그인한다. 경로는 config.json의 "reviewProgram"으로 바꿀 수 있다.
 *   3. 스마트플레이스 소식 등록
 * 로그인이 풀려 있으면 알림 창을 띄우고, 사장님이 그 크롬 창에서 로그인할 때까지 20분 기다린다.
 *
 * 사용법
 *   node scripts/smartplace/daily.mjs                       # 두 지점 전부
 *   옵션: --branch=pangyo|moran  --date=2026-10-17(엑셀에 적을 방문일)  --skip-news  --skip-reviews  --check(소식은 등록 직전까지만)
 */

import { spawn } from "node:child_process";
import path from "node:path";

import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { bookingBusinessId, bookingListUrl, exportBookings } from "../../lib/smartplace/bookings.mjs";
import { launchBrowser, LoginRequiredError, openWhenLoggedIn, postNews } from "../../lib/smartplace/browser.mjs";
import { alreadyPosted, appendLog, readConfig, readLog } from "../../lib/smartplace/local-store.mjs";
import { checkNewsText, loadNewsBank, selectNewsPost, validateNewsBank } from "../../lib/smartplace/news-bank.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

function parseArgs(argv) {
  const args = { branches: BRANCH_IDS, date: undefined, skipNews: false, skipReviews: false, check: false };
  for (const arg of argv) {
    if (arg === "--skip-news") args.skipNews = true;
    else if (arg === "--skip-reviews") args.skipReviews = true;
    else if (arg === "--check") args.check = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice(7);
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);
  return args;
}

const REVIEW_PROGRAM = {
  python: "C:\\Users\\USER\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
  script: "C:\\클라우드\\네이버플레이스 영수증 자동리뷰\\daily_run.py",
  timeoutMinutes: 60,
};

/** 소식 주소(.../bizes/place/8771182/feeds/new...)의 플레이스 번호 = 리뷰 프로그램의 지점 번호 */
function placeId(newsUrl) {
  const id = newsUrl?.match(/\/bizes\/place\/(\d+)/)?.[1];
  if (!id) throw new Error("플레이스 번호를 찾지 못했습니다. config.json의 newsUrl을 확인해 주세요.");
  return id;
}

/** 영수증 리뷰 답글 프로그램을 그 지점만 돌리고 끝날 때까지 기다린다. 돌려주는 값: 문제가 있으면 메시지 */
function runReviewReplies(storeId, settings = {}) {
  const { python, script, timeoutMinutes } = { ...REVIEW_PROGRAM, ...settings };
  return new Promise((resolve) => {
    const child = spawn(python, [script, storeId], {
      cwd: path.dirname(script),
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
      windowsHide: true,
    });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    const timer = setTimeout(() => child.kill(), timeoutMinutes * 60_000);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve(`리뷰 프로그램을 실행하지 못했습니다: ${error.message}`);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const lines = output.split(/\r?\n/).filter(Boolean);
      for (const line of lines.slice(-8)) console.log(`    ${line}`);
      if (signal) resolve(`리뷰 프로그램이 ${timeoutMinutes}분 안에 끝나지 않아 멈췄습니다.`);
      else if (code !== 0) resolve(`리뷰 프로그램이 오류로 끝났습니다(코드 ${code}).`);
      else resolve(null);
    });
  });
}

async function postTodayNews(page, { branchId, config, check, log, today }) {
  const name = BRANCHES[branchId].name;
  if (!check && alreadyPosted(log, today, branchId)) {
    console.log(`  소식: 오늘 이미 올렸습니다. 건너뜁니다.`);
    return null;
  }
  const bank = await loadNewsBank();
  const problems = validateNewsBank(bank);
  if (problems.length) throw new Error(`원고집에 문제가 있습니다: ${problems.join(", ")}`);
  const post = selectNewsPost({ posts: bank.posts, branchId, date: new Date() });
  const textProblems = checkNewsText(post.text);
  if (textProblems.length) throw new Error(`원고 점검 실패: ${textProblems.join(", ")}`);

  const result = await postNews(page, {
    url: config.branches[branchId].newsUrl,
    post,
    selectors: config.selectors,
    submit: !check,
    shotName: `${today}-${branchId}`,
  });
  if (check) {
    console.log(`  소식: 등록 직전까지 채웠습니다(등록 안 누름).`);
    return null;
  }
  await appendLog({ date: today, branch: branchId, postId: post.id, submitted: result.submitted, verified: result.verified, at: new Date().toISOString() });
  if (result.verified) {
    console.log(`  소식: ✅ 등록 완료 (${post.id})`);
    return null;
  }
  return `${name}: 소식 등록 버튼은 눌렀지만 완료 화면을 확인하지 못했습니다. 스마트플레이스에서 한 번 확인해 주세요.`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const today = kstDateKey(new Date());
  const visitDate = args.date ?? kstDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const config = await readConfig();
  const log = await readLog();
  const failures = [];

  for (const branchId of args.branches) {
    const name = BRANCHES[branchId].name;
    console.log(`\n━━━━━ ${name} · 오늘 ${today} · 방문일 ${visitDate} ━━━━━`);
    let bizId;
    try {
      bizId = bookingBusinessId(config.branches?.[branchId]?.newsUrl);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      continue;
    }

    const context = await launchBrowser({ branchId, channel: config.browserChannel ?? "chrome" });
    try {
      const page = context.pages()[0] ?? (await context.newPage());
      await openWhenLoggedIn(page, bookingListUrl(bizId, visitDate), {
        onWait: () => alertOwner(`${name} 네이버 로그인이 필요합니다. 방금 열린 크롬 창에서 ${name} 아이디로 로그인해 주세요. (20분 동안 기다립니다)`),
      });

      // 1. 전날 방문 손님 엑셀
      try {
        const r = await exportBookings(page, { branchId, bizId, date: visitDate });
        console.log(`  예약 엑셀: ${r.count}명 (취소 ${r.cancelled}건) → ${r.filePath}`);
      } catch (error) {
        failures.push(`${name} 예약 엑셀: ${error.message}`);
      }

      // 2. 영수증 리뷰 답글 (별도 프로그램, 이 지점만)
      if (!args.skipReviews) {
        console.log("  영수증 리뷰: 답글 프로그램 실행 중…");
        try {
          const problem = await runReviewReplies(placeId(config.branches[branchId].newsUrl), config.reviewProgram);
          if (problem) failures.push(`${name} 영수증 리뷰: ${problem}`);
          else console.log("  영수증 리뷰: 끝");
        } catch (error) {
          failures.push(`${name} 영수증 리뷰: ${error.message}`);
        }
      }

      // 3. 소식
      if (!args.skipNews) {
        try {
          const problem = await postTodayNews(page, { branchId, config, check: args.check, log, today });
          if (problem) failures.push(problem);
        } catch (error) {
          failures.push(`${name} 소식: ${error.message}`);
        }
      }
    } catch (error) {
      if (error instanceof LoginRequiredError) failures.push(`${name}: ${error.message} 이 지점은 오늘 작업을 하지 못했습니다.`);
      else failures.push(`${name}: ${error.message}`);
    } finally {
      await context.close().catch(() => {});
    }
  }

  if (failures.length) {
    alertOwner(failures.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("\n모든 작업을 마쳤습니다.");
  }
}

main().catch((error) => {
  alertOwner(error.message);
  process.exitCode = 1;
});

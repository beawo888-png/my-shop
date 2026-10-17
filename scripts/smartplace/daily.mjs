#!/usr/bin/env node
/**
 * 매일 오전 9시(KST) 지점마다 크롬을 한 번 열어, 한 번 로그인한 채로 순서대로 처리한다.
 *   1. 전날 방문 예약 손님(이름·핸드폰번호, 취소는 비고 '취소') → 바탕화면 '판교점/모란점 예약고객.xlsx'의 날짜 시트
 *   2. 영수증 리뷰 (아직 연결 안 됨 — 방식이 정해지면 여기에 넣는다)
 *   3. 스마트플레이스 소식 등록
 * 로그인이 풀려 있으면 알림 창을 띄우고, 사장님이 그 크롬 창에서 로그인할 때까지 20분 기다린다.
 *
 * 사용법
 *   node scripts/smartplace/daily.mjs                       # 두 지점 전부
 *   옵션: --branch=pangyo|moran  --date=2026-10-17(엑셀에 적을 방문일)  --skip-news  --check(소식은 등록 직전까지만)
 */

import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { bookingBusinessId, bookingListUrl, exportBookings } from "../../lib/smartplace/bookings.mjs";
import { launchBrowser, LoginRequiredError, openWhenLoggedIn, postNews } from "../../lib/smartplace/browser.mjs";
import { alreadyPosted, appendLog, readConfig, readLog } from "../../lib/smartplace/local-store.mjs";
import { checkNewsText, loadNewsBank, selectNewsPost, validateNewsBank } from "../../lib/smartplace/news-bank.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

function parseArgs(argv) {
  const args = { branches: BRANCH_IDS, date: undefined, skipNews: false, check: false };
  for (const arg of argv) {
    if (arg === "--skip-news") args.skipNews = true;
    else if (arg === "--check") args.check = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice(7);
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);
  return args;
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

      // 2. 영수증 리뷰 — 방식이 정해지면 여기에 연결한다.
      console.log("  영수증 리뷰: 아직 연결되지 않아 건너뜁니다.");

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

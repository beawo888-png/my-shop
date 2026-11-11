#!/usr/bin/env node
/**
 * 매일 오전 9시(KST)에 판교점·모란본점 네이버 스마트플레이스 '소식'을 올린다.
 * 사장님 PC의 작업 스케줄러가 실행한다 (docs/operations/smartplace-automation.md).
 *
 * 사용법
 *   node scripts/smartplace/post-daily-news.mjs              # 두 지점 발행
 *   node scripts/smartplace/post-daily-news.mjs --dry-run    # 브라우저 없이 오늘 원고만 보기
 *   node scripts/smartplace/post-daily-news.mjs --check      # 화면에 다 채우고 '등록'은 누르지 않기
 *   옵션: --branch=pangyo|moran  --date=2026-10-16  --force
 */

import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";

import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { launchBrowser, LoginRequiredError, postNews } from "../../lib/smartplace/browser.mjs";
import { alreadyPosted, appendLog, readConfig, readLog } from "../../lib/smartplace/local-store.mjs";
import { checkNewsText, loadNewsBank, loadNewsPlan, selectNewsPost, validateNewsBank, validateNewsPlan } from "../../lib/smartplace/news-bank.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, check: false, force: false, date: undefined, branches: BRANCH_IDS };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--force") args.force = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice(7);
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  return args;
}

/** 실패하면 사장님 PC 화면에 알림 창을 띄운다(윈도우). */
function alertOwner(message) {
  console.error(`\n❌ ${message}`);
  if (process.platform !== "win32") return;
  const safe = message.replace(/'/g, "''");
  const child = spawn(
    "powershell",
    ["-NoProfile", "-Command", `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${safe}', '스마트플레이스 소식 자동 발행')`],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = args.date ? new Date(`${args.date}T09:00:00+09:00`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);
  const today = kstDateKey(now);

  const bank = await loadNewsBank();
  const problems = validateNewsBank(bank);
  if (problems.length) throw new Error(`원고집에 문제가 있습니다:\n- ${problems.join("\n- ")}`);
  // 날짜별 원고(plan-YYYY-MM.json)에 그날 항목이 있으면 원고집보다 먼저 쓴다.
  const plan = await loadNewsPlan(now);
  const planProblems = validateNewsPlan(plan);
  if (planProblems.length) throw new Error(`날짜별 원고에 문제가 있습니다:\n- ${planProblems.join("\n- ")}`);

  const log = await readLog();
  const jobs = [];
  for (const branchId of args.branches) {
    const post = selectNewsPost({ posts: bank.posts, plan: plan.posts, branchId, date: now });
    const textProblems = checkNewsText(post.text, post);
    if (textProblems.length) throw new Error(`${BRANCHES[branchId].name} 원고 점검 실패: ${textProblems.join(", ")}`);

    const source = post.source === "plan" ? "날짜별 원고" : "요일별 원고집";
    console.log(`\n── ${today} · ${BRANCHES[branchId].name} · ${post.id} (${source}) · 사진 ${post.photo} ──\n`);
    console.log(`[제목] ${post.title}\n[본문]\n${post.body}`);

    if (!args.dryRun && !args.check && !args.force && alreadyPosted(log, today, branchId)) {
      console.log(`\n${BRANCHES[branchId].name}: 오늘 이미 올렸습니다. 건너뜁니다.`);
      continue;
    }
    jobs.push({ branchId, post });
  }
  console.log("\n────────────────────────────");
  if (args.dryRun || !jobs.length) return;

  const config = await readConfig();
  const missing = jobs.filter((job) => !config.branches?.[job.branchId]?.newsUrl);
  if (missing.length) {
    throw new Error(
      `${missing.map((job) => BRANCHES[job.branchId].name).join(", ")} 소식 작성 주소가 없습니다. 'npm run smartplace:setup'을 먼저 실행해 주세요.`,
    );
  }

  const failures = [];
  // 지점마다 네이버 아이디가 달라서, 지점별 크롬 프로필을 하나씩 열고 닫는다.
  for (const { branchId, post } of jobs) {
    const name = BRANCHES[branchId].name;
    const context = await launchBrowser({ branchId, channel: config.browserChannel ?? "chrome" });
    try {
      const page = context.pages()[0] ?? (await context.newPage());
      const result = await postNews(page, {
        url: config.branches[branchId].newsUrl,
        post,
        selectors: config.selectors,
        submit: !args.check,
        shotName: `${today}-${branchId}`,
      });
      if (args.check) {
        console.log(`\n🔎 ${name}: 등록 직전까지 채웠습니다. 화면을 확인하세요. (등록은 누르지 않았습니다)`);
        // 엣지 창은 로그인을 지키려고 켜 두므로, 창 대신 엔터로 다음 지점으로 넘어간다.
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        await rl.question("확인이 끝났으면 여기서 엔터를 누르세요. (창은 닫지 마세요) ");
        rl.close();
        continue;
      }
      await appendLog({
        date: today,
        branch: branchId,
        postId: post.id,
        submitted: result.submitted,
        verified: result.verified,
        at: new Date().toISOString(),
      });
      if (result.verified) console.log(`\n✅ ${name}: 소식 등록 완료`);
      else failures.push(`${name}: 등록 버튼은 눌렀지만 완료 화면을 확인하지 못했습니다. 스마트플레이스에서 한 번 확인해 주세요.`);
    } catch (error) {
      if (error instanceof LoginRequiredError) {
        failures.push(`${name} 네이버 로그인이 풀렸습니다. 'npm run smartplace:setup -- --branch=${branchId}'로 다시 로그인해 주세요.`);
      } else {
        failures.push(`${name}: ${error.message}`);
      }
    } finally {
      await context.close().catch(() => {});
    }
  }

  if (failures.length) {
    alertOwner(failures.join("\n"));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  alertOwner(error.message);
  process.exitCode = 1;
});

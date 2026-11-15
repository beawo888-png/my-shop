#!/usr/bin/env node
/**
 * 매장 전담 에이전트 실행. 매장마다 그 매장 에이전트 하나만 불러 처음부터 끝까지 처리한다.
 * 매장이 여러 개면 한 매장씩 차례로 돈다(서로 부르지 않고, 서로의 데이터를 보지 않는다).
 *
 * 한 매장에서 하는 일
 *   1. 스마트플레이스 일일 작업 (예약 엑셀 → 영수증 리뷰 답글 → 소식 → 블로그) = scripts/smartplace/daily.mjs --branch=<매장>
 *   2. 네이버 검색광고 키워드 정리 (검색량 없는 키워드 삭제, 돈만 쓰는 키워드 일시중지)
 *   3. 결과를 카카오톡으로 알림
 *
 * 사용법
 *   npm run agent:daily                              # 모든 매장
 *   npm run agent:daily -- --store=pangyo            # 한 매장만
 *   옵션: --skip-daily(스마트플레이스·블로그 건너뜀)  --skip-ads  --check(발행·적용 없이 확인만)  --force(오늘 이미 했어도 다시)
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { sendKakaoMemo } from "../../lib/notify/kakao.mjs";
import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { createSandbox } from "../../lib/store-agent/sandbox.mjs";
import { runSearchAdStep } from "../../lib/store-agent/searchad-step.mjs";
import { listStoreIds, loadStore } from "../../lib/store-agent/stores.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const ALERT_TITLE = "매장 전담 에이전트";

function parseArgs(argv) {
  const args = { stores: listStoreIds(), skipDaily: false, skipAds: false, check: false, force: false };
  for (const arg of argv) {
    if (arg === "--skip-daily") args.skipDaily = true;
    else if (arg === "--skip-ads") args.skipAds = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--force") args.force = true;
    else if (arg.startsWith("--store=")) args.stores = arg.slice(8).split(",").filter(Boolean);
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  if (!args.stores.length) throw new Error("매장이 없습니다. 'npm run agent:new-store'로 먼저 만들어 주세요.");
  return args;
}

/** 스마트플레이스·블로그 일일 작업을 이 매장만 돌린다. 돌려주는 값: 문제가 있으면 메시지 */
function runDaily(branchId, { check }) {
  const script = fileURLToPath(new URL("../smartplace/daily.mjs", import.meta.url));
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, `--branch=${branchId}`, ...(check ? ["--check"] : [])], { stdio: "inherit", windowsHide: true });
    child.on("error", (error) => resolve(`일일 작업을 실행하지 못했습니다: ${error.message}`));
    child.on("close", (code) => resolve(code === 0 ? null : "스마트플레이스·블로그 작업 중 문제가 있었습니다(PC 알림 창 확인)."));
  });
}

/** 매장 하나 = 전담 에이전트 한 번 실행 */
async function runStoreAgent(storeId, args, today) {
  const store = loadStore(storeId);
  const sandbox = createSandbox(store.id);
  await sandbox.init();
  const lines = [];
  const problems = [];
  console.log(`\n═════ ${store.shortName} 전담 에이전트 · ${today} ═════`);

  if (!args.skipDaily && store.channels?.smartplace !== false && store.branchId) {
    const problem = await runDaily(store.branchId, { check: args.check });
    if (problem) problems.push(problem);
    lines.push(problem ? "⚠️ 플레이스·블로그 확인 필요" : "✅ 플레이스·블로그");
  }

  if (!args.skipAds) {
    console.log("  검색광고: 키워드 성과 확인 중…");
    try {
      const result = await runSearchAdStep({ store, sandbox, today, check: args.check, force: args.force });
      console.log(`  검색광고: ${result.summary}`);
      const icon = { applied: "✅", nothing: "✅", pending: "🙋", waiting: "🙋", checked: "🔎", skipped: "➖" }[result.status] ?? "•";
      lines.push(`${icon} ${result.summary}`);
      if (result.failed?.length) problems.push(`검색광고 ${result.failed.length}건 실패: ${result.failed.map((f) => f.keyword).join(", ")}`);
    } catch (error) {
      problems.push(`검색광고: ${error.message}`);
      lines.push("❌ 검색광고 오류");
    }
  }

  await sandbox.appendHistory({ kind: "run", date: today, check: args.check, problems });
  return { store, lines, problems };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const today = kstDateKey(new Date());
  const failures = [];
  for (const storeId of args.stores) {
    try {
      const { store, lines, problems } = await runStoreAgent(storeId, args, today);
      failures.push(...problems.map((p) => `${store.shortName} ${p}`));
      if (!args.check && lines.length) {
        await sendKakaoMemo([`[${store.shortName} 에이전트] ${today.slice(5).replace("-", "/")}`, ...lines].join("\n"), {
          link: "https://searchad.naver.com/",
          buttonTitle: "검색광고 보기",
        });
      }
    } catch (error) {
      failures.push(`${storeId}: ${error.message}`);
    }
  }
  if (failures.length) {
    alertOwner(failures.join("\n"), ALERT_TITLE);
    process.exitCode = 1;
  } else {
    console.log("\n모든 매장 작업을 마쳤습니다.");
  }
}

main().catch((error) => {
  alertOwner(error.message, ALERT_TITLE);
  process.exitCode = 1;
});

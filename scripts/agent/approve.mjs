#!/usr/bin/env node
/**
 * 승인 대기 중인 계획을 확인하고 적용하거나 거절한다.
 *
 *   npm run agent:approve -- --store=pangyo            # 계획을 보여주고 물어본다
 *   npm run agent:approve -- --store=pangyo --yes      # 묻지 않고 승인
 *   npm run agent:approve -- --store=pangyo --reject   # 거절 (아무것도 바꾸지 않음)
 *
 * 일부만 빼고 싶으면: 화면에 나오는 pending 파일을 메모장으로 열어 "actions" 목록에서 그 키워드 항목을 지운 뒤 승인한다.
 * 뺀 키워드는 이 매장 기억에 "지킬 키워드"로 저장돼 다음부터 삭제·중지 후보에 오르지 않는다.
 * 고쳐서 승인하면 무수정 승인 횟수는 0으로 돌아간다(수습 기간 유지).
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { describePlan } from "../../lib/store-agent/keyword-rules.mjs";
import { createSandbox } from "../../lib/store-agent/sandbox.mjs";
import { CHANNEL, reviewPending } from "../../lib/store-agent/searchad-step.mjs";
import { loadStore } from "../../lib/store-agent/stores.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const args = { store: undefined, yes: false, reject: false };
for (const arg of process.argv.slice(2)) {
  if (arg === "--yes") args.yes = true;
  else if (arg === "--reject") args.reject = true;
  else if (arg.startsWith("--store=")) args.store = arg.slice(8);
  else throw new Error(`알 수 없는 옵션: ${arg}`);
}
if (!args.store) throw new Error("--store=<매장 id>가 필요합니다. 예: npm run agent:approve -- --store=pangyo");

const store = loadStore(args.store);
const sandbox = createSandbox(store.id);
const pending = await sandbox.readPending(CHANNEL);
if (!pending) {
  console.log(`${store.shortName}: 승인 대기 중인 계획이 없습니다.`);
  process.exit(0);
}

console.log(`\n━━━━━ ${store.shortName} · 검색광고 키워드 정리 (${pending.date} 계획) ━━━━━`);
console.log(`승인이 필요한 이유: ${pending.reasons.join(", ")}`);
console.log(describePlan(pending));
console.log(`\n일부만 빼려면 이 파일에서 그 항목을 지우고 다시 실행하세요:\n  ${sandbox.pendingPath(CHANNEL)}`);

let decision = args.reject ? "reject" : args.yes ? "approve" : null;
if (!decision) {
  const rl = readline.createInterface({ input, output });
  const answer = (await rl.question("\n적용할까요? (y = 적용 / n = 거절 / 그냥 엔터 = 나중에) ")).trim().toLowerCase();
  rl.close();
  if (answer === "y") decision = "approve";
  else if (answer === "n") decision = "reject";
  else {
    console.log("나중에 다시 확인합니다. 아무것도 바꾸지 않았습니다.");
    process.exit(0);
  }
}

const result = await reviewPending({ store, sandbox, decision, today: kstDateKey(new Date()) });
if (result.status === "rejected") {
  console.log("거절했습니다. 아무것도 바꾸지 않았고, 수습 기간이 처음부터 다시 시작됩니다.");
} else {
  console.log(`\n✅ 적용: ${result.summary}`);
  for (const f of result.failed) console.log(`  ❌ ${f.keyword}: ${f.error}`);
  if (result.removed.length) console.log(`다음부터 지킬 키워드로 기억했습니다: ${result.removed.join(", ")}`);
  if (result.edited) console.log("계획을 고쳐서 승인했으므로 무수정 승인 횟수는 0으로 돌아갑니다.");
  if (result.promoted) console.log("🎉 수정 없이 연속 승인돼 이제부터 검색광고 정리는 자동으로 적용합니다(예외만 승인 요청).");
  else if (result.trust.mode !== "auto") console.log(`무수정 승인 ${result.trust.streak}회째 (자동 전환까지 계속 확인합니다)`);
  if (result.failed.length) process.exitCode = 1;
}

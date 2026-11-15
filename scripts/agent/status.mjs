#!/usr/bin/env node
/**
 * 매장별 전담 에이전트 상태를 본다.
 *
 *   npm run agent:status
 *   npm run agent:status -- --store=pangyo --reset-trust     # 자동 발행을 끄고 수습 기간으로 되돌린다
 */

import { resolveRules } from "../../lib/store-agent/base-template.mjs";
import { CHANNELS, createSandbox } from "../../lib/store-agent/sandbox.mjs";
import { demote, trustState } from "../../lib/store-agent/trust.mjs";
import { listStoreIds, loadStore } from "../../lib/store-agent/stores.mjs";

const args = { stores: listStoreIds(), resetTrust: false };
for (const arg of process.argv.slice(2)) {
  if (arg === "--reset-trust") args.resetTrust = true;
  else if (arg.startsWith("--store=")) args.stores = arg.slice(8).split(",");
  else throw new Error(`알 수 없는 옵션: ${arg}`);
}
if (args.resetTrust && args.stores.length !== 1) throw new Error("--reset-trust는 --store=<매장 id> 하나와 같이 씁니다.");

const LABEL = { searchAd: "검색광고" };

for (const id of args.stores) {
  const store = loadStore(id);
  const sandbox = createSandbox(store.id);
  let memory = await sandbox.readMemory();
  if (args.resetTrust) {
    for (const channel of CHANNELS) memory = demote(memory, channel);
    await sandbox.writeMemory(memory);
    console.log(`${store.shortName}: 모든 채널을 수습 기간으로 되돌렸습니다.`);
  }
  const rules = resolveRules(store);
  const credentials = await sandbox.readCredentials();
  const pending = await sandbox.listPending();
  console.log(`\n■ ${store.shortName} (${store.id})`);
  for (const channel of CHANNELS) {
    const t = trustState(memory, channel);
    console.log(`  ${LABEL[channel]}: ${t.mode === "auto" ? "자동 적용" : `수습 (무수정 승인 ${t.streak}/${rules.trust.promoteAfter})`}`);
  }
  console.log(`  검색광고 연결: ${credentials?.campaignIds?.length ? `캠페인 ${credentials.campaignIds.length}개` : "안 됨 → npm run agent:ads-setup -- --store=" + store.id}`);
  console.log(`  핵심 키워드: ${(store.searchAd?.coreKeywords ?? []).join(", ") || "(없음)"}`);
  if (memory.protectedKeywords?.length) console.log(`  사장님이 지키라고 한 키워드: ${memory.protectedKeywords.join(", ")}`);
  console.log(`  승인 대기: ${pending.length ? pending.map((c) => LABEL[c] ?? c).join(", ") + ` → npm run agent:approve -- --store=${store.id}` : "없음"}`);
}

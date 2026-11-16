#!/usr/bin/env node
/**
 * 두 지점 검색광고 키워드 전부의 네이버 월간 검색수 → 바탕화면 `왕징 키워드 검색수.xlsx`. 읽기만 한다.
 *
 *   npm run ads:volumes
 *
 * 키워드가 약 10만 개라 처음에는 1시간 가까이 걸린다. 받은 검색수는 .smartplace/keyword-volumes.json에
 * 쌓아 두므로, 중간에 창을 닫거나 끊겨도 다시 실행하면 이어서 받는다(30일 동안은 다시 묻지 않음).
 */

import path from "node:path";

import { createClient, readSearchadKeys } from "../../lib/searchad/client.mjs";
import { collectAccount, lastDays } from "../../lib/searchad/keywords.mjs";
import { buildVolumeTable, fillVolumes, readVolumeCache, writeVolumeCache, writeVolumeReport } from "../../lib/searchad/volumes.mjs";
import { desktopDir } from "../../lib/smartplace/bookings.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";

const keys = await readSearchadKeys();
const range = lastDays(30);
const branches = [];
for (const id of BRANCH_IDS) {
  if (!keys[id]) {
    console.log(`⚠️  ${BRANCHES[id].name}: 검색광고 API 키가 없습니다. 'npm run ads:setup -- --branch=${id}'`);
    continue;
  }
  console.log(`\n━━━━━ ${BRANCHES[id].name}: 키워드와 30일 성과 읽기 ━━━━━`);
  const client = createClient(keys[id]);
  const account = await collectAccount(client, { timeRange: range, onProgress: (t) => console.log(`  읽음: ${t}`) });
  branches.push({ id, name: BRANCHES[id].name, account, client });
}
if (!branches.length) process.exit(1);

const cache = await readVolumeCache();
const all = branches.flatMap((b) => b.account.keywords.map((k) => k.keyword));
console.log(`\n━━━━━ 네이버 월간 검색수 (고유 키워드 약 ${new Set(all.map((k) => k.replace(/\s+/g, "").toUpperCase())).size.toLocaleString()}개) ━━━━━`);
console.log("  처음에는 오래 걸립니다. 끊겨도 다시 실행하면 이어서 받습니다.");
const result = await fillVolumes(branches[0].client, all, cache, {
  concurrency: 3,
  save: writeVolumeCache,
  onProgress: (t) => console.log(`  ${t}`),
});
console.log(`  새로 물어본 키워드 ${result.asked.toLocaleString()}개${result.failed ? `, 네이버가 거절한 ${result.failed}개는 '정보 없음'으로 둠` : ""}`);

const rows = buildVolumeTable(branches, cache);
console.log("\n검색 많은 키워드 TOP 20:");
for (const [i, r] of rows.slice(0, 20).entries()) {
  console.log(`  ${String(i + 1).padStart(2)}. ${r.keyword} — 월 ${r.volume.total.toLocaleString()}회 (${r.category})`);
}
const file = path.join(desktopDir(), "왕징 키워드 검색수.xlsx");
await writeVolumeReport(file, rows, branches, { range });
console.log(`\n✅ 엑셀을 만들었습니다: ${file}`);

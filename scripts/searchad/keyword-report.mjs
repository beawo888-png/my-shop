#!/usr/bin/env node
/**
 * 판교점·모란본점 검색광고 계정에 넣어 둔 키워드를 모두 읽어, 검색이 잘 되는 키워드와
 * 돈값을 하는 키워드를 가려 바탕화면 `왕징 검색광고 키워드 분석.xlsx`로 만든다.
 * 읽기만 하고 광고 설정은 아무것도 바꾸지 않는다.
 *
 *   npm run ads:keywords                  두 지점, 최근 30일(어제까지)
 *   npm run ads:keywords -- --days=14     기간 바꾸기
 *   npm run ads:keywords -- --branch=moran
 */

import { createClient, readSearchadKeys } from "../../lib/searchad/client.mjs";
import {
  analyzeGroups,
  analyzeKeywords,
  BRANCH_SEEDS,
  collectAccount,
  fetchRelated,
  fetchSearchVolumes,
  lastDays,
  pickCandidates,
} from "../../lib/searchad/keywords.mjs";
import { reportPath, topSearched, writeKeywordReport } from "../../lib/searchad/report.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const days = Number(arg("days") ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 90) throw new Error("--days는 1~90 사이 숫자로 써 주세요.");
const targets = arg("branch") ? arg("branch").split(",") : BRANCH_IDS;
for (const id of targets) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const keys = await readSearchadKeys();
const range = lastDays(days);
const results = [];

for (const branchId of targets) {
  const name = BRANCHES[branchId].name;
  if (!keys[branchId]) {
    console.log(`⚠️  ${name}: 검색광고 API 키가 없습니다. 'npm run ads:setup -- --branch=${branchId}'를 먼저 실행해 주세요.`);
    continue;
  }
  console.log(`\n━━━━━ ${name} (${range.since} ~ ${range.until}) ━━━━━`);
  const client = createClient(keys[branchId]);
  const warnings = [];
  const onError = (part, error) => warnings.push(`검색수 조회 실패: ${part.join(", ")} (${error.message})`);

  const account = await collectAccount(client, { timeRange: range, onProgress: (text) => console.log(`  읽음: ${text}`) });
  const volumes = await fetchSearchVolumes(client, account.keywords.map((k) => k.keyword), { onError });
  console.log(`  네이버 월간 검색수: ${volumes.size}개 키워드`);
  const analysis = analyzeKeywords(account, volumes);
  const groups = analyzeGroups(account);

  const seeds = BRANCH_SEEDS[branchId];
  const related = await fetchRelated(client, seeds.hints, { onError });
  const candidates = pickCandidates(related, { areas: seeds.areas, registered: account.keywords.map((k) => k.keyword) });
  console.log(`  새 키워드 후보: ${candidates.length}개`);

  if (!account.keywords.length) warnings.push("직접 넣은 키워드가 없습니다. 플레이스 광고만 쓰는 계정이면 '광고그룹' 시트에서 성과를 보세요.");
  results.push({ name, range, analysis, groups, candidates, warnings });

  console.log("  검색 많이 되는 키워드 TOP 5:");
  for (const row of topSearched(analysis.rows, 5)) {
    console.log(`    ${row.keyword} — 월 ${row.searches.text || row.searches.total.toLocaleString()}회 검색, 30일 클릭 ${row.clicks}, 광고비 ${row.cost.toLocaleString()}원 [${row.verdict}]`);
  }
  for (const warning of warnings) console.log(`  ⚠️  ${warning}`);
}

if (!results.length) process.exit(1);
const file = reportPath();
await writeKeywordReport(file, results);
console.log(`\n✅ 엑셀을 만들었습니다: ${file}`);

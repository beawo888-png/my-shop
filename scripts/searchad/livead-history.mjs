#!/usr/bin/env node
/**
 * 라이브애드가 멈춘 날과 예약이 줄어든 날이 겹치는지 본다. 읽기만 한다.
 *
 *   npm run ads:history                                  8/1부터 어제까지, 두 지점
 *   npm run ads:history -- --since=2026-09-01 --until=2026-09-30
 *   npm run ads:history -- --branch=moran
 *   npm run ads:history -- --since=2025-01-01       1년 넘게 길게 (오래된 기간은 네이버가 거절할 수 있다)
 *
 * 결과: 바탕화면 `왕징 라이브애드 기간 점검.xlsx`
 * 예약 수는 바탕화면 `판교점 예약고객.xlsx`, `모란점 예약고객.xlsx`에서 읽는다.
 * 8월 예약이 엑셀에 없으면 먼저: npm run smartplace:bookings-backfill -- --from=2026-08-01
 */

import path from "node:path";

import { createClient, readSearchadKeys } from "../../lib/searchad/client.mjs";
import { buildDailyRows, collectHistory, compareBookings, markLiveAd, readBookingCounts, writeHistoryReport } from "../../lib/searchad/history.mjs";
import { lastDays } from "../../lib/searchad/keywords.mjs";
import { BOOKING_FILE_LABEL, bookingWorkbookPath, desktopDir } from "../../lib/smartplace/bookings.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const range = { since: arg("since") ?? "2026-08-01", until: arg("until") ?? lastDays(1).until };
for (const key of ["since", "until"]) if (!/^\d{4}-\d{2}-\d{2}$/.test(range[key])) throw new Error(`--${key}=YYYY-MM-DD 로 써 주세요.`);
if (range.since > range.until) throw new Error("--since가 --until보다 늦습니다.");
const targets = arg("branch") ? arg("branch").split(",") : BRANCH_IDS;
for (const id of targets) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const keys = await readSearchadKeys();
const results = [];
for (const branchId of targets) {
  const name = BRANCHES[branchId].name;
  if (!keys[branchId]) {
    console.log(`⚠️  ${name}: 검색광고 API 키가 없습니다. 'npm run ads:setup -- --branch=${branchId}'를 먼저 실행해 주세요.`);
    continue;
  }
  console.log(`\n━━━━━ ${name} (${range.since} ~ ${range.until}) ━━━━━`);
  // 네이버가 거절한 기간(너무 오래된 기간 등)은 모아서 알려 준다.
  const refused = new Map();
  const onError = ({ since, until }, error) => refused.set(`${since}~${until}`, error.message);
  const history = await collectHistory(createClient(keys[branchId]), range, { onProgress: (t) => console.log(`  ${t}`), onError });
  const warnings = [...refused].map(([window, message]) => `네이버가 ${window} 성과를 주지 않았습니다 (${message.slice(0, 60)})`);
  for (const warning of warnings) console.log(`  ⚠️  ${warning}`);
  const firstDay = history.flatMap((h) => [...h.days.entries()].filter(([, r]) => Number(r.impCnt) > 0).map(([d]) => d)).sort()[0];
  if (firstDay) console.log(`  광고 성과가 있는 가장 이른 날: ${firstDay}`);
  const liveAdCount = history.filter((h) => h.group === "라이브애드").length;
  console.log(`  라이브애드 캠페인(이름에 '프로그램'): ${liveAdCount}개`);

  const bookingFile = bookingWorkbookPath(BOOKING_FILE_LABEL[branchId]);
  const bookings = await readBookingCounts(bookingFile);
  if (!bookings) console.log(`  ⚠️  예약 엑셀을 찾지 못했습니다: ${bookingFile}`);

  const rows = buildDailyRows(history, range, bookings);
  const typical = markLiveAd(rows);
  const comparison = compareBookings(rows);
  results.push({ name, range, rows, typical, comparison, hasBookings: Boolean(bookings), warnings });

  const f = (v) => (v === null ? "자료 없음" : v.toFixed(1));
  console.log(`  멈춤 의심인 날: ${comparison.downDays}일 ${comparison.downDates.length ? `(${comparison.downDates.slice(0, 10).join(", ")}${comparison.downDates.length > 10 ? " …" : ""})` : ""}`);
  console.log(`  하루 평균 예약: 정상 ${f(comparison.normalAvg)}건 · 멈춤 의심 ${f(comparison.downAvg)}건 · 같은 요일 대비 ${f(comparison.perDayGap)}건`);
  if (comparison.missingBookingDays) console.log(`  예약 엑셀에 없는 날 ${comparison.missingBookingDays}일은 비교에서 뺐습니다.`);
}

if (!results.length) process.exit(1);
const file = path.join(desktopDir(), "왕징 라이브애드 기간 점검.xlsx");
await writeHistoryReport(file, results);
console.log(`\n✅ 엑셀을 만들었습니다: ${file}`);

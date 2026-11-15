import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createClient } from "../lib/searchad/client.mjs";
import {
  buildDailyRows,
  campaignGroup,
  collectHistory,
  compareBookings,
  dateWindows,
  markLiveAd,
  readBookingCounts,
  weekday,
  writeHistoryReport,
} from "../lib/searchad/history.mjs";

const quiet = { wait: async () => {}, now: () => 1700000000000 };

test("캠페인 묶음: 이름에 '프로그램' = 라이브애드, 나머지는 광고 종류대로", () => {
  assert.equal(campaignGroup({ name: "성남맛집/프로그램", campaignTp: "PLACE" }), "라이브애드");
  assert.equal(campaignGroup({ name: "판교왕징_플레이스", campaignTp: "PLACE" }), "플레이스(직접)");
  assert.equal(campaignGroup({ name: "파워컨텐츠#1", campaignTp: "POWER_CONTENTS" }), "파워컨텐츠");
  assert.equal(campaignGroup({ name: "상위노출", campaignTp: "WEB_SITE" }), "파워링크");
  assert.equal(weekday("2026-09-25"), "금");
});

test("긴 기간은 31일씩 나눠서, 캠페인마다 날짜별 성과를 묻는다", async () => {
  assert.deepEqual(dateWindows("2026-08-01", "2026-10-05"), [
    { since: "2026-08-01", until: "2026-08-31" },
    { since: "2026-09-01", until: "2026-10-01" },
    { since: "2026-10-02", until: "2026-10-05" },
  ]);
  const calls = [];
  const fetch = async (url) => {
    const { pathname, searchParams } = new URL(url);
    calls.push({ pathname, params: Object.fromEntries(searchParams) });
    if (pathname === "/ncc/campaigns") return new Response(JSON.stringify([{ nccCampaignId: "cmp-1", name: "모란맛집 프로그램", campaignTp: "PLACE" }]));
    const { since } = JSON.parse(searchParams.get("timeRange"));
    return new Response(JSON.stringify({ data: [{ dateStart: since, dateEnd: since, impCnt: 100, clkCnt: 5, salesAmt: 9000, avgRnk: 1.2 }] }));
  };
  const history = await collectHistory(createClient({ apiKey: "a", secretKey: "b", customerId: 1 }, { ...quiet, fetch }), { since: "2026-08-01", until: "2026-09-10" });
  const stats = calls.filter((c) => c.pathname === "/stats");
  assert.equal(stats.length, 2);
  assert.equal(stats[0].params.id, "cmp-1");
  assert.equal(stats[0].params.timeIncrement, "1");
  assert.equal(history[0].group, "라이브애드");
  assert.equal(history[0].days.get("2026-09-01").clkCnt, 5);
});

/** 9월 한 달: 라이브애드가 9/15~9/18(화~금) 멈추고, 그날 예약이 줄어든 상황 */
function septemberCase() {
  const range = { since: "2026-09-01", until: "2026-09-30" };
  const liveAd = new Map();
  const direct = new Map();
  const bookings = new Map();
  for (let d = 1; d <= 30; d += 1) {
    const date = `2026-09-${String(d).padStart(2, "0")}`;
    const down = d >= 15 && d <= 18;
    liveAd.set(date, { impCnt: down ? 30 : 1000, clkCnt: down ? 1 : 40, salesAmt: down ? 2000 : 80000, avgRnk: down ? 6 : 1.1 });
    direct.set(date, { impCnt: 3000, clkCnt: 90, salesAmt: 27000 });
    const base = ["토", "일"].includes(weekday(date)) ? 30 : 20;
    bookings.set(date, down ? base - 8 : base);
  }
  bookings.delete("2026-09-30"); // 엑셀에 아직 없는 날
  const history = [
    { group: "라이브애드", days: liveAd },
    { group: "플레이스(직접)", days: direct },
  ];
  return { range, history, bookings };
}

test("라이브애드가 멈춘 날을 찾아, 같은 요일 평소와 예약 수를 비교한다", () => {
  const { range, history, bookings } = septemberCase();
  const rows = buildDailyRows(history, range, bookings);
  assert.equal(rows.length, 30);
  assert.equal(rows[0]["라이브애드"].clicks, 40);
  assert.equal(rows[0].totalCost, 107000);
  assert.equal(rows[0].liveAdRank, 1.1);

  assert.equal(markLiveAd(rows), 1000);
  const c = compareBookings(rows);
  assert.deepEqual(c.downDates, ["2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]);
  assert.equal(c.downDays, 4);
  assert.equal(c.normalDays, 25);
  assert.equal(c.missingBookingDays, 1);
  assert.equal(c.downAvg, 12);
  assert.equal(c.perDayGap, -8, "멈춘 날은 같은 요일 평소보다 하루 8건 적었다");
});

test("예약고객 엑셀: 취소는 빼고, 예약 없던 날은 0건, 엑셀 밖 날짜는 자료 없음", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "history-"));
  try {
    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("예약고객");
    sheet.addRow(["일자", "고객님 이름", "핸드폰번호", "비고"]);
    sheet.addRow(["2026-09-01", "김", "010", ""]);
    sheet.addRow(["2026-09-01", "이", "010", "취소"]);
    sheet.addRow(["2026-09-01", "박", "010", ""]);
    sheet.addRow(["2026-09-03", "최", "010", ""]);
    const file = path.join(dir, "bookings.xlsx");
    await book.xlsx.writeFile(file);

    const counts = await readBookingCounts(file);
    assert.equal(counts.get("2026-09-01"), 2);
    assert.equal(counts.get("2026-09-02"), 0);
    assert.equal(counts.get("2026-09-03"), 1);
    assert.equal(counts.has("2026-09-04"), false);
    assert.equal(await readBookingCounts(path.join(dir, "none.xlsx")), null);

    const { range, history, bookings } = septemberCase();
    const rows = buildDailyRows(history, range, bookings);
    const typical = markLiveAd(rows);
    const out = path.join(dir, "report.xlsx");
    await writeHistoryReport(out, [{ name: "모란본점", range, rows, typical, comparison: compareBookings(rows), hasBookings: true }]);
    const read = new ExcelJS.Workbook();
    await read.xlsx.readFile(out);
    assert.deepEqual(read.worksheets.map((s) => s.name), ["요약", "모란 날짜별"]);
    assert.equal(read.getWorksheet("모란 날짜별").getCell("C16").value, "멈춤 의심");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("노출은 그대로인데 순위만 밀린 날도 멈춤 의심으로 본다", () => {
  const history = [{ group: "라이브애드", days: new Map([
    ["2026-09-01", { impCnt: 1000, avgRnk: 1.2 }],
    ["2026-09-02", { impCnt: 1000, avgRnk: 1.1 }],
    ["2026-09-03", { impCnt: 900, avgRnk: 4.5 }],
    ["2026-09-04", { impCnt: 1000, avgRnk: 1.3 }],
  ]) }];
  const rows = buildDailyRows(history, { since: "2026-09-01", until: "2026-09-04" }, null);
  markLiveAd(rows);
  assert.deepEqual(rows.map((r) => r.liveAdStatus), ["정상", "정상", "멈춤 의심", "정상"]);
  assert.equal(compareBookings(rows).normalAvg, null, "예약 엑셀이 없으면 비교하지 않는다");
});

test("8월처럼 노출은 절반쯤 남고 클릭만 크게 줄어도 멈춤 의심으로 잡는다", () => {
  const days = new Map();
  for (let d = 1; d <= 20; d += 1) {
    const date = `2026-08-${String(d).padStart(2, "0")}`;
    const weak = d >= 14;
    days.set(date, { impCnt: weak ? 2300 : 4100, clkCnt: weak ? 12 : 40, avgRnk: 2.1 });
  }
  const rows = buildDailyRows([{ group: "라이브애드", days }], { since: "2026-08-01", until: "2026-08-20" }, null);
  markLiveAd(rows);
  assert.deepEqual(rows.filter((r) => r.liveAdStatus === "멈춤 의심").map((r) => r.date.slice(8)), ["14", "15", "16", "17", "18", "19", "20"]);
});

test("오래된 기간을 네이버가 거절하면(400) 그 구간만 건너뛰고 나머지는 받는다", async () => {
  const fetch = async (url) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/ncc/campaigns") return new Response(JSON.stringify([{ nccCampaignId: "cmp-1", name: "성남맛집/프로그램", campaignTp: "PLACE" }]));
    const { since } = JSON.parse(searchParams.get("timeRange"));
    if (since < "2025-03-01") return new Response(JSON.stringify({ code: 11000, title: "조회 기간 초과" }), { status: 400 });
    return new Response(JSON.stringify({ data: [{ dateStart: since, impCnt: 10, clkCnt: 1 }] }));
  };
  const refused = [];
  const history = await collectHistory(createClient({ apiKey: "a", secretKey: "b", customerId: 1 }, { ...quiet, fetch }), { since: "2025-01-01", until: "2025-04-10" }, { onError: (w) => refused.push(w.since) });
  assert.deepEqual(refused, ["2025-01-01", "2025-02-01"]);
  assert.deepEqual([...history[0].days.keys()], ["2025-03-04", "2025-04-04"]);
});

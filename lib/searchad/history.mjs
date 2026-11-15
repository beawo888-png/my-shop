/**
 * 라이브애드가 멈춘 날과 예약이 줄어든 날이 겹치는지 보는 기간 점검.
 *
 * 캠페인마다 날짜별 성과를 받고(네이버 /stats, timeIncrement=1), 바탕화면 예약고객 엑셀의 날짜별 예약 수와 나란히 놓는다.
 * 라이브애드 캠페인은 이름에 '프로그램'이 들어간 캠페인이다(사장님 계정의 실제 이름 규칙).
 * 읽기만 하고 아무것도 바꾸지 않는다.
 */

import { CAMPAIGN_TYPES, STAT_FIELDS, mapLimit } from "./keywords.mjs";

export const LIVEAD_MARK = "프로그램";
export const GROUPS = ["라이브애드", "플레이스(직접)", "파워컨텐츠", "파워링크", "기타"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function campaignGroup(campaign) {
  if (String(campaign?.name ?? "").includes(LIVEAD_MARK)) return "라이브애드";
  const type = CAMPAIGN_TYPES[campaign?.campaignTp];
  if (type === "플레이스") return "플레이스(직접)";
  if (type === "파워컨텐츠" || type === "파워링크") return type;
  return "기타";
}

const toDate = (key) => new Date(`${key}T00:00:00Z`);
const toKey = (date) => date.toISOString().slice(0, 10);
export const addDays = (key, n) => toKey(new Date(toDate(key).getTime() + n * 86_400_000));
export const weekday = (key) => WEEKDAYS[toDate(key).getUTCDay()];

export function dateList(since, until) {
  const out = [];
  for (let d = since; d <= until; d = addDays(d, 1)) out.push(d);
  return out;
}

/** 네이버가 한 번에 긴 기간을 거절할 수 있어 31일씩 나눠 묻는다. */
export function dateWindows(since, until, maxDays = 31) {
  const out = [];
  for (let start = since; start <= until; start = addDays(start, maxDays)) {
    const end = addDays(start, maxDays - 1);
    out.push({ since: start, until: end < until ? end : until });
  }
  return out;
}

/** 캠페인 하나의 날짜별 성과: Map<YYYY-MM-DD, row> */
export async function fetchDailyStats(client, id, { since, until }) {
  const days = new Map();
  for (const timeRange of dateWindows(since, until)) {
    const body = await client.get("/stats", { id, fields: STAT_FIELDS, timeRange, timeIncrement: 1 });
    for (const row of body?.data ?? []) {
      const key = String(row.dateStart ?? row.date ?? "").slice(0, 10);
      if (key) days.set(key, row);
    }
  }
  return days;
}

export async function collectHistory(client, range, { onProgress, concurrency = 4 } = {}) {
  const body = await client.get("/ncc/campaigns");
  const campaigns = Array.isArray(body) ? body : body?.data ?? [];
  onProgress?.(`캠페인 ${campaigns.length}개의 날짜별 성과를 읽습니다`);
  let done = 0;
  const daily = await mapLimit(campaigns, concurrency, async (campaign) => {
    const days = await fetchDailyStats(client, campaign.nccCampaignId, range);
    done += 1;
    if (done % 20 === 0 && done < campaigns.length) onProgress?.(`캠페인 ${done}/${campaigns.length}`);
    return days;
  });
  return campaigns.map((campaign, i) => ({ campaign, group: campaignGroup(campaign), days: daily[i] }));
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * 날짜별 한 줄: 묶음(라이브애드·직접 플레이스·…)별 노출·클릭·광고비, 라이브애드 평균 순위(노출 가중), 예약 수.
 * @param {Map<string, number>} bookings 날짜 → 예약 수 (예약고객 엑셀에 그 날짜가 없으면 null)
 */
export function buildDailyRows(history, { since, until }, bookings) {
  return dateList(since, until).map((date) => {
    const row = { date, weekday: weekday(date), bookings: bookings?.has(date) ? bookings.get(date) : null };
    let rankWeight = 0;
    let rankSum = 0;
    for (const group of GROUPS) row[group] = { impressions: 0, clicks: 0, cost: 0 };
    for (const { group, days } of history) {
      const stat = days.get(date);
      if (!stat) continue;
      const imp = num(stat.impCnt);
      row[group].impressions += imp;
      row[group].clicks += num(stat.clkCnt);
      row[group].cost += num(stat.salesAmt);
      if (group === "라이브애드" && imp && num(stat.avgRnk)) {
        rankWeight += imp;
        rankSum += num(stat.avgRnk) * imp;
      }
    }
    row.liveAdRank = rankWeight ? rankSum / rankWeight : null;
    row.totalCost = GROUPS.reduce((sum, g) => sum + row[g].cost, 0);
    return row;
  });
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * '멈춤 의심'인 날: 라이브애드 클릭이 기간 중간값의 50% 미만, 노출이 40% 미만,
 * 또는 평균 순위가 평소(중간값)보다 2칸 이상 밀린 날.
 * 2026년 8월 14~27일 실제로 라이브애드가 약해졌을 때 노출은 절반쯤 남았지만 클릭이 70% 줄었다. 그래서 클릭도 본다.
 */
export function markLiveAd(rows, { impressions = 0.4, clicks = 0.5 } = {}) {
  const typical = median(rows.map((r) => r["라이브애드"].impressions));
  const typicalClicks = median(rows.map((r) => r["라이브애드"].clicks));
  const ranks = rows.map((r) => r.liveAdRank).filter((v) => v !== null);
  const typicalRank = ranks.length ? median(ranks) : null;
  for (const row of rows) {
    const fewer = typical && row["라이브애드"].impressions < typical * impressions;
    const fewerClicks = typicalClicks && row["라이브애드"].clicks < typicalClicks * clicks;
    const lower = typicalRank !== null && row.liveAdRank !== null && row.liveAdRank >= typicalRank + 2;
    row.liveAdStatus = fewer || fewerClicks || lower ? "멈춤 의심" : "정상";
  }
  return typical;
}

/**
 * 멈춤 의심인 날의 예약 수를, 같은 요일의 정상인 날 평균과 비교한다(요일마다 손님 수가 달라서).
 * 예약 엑셀에 없는 날은 빼고 센다.
 */
export function compareBookings(rows) {
  const known = rows.filter((r) => r.bookings !== null);
  const normal = known.filter((r) => r.liveAdStatus === "정상");
  const down = known.filter((r) => r.liveAdStatus === "멈춤 의심");
  const avg = (list) => (list.length ? list.reduce((s, r) => s + r.bookings, 0) / list.length : null);
  const byWeekday = Object.fromEntries(WEEKDAYS.map((w) => [w, avg(normal.filter((r) => r.weekday === w))]));
  const gaps = down.filter((r) => byWeekday[r.weekday] !== null).map((r) => r.bookings - byWeekday[r.weekday]);
  return {
    normalDays: normal.length,
    downDays: down.length,
    normalAvg: avg(normal),
    downAvg: avg(down),
    /** 멈춘 날 하루에 같은 요일 평소보다 몇 건 적었나 (음수 = 적음) */
    perDayGap: gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null,
    missingBookingDays: rows.length - known.length,
    downDates: rows.filter((r) => r.liveAdStatus === "멈춤 의심").map((r) => r.date),
  };
}

/** 예약고객 엑셀(일자 · 이름 · 번호 · 비고) → 날짜별 예약 수. 비고가 '취소'인 줄은 뺀다. 파일이 없으면 null.
 *  엑셀에 적힌 첫 날 이전·마지막 날 이후는 Map에 없다(자료 없음). */
export async function readBookingCounts(filePath) {
  const { access } = await import("node:fs/promises");
  if (!(await access(filePath).then(() => true, () => false))) return null;
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(filePath);
  const sheet = book.getWorksheet("예약고객");
  if (!sheet) return null;
  const counts = new Map();
  sheet.eachRow((row, i) => {
    if (i === 1) return;
    const date = String(row.getCell(1).value ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (!counts.has(date)) counts.set(date, 0);
    if (String(row.getCell(4).value ?? "").includes("취소")) return;
    counts.set(date, counts.get(date) + 1);
  });
  // 예약이 없던 날은 엑셀에 줄이 없다. 엑셀의 첫 날~마지막 날 사이 빈 날짜는 0건으로 채운다.
  const keys = [...counts.keys()].sort();
  if (keys.length) for (const date of dateList(keys[0], keys.at(-1))) if (!counts.has(date)) counts.set(date, 0);
  return counts;
}

/** 요약 시트 + 지점별 날짜 시트 */
export async function writeHistoryReport(filePath, branches) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const summary = book.addWorksheet("요약");
  summary.columns = [{ width: 34 }, { width: 22 }];
  summary.addRow(["라이브애드 기간 점검"]).font = { bold: true, size: 14 };
  summary.addRow(["라이브애드 클릭이 평소(기간 중간값)의 50% 미만, 노출이 40% 미만이거나 평균 순위가 2칸 이상 밀린 날을 '멈춤 의심'으로 봅니다. 광고 설정은 바꾸지 않았습니다."]);
  const fmt = (v, digits = 1) => (v === null || v === undefined ? "자료 없음" : Number(v.toFixed(digits)));
  for (const b of branches) {
    const c = b.comparison;
    summary.addRow([]);
    summary.addRow([`${b.name}  (${b.range.since} ~ ${b.range.until})`]).font = { bold: true, size: 12 };
    summary.addRow(["라이브애드 하루 평소 노출(중간값)", Math.round(b.typical)]);
    summary.addRow(["정상인 날", `${c.normalDays}일`]);
    summary.addRow(["멈춤 의심인 날", `${c.downDays}일`]);
    summary.addRow(["정상인 날 하루 평균 예약", fmt(c.normalAvg)]);
    summary.addRow(["멈춤 의심인 날 하루 평균 예약", fmt(c.downAvg)]);
    summary.addRow(["멈춘 날, 같은 요일 평소보다 예약 (건/일)", fmt(c.perDayGap)]);
    if (c.missingBookingDays) summary.addRow(["예약 엑셀에 없는 날", `${c.missingBookingDays}일 (예약 수 비교에서 뺌)`]);
    if (c.downDates.length) summary.addRow(["멈춤 의심 날짜", c.downDates.join(", ")]);
    if (!b.hasBookings) summary.addRow(["⚠ 예약고객 엑셀을 찾지 못해 예약 비교를 못 했습니다."]);
  }

  for (const b of branches) {
    const sheet = book.addWorksheet(`${b.name.replace(/(본)?점$/, "")} 날짜별`, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "날짜", key: "date", width: 12 },
      { header: "요일", key: "weekday", width: 6 },
      { header: "라이브애드 상태", key: "status", width: 13 },
      { header: "네이버 예약(취소 제외)", key: "bookings", width: 15 },
      { header: "라이브애드 노출", key: "laImp", width: 13 },
      { header: "라이브애드 클릭", key: "laClk", width: 13 },
      { header: "라이브애드 광고비(원)", key: "laCost", width: 16 },
      { header: "라이브애드 평균 순위", key: "laRank", width: 15 },
      { header: "직접 플레이스 클릭", key: "plClk", width: 15 },
      { header: "직접 플레이스 광고비(원)", key: "plCost", width: 18 },
      { header: "파워컨텐츠 광고비(원)", key: "pcCost", width: 17 },
      { header: "파워링크 광고비(원)", key: "pwCost", width: 16 },
      { header: "전체 광고비(원)", key: "total", width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const r of b.rows) {
      const added = sheet.addRow({
        date: r.date,
        weekday: r.weekday,
        status: r.liveAdStatus,
        bookings: r.bookings ?? "",
        laImp: r["라이브애드"].impressions,
        laClk: r["라이브애드"].clicks,
        laCost: r["라이브애드"].cost,
        laRank: r.liveAdRank ? Number(r.liveAdRank.toFixed(1)) : "",
        plClk: r["플레이스(직접)"].clicks,
        plCost: r["플레이스(직접)"].cost,
        pcCost: r["파워컨텐츠"].cost,
        pwCost: r["파워링크"].cost,
        total: r.totalCost,
      });
      for (const key of ["laImp", "laCost", "plCost", "pcCost", "pwCost", "total"]) added.getCell(key).numFmt = "#,##0";
      if (r.liveAdStatus === "멈춤 의심") added.getCell("status").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBE0DC" } };
    }
    sheet.autoFilter = { from: "A1", to: "M1" };
  }
  await book.xlsx.writeFile(filePath);
}

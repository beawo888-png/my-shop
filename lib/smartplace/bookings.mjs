/**
 * 네이버 예약(파트너센터)에서 하루치 방문 예약 손님을 읽어 바탕화면 엑셀에 날짜별 시트로 쌓는다.
 *
 * 파트너센터 '예약자관리' 화면이 부르는 목록 API를 로그인된 페이지 안에서 그대로 부른다.
 * 이용일(USEDATE) 기준이라 '그날 방문하기로 한 손님'이 나온다. 취소 건도 함께 나온다.
 */

import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const BOOKING_STATUS_CANCELLED = "RC04";

/** 소식 주소(...?bookingBusinessId=970819)에 들어 있는 예약 업체 번호를 꺼낸다. */
export function bookingBusinessId(newsUrl) {
  const id = newsUrl ? new URL(newsUrl).searchParams.get("bookingBusinessId") : null;
  if (!id) throw new Error("예약 업체 번호(bookingBusinessId)를 찾지 못했습니다. config.json의 newsUrl을 확인해 주세요.");
  return id;
}

export function bookingListUrl(bizId, date) {
  return `https://partner.booking.naver.com/bizes/${bizId}/booking-list-view?dateDropdownType=DAY&startDateTime=${date}&endDateTime=${date}&dateFilter=USEDATE&searchValueCode=USER_NAME`;
}

/** 2026-10-17 → 2026-10-16T15:00:00.000Z (그날 0시 KST) */
function kstMidnightIso(date) {
  return new Date(`${date}T00:00:00+09:00`).toISOString();
}

/** 01052401349 → 010-5240-1349 */
export function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (/^01\d{8,9}$/.test(digits)) return digits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
  return raw;
}

/** 이용일이 startDate~endDate(YYYY-MM-DD, 31일 이하)인 예약 전체. page는 partner.booking.naver.com에 로그인된 탭이어야 한다. */
async function fetchBookingPeriod(page, bizId, startDate, endDate) {
  const params = new URLSearchParams({
    bizItemTypes: "STANDARD",
    bookingStatusCodes: "",
    businessTypeId: "6",
    dateDropdownType: "DAY",
    dateFilter: "USEDATE",
    startDateTime: kstMidnightIso(startDate),
    endDateTime: kstMidnightIso(endDate),
    maxDays: "31",
    nPayChargedStatusCodes: "",
    orderBy: "",
    orderByStartDate: "ASC",
    paymentStatusCodes: "",
    searchValue: "",
    size: "50",
  });
  const all = [];
  for (let pageNo = 0; pageNo < 100; pageNo += 1) {
    params.set("page", String(pageNo));
    const url = `/api/businesses/${bizId}/bookings?${params}`;
    const result = await page.evaluate(async (u) => {
      const res = await fetch(u, { credentials: "include" });
      return { status: res.status, body: res.ok ? await res.json() : null };
    }, url);
    if (result.status === 401 || result.status === 403) throw new Error(`예약 목록을 볼 권한이 없습니다(${result.status}). 로그인을 확인해 주세요.`);
    if (!Array.isArray(result.body)) throw new Error(`예약 목록을 읽지 못했습니다(응답 ${result.status}).`);
    all.push(...result.body);
    if (result.body.length < 50) break;
  }
  return all;
}

function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 이용일이 startDate~endDate인 예약을 날짜별로 묶어 돌려준다. Map<날짜, 손님[]> (날짜 순) */
export async function fetchBookingsByDate(page, bizId, startDate, endDate) {
  const byId = new Map();
  for (let from = startDate; from <= endDate; from = addDays(from, 31)) {
    const to = addDays(from, 30) < endDate ? addDays(from, 30) : endDate;
    for (const b of await fetchBookingPeriod(page, bizId, from, to)) byId.set(b.bookingId, b);
  }
  const byDate = new Map();
  const sorted = [...byId.values()]
    .filter((b) => b.startDate >= startDate && b.startDate <= endDate)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (const b of sorted) {
    if (!byDate.has(b.startDate)) byDate.set(b.startDate, []);
    byDate.get(b.startDate).push({
      name: b.name ?? "",
      phone: formatPhone(b.phone ?? ""),
      note: b.bookingStatusCode === BOOKING_STATUS_CANCELLED ? "취소" : "",
    });
  }
  return byDate;
}

/** 이용일이 date(YYYY-MM-DD)인 예약 손님 */
export async function fetchBookings(page, bizId, date) {
  return (await fetchBookingsByDate(page, bizId, date, date)).get(date) ?? [];
}

export function desktopDir() {
  return path.join(os.homedir(), "Desktop");
}

export function bookingWorkbookPath(fileLabel) {
  return path.join(desktopDir(), `${fileLabel} 예약고객.xlsx`);
}

/**
 * 엑셀 파일에 날짜 이름의 시트들을 적는다. sheets: Map<날짜, 손님[]>
 * 이미 있는 날짜 시트는 새로 덮고, 나머지 시트는 그대로 두며, 시트는 날짜 순으로 다시 정렬한다.
 */
export async function writeBookingSheets(filePath, sheets) {
  const { default: ExcelJS } = await import("exceljs");
  const merged = new Map();
  if (await access(filePath).then(() => true, () => false)) {
    const old = new ExcelJS.Workbook();
    await old.xlsx.readFile(filePath);
    old.eachSheet((sheet) => {
      const rows = [];
      sheet.eachRow((row, i) => {
        if (i === 1) return;
        const name = String(row.getCell(1).value ?? "");
        if (name === "예약 없음") return;
        rows.push({ name, phone: String(row.getCell(2).value ?? ""), note: String(row.getCell(3).value ?? "") });
      });
      merged.set(sheet.name, rows);
    });
  }
  for (const [date, rows] of sheets) merged.set(date, rows);

  const workbook = new ExcelJS.Workbook();
  for (const date of [...merged.keys()].sort()) {
    const rows = merged.get(date);
    const sheet = workbook.addWorksheet(date);
    sheet.columns = [
      { header: "고객님 이름", key: "name", width: 16 },
      { header: "핸드폰번호", key: "phone", width: 18 },
      { header: "비고", key: "note", width: 10 },
    ];
    sheet.getRow(1).font = { bold: true };
    if (rows.length) sheet.addRows(rows);
    else sheet.addRow({ name: "예약 없음" });
  }

  try {
    await workbook.xlsx.writeFile(filePath);
  } catch (error) {
    if (error.code === "EBUSY" || error.code === "EPERM") {
      throw new Error(`${path.basename(filePath)} 파일이 엑셀에서 열려 있어 저장하지 못했습니다. 파일을 닫고 다시 실행해 주세요.`);
    }
    throw error;
  }
}

/** 엑셀 파일에 date 이름의 시트를 만들거나(있으면 새로 덮어) 손님 목록을 적는다. */
export async function writeBookingSheet(filePath, date, rows) {
  await writeBookingSheets(filePath, new Map([[date, rows]]));
}

/** 엑셀 파일 이름에 쓰는 지점 이름 (사장님이 부르는 대로) */
export const BOOKING_FILE_LABEL = { pangyo: "판교점", moran: "모란점" };

/** 한 지점의 date 방문 손님을 바탕화면 엑셀에 적는다. 돌려주는 값: { filePath, count, cancelled } */
export async function exportBookings(page, { branchId, bizId, date }) {
  if (!page.url().startsWith("https://partner.booking.naver.com/")) {
    await page.goto(bookingListUrl(bizId, date), { waitUntil: "domcontentloaded", timeout: 60_000 });
  }
  const rows = await fetchBookings(page, bizId, date);
  const filePath = bookingWorkbookPath(BOOKING_FILE_LABEL[branchId]);
  await writeBookingSheet(filePath, date, rows);
  return { filePath, count: rows.length, cancelled: rows.filter((r) => r.note === "취소").length };
}

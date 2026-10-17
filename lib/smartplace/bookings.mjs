/**
 * 네이버 예약(파트너센터)에서 하루치 방문 예약 손님을 읽어 바탕화면 엑셀에 날짜별 시트로 쌓는다.
 *
 * 파트너센터 '예약자관리' 화면이 부르는 목록 API를 로그인된 페이지 안에서 그대로 부른다.
 * 이용일(USEDATE) 기준이라 '그날 방문하기로 한 손님'이 나온다. 취소 건도 함께 나온다.
 */

import { access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { alertOwner } from "./alert.mjs";

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

export const BOOKING_SHEET_NAME = "예약고객";

/**
 * 엑셀 파일의 '예약고객' 시트 한 장에 날짜 순으로 손님을 적는다. days: Map<날짜, 손님[]>
 * days에 있는 날짜는 새로 덮어쓰고(손님이 없으면 그 날짜 줄을 지움), 다른 날짜 줄은 그대로 둔다.
 * 예전 방식(날짜마다 시트 하나)으로 만든 파일이면 그 시트들을 읽어 한 시트로 합친다.
 */
export async function writeBookingDays(filePath, days) {
  const { default: ExcelJS } = await import("exceljs");
  const merged = new Map();
  const add = (date, row) => {
    if (!merged.has(date)) merged.set(date, []);
    merged.get(date).push(row);
  };
  if (await access(filePath).then(() => true, () => false)) {
    const old = new ExcelJS.Workbook();
    await old.xlsx.readFile(filePath);
    const text = (cell) => String(cell.value ?? "");
    old.eachSheet((sheet) => {
      if (sheet.name === BOOKING_SHEET_NAME) {
        sheet.eachRow((row, i) => {
          if (i > 1) add(text(row.getCell(1)), { name: text(row.getCell(2)), phone: text(row.getCell(3)), note: text(row.getCell(4)) });
        });
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(sheet.name)) {
        sheet.eachRow((row, i) => {
          const name = text(row.getCell(1));
          if (i > 1 && name !== "예약 없음") add(sheet.name, { name, phone: text(row.getCell(2)), note: text(row.getCell(3)) });
        });
      }
    });
  }
  for (const [date, rows] of days) merged.set(date, rows);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(BOOKING_SHEET_NAME, { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "일자", key: "date", width: 12 },
    { header: "고객님 이름", key: "name", width: 16 },
    { header: "핸드폰번호", key: "phone", width: 18 },
    { header: "비고", key: "note", width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };
  for (const date of [...merged.keys()].sort()) {
    for (const row of merged.get(date)) sheet.addRow({ date, ...row });
  }
  sheet.autoFilter = "A1:D1";

  // 엑셀에서 파일을 열어 두면 저장이 막힌다. 알림을 한 번 띄우고 닫힐 때까지 5분 기다린다.
  const deadline = Date.now() + 5 * 60_000;
  let alerted = false;
  for (;;) {
    try {
      await workbook.xlsx.writeFile(filePath);
      return;
    } catch (error) {
      if (error.code !== "EBUSY" && error.code !== "EPERM") throw error;
      const message = `${path.basename(filePath)} 파일이 엑셀에서 열려 있어 저장하지 못했습니다. 파일을 닫아 주세요.`;
      if (Date.now() > deadline) throw new Error(`${message} (5분 기다렸지만 닫히지 않았습니다)`);
      if (!alerted) {
        alertOwner(`${message} 닫으면 바로 저장합니다.`);
        alerted = true;
      }
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
  }
}

/** 엑셀 파일 이름에 쓰는 지점 이름 (사장님이 부르는 대로) */
export const BOOKING_FILE_LABEL = { pangyo: "판교점", moran: "모란점" };

/** 한 지점의 date 방문 손님을 바탕화면 엑셀(한 시트)에 이어 적는다. 돌려주는 값: { filePath, count, cancelled } */
export async function exportBookings(page, { branchId, bizId, date }) {
  if (!page.url().startsWith("https://partner.booking.naver.com/")) {
    await page.goto(bookingListUrl(bizId, date), { waitUntil: "domcontentloaded", timeout: 60_000 });
  }
  const rows = await fetchBookings(page, bizId, date);
  const filePath = bookingWorkbookPath(BOOKING_FILE_LABEL[branchId]);
  await writeBookingDays(filePath, new Map([[date, rows]]));
  return { filePath, count: rows.length, cancelled: rows.filter((r) => r.note === "취소").length };
}

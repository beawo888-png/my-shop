/**
 * 두 지점 검색광고에 넣어 둔 키워드 전부의 네이버 월간 검색수를 받아, 검색 많은 순으로 정리한다. 읽기만 한다.
 *
 * 키워드가 두 지점 합쳐 약 10만 개라 키워드 도구(한 번에 5개)를 2만 번 가까이 불러야 한다.
 * 그래서 받은 검색수를 .smartplace/keyword-volumes.json에 모아 두고(30일 동안 다시 묻지 않음),
 * 중간에 끊겨도 다시 실행하면 이어서 받는다. 검색수는 계정과 상관없는 값이라 한 계정 키로 한 번만 묻는다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";

import { LOCAL_DIR } from "../smartplace/local-store.mjs";
import { chunk, mapLimit, monthlySearches, normalizeKeyword } from "./keywords.mjs";

export const VOLUME_CACHE = `${LOCAL_DIR}keyword-volumes.json`;
const FRESH_DAYS = 30;

/** 우리 동네 이름 (지점별) */
export const LOCAL_AREAS = {
  pangyo: ["판교", "분당", "서현", "정자", "미금", "야탑", "율동", "백현", "삼평", "운중", "아비뉴프랑", "아브뉴프랑", "수내", "이매", "오리역", "현백"],
  moran: ["모란", "성남", "중원", "수진", "신흥", "태평", "단대", "남한산성", "산성", "상대원", "은행동", "금광", "도촌"],
};
const GENERIC = new Set(["맛집", "근처맛집", "주변맛집", "맛집추천", "내주변맛집", "저녁맛집", "점심맛집", "회식장소", "단체회식", "회식", "고기집", "술집", "데이트맛집", "가족외식", "외식"]);
const LAMB = ["양꼬치", "양다리", "양갈비", "양고기", "양등심"];
const MENU = ["꿔바로우", "찹쌀탕수육", "마라", "훠궈", "중식", "중국", "고량주", "연태", "하얼빈", "칭다오", "소룽샤", "가지튀김", "토마토계란", "마파두부", "오이무침", "양탕", "지삼선", "쯔란", "꽃빵", "물만두", "볶음밥", "탕수육", "어향육사", "경장육사", "향라대하", "건두부"];
const AREA_LIKE = /(맛집|역|동|시장|술집|회식|고기집|가볼만한곳|데이트|모임|식당|밥집|룸|단체|구|시|군)/;

export const CATEGORIES = [
  "① 가게 이름",
  "② 우리 동네 + 메뉴",
  "③ 우리 동네",
  "④ 동네 없는 넓은 단어",
  "⑤ 양고기 (동네 없음·다른 동네)",
  "⑥ 요리 이름 (동네 없음)",
  "⑦ 다른 동네",
  "⑧ 기타",
];

/** 키워드 분류. 판교·모란 동네 이름이 들어가면 '우리 동네'(어느 지점 동네인지는 따로 표시). */
export function classifyKeyword(keyword) {
  const k = normalizeKeyword(keyword);
  if (k.includes("왕징")) return CATEGORIES[0];
  const local = Object.values(LOCAL_AREAS).some((areas) => areas.some((a) => k.includes(a)));
  const lamb = LAMB.some((m) => k.includes(m));
  const menu = MENU.some((m) => k.includes(m));
  if (local && (lamb || menu)) return CATEGORIES[1];
  if (local) return CATEGORIES[2];
  if (GENERIC.has(k)) return CATEGORIES[3];
  if (lamb) return CATEGORIES[4];
  if (menu) return CATEGORIES[5];
  if (AREA_LIKE.test(k)) return CATEGORIES[6];
  return CATEGORIES[7];
}

/** 어느 지점 동네 단어인지 ("판교", "모란", "판교·모란", "") */
export function localBranch(keyword) {
  const k = normalizeKeyword(keyword);
  const names = { pangyo: "판교", moran: "모란" };
  return Object.entries(LOCAL_AREAS)
    .filter(([, areas]) => areas.some((a) => k.includes(a)))
    .map(([id]) => names[id])
    .join("·");
}

export async function readVolumeCache() {
  try {
    return JSON.parse(await readFile(VOLUME_CACHE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`.smartplace/keyword-volumes.json을 읽지 못했습니다: ${error.message}`);
  }
}

export async function writeVolumeCache(cache) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(VOLUME_CACHE, JSON.stringify(cache), "utf8");
}

const isFresh = (entry, now) => entry && now - Date.parse(entry.at) < FRESH_DAYS * 86_400_000;

/**
 * cache에 없거나 30일 지난 키워드만 키워드 도구로 묻는다. 결과는 cache에 바로 쓴다.
 * 네이버에 정보가 없는 키워드도 {none:true}로 남겨 다시 묻지 않는다.
 * save(cache)를 주면 묶음 saveEvery번마다 저장한다(중간에 끊겨도 이어서 받게).
 */
export async function fillVolumes(client, keywords, cache, { now = Date.now(), concurrency = 2, onProgress, save, saveEvery = 100 } = {}) {
  const todo = [...new Set(keywords.map(normalizeKeyword).filter(Boolean))].filter((k) => !isFresh(cache[k], now));
  const parts = chunk(todo, 5);
  const at = new Date(now).toISOString();
  let done = 0;
  let failed = 0;
  const started = Date.now();
  await mapLimit(parts, concurrency, async (part) => {
    try {
      const body = await client.get("/keywordstool", { hintKeywords: part.join(","), showDetail: 1 });
      const found = new Map((body?.keywordList ?? []).map((row) => [normalizeKeyword(row.relKeyword), row]));
      for (const k of part) {
        const row = found.get(k);
        cache[k] = row ? { at, pc: row.monthlyPcQcCnt, mobile: row.monthlyMobileQcCnt, comp: row.compIdx ?? "" } : { at, none: true };
      }
    } catch (error) {
      // 특수문자 등으로 거절된 묶음은 하나씩 다시 묻지 않고 '정보 없음'으로 둔다(다음 달에 다시 시도).
      if (error.status === 401 || error.status === 403) throw error;
      failed += part.length;
      for (const k of part) cache[k] = { at, none: true, error: true };
    }
    done += 1;
    if (done % saveEvery === 0) {
      await save?.(cache);
      const perPart = (Date.now() - started) / done;
      const left = Math.round(((parts.length - done) * perPart) / 60_000);
      onProgress?.(`검색수 받는 중… ${(done * 5).toLocaleString()}/${todo.length.toLocaleString()}개 (남은 시간 약 ${left}분)`);
    }
  });
  await save?.(cache);
  return { asked: todo.length, failed };
}

/** cache → 키워드 하나의 월간 검색수 */
export function volumeOf(cache, keyword) {
  const entry = cache[normalizeKeyword(keyword)];
  if (!entry) return { known: false, total: 0, pc: 0, mobile: 0, text: "확인 전", comp: "" };
  if (entry.none) return { known: true, total: 0, pc: 0, mobile: 0, text: "정보 없음", comp: "" };
  const s = monthlySearches({ monthlyPcQcCnt: entry.pc, monthlyMobileQcCnt: entry.mobile });
  return { known: true, total: s.total, pc: s.pc, mobile: s.mobile, text: s.text, comp: entry.comp };
}

/**
 * 지점별 계정 데이터(collectAccount 결과) → 고유 키워드 표.
 * @param {Array<{id: string, name: string, account: object}>} branches
 */
export function buildVolumeTable(branches, cache) {
  const rows = new Map();
  for (const { id, account } of branches) {
    for (const k of account.keywords) {
      const key = normalizeKeyword(k.keyword);
      if (!key) continue;
      if (!rows.has(key)) rows.set(key, { keyword: k.keyword, per: {} });
      const stat = account.stats?.get(k.nccKeywordId);
      const p = (rows.get(key).per[id] ??= { count: 0, impressions: 0, clicks: 0, cost: 0, on: 0 });
      p.count += 1;
      if (!k.userLock && k.status !== "PAUSED") p.on += 1;
      p.impressions += Number(stat?.impCnt ?? 0);
      p.clicks += Number(stat?.clkCnt ?? 0);
      p.cost += Number(stat?.salesAmt ?? 0);
    }
  }
  return [...rows.values()]
    .map((r) => ({ ...r, volume: volumeOf(cache, r.keyword), category: classifyKeyword(r.keyword), area: localBranch(r.keyword) }))
    .sort((a, b) => b.volume.total - a.volume.total || a.keyword.localeCompare(b.keyword, "ko"));
}

/** 분류별 요약 */
export function summarize(rows, branchIds) {
  return CATEGORIES.map((category) => {
    const list = rows.filter((r) => r.category === category);
    const sum = (f) => list.reduce((s, r) => s + f(r), 0);
    return {
      category,
      keywords: list.length,
      searched: list.filter((r) => r.volume.total >= 10).length,
      volume: sum((r) => r.volume.total),
      clicks: Object.fromEntries(branchIds.map((id) => [id, sum((r) => r.per[id]?.clicks ?? 0)])),
      cost: Object.fromEntries(branchIds.map((id) => [id, sum((r) => r.per[id]?.cost ?? 0)])),
    };
  });
}

/** 바탕화면 엑셀: 요약 · 검색 많은 순 전체 · 우리 동네 TOP · 검색 0 키워드 수 */
export async function writeVolumeReport(filePath, rows, branches, { range } = {}) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const ids = branches.map((b) => b.id);
  const label = Object.fromEntries(branches.map((b) => [b.id, b.name.replace(/(본)?점$/, "")]));

  const sumSheet = book.addWorksheet("요약");
  sumSheet.columns = [{ width: 30 }, { width: 12 }, { width: 16 }, { width: 16 }, ...ids.flatMap(() => [{ width: 14 }, { width: 16 }])];
  sumSheet.addRow(["왕징 검색광고 키워드 검색수"]).font = { bold: true, size: 14 };
  sumSheet.addRow([`두 지점에 넣어 둔 고유 키워드 ${rows.length.toLocaleString()}개. 검색수는 네이버 키워드 도구의 최근 한 달(PC+모바일). 성과는 ${range ? `${range.since}~${range.until}` : "최근 30일"}.`]);
  sumSheet.addRow([]);
  const head = sumSheet.addRow(["분류", "키워드 수", "검색 10회 이상", "월 검색수 합계", ...ids.flatMap((id) => [`${label[id]} 30일 클릭`, `${label[id]} 30일 광고비(원)`])]);
  head.font = { bold: true };
  for (const s of summarize(rows, ids)) {
    const r = sumSheet.addRow([s.category, s.keywords, s.searched, s.volume, ...ids.flatMap((id) => [s.clicks[id], s.cost[id]])]);
    r.eachCell((c, i) => i > 1 && (c.numFmt = "#,##0"));
  }
  const zero = rows.filter((r) => r.volume.known && r.volume.total < 10).length;
  const unknown = rows.filter((r) => !r.volume.known).length;
  sumSheet.addRow([]);
  sumSheet.addRow([`월 검색 10회 미만이거나 정보 없는 키워드: ${zero.toLocaleString()}개 (넣어 둬도 거의 보이지 않음)`]);
  if (unknown) sumSheet.addRow([`⚠ 검색수를 아직 못 받은 키워드: ${unknown.toLocaleString()}개 — 'npm run ads:volumes'를 다시 실행하면 이어서 받습니다.`]);

  const columns = [
    { header: "순위", key: "rank", width: 7 },
    { header: "키워드", key: "keyword", width: 22 },
    { header: "월 검색수(PC+모바일)", key: "volume", width: 14 },
    { header: "모바일", key: "mobile", width: 10 },
    { header: "경쟁 정도", key: "comp", width: 9 },
    { header: "분류", key: "category", width: 26 },
    { header: "어느 동네", key: "area", width: 9 },
    ...ids.flatMap((id) => [
      { header: `${label[id]} 넣은 곳 수`, key: `${id}Count`, width: 11 },
      { header: `${label[id]} 30일 노출`, key: `${id}Imp`, width: 12 },
      { header: `${label[id]} 30일 클릭`, key: `${id}Clk`, width: 11 },
      { header: `${label[id]} 30일 광고비(원)`, key: `${id}Cost`, width: 14 },
    ]),
  ];
  const addTable = (name, list) => {
    const sheet = book.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1, xSplit: 2 }] });
    sheet.columns = columns;
    sheet.getRow(1).font = { bold: true };
    list.forEach((r, i) => {
      const row = { rank: i + 1, keyword: r.keyword, volume: r.volume.known ? (r.volume.text && r.volume.total === 0 ? r.volume.text : r.volume.total) : "확인 전", mobile: r.volume.mobile, comp: r.volume.comp, category: r.category, area: r.area };
      for (const id of ids) {
        const p = r.per[id];
        Object.assign(row, { [`${id}Count`]: p?.count ?? "", [`${id}Imp`]: p?.impressions ?? "", [`${id}Clk`]: p?.clicks ?? "", [`${id}Cost`]: p?.cost ?? "" });
      }
      const added = sheet.addRow(row);
      added.eachCell((c) => typeof c.value === "number" && c.col > 2 && (c.numFmt = "#,##0"));
    });
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  };
  addTable("검색 많은 순 (10회 이상)", rows.filter((r) => r.volume.total >= 10));
  addTable("우리 동네 키워드", rows.filter((r) => r.category === CATEGORIES[0] || r.category === CATEGORIES[1] || r.category === CATEGORIES[2]));
  await book.xlsx.writeFile(filePath);
}

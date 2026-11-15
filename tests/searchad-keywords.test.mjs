import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createClient, sign } from "../lib/searchad/client.mjs";
import {
  analyzeGroups,
  analyzeKeywords,
  collectAccount,
  fetchSearchVolumes,
  judgeKeyword,
  lastDays,
  parseCount,
  pickCandidates,
} from "../lib/searchad/keywords.mjs";
import { countVerdicts, topSearched, writeKeywordReport } from "../lib/searchad/report.mjs";

const KEYS = { apiKey: "license", secretKey: "secret", customerId: 1234 };

/** 네이버 검색광고 API 흉내: 경로별 응답 + 받은 요청 기록 */
function fakeApi(routes) {
  const calls = [];
  const fetch = async (url, init) => {
    const { pathname, searchParams } = new URL(url);
    calls.push({ pathname, params: Object.fromEntries(searchParams), init });
    const route = routes[pathname];
    const body = typeof route === "function" ? route(Object.fromEntries(searchParams)) : route;
    if (body === undefined) return new Response(JSON.stringify({ code: 0, title: "not found" }), { status: 404 });
    if (body instanceof Response) return body;
    return new Response(JSON.stringify(body), { status: 200 });
  };
  return { fetch, calls };
}
const quiet = { wait: async () => {}, now: () => 1700000000000 };

test("서명은 네이버 예제와 같은 방식(타임스탬프.메서드.경로)이고 쿼리는 넣지 않는다", async () => {
  const expected = createHmac("sha256", "secret").update("1700000000000.GET./ncc/keywords").digest("base64");
  assert.equal(sign("1700000000000", "GET", "/ncc/keywords", "secret"), expected);

  const api = fakeApi({ "/ncc/keywords": [] });
  await createClient(KEYS, { ...quiet, fetch: api.fetch }).get("/ncc/keywords", { nccAdgroupId: "grp-1" });
  const { init, params } = api.calls[0];
  assert.equal(params.nccAdgroupId, "grp-1");
  assert.equal(init.method, "GET");
  assert.equal(init.headers["X-Signature"], expected);
  assert.equal(init.headers["X-API-KEY"], "license");
  assert.equal(init.headers["X-Customer"], "1234");
});

test("요청이 많다고(429) 하면 쉬었다가 다시 묻고, 키가 틀리면 알아듣게 알려 준다", async () => {
  let n = 0;
  const api = fakeApi({
    "/ncc/campaigns": () => (n++ === 0 ? new Response(JSON.stringify({ code: 1016 }), { status: 429 }) : []),
    "/ncc/adgroups": new Response(JSON.stringify({ title: "Unauthorized" }), { status: 401 }),
  });
  const client = createClient(KEYS, { ...quiet, fetch: api.fetch });
  assert.deepEqual(await client.get("/ncc/campaigns"), []);
  await assert.rejects(client.get("/ncc/adgroups"), /401.*API 키/);
  assert.throws(() => createClient({ apiKey: "a" }), /ads:setup/);
});

test("키워드 도구 검색수: '< 10'은 0으로 세고, 5개씩 띄어쓰기 없이 묻는다", async () => {
  assert.equal(parseCount("< 10"), 0);
  assert.equal(parseCount(1520), 1520);
  assert.equal(parseCount("2,300"), 2300);

  const api = fakeApi({
    "/keywordstool": ({ hintKeywords }) => ({
      keywordList: hintKeywords.split(",").map((k) => ({ relKeyword: k, monthlyPcQcCnt: 100, monthlyMobileQcCnt: 900 })),
    }),
  });
  const volumes = await fetchSearchVolumes(createClient(KEYS, { ...quiet, fetch: api.fetch }), ["판교 양꼬치", "판교양꼬치", "a", "b", "c", "d", "e"]);
  assert.equal(api.calls.length, 2);
  assert.equal(api.calls[0].params.hintKeywords, "판교양꼬치,A,B,C,D");
  assert.equal(volumes.get("판교양꼬치").monthlyMobileQcCnt, 900);
});

const ACCOUNT = {
  campaigns: [
    { nccCampaignId: "cmp-power", name: "판교 파워링크", campaignTp: "WEB_SITE", status: "ELIGIBLE", useDailyBudget: true, dailyBudget: 200000 },
    { nccCampaignId: "cmp-place", name: "판교 플레이스", campaignTp: "PLACE", status: "ELIGIBLE", useDailyBudget: false },
  ],
  adgroups: [
    { nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", name: "양고기", bidAmt: 500, status: "ELIGIBLE" },
    { nccAdgroupId: "grp-place", nccCampaignId: "cmp-place", name: "플레이스 기본", bidAmt: 300, status: "ELIGIBLE" },
  ],
  keywords: [
    { nccKeywordId: "kw-good", nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", keyword: "판교 양꼬치", useGroupBidAmt: true, status: "ELIGIBLE" },
    { nccKeywordId: "kw-pricey", nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", keyword: "판교 맛집", bidAmt: 3000, status: "ELIGIBLE" },
    { nccKeywordId: "kw-none", nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", keyword: "판교 양다리구이", bidAmt: 70, status: "ELIGIBLE" },
    { nccKeywordId: "kw-off", nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", keyword: "판교 꿔바로우", bidAmt: 500, status: "PAUSED", userLock: true },
    { nccKeywordId: "kw-rare", nccAdgroupId: "grp-1", nccCampaignId: "cmp-power", keyword: "백현동 양갈비", bidAmt: 500, status: "ELIGIBLE" },
  ],
};
const STATS = {
  "kw-good": { id: "kw-good", impCnt: 4000, clkCnt: 200, salesAmt: 100000, avgRnk: 2.1 },
  "kw-pricey": { id: "kw-pricey", impCnt: 3000, clkCnt: 100, salesAmt: 300000, avgRnk: 1.4 },
  "kw-rare": { id: "kw-rare", impCnt: 20, clkCnt: 1, salesAmt: 500 },
  "grp-1": { id: "grp-1", impCnt: 7020, clkCnt: 301, salesAmt: 400500 },
  "grp-place": { id: "grp-place", impCnt: 9000, clkCnt: 450, salesAmt: 150000 },
};
const VOLUMES = new Map([
  ["판교양꼬치", { relKeyword: "판교양꼬치", monthlyPcQcCnt: 300, monthlyMobileQcCnt: 2700, compIdx: "중간" }],
  ["판교맛집", { relKeyword: "판교맛집", monthlyPcQcCnt: 9000, monthlyMobileQcCnt: 41000, compIdx: "높음" }],
  ["판교양다리구이", { relKeyword: "판교양다리구이", monthlyPcQcCnt: 40, monthlyMobileQcCnt: 210, compIdx: "낮음" }],
  ["백현동양갈비", { relKeyword: "백현동양갈비", monthlyPcQcCnt: "< 10", monthlyMobileQcCnt: "< 10" }],
]);

test("계정 전체를 읽는다: 캠페인 → 광고그룹 → 키워드 → 성과 (플레이스 그룹은 키워드 조회가 거절돼도 계속)", async () => {
  const api = fakeApi({
    "/ncc/campaigns": ACCOUNT.campaigns,
    "/ncc/adgroups": ({ nccCampaignId }) => ACCOUNT.adgroups.filter((g) => g.nccCampaignId === nccCampaignId),
    "/ncc/keywords": ({ nccAdgroupId }) =>
      nccAdgroupId === "grp-place" ? new Response(JSON.stringify({ code: 3000 }), { status: 400 }) : ACCOUNT.keywords,
    "/stats": ({ ids }) => ({ data: ids.split(",").filter((id) => STATS[id]).map((id) => STATS[id]) }),
  });
  const timeRange = { since: "2026-10-14", until: "2026-11-12" };
  const account = await collectAccount(createClient(KEYS, { ...quiet, fetch: api.fetch }), { timeRange });
  assert.equal(account.keywords.length, 5);
  assert.equal(account.stats.get("grp-place").clkCnt, 450);
  const statsCall = api.calls.find((c) => c.pathname === "/stats");
  assert.deepEqual(JSON.parse(statsCall.params.timeRange), timeRange);
  assert.ok(JSON.parse(statsCall.params.fields).includes("salesAmt"));
  // 읽기만 한다
  assert.ok(api.calls.every((c) => c.init.method === "GET"));
});

test("키워드마다 판정을 붙인다: 잘 됨 · 비쌈 · 노출 안 됨 · 꺼짐 · 검색 거의 없음", () => {
  const stats = new Map(Object.entries(STATS));
  const { rows, baseline } = analyzeKeywords({ ...ACCOUNT, stats }, VOLUMES);
  const by = Object.fromEntries(rows.map((r) => [r.keyword, r]));

  assert.equal(baseline.avgCpc, Math.round(400500 / 301));
  assert.equal(by["판교 양꼬치"].verdict, "잘 되는 키워드");
  assert.equal(by["판교 양꼬치"].bid, 500, "그룹 입찰가를 쓰는 키워드는 그룹 입찰가로 보여 준다");
  assert.equal(by["판교 양꼬치"].focus, "양꼬치");
  assert.equal(by["판교 양꼬치"].searches.total, 3000);
  assert.equal(by["판교 맛집"].verdict, "비싼 키워드");
  assert.equal(by["판교 양다리구이"].verdict, "노출 안 됨");
  assert.equal(by["판교 양다리구이"].focus, "양다리");
  assert.equal(by["판교 꿔바로우"].verdict, "꺼져 있음");
  assert.equal(by["백현동 양갈비"].verdict, "검색 거의 없음");
  assert.equal(rows[0].keyword, "판교 맛집", "광고비 많은 순");

  assert.equal(topSearched(rows, 2).map((r) => r.keyword).join(","), "판교 맛집,판교 양꼬치");
  assert.equal(countVerdicts(rows)["잘 되는 키워드"], 1);
  assert.equal(judgeKeyword({ status: "노출 가능", impressions: 50, clicks: 1, cost: 100, cpc: 100, ctr: 2, searches: { found: false } }, baseline).reason, "네이버 검색수 정보 없음");
});

test("새 키워드 후보: 그 지점 동네 + 왕징 관련 + 아직 안 넣은 것만, 집중 메뉴 먼저", () => {
  const related = [
    { relKeyword: "판교양꼬치", monthlyPcQcCnt: 300, monthlyMobileQcCnt: 2700 }, // 이미 있음
    { relKeyword: "판교회식장소", monthlyPcQcCnt: 900, monthlyMobileQcCnt: 3100 },
    { relKeyword: "판교양다리", monthlyPcQcCnt: 50, monthlyMobileQcCnt: 400 },
    { relKeyword: "양꼬치만드는법", monthlyPcQcCnt: 2000, monthlyMobileQcCnt: 9000 }, // 동네 아님 + 손님 아님
    { relKeyword: "판교양꼬치알바", monthlyPcQcCnt: 100, monthlyMobileQcCnt: 300 }, // 손님 아님
    { relKeyword: "모란양꼬치", monthlyPcQcCnt: 500, monthlyMobileQcCnt: 2500 }, // 다른 지점 동네
    { relKeyword: "판교카페", monthlyPcQcCnt: 3000, monthlyMobileQcCnt: 9000 }, // 왕징과 무관
    { relKeyword: "분당양꼬치", monthlyPcQcCnt: "< 10", monthlyMobileQcCnt: 20 }, // 검색 너무 적음
  ];
  const picked = pickCandidates(related, { areas: ["판교", "분당"], registered: ["판교 양꼬치"] });
  assert.deepEqual(picked.map((p) => p.keyword), ["판교양다리", "판교회식장소"]);
});

test("광고그룹 표에 플레이스 광고 성과도 나온다", () => {
  const groups = analyzeGroups({ ...ACCOUNT, stats: new Map(Object.entries(STATS)) });
  assert.equal(groups[0].campaignType, "파워링크");
  const place = groups.find((g) => g.campaignType === "플레이스");
  assert.equal(place.clicks, 450);
  assert.equal(place.cpc, Math.round(150000 / 450));
});

test("기간은 한국 날짜로 어제까지 N일", () => {
  assert.deepEqual(lastDays(30, new Date("2026-11-13T01:00:00+09:00")), { since: "2026-10-14", until: "2026-11-12" });
});

test("엑셀 한 파일에 요약 · 지점별 키워드 · 새 후보 · 광고그룹 시트를 만든다", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "searchad-"));
  try {
    const stats = new Map(Object.entries(STATS));
    const analysis = analyzeKeywords({ ...ACCOUNT, stats }, VOLUMES);
    const groups = analyzeGroups({ ...ACCOUNT, stats });
    const candidates = pickCandidates([{ relKeyword: "판교양다리", monthlyPcQcCnt: 50, monthlyMobileQcCnt: 400 }], { areas: ["판교"], registered: [] });
    const file = path.join(dir, "report.xlsx");
    await writeKeywordReport(file, [{ name: "판교점", range: { since: "2026-10-14", until: "2026-11-12" }, analysis, groups, candidates, warnings: [] }]);

    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(file);
    assert.deepEqual(book.worksheets.map((s) => s.name), ["요약", "판교 키워드", "판교 새 후보", "판교 광고그룹"]);
    const sheet = book.getWorksheet("판교 키워드");
    assert.equal(sheet.getCell("A1").value, "키워드");
    assert.equal(sheet.getCell("A2").value, "판교 맛집");
    assert.equal(sheet.getCell("B2").value, "비싼 키워드");
    assert.equal(book.getWorksheet("판교 새 후보").getCell("A2").value, "판교양다리");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("광고그룹이 수천 개여도: 동시에 몇 개씩 읽고, 검색수는 노출된 키워드만 노출 많은 순으로 묻는다", async () => {
  const { mapLimit, keywordsForVolume } = await import("../lib/searchad/keywords.mjs");
  let running = 0;
  let peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, async (n) => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 5));
    running -= 1;
    return n * 2;
  });
  assert.deepEqual(out, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  assert.equal(peak, 4);

  const stats = new Map(Object.entries(STATS));
  assert.deepEqual(keywordsForVolume({ keywords: ACCOUNT.keywords, stats }), ["판교 양꼬치", "판교 맛집", "백현동 양갈비"]);
  assert.deepEqual(keywordsForVolume({ keywords: ACCOUNT.keywords, stats }, 1), ["판교 양꼬치"]);
});

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createClient } from "../lib/searchad/client.mjs";
import { buildVolumeTable, CATEGORIES, classifyKeyword, fillVolumes, localBranch, summarize, volumeOf, writeVolumeReport } from "../lib/searchad/volumes.mjs";

test("키워드 분류: 가게 이름 → 우리 동네+메뉴 → 우리 동네 → 넓은 단어 → 양고기 → 요리 → 다른 동네 → 기타", () => {
  assert.equal(classifyKeyword("판교왕징양꼬치"), CATEGORIES[0]);
  assert.equal(classifyKeyword("판교 양갈비"), CATEGORIES[1]);
  assert.equal(classifyKeyword("성남마라샹궈"), CATEGORIES[1]);
  assert.equal(classifyKeyword("판교현대백화점"), CATEGORIES[2]);
  assert.equal(classifyKeyword("근처맛집"), CATEGORIES[3]);
  assert.equal(classifyKeyword("강남역양꼬치"), CATEGORIES[4]);
  assert.equal(classifyKeyword("마라샹궈"), CATEGORIES[5]);
  assert.equal(classifyKeyword("강남역맛집"), CATEGORIES[6]);
  assert.equal(classifyKeyword("김밥"), CATEGORIES[7]);
  assert.equal(localBranch("모란역맛집"), "모란");
  assert.equal(localBranch("야탑역맛집"), "판교");
  assert.equal(localBranch("김밥"), "");
});

test("검색수: 없는 것만 5개씩 묻고, 네이버에 없는 키워드도 기록해 다시 묻지 않는다", async () => {
  const asked = [];
  const fetch = async (url) => {
    const hints = new URL(url).searchParams.get("hintKeywords").split(",");
    asked.push(hints);
    const known = hints.filter((h) => h !== "아무도안찾는말");
    return new Response(JSON.stringify({ keywordList: [...known.map((h) => ({ relKeyword: h, monthlyPcQcCnt: 100, monthlyMobileQcCnt: "< 10", compIdx: "높음" })), { relKeyword: "연관어", monthlyPcQcCnt: 1, monthlyMobileQcCnt: 1 }] }));
  };
  const client = createClient({ apiKey: "a", secretKey: "b", customerId: 1 }, { fetch, wait: async () => {} });
  const now = Date.parse("2026-11-16T00:00:00Z");
  const cache = { 판교양꼬치: { at: "2026-11-10T00:00:00Z", pc: 200, mobile: 1000 }, 오래된말: { at: "2026-09-01T00:00:00Z", pc: 1, mobile: 1 } };
  let saves = 0;
  const words = ["판교양꼬치", "판교 양꼬치", "모란양꼬치", "아무도안찾는말", "오래된말", "a", "b", "c", "d"];
  const result = await fillVolumes(client, words, cache, { now, concurrency: 1, save: async () => (saves += 1), saveEvery: 1 });
  assert.equal(result.asked, 7, "판교양꼬치(최근)는 다시 묻지 않고, 30일 지난 '오래된말'은 다시 묻는다");
  assert.equal(asked.length, 2);
  assert.ok(saves >= 2);
  assert.equal(volumeOf(cache, "모란 양꼬치").total, 100);
  assert.equal(volumeOf(cache, "아무도안찾는말").text, "정보 없음");
  assert.equal(volumeOf(cache, "판교양꼬치").total, 1200);
  assert.equal(volumeOf(cache, "없던말").text, "확인 전");
});

test("두 지점 표: 같은 단어는 한 줄로, 지점별 넣은 곳 수·성과, 검색 많은 순", async () => {
  const at = "2026-11-16T00:00:00Z";
  const cache = { 판교양꼬치: { at, pc: 200, mobile: 1000 }, 맛집: { at, pc: 90000, mobile: 500000 }, 김밥: { at, none: true } };
  const acc = (kws, stats) => ({ keywords: kws, stats: new Map(Object.entries(stats)) });
  const branches = [
    { id: "pangyo", name: "판교점", account: acc([{ nccKeywordId: "p1", keyword: "판교양꼬치" }, { nccKeywordId: "p2", keyword: "판교 양꼬치" }, { nccKeywordId: "p3", keyword: "맛집" }], { p1: { impCnt: 100, clkCnt: 0 }, p3: { impCnt: 9000, clkCnt: 200, salesAmt: 120000 } }) },
    { id: "moran", name: "모란본점", account: acc([{ nccKeywordId: "m1", keyword: "맛집" }, { nccKeywordId: "m2", keyword: "김밥", userLock: true }], { m1: { impCnt: 20000, clkCnt: 680, salesAmt: 485000 } }) },
  ];
  const rows = buildVolumeTable(branches, cache);
  assert.deepEqual(rows.map((r) => r.keyword), ["맛집", "판교양꼬치", "김밥"]);
  assert.equal(rows[0].per.moran.cost, 485000);
  assert.equal(rows[1].per.pangyo.count, 2);
  assert.equal(rows[2].per.moran.on, 0);
  const sum = summarize(rows, ["pangyo", "moran"]);
  assert.equal(sum.find((s) => s.category === CATEGORIES[3]).cost.moran, 485000);

  const dir = await mkdtemp(path.join(os.tmpdir(), "volumes-"));
  try {
    const file = path.join(dir, "v.xlsx");
    await writeVolumeReport(file, rows, branches, { range: { since: "2026-10-17", until: "2026-11-15" } });
    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    await book.xlsx.readFile(file);
    assert.deepEqual(book.worksheets.map((s) => s.name), ["요약", "검색 많은 순 (10회 이상)", "우리 동네 키워드"]);
    assert.equal(book.getWorksheet("검색 많은 순 (10회 이상)").getCell("B2").value, "맛집");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

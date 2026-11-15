import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { resolveRules } from "../lib/store-agent/base-template.mjs";
import { exceptionFlags, planKeywordActions, statsWindow } from "../lib/store-agent/keyword-rules.mjs";
import { createSandbox } from "../lib/store-agent/sandbox.mjs";
import { createSearchAdClient, parseVolume, signRequest } from "../lib/store-agent/searchad-client.mjs";
import { reviewPending, runSearchAdStep } from "../lib/store-agent/searchad-step.mjs";
import { assertStoreId, listStoreIds, loadStore, renderStoreTemplate, TEMPLATE_PATH, validateStore } from "../lib/store-agent/stores.mjs";
import { approvalNeeded, recordReview } from "../lib/store-agent/trust.mjs";

const TODAY = "2026-11-15";
const OLD = "2026-01-01T00:00:00Z";

test("매장 파일 두 개가 있고 모두 점검을 통과한다", () => {
  assert.deepEqual(listStoreIds(), ["moran", "pangyo"]);
  for (const id of listStoreIds()) assert.equal(loadStore(id).id, id);
});

test("매장 id는 경로 문자를 막는다 (다른 매장 폴더로 못 넘어감)", () => {
  for (const bad of ["../moran", "pangyo/..", "Pangyo", "a", "", "판교"]) assert.throws(() => assertStoreId(bad));
  assert.throws(() => createSandbox("../moran"));
});

test("기본 틀로 새 매장 파일을 만든다", () => {
  const store = renderStoreTemplate(readFileSync(TEMPLATE_PATH, "utf8"), {
    id: "bundang",
    name: "왕징 \"분당\"점",
    shortName: "분당점",
    branchId: "bundang",
    tone: "친근하게",
    coreKeywords: ["분당양꼬치"],
  });
  assert.equal(store.name, '왕징 "분당"점');
  assert.deepEqual(store.searchAd.coreKeywords, ["분당양꼬치"]);
  assert.deepEqual(validateStore(store, "bundang"), []);
  assert.throws(() => renderStoreTemplate(readFileSync(TEMPLATE_PATH, "utf8"), { id: "x1" }), /답이 없습니다/);
});

test("매장 규칙이 기본 틀을 덮어쓴다", () => {
  const rules = resolveRules({ searchAd: { rules: { minMonthlySearch: 30 } }, trust: { promoteAfter: 3 } });
  assert.equal(rules.searchAd.minMonthlySearch, 30);
  assert.equal(rules.searchAd.windowDays, 30);
  assert.equal(rules.trust.promoteAfter, 3);
});

test("검색광고 서명은 시각.메서드.경로를 HMAC-SHA256으로 만든다", () => {
  assert.equal(signRequest({ timestamp: "1700000000000", method: "get", uri: "/ncc/campaigns", secretKey: "secret" }), "9eQw3iPVTMIl3cgVonp2ltPK6kBGHuGeRLFPC4u7iOw=");
});

test("검색량 글자를 숫자로 바꾼다", () => {
  assert.equal(parseVolume("< 10"), 0);
  assert.equal(parseVolume("1,230"), 1230);
  assert.equal(parseVolume(50), 50);
  assert.equal(parseVolume(undefined), null);
});

test("통계 기간은 오늘을 뺀 지난 N일이다", () => {
  assert.deepEqual(statsWindow(TODAY, 30), { since: "2026-10-16", until: "2026-11-14" });
});

const kw = (id, keyword, extra = {}) => ({ nccKeywordId: id, nccAdgroupId: "grp-1", keyword, regTm: OLD, userLock: false, ...extra });
const rules = resolveRules({}).searchAd;

test("검색량 없는 키워드는 지우고, 핵심·지킬·꺼진·새 키워드는 건드리지 않는다", () => {
  const keywords = [
    kw("k1", "판교 양꼬치"), // 핵심 (띄어쓰기 달라도)
    kw("k2", "판교양갈비맛집추천"), // 노출 0, 검색량 0 → 삭제
    kw("k3", "판교중식당"), // 노출 0, 검색량 많음 → 남김
    kw("k4", "판교훠궈", { userLock: true }), // 꺼짐
    kw("k5", "판교신메뉴", { regTm: "2026-11-01T00:00:00Z" }), // 새 키워드
    kw("k6", "판교회식장소"), // 사장님이 지키라고 함
    kw("k7", "판교검색량모름"), // 검색량 모름 → 남김
    kw("k8", "판교맛집"), // 잘 됨
  ];
  const stats = new Map([["k8", { impCnt: 1000, clkCnt: 50, salesAmt: 40000, ccnt: 3 }]]);
  const volumes = new Map([
    ["판교양갈비맛집추천".toUpperCase(), 0],
    ["판교중식당", 500],
    ["판교회식장소", 0],
  ]);
  const plan = planKeywordActions({ keywords, stats, volumes, rules, coreKeywords: ["판교양꼬치"], protectedKeywords: ["판교회식장소"], today: TODAY });
  assert.deepEqual(plan.actions.map((a) => [a.type, a.keyword]), [["delete", "판교양갈비맛집추천"]]);
  assert.equal(plan.top[0].keyword, "판교맛집");
  assert.ok(plan.notes.some((n) => n.includes("1개는 지우지 않았습니다")));
});

test("전환 기록이 있으면 돈만 쓰는 키워드를 일시중지하고, 없으면 판단하지 않는다", () => {
  const keywords = [kw("a", "돈만씀"), kw("b", "전환됨")];
  const withConv = new Map([
    ["a", { impCnt: 900, clkCnt: 40, salesAmt: 52000, ccnt: 0 }],
    ["b", { impCnt: 500, clkCnt: 30, salesAmt: 20000, ccnt: 2 }],
  ]);
  const plan = planKeywordActions({ keywords, stats: withConv, volumes: new Map(), rules, today: TODAY });
  assert.deepEqual(plan.actions.map((a) => [a.type, a.keyword]), [["pause", "돈만씀"]]);

  const noConv = new Map([["a", withConv.get("a")]]);
  const plan2 = planKeywordActions({ keywords: [keywords[0]], stats: noConv, volumes: new Map(), rules, today: TODAY });
  assert.equal(plan2.actions.length, 0);
  assert.ok(plan2.notes[0].includes("전환 기록이 없어"));
});

test("한 번에 많이 지우면 자동이어도 승인을 받는다", () => {
  const actions = Array.from({ length: 11 }, (_, i) => ({ type: "delete", keywordId: `k${i}` }));
  assert.equal(exceptionFlags(actions, resolveRules({}).approval).length, 1);
  assert.equal(exceptionFlags(actions.slice(0, 10), resolveRules({}).approval).length, 0);
});

test("수정 없이 5번 승인되면 자동, 고치면 다시 수습", () => {
  let memory = { trust: {} };
  for (let i = 0; i < 4; i += 1) {
    const r = recordReview(memory, "searchAd", "approved", { promoteAfter: 5 });
    assert.equal(r.promoted, false);
    memory = r.memory;
  }
  assert.equal(approvalNeeded({ memory, channel: "searchAd", promoteAfter: 5 }).required, true);
  const fifth = recordReview(memory, "searchAd", "approved", { promoteAfter: 5 });
  assert.equal(fifth.promoted, true);
  memory = fifth.memory;
  assert.equal(approvalNeeded({ memory, channel: "searchAd", promoteAfter: 5 }).required, false);
  assert.equal(approvalNeeded({ memory, channel: "searchAd", flags: ["많이 삭제"], promoteAfter: 5 }).required, true);
  const edited = recordReview(memory, "searchAd", "edited", { promoteAfter: 5 });
  assert.equal(edited.demoted, true);
  assert.deepEqual(edited.memory.trust.searchAd, { mode: "probation", streak: 0 });
});

/** 네이버에 보내지 않는 가짜 검색광고 API */
function fakeAds({ keywords, stats, volumes = {} }) {
  const calls = [];
  const client = {
    listAdgroups: async () => [{ nccAdgroupId: "grp-1" }],
    listKeywords: async () => keywords,
    getStats: async () => new Map(Object.entries(stats)),
    getMonthlyVolumes: async () => new Map(Object.entries(volumes)),
    deleteKeyword: async (a) => calls.push(["delete", a.keyword]),
    pauseKeyword: async (a) => calls.push(["pause", a.keyword]),
  };
  return { client, calls, factory: () => client };
}

async function sandboxWithCredentials(id = "pangyo") {
  const sandbox = createSandbox(id, mkdtempSync(path.join(tmpdir(), "store-agent-")));
  await sandbox.init();
  await sandbox.writeCredentials({ accessLicense: "a", secretKey: "s", customerId: "1", campaignIds: ["cmp-1"] });
  return sandbox;
}

const store = { id: "pangyo", shortName: "판교점", channels: { searchAd: true }, searchAd: { coreKeywords: ["판교양꼬치"] } };

test("수습 기간에는 승인 대기로 남기고 아무것도 지우지 않는다", async () => {
  const sandbox = await sandboxWithCredentials();
  const ads = fakeAds({ keywords: [kw("k1", "안팔림1"), kw("k2", "안팔림2")], stats: {}, volumes: { 안팔림1: 0, 안팔림2: 0 } });
  const result = await runSearchAdStep({ store, sandbox, today: TODAY, clientFactory: ads.factory, log: () => {} });
  assert.equal(result.status, "pending");
  assert.equal(ads.calls.length, 0);
  assert.ok(await sandbox.readPending("searchAd"));

  // 같은 날 다시 돌려도 대기 중이라고만 한다
  const again = await runSearchAdStep({ store, sandbox, today: TODAY, clientFactory: ads.factory, log: () => {} });
  assert.equal(again.status, "waiting");
});

test("사장님이 계획에서 뺀 키워드는 기억해 다음부터 지킨다", async () => {
  const sandbox = await sandboxWithCredentials();
  const ads = fakeAds({ keywords: [kw("k1", "안팔림1"), kw("k2", "지켜줘")], stats: {}, volumes: { 안팔림1: 0, 지켜줘: 0 } });
  await runSearchAdStep({ store, sandbox, today: TODAY, clientFactory: ads.factory, log: () => {} });

  // 사장님이 pending 파일에서 '지켜줘'를 지운다
  const file = sandbox.pendingPath("searchAd");
  const pending = JSON.parse(readFileSync(file, "utf8"));
  pending.actions = pending.actions.filter((a) => a.keyword !== "지켜줘");
  writeFileSync(file, JSON.stringify(pending));

  const result = await reviewPending({ store, sandbox, decision: "approve", today: TODAY, clientFactory: ads.factory });
  assert.equal(result.edited, true);
  assert.deepEqual(result.removed, ["지켜줘"]);
  assert.deepEqual(ads.calls, [["delete", "안팔림1"]]);
  const memory = await sandbox.readMemory();
  assert.deepEqual(memory.protectedKeywords, ["지켜줘"]);
  assert.deepEqual(memory.trust.searchAd, { mode: "probation", streak: 0 });
  assert.equal(await sandbox.readPending("searchAd"), null);

  // 다음 날에는 '지켜줘'가 후보에 오르지 않는다
  const next = await runSearchAdStep({ store, sandbox, today: "2026-11-16", clientFactory: fakeAds({ keywords: [kw("k2", "지켜줘")], stats: {}, volumes: { 지켜줘: 0 } }).factory, log: () => {} });
  assert.equal(next.status, "nothing");
});

test("자동 단계에서는 바로 적용하고, 매장 샌드박스끼리 기억이 섞이지 않는다", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "store-agent-"));
  const pangyo = createSandbox("pangyo", root);
  const moran = createSandbox("moran", root);
  await pangyo.init();
  await moran.init();
  await pangyo.writeCredentials({ accessLicense: "a", secretKey: "s", customerId: "1", campaignIds: ["cmp-1"] });
  await pangyo.writeMemory({ ...(await pangyo.readMemory()), trust: { searchAd: { mode: "auto", streak: 5 } } });

  const ads = fakeAds({ keywords: [kw("k1", "안팔림")], stats: {}, volumes: { 안팔림: 0 } });
  const result = await runSearchAdStep({ store, sandbox: pangyo, today: TODAY, clientFactory: ads.factory, log: () => {} });
  assert.equal(result.status, "applied");
  assert.deepEqual(ads.calls, [["delete", "안팔림"]]);
  assert.equal((await pangyo.readMemory()).deletedKeywords.length, 1);

  assert.equal((await moran.readMemory()).deletedKeywords.length, 0);
  assert.equal((await moran.readMemory()).trust.searchAd.mode, "probation");
  const moranResult = await runSearchAdStep({ store: { ...store, id: "moran" }, sandbox: moran, today: TODAY, clientFactory: ads.factory, log: () => {} });
  assert.equal(moranResult.status, "skipped");
});

test("검색광고 클라이언트는 서명 헤더와 여러 ids를 보낸다", async () => {
  const seen = [];
  const client = createSearchAdClient({
    accessLicense: "lic",
    secretKey: "secret",
    customerId: "123",
    now: () => 1700000000000,
    fetchImpl: async (url, init) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ data: [{ id: "k1", impCnt: 3, clkCnt: 1, salesAmt: 500, ccnt: 0 }] }), { status: 200 });
    },
  });
  const stats = await client.getStats(["k1", "k2"], { since: "2026-10-16", until: "2026-11-14" });
  assert.deepEqual(stats.get("k1"), { impCnt: 3, clkCnt: 1, salesAmt: 500, ccnt: 0 });
  const { url, init } = seen[0];
  const parsed = new URL(url);
  assert.equal(parsed.pathname, "/stats");
  assert.deepEqual(parsed.searchParams.getAll("ids"), ["k1", "k2"]);
  assert.equal(parsed.searchParams.get("timeRange"), '{"since":"2026-10-16","until":"2026-11-14"}');
  assert.equal(init.headers["X-Customer"], "123");
  assert.equal(init.headers["X-Signature"], signRequest({ timestamp: "1700000000000", method: "GET", uri: "/stats", secretKey: "secret" }));
});

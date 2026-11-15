import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { createClient } from "../lib/searchad/client.mjs";
import { listAccount, openBatches, planPause, setUserLock } from "../lib/searchad/pause.mjs";

const quiet = { wait: async () => {}, now: () => 1700000000000 };
const KEYS = { apiKey: "a", secretKey: "b", customerId: 1 };

const ACCOUNT = {
  campaigns: [
    { nccCampaignId: "c-pc", name: "파워컨텐츠#1", campaignTp: "POWER_CONTENTS" },
    { nccCampaignId: "c-la", name: "성남맛집/프로그램", campaignTp: "PLACE" },
    { nccCampaignId: "c-pw", name: "26.07.05 경기+메뉴", campaignTp: "WEB_SITE" },
  ],
  adgroups: [
    { nccAdgroupId: "g-oi", nccCampaignId: "c-pc", name: "오이,오이무침,오이탕탕이" },
    { nccAdgroupId: "g-la", nccCampaignId: "c-la", name: "성남맛집/MO/프로그램" },
    { nccAdgroupId: "g-pw", nccCampaignId: "c-pw", name: "경기+메뉴" },
  ],
  keywords: [
    { nccKeywordId: "k1", nccAdgroupId: "g-oi", nccCampaignId: "c-pc", keyword: "오이무침" },
    { nccKeywordId: "k2", nccAdgroupId: "g-pw", nccCampaignId: "c-pw", keyword: "오이 무침" },
    { nccKeywordId: "k3", nccAdgroupId: "g-la", nccCampaignId: "c-la", keyword: "오이무침" },
    { nccKeywordId: "k4", nccAdgroupId: "g-pw", nccCampaignId: "c-pw", keyword: "경기버스", userLock: true },
    { nccKeywordId: "k5", nccAdgroupId: "g-oi", nccCampaignId: "c-pc", keyword: "모란양꼬치" },
  ],
};

test("끌 목록: 같은 단어는 모든 광고그룹에서, 라이브애드·이미 꺼진 것·목록 밖 단어는 건드리지 않는다", () => {
  const plan = planPause(ACCOUNT, [{ keyword: "오이무침" }, { keyword: "경기버스" }, { keyword: "곤지암" }]);
  assert.deepEqual(plan.toPause.map((i) => i.nccKeywordId), ["k1", "k2"]);
  assert.deepEqual(plan.liveAd.map((i) => i.nccKeywordId), ["k3"], "라이브애드 캠페인은 건너뛴다");
  assert.deepEqual(plan.alreadyOff.map((i) => i.nccKeywordId), ["k4"], "원래 꺼져 있던 건 기록하지 않아 되돌릴 때도 켜지 않는다");
  assert.deepEqual(plan.notFound, ["곤지암"]);
  assert.equal(plan.toPause[0].campaignType, "파워컨텐츠");
});

test("끄기·켜기는 userLock만 바꾸고, 쓰기 허락 없는 클라이언트로는 못 바꾼다", async () => {
  const calls = [];
  const fetch = async (url, init) => {
    const { pathname, searchParams } = new URL(url);
    calls.push({ method: init.method, pathname, fields: searchParams.get("fields"), body: init.body && JSON.parse(init.body), sig: init.headers["X-Signature"] });
    return new Response("[]");
  };
  const items = Array.from({ length: 120 }, (_, i) => ({ nccKeywordId: `k${i}`, nccAdgroupId: "g" }));
  await assert.rejects(setUserLock(createClient(KEYS, { ...quiet, fetch }), items, true), /allowWrite/);
  assert.equal(calls.length, 0);

  await setUserLock(createClient(KEYS, { ...quiet, fetch, allowWrite: true }), items, true);
  assert.equal(calls.length, 3, "50개씩 나눠서");
  assert.ok(calls.every((c) => c.method === "PUT" && c.pathname === "/ncc/keywords" && c.fields === "userLock"));
  assert.deepEqual(calls[0].body[0], { nccKeywordId: "k0", nccAdgroupId: "g", userLock: true });
  assert.equal(calls[2].body.length, 20);
});

test("계정 목록 읽기: 캠페인 → 광고그룹 → 키워드 (성과는 안 읽음)", async () => {
  const fetch = async (url) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/ncc/campaigns") return new Response(JSON.stringify(ACCOUNT.campaigns));
    if (pathname === "/ncc/adgroups") return new Response(JSON.stringify(ACCOUNT.adgroups.filter((g) => g.nccCampaignId === searchParams.get("nccCampaignId"))));
    if (pathname === "/ncc/keywords") return new Response(JSON.stringify(ACCOUNT.keywords.filter((k) => k.nccAdgroupId === searchParams.get("nccAdgroupId"))));
    throw new Error(`성과 API를 부르면 안 됨: ${pathname}`);
  };
  const account = await listAccount(createClient(KEYS, { ...quiet, fetch }));
  assert.equal(account.keywords.length, 5);
});

test("되돌릴 기록: 아직 되돌리지 않은 것만, 지점별로", () => {
  const log = { batches: [{ branch: "moran", items: [1] }, { branch: "moran", restoredAt: "x", items: [2] }, { branch: "pangyo", items: [3] }] };
  assert.equal(openBatches(log, "moran").length, 1);
  assert.equal(openBatches(log).length, 2);
});

test("끌 목록 파일: 두 지점, 애매한 단어는 없고, 우리 메뉴 이름은 표시돼 있다", async () => {
  const list = JSON.parse(await readFile(new URL("../data/searchad/pause-2026-11-recipe.json", import.meta.url), "utf8"));
  const all = [...list.branches.pangyo, ...list.branches.moran].map((k) => k.keyword);
  for (const keep of ["가족외식", "결혼기념일식사", "꼬치전문점", "모란양꼬치", "판교양꼬치", "성남마라샹궈"]) assert.ok(!all.includes(keep), keep);
  assert.ok(list.branches.moran.find((k) => k.keyword === "오이무침").ourMenu);
  assert.ok(!list.branches.moran.find((k) => k.keyword === "캠핑음식").ourMenu);
});

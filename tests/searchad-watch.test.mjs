import assert from "node:assert/strict";
import { test } from "node:test";

import { TEXT_MAX } from "../lib/notify/kakao.mjs";
import { createClient } from "../lib/searchad/client.mjs";
import { buildDailyRows, dateList } from "../lib/searchad/history.mjs";
import { BASELINE_DAYS, evaluateLiveAd, formatWatchMessage, watchBranch, watchRange } from "../lib/searchad/watch.mjs";

/** 판교점 2026-07-18 ~ 08-20: 8/14부터 라이브애드 클릭이 하루 40번 안팎에서 14번 안팎으로 (실제 8월 모양) */
function augustRows(until) {
  const range = watchRange(until);
  const days = new Map();
  for (const date of dateList(range.since, range.until)) {
    const weak = date >= "2026-08-14";
    days.set(date, { impCnt: weak ? 2300 : 4100, clkCnt: weak ? 13 : 40, salesAmt: weak ? 23000 : 70000, avgRnk: weak ? 2.4 : 2.2 });
  }
  return buildDailyRows([{ group: "라이브애드", days }], range, null);
}

test("평소는 지난 28일, 어제를 그와 비교한다", () => {
  assert.equal(BASELINE_DAYS, 28);
  assert.deepEqual(watchRange("2026-08-14"), { since: "2026-07-17", until: "2026-08-14" });
});

test("8월 14일: 첫날부터 '약해짐 의심'으로 잡는다 (노출은 절반 남았는데 클릭이 크게 줆)", () => {
  const r = evaluateLiveAd(augustRows("2026-08-14"));
  assert.equal(r.status, "약해짐 의심");
  assert.equal(r.streak, 1);
  assert.deepEqual(r.reasons, ["클릭 13 (평소 40)"]);
});

test("약해진 지 1주가 지나도 계속 알린다 (8/20 = 7일째)", () => {
  const r = evaluateLiveAd(augustRows("2026-08-20"));
  assert.equal(r.status, "약해짐 의심");
  assert.equal(r.streak, 7);
});

test("평소대로면 정상, 노출 0이면 멈춤 의심", () => {
  const ok = evaluateLiveAd(augustRows("2026-08-13"));
  assert.equal(ok.status, "정상");
  assert.equal(ok.streak, 0);
  const rows = augustRows("2026-08-13");
  rows.at(-1)["라이브애드"] = { impressions: 0, clicks: 0, cost: 0 };
  rows.at(-1).liveAdRank = null;
  assert.equal(evaluateLiveAd(rows).status, "멈춤 의심");
});

test("카톡 메시지: 이상이 있을 때만, 200자 안으로, 지점별 한 줄", () => {
  const weak = evaluateLiveAd(augustRows("2026-08-16"));
  const ok = evaluateLiveAd(augustRows("2026-08-13"));
  const message = formatWatchMessage([{ name: "판교점", result: weak }, { name: "모란본점", result: ok }], { date: "2026-08-16" });
  assert.equal(
    message,
    [
      "[왕징 라이브애드] 8/16 확인 필요",
      "⚠️ 판교: 약해짐 의심 3일째 - 클릭 13 (평소 40)",
      "✅ 모란: 정상 (클릭 40, 평소 40)",
      "라이브애드 화면에서 캠페인 상태·잔액·연동을 확인해 주세요.",
    ].join("\n"),
  );
  assert.ok([...message].length <= TEXT_MAX);

  assert.equal(formatWatchMessage([{ name: "판교점", result: ok }], { date: "2026-08-13" }), null, "정상이면 안 보낸다");
  assert.match(formatWatchMessage([{ name: "판교점", result: ok }], { date: "2026-08-13", heartbeat: true }), /이번 주도 정상 감시 중/);
  const failed = formatWatchMessage([{ name: "모란본점", error: "검색광고 API /ncc/campaigns 실패: 401 Unauthorized (API 키·비밀키·CUSTOMER_ID가 맞는지 확인해 주세요)" }], { date: "2026-08-13" });
  assert.match(failed, /❌ 모란: 점검 실패/);
  assert.ok([...failed].length <= TEXT_MAX);
});

test("감시는 라이브애드 캠페인만 읽는다", async () => {
  const asked = [];
  const fetch = async (url) => {
    const { pathname, searchParams } = new URL(url);
    if (pathname === "/ncc/campaigns") {
      return new Response(JSON.stringify([
        { nccCampaignId: "cmp-la", name: "성남맛집/프로그램", campaignTp: "PLACE" },
        { nccCampaignId: "cmp-pl", name: "판교왕징_플레이스", campaignTp: "PLACE" },
      ]));
    }
    asked.push(searchParams.get("id"));
    const { since, until } = JSON.parse(searchParams.get("timeRange"));
    return new Response(JSON.stringify({ data: dateList(since, until).map((d) => ({ dateStart: d, impCnt: 4000, clkCnt: 40, avgRnk: 2 })) }));
  };
  const client = createClient({ apiKey: "a", secretKey: "b", customerId: 1 }, { fetch, wait: async () => {} });
  const result = await watchBranch(client, "2026-11-14");
  assert.deepEqual(asked, ["cmp-la"]);
  assert.equal(result.status, "정상");
  assert.equal(result.campaigns, 1);
});

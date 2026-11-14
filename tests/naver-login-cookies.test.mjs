import assert from "node:assert/strict";
import { test } from "node:test";

import { formatBlogReport } from "../lib/blog/report.mjs";
import { loginPersistence } from "../lib/smartplace/login-cookies.mjs";

const now = Date.parse("2026-11-14T12:00:00Z");
const later = now / 1000 + 365 * 86400;

test("'로그인 상태 유지'로 받은 로그인 쿠키는 재부팅해도 남는 것으로 본다", () => {
  assert.equal(loginPersistence([{ name: "NID_AUT", expires: later }, { name: "NID_SES", expires: later }], now), "persistent");
});

test("만료 시각이 없는 세션 쿠키 로그인은 창이 닫히면 풀리는 것으로 본다", () => {
  assert.equal(loginPersistence([{ name: "NID_AUT", expires: -1 }, { name: "NID_SES", expires: -1 }, { name: "NID_JST", expires: later }], now), "session");
  assert.equal(loginPersistence([{ name: "NID_AUT", expires: later }, { name: "NID_SES", expires: -1 }], now), "session");
});

test("로그인 쿠키가 없으면 로그인 안 된 것으로 본다", () => {
  assert.equal(loginPersistence([{ name: "NID_JST", expires: later }], now), "none");
  assert.equal(loginPersistence([], now), "none");
});

test("카톡 결과에 로그인 안내 줄을 덧붙인다", () => {
  const text = formatBlogReport({
    date: "2026-11-14",
    results: [{ branch: "판교점", slot: "1번째 글", menu: "소룽샤", status: "ok" }],
    notes: ["🔑 판교: 로그인 상태 유지 꺼짐(재부팅하면 풀림)"],
  });
  assert.match(text, /✅ 판교 1 소룽샤\n🔑 판교: 로그인 상태 유지 꺼짐/);
  assert.equal(formatBlogReport({ date: "2026-11-14", results: [] }).includes("🔑"), false);
});

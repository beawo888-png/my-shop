import assert from "node:assert/strict";
import { test } from "node:test";

import { formatBlogReport, shortReason } from "../lib/blog/report.mjs";
import { authorizeUrl, clip, mergeTokens, REDIRECT_URI, TEXT_MAX } from "../lib/notify/kakao.mjs";

const results = [
  { branch: "판교점", slot: "1번째 글", menu: "어향육사", status: "ok" },
  { branch: "모란본점", slot: "1번째 글", menu: "물만두", status: "ok" },
  { branch: "판교점", slot: "2번째 글", menu: "오이무침", status: "fail", reason: "로그인 풀림" },
  { branch: "모란본점", slot: "2번째 글", menu: "가지볶음밥", status: "warn", reason: "링크 확인 필요" },
];

test("발행 결과를 한 통으로 줄인다", () => {
  assert.equal(
    formatBlogReport({ date: "2026-11-09", results }),
    [
      "[왕징 블로그] 11/9 발행 3편 성공, 1편 실패",
      "✅ 판교 1 어향육사",
      "✅ 모란 1 물만두",
      "❌ 판교 2 오이무침 - 로그인 풀림",
      "⚠️ 모란 2 가지볶음밥 - 링크 확인 필요",
      "자세한 내용은 PC 알림 창을 봐 주세요.",
    ].join("\n"),
  );
  assert.equal(
    formatBlogReport({ date: "2026-11-10", results: results.slice(0, 2) }),
    "[왕징 블로그] 11/10 2편 발행 완료\n✅ 판교 1 어향육사\n✅ 모란 1 물만두",
  );
  assert.ok([...formatBlogReport({ date: "2026-11-09", results: [...results, ...results, ...results] })].length <= TEXT_MAX);
});

test("긴 오류는 짧은 이유로 바꾼다", () => {
  assert.equal(shortReason("판교점 네이버 로그인이 풀렸습니다."), "로그인 풀림");
  assert.equal(shortReason("블로그에 '메뉴추천' 카테고리가 없습니다."), "카테고리 못 찾음");
  assert.ok([...shortReason("알 수 없는 아주 긴 오류 메시지가 여기에 들어갑니다 정말 길어요")].length <= 20);
});

test("카카오 토큰 갱신 응답에 갱신 토큰이 없으면 기존 것을 지킨다", () => {
  const saved = { restApiKey: "k", refreshToken: "old", refreshExpiresAt: 99 };
  const now = 1_000;
  assert.deepEqual(mergeTokens(saved, { access_token: "a", expires_in: 10 }, now), { ...saved, accessToken: "a", expiresAt: 11_000 });
  assert.deepEqual(mergeTokens(saved, { access_token: "a", expires_in: 10, refresh_token: "new", refresh_token_expires_in: 20 }, now), {
    restApiKey: "k",
    accessToken: "a",
    expiresAt: 11_000,
    refreshToken: "new",
    refreshExpiresAt: 21_000,
  });
});

test("카카오 로그인 주소에 메시지 권한과 돌아올 주소가 들어간다", () => {
  const url = new URL(authorizeUrl("abc"));
  assert.equal(url.searchParams.get("client_id"), "abc");
  assert.equal(url.searchParams.get("redirect_uri"), REDIRECT_URI);
  assert.equal(url.searchParams.get("scope"), "talk_message");
  assert.equal(clip("가".repeat(250)).length, TEXT_MAX);
});

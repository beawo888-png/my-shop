import assert from "node:assert/strict";
import { test } from "node:test";

import { THREADS_MAX_LENGTH, ThreadsApiError, publishTextPost } from "../lib/threads/threads-client.mjs";

function fakeFetch(responses) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, body: Object.fromEntries(new URLSearchParams(init.body)) });
      const next = responses.shift();
      if (!next) throw new Error(`예상하지 못한 추가 요청: ${url}`);
      return {
        ok: next.status >= 200 && next.status < 300,
        status: next.status,
        text: async () => next.body,
      };
    },
  };
}

const baseArgs = {
  userId: "12345",
  accessToken: "secret-token",
  text: "새벽 5시 20분.",
  publishDelayMs: 0,
};

test("컨테이너 생성 뒤 발행까지 두 번 호출한다", async () => {
  const { calls, fetchImpl } = fakeFetch([
    { status: 200, body: JSON.stringify({ id: "container-1" }) },
    { status: 200, body: JSON.stringify({ id: "post-9" }) },
  ]);

  const result = await publishTextPost({ ...baseArgs, fetchImpl });

  assert.deepEqual(result, { creationId: "container-1", postId: "post-9" });
  assert.equal(calls.length, 2);
  assert.ok(calls[0].url.endsWith("/12345/threads"));
  assert.equal(calls[0].body.media_type, "TEXT");
  assert.equal(calls[0].body.text, baseArgs.text);
  assert.equal(calls[0].body.access_token, "secret-token");
  assert.ok(calls[1].url.endsWith("/12345/threads_publish"));
  assert.equal(calls[1].body.creation_id, "container-1");
});

test("일시적인 5xx는 다시 시도한다", async () => {
  const { calls, fetchImpl } = fakeFetch([
    { status: 503, body: "temporarily unavailable" },
    { status: 200, body: JSON.stringify({ id: "container-2" }) },
    { status: 200, body: JSON.stringify({ id: "post-10" }) },
  ]);

  const result = await publishTextPost({ ...baseArgs, fetchImpl });

  assert.equal(result.postId, "post-10");
  assert.equal(calls.length, 3);
});

test("토큰 오류는 바로 실패시킨다", async () => {
  const { calls, fetchImpl } = fakeFetch([{ status: 401, body: '{"error":{"message":"bad token"}}' }]);

  await assert.rejects(() => publishTextPost({ ...baseArgs, fetchImpl }), ThreadsApiError);
  assert.equal(calls.length, 1, "재시도 없이 한 번만 호출해야 합니다");
});

test("자격 증명과 본문 길이를 미리 막는다", async () => {
  const { fetchImpl } = fakeFetch([]);
  await assert.rejects(() => publishTextPost({ ...baseArgs, fetchImpl, accessToken: "" }), /THREADS_ACCESS_TOKEN/);
  await assert.rejects(() => publishTextPost({ ...baseArgs, fetchImpl, userId: "" }), /THREADS_USER_ID/);
  await assert.rejects(() => publishTextPost({ ...baseArgs, fetchImpl, text: "   " }), /비어 있습니다/);
  await assert.rejects(
    () => publishTextPost({ ...baseArgs, fetchImpl, text: "가".repeat(THREADS_MAX_LENGTH + 1) }),
    /500자/,
  );
});

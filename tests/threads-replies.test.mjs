import assert from "node:assert/strict";
import test from "node:test";

import {
  REPLY_TEXTS,
  classifyReply,
  pickReplyText,
  publishReply,
} from "../lib/threads/replies.mjs";

test("분명한 칭찬은 자동 답글 후보가 된다", () => {
  for (const text of [
    "맛있어요",
    "글 잘 보고 갑니다",
    "응원합니다",
    "공감되네요",
    "사장님 화이팅",
    "고생 많으십니다",
  ]) {
    assert.equal(classifyReply(text), "praise", text);
  }
});

test("물어보는 글은 사장님께 넘긴다", () => {
  for (const text of [
    "영업시간이 어떻게 되나요?",
    "주차 되나요",
    "예약하고 싶은데 전화번호 좀",
    "위치가 어디예요",
    "양다리 얼마예요",
  ]) {
    assert.equal(classifyReply(text), "needs-owner", text);
  }
});

test("불만은 자동 답글을 달지 않는다", () => {
  for (const text of [
    "저번에 갔는데 좀 별로였어요",
    "불친절해서 다신 안 갑니다",
    "맛없어요",
    "너무 오래 기다렸어요",
    "가격이 너무 비싸요",
  ]) {
    assert.equal(classifyReply(text), "needs-owner", text);
  }
});

test("홍보와 링크는 자동 답글을 달지 않는다", () => {
  for (const text of ["맞팔해요", "https://example.com 좋은 정보", "DM 주세요 수익 보장"]) {
    assert.equal(classifyReply(text), "needs-owner", text);
  }
});

test("칭찬이라도 길면 사람이 읽는다", () => {
  const long = "맛있게 잘 먹었습니다 ".repeat(8);
  assert.ok([...long].length > 60);
  assert.equal(classifyReply(long), "needs-owner");
});

test("빈 댓글과 칭찬 아닌 말은 넘긴다", () => {
  assert.equal(classifyReply(""), "needs-owner");
  assert.equal(classifyReply("   "), "needs-owner");
  assert.equal(classifyReply(undefined), "needs-owner");
  assert.equal(classifyReply("안녕하세요"), "needs-owner");
});

test("같은 댓글에는 늘 같은 답글이 나온다", () => {
  const first = pickReplyText("17901234567890");
  assert.equal(first, pickReplyText("17901234567890"));
  assert.ok(REPLY_TEXTS.includes(first));
});

test("답글 문구는 손님 글을 되받아 쓰지 않는다", () => {
  // 짧고, 미리 적어둔 문장만 쓴다.
  for (const text of REPLY_TEXTS) {
    assert.ok([...text].length <= 40, text);
    assert.ok(!text.includes("{"), text);
  }
});

test("답글을 달 때 reply_to_id를 함께 보낸다", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: init.body });
    const id = calls.length === 1 ? "container-1" : "reply-1";
    return { ok: true, status: 200, text: async () => JSON.stringify({ id }) };
  };

  const result = await publishReply({
    userId: "123",
    accessToken: "token",
    text: "감사합니다.",
    replyToId: "reply-target",
    fetchImpl,
    publishDelayMs: 0,
  });

  assert.deepEqual(result, { creationId: "container-1", replyId: "reply-1" });
  assert.equal(calls.length, 2);
  assert.ok(calls[0].body.includes("reply_to_id=reply-target"));
  assert.ok(calls[0].url.endsWith("/123/threads"));
  assert.ok(calls[1].body.includes("creation_id=container-1"));
  assert.ok(calls[1].url.endsWith("/123/threads_publish"));
});

test("답글 대상이 없으면 올리지 않는다", async () => {
  await assert.rejects(
    publishReply({ userId: "123", accessToken: "t", text: "감사합니다.", fetchImpl: async () => {
      throw new Error("불려서는 안 된다");
    } }),
    /답글을 달 댓글 id가 없습니다/,
  );
});

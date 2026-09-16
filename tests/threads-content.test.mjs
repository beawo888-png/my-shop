import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LENGTH_MAX,
  LENGTH_MIN,
  checkPostContent,
  countCharacters,
  loadPostBank,
  parsePostBank,
  validateBank,
} from "../lib/threads/post-bank.mjs";

const bank = await loadPostBank();

test("원고집이 최소 두 달치를 담고 있다", () => {
  assert.ok(bank.posts.length >= 60, `원고가 ${bank.posts.length}편뿐입니다`);
});

test("모든 원고가 200자 기준 안에 있다", () => {
  const problems = validateBank(bank);
  assert.deepEqual(problems, []);
  for (const post of bank.posts) {
    assert.ok(
      post.length >= LENGTH_MIN && post.length <= LENGTH_MAX,
      `${post.id}: ${post.length}자`,
    );
  }
});

test("평균 길이가 목표 200자 근처다", () => {
  const total = bank.posts.reduce((sum, post) => sum + post.length, 0);
  const average = total / bank.posts.length;
  assert.ok(average >= 190 && average <= 210, `평균 ${average.toFixed(1)}자`);
});

test("id와 본문이 서로 겹치지 않는다", () => {
  assert.equal(new Set(bank.posts.map((post) => post.id)).size, bank.posts.length);
  assert.equal(new Set(bank.posts.map((post) => post.text)).size, bank.posts.length);
});

test("본문 점검이 해시태그·이모지·마크다운을 걸러낸다", () => {
  const body = bank.posts[0].text;
  assert.deepEqual(checkPostContent(body), []);
  assert.ok(checkPostContent(`${body}\n\n#자영업`).some((p) => p.includes("해시태그")));
  assert.ok(checkPostContent(`${body} 🔥`).some((p) => p.includes("이모지")));
  assert.ok(checkPostContent("- 항목 하나").some((p) => p.includes("마크다운")));
  assert.deepEqual(checkPostContent(""), ["본문이 비어 있습니다"]);
});

test("글자 수는 공백과 줄바꿈을 포함해서 센다", () => {
  assert.equal(countCharacters("가 나\n다"), 5);
});

test("원고집 파서가 헤더와 본문을 나눈다", () => {
  const { posts } = parsePostBank(
    ["# 주석", "== id: sample-one | theme: 새벽", "", "첫 줄.", "", "둘째 줄.", "", "== id: sample-two | theme: 마감", "한 줄."].join("\n"),
  );
  assert.equal(posts.length, 2);
  assert.equal(posts[0].id, "sample-one");
  assert.equal(posts[0].theme, "새벽");
  assert.equal(posts[0].text, "첫 줄.\n\n둘째 줄.");
  assert.equal(posts[1].text, "한 줄.");
});

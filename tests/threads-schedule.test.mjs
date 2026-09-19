import assert from "node:assert/strict";
import { test } from "node:test";

import { kstDateKey, kstDayIndex, selectPost } from "../lib/threads/schedule.mjs";

const posts = Array.from({ length: 60 }, (_, index) => ({ id: `post-${index}`, text: `본문 ${index}` }));

test("한국 시간 기준으로 날짜가 넘어간다", () => {
  // 07:00 KST = 전날 22:00 UTC. 워크플로 크론이 이 시각에 돈다.
  assert.equal(kstDateKey(new Date("2026-09-16T22:00:00Z")), "2026-09-17");
  assert.equal(kstDateKey(new Date("2026-09-16T14:59:59Z")), "2026-09-16");
  assert.equal(kstDateKey(new Date("2026-09-16T15:00:00Z")), "2026-09-17");
});

test("같은 KST 날짜면 순번도 같다", () => {
  assert.equal(
    kstDayIndex(new Date("2026-09-16T22:00:00Z")),
    kstDayIndex(new Date("2026-09-17T10:30:00Z")),
  );
  assert.equal(
    kstDayIndex(new Date("2026-09-17T15:00:00Z")) - kstDayIndex(new Date("2026-09-16T22:00:00Z")),
    1,
  );
});

test("같은 날에는 늘 같은 글이 나온다", () => {
  const first = selectPost({ posts, date: new Date("2026-09-16T22:00:00Z") });
  const second = selectPost({ posts, date: new Date("2026-09-17T09:00:00Z") });
  assert.equal(first.id, second.id);
});

test("한 바퀴(60일) 동안 같은 글이 두 번 나오지 않는다", () => {
  const seen = [];
  for (let day = 0; day < posts.length; day += 1) {
    const date = new Date(Date.UTC(2026, 0, 1 + day, 22, 0, 0));
    seen.push(selectPost({ posts, date, recentIds: seen }).id);
  }
  assert.equal(new Set(seen).size, posts.length);
});

test("최근에 올린 글은 건너뛴다", () => {
  const date = new Date("2026-09-16T22:00:00Z");
  const planned = selectPost({ posts, date });
  const next = selectPost({ posts, date, recentIds: [planned.id] });
  assert.notEqual(next.id, planned.id);
});

test("이력이 원고 수보다 많아도 글을 고른다", () => {
  const date = new Date("2026-09-16T22:00:00Z");
  const chosen = selectPost({ posts, date, recentIds: posts.map((post) => post.id) });
  assert.ok(posts.some((post) => post.id === chosen.id));
});

test("원고집이 비면 오류를 낸다", () => {
  assert.throws(() => selectPost({ posts: [] }), /원고집이 비어/);
});

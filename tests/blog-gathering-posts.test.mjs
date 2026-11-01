import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildSchedule,
  LENGTH_MAX,
  LENGTH_MIN,
  loadGatheringPosts,
  postLength,
  renderGatheringPost,
  SLOTS,
  TITLE_MAX,
  validateGatheringPosts,
} from "../lib/blog/gathering-posts.mjs";
import { alreadyPublished } from "../lib/blog/log.mjs";
import { BOOKING_LINK_TEXT, LAMB_LEG_NOTICE, MAP_LINK_TEXT, PHOTO_ROOT, TAG_MAX, toPlainText } from "../lib/blog/menu-posts.mjs";
import { BRANCH_IDS } from "../lib/smartplace/branches.mjs";

const bank = await loadGatheringPosts();
const at18 = (day) => new Date(`${day}T18:00:00+09:00`);
const schedule = buildSchedule(bank, at18(bank.endDate));
const days = Object.keys(schedule);
const everyPost = () =>
  days.flatMap((day) => BRANCH_IDS.flatMap((branchId) => SLOTS.map((slot) => ({ day, branchId, slot, post: renderGatheringPost({ bank, branchId, slot, date: at18(day) }) }))));
const posts = everyPost();

test("모임 글 원고집이 규칙을 모두 지킨다", () => {
  assert.deepEqual(validateGatheringPosts(bank), []);
});

test("발행 기간 내내 매일 지점마다 2편씩 나간다", () => {
  assert.equal(days[0], bank.startDate);
  assert.equal(days.at(-1), bank.endDate);
  assert.equal(posts.length, days.length * BRANCH_IDS.length * SLOTS.length);
  assert.ok(posts.every(({ post }) => post));
});

test("같은 날 네 편(두 지점 × 두 편)은 모두 다른 테마다", () => {
  for (const day of days) {
    const ids = posts.filter((p) => p.day === day).map((p) => p.post.themeId);
    assert.equal(new Set(ids).size, ids.length, day);
  }
});

test("한 블로그 안에서 제목이 겹치지 않는다", () => {
  for (const branchId of BRANCH_IDS) {
    const titles = posts.filter((p) => p.branchId === branchId).map((p) => p.post.title);
    assert.equal(new Set(titles).size, titles.length, branchId);
    for (const title of titles) assert.ok([...title].length <= TITLE_MAX, title);
  }
});

test("본문은 2000자 안팎이고 가격이 없으며, 예약·지도 링크와 양다리 안내가 들어간다", () => {
  for (const { post, day, branchId } of posts) {
    const length = postLength(post);
    assert.ok(length >= LENGTH_MIN && length <= LENGTH_MAX, `${day} ${branchId} ${length}자`);
    const text = toPlainText(post);
    assert.doesNotMatch(text, /\d원/);
    assert.doesNotMatch(text, /\{[^}]*\}/, "자리표시가 남지 않는다");
    assert.ok(text.includes(LAMB_LEG_NOTICE));
    assert.ok(text.includes(BOOKING_LINK_TEXT) && text.includes(MAP_LINK_TEXT));
    assert.ok(post.tags.length <= TAG_MAX);
  }
});

test("모란본점 글에는 판교점 사진이, 판교점 글에는 모란본점 사진이 들어가지 않는다", () => {
  for (const { post, branchId } of posts) {
    const other = branchId === "moran" ? /pangyo|storefront\.jpg|판교/ : /moran|모란/;
    for (const photo of post.photos) assert.doesNotMatch(photo.replace(PHOTO_ROOT, ""), other, `${branchId} ${photo}`);
  }
});

test("판교 접대 테마는 판교점에만, 계절 테마는 기간 안에만 나간다", () => {
  for (const { post, branchId, day } of posts) {
    if (post.themeId === "business") assert.equal(branchId, "pangyo");
    if (post.themeId === "christmas") assert.ok(day.slice(5) >= "11-15" && day.slice(5) <= "12-25", day);
    if (post.themeId === "newyear") assert.ok(day.slice(5) >= "12-10", day);
  }
});

test("AI 연출 사진을 넣으면 바로 아래에 AI 연출 표시가 붙는다", () => {
  const photos = { real: ["/a/1.jpg", "/a/2.jpg", "/a/3.jpg"], ai: { "year-end": ["/a/AI연출/year-end/x.png"], 공통: ["/a/AI연출/c.png"] } };
  const post = renderGatheringPost({ bank, branchId: "pangyo", slot: 0, date: at18("2026-11-03"), photos });
  assert.ok(post.aiPhoto);
  const i = post.blocks.findIndex((block) => block.ai);
  assert.deepEqual(post.blocks[i + 1], { type: "text", lines: [bank.aiCaption] });
  assert.ok(post.photos.includes("/a/1.jpg") || post.photos.includes("/a/2.jpg") || post.photos.includes("/a/3.jpg"));
});

test("발행 기간 밖에는 글이 없다", () => {
  assert.equal(renderGatheringPost({ bank, branchId: "pangyo", slot: 0, date: at18("2027-01-01") }), null);
});

test("메뉴 글과 모임 글의 발행 기록이 섞이지 않는다", () => {
  const log = [
    { date: "2026-11-02", branch: "pangyo", submitted: true },
    { kind: "gathering", date: "2026-11-02", branch: "moran", slot: 0, submitted: true },
  ];
  assert.equal(alreadyPublished(log, "2026-11-02", "pangyo"), true);
  assert.equal(alreadyPublished(log, "2026-11-02", "moran"), false);
  assert.equal(alreadyPublished(log, "2026-11-02", "pangyo", { kind: "gathering", slot: 0 }), false);
  assert.equal(alreadyPublished(log, "2026-11-02", "moran", { kind: "gathering", slot: 0 }), true);
  assert.equal(alreadyPublished(log, "2026-11-02", "moran", { kind: "gathering", slot: 1 }), false);
});

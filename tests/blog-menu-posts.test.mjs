import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { BLOG_BRANCHES } from "../lib/blog/branch-info.mjs";
import { alreadyPublished } from "../lib/blog/log.mjs";
import {
  blocksToHtml,
  BOOKING_LINK_TEXT,
  LAMB_LEG_NOTICE,
  MAP_LINK_TEXT,
  postLinks,
  loadMenuPosts,
  renderMenuPost,
  selectMenu,
  splitByPhotos,
  START_DATE,
  TAG_MAX,
  toPlainText,
  validateMenuPosts,
} from "../lib/blog/menu-posts.mjs";
import { BRANCH_IDS } from "../lib/smartplace/branches.mjs";

const bank = await loadMenuPosts();
const at10 = (day) => new Date(`${day}T10:00:00+09:00`);
const dayAfter = (n) => new Date(at10(START_DATE).getTime() + n * 24 * 60 * 60 * 1000);

test("블로그 원고집이 규칙을 모두 지킨다", () => {
  assert.deepEqual(validateMenuPosts(bank), []);
});

test("메뉴 이름이 홈페이지 메뉴판에 있다", async () => {
  const source = await readFile(new URL("../lib/menu-content.ts", import.meta.url), "utf8");
  for (const menu of bank.menus.filter((m) => m.id !== "lamb-leg")) {
    assert.ok(source.includes(`menuItem("${menu.name}",`), menu.name);
  }
});

test("지점마다 가격이 달라 글에 가격이 들어가지 않는다", () => {
  for (let n = 0; n < bank.menus.length; n += 1) {
    for (const branchId of BRANCH_IDS) {
      const post = renderMenuPost({ bank, branchId, date: dayAfter(n) });
      assert.doesNotMatch(toPlainText(post) + post.title, /가격|\d원/);
    }
  }
});

test("지점 안내(지도·예약·주소)가 홈페이지와 같다", async () => {
  const source = await readFile(new URL("../lib/site-content.ts", import.meta.url), "utf8");
  for (const info of Object.values(BLOG_BRANCHES)) {
    assert.ok(source.includes(info.mapUrl), info.mapUrl);
    assert.ok(source.includes(info.bookingUrl), info.bookingUrl);
    assert.ok(source.includes(info.address), info.address);
  }
});

test("첫날은 판교점 통양다리구이, 모란본점 가지튀김이다", () => {
  assert.equal(selectMenu({ menus: bank.menus, branchId: "pangyo", date: at10(START_DATE) }).menu.id, "lamb-leg");
  assert.equal(selectMenu({ menus: bank.menus, branchId: "moran", date: at10(START_DATE) }).menu.id, "fried-eggplant");
});

test("같은 날 두 블로그는 서로 다른 메뉴, 같은 메뉴는 서로 다른 글감 벌이 나간다", () => {
  const seen = { pangyo: new Map(), moran: new Map() };
  for (let n = 0; n < 112; n += 1) {
    const [pangyo, moran] = BRANCH_IDS.map((branchId) => selectMenu({ menus: bank.menus, branchId, date: dayAfter(n) }));
    assert.notEqual(pangyo.menu.id, moran.menu.id);
    const cycle = Math.floor(n / bank.menus.length);
    seen.pangyo.set(`${cycle}:${pangyo.menu.id}`, pangyo.variant);
    seen.moran.set(`${cycle}:${moran.menu.id}`, moran.variant);
  }
  for (const [key, variant] of seen.pangyo) {
    if (seen.moran.has(key)) assert.notEqual(seen.moran.get(key), variant, key);
  }
});

test("한 블로그에서 한 바퀴 동안 메뉴가 겹치지 않고, 다음 바퀴엔 다른 글감 벌이 나간다", () => {
  const n = bank.menus.length;
  for (const branchId of BRANCH_IDS) {
    const first = Array.from({ length: n }, (_, i) => selectMenu({ menus: bank.menus, branchId, date: dayAfter(i) }));
    assert.equal(new Set(first.map((s) => s.menu.id)).size, n);
    for (const [i, pick] of first.entries()) {
      const next = selectMenu({ menus: bank.menus, branchId, date: dayAfter(i + n) });
      assert.equal(next.menu.id, pick.menu.id);
      assert.notEqual(next.variant, pick.variant);
    }
  }
});

test("글에 지도·예약 링크, 지점 정보, 사진 두 장이 들어간다", () => {
  for (const branchId of BRANCH_IDS) {
    const post = renderMenuPost({ bank, branchId, date: at10(START_DATE) });
    const text = toPlainText(post);
    const info = BLOG_BRANCHES[branchId];
    assert.doesNotMatch(text + post.title, /[{}]/);
    for (const value of [info.mapUrl, info.bookingUrl, info.address, info.parking]) assert.ok(text.includes(value), value);
    assert.equal(post.photos.length, 2);
    assert.ok(post.tags.length <= TAG_MAX);
    assert.equal(new Set(post.tags).size, post.tags.length);
  }
});

test("같은 날 두 블로그의 인사말이 다르다", () => {
  for (let n = 0; n < 14; n += 1) {
    const [pangyo, moran] = BRANCH_IDS.map((branchId) => renderMenuPost({ bank, branchId, date: dayAfter(n) }));
    assert.notDeepEqual(pangyo.blocks[0], moran.blocks[0]);
  }
});

test("붙여 넣을 HTML은 링크를 살리고 특수문자를 막는다", () => {
  const html = blocksToHtml([
    { type: "text", lines: ["a < b & c", ""] },
    { type: "info", items: [{ label: "주차", value: "무료" }] },
    { type: "links", items: [{ text: "예약", href: "https://x.test/?a=1&b=2" }] },
  ]);
  assert.equal(
    html,
    '<p>a &lt; b &amp; c</p><p><br></p><p>✔ <b>주차</b> : 무료</p><p><b><a href="https://x.test/?a=1&amp;b=2">예약</a></b></p>',
  );
});

test("모든 글에 양다리구이 1시간 전 예약 안내와 눌러지는 예약·지도 링크가 들어간다", () => {
  for (let n = 0; n < bank.menus.length; n += 1) {
    for (const branchId of BRANCH_IDS) {
      const post = renderMenuPost({ bank, branchId, date: dayAfter(n) });
      const info = BLOG_BRANCHES[branchId];
      assert.ok(post.blocks.some((block) => block.type === "notice" && block.text === LAMB_LEG_NOTICE));
      assert.deepEqual(postLinks(post), [
        { text: BOOKING_LINK_TEXT, href: info.bookingUrl },
        { text: MAP_LINK_TEXT, href: info.mapUrl },
      ]);
    }
  }
});

test("양다리구이 글 본문에도 1시간 전 예약 문구가 있다", () => {
  const lambLeg = bank.menus.find((menu) => menu.id === "lamb-leg");
  for (const taste of lambLeg.tastes) assert.match(taste, /1시간 전에 예약/);
});

test("본문은 글·사진·글·사진·글 순서로 나뉜다", () => {
  const post = renderMenuPost({ bank, branchId: "pangyo", date: at10(START_DATE) });
  assert.deepEqual(splitByPhotos(post.blocks).map((part) => part.type), ["html", "photo", "html", "photo", "html"]);
});

test("최종 발행까지 누른 지점은 같은 날 다시 올리지 않는다", () => {
  const log = [{ date: "2026-11-02", branch: "pangyo", submitted: true }, { date: "2026-11-02", branch: "moran", submitted: false }];
  assert.equal(alreadyPublished(log, "2026-11-02", "pangyo"), true);
  assert.equal(alreadyPublished(log, "2026-11-02", "moran"), false);
});

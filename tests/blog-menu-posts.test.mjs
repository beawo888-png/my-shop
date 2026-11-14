import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { BLOG_BRANCHES } from "../lib/blog/branch-info.mjs";
import { DEFAULT_BLOG_SELECTORS, findPostUrl, hasUrlText, urlBelongsToBlog } from "../lib/blog/editor.mjs";
import { alreadyPublished } from "../lib/blog/log.mjs";
import {
  blocksToHtml,
  findMenu,
  BOOKING_LINK_TEXT,
  LAMB_LEG_NOTICE,
  MAP_LINK_TEXT,
  pairingPhoto,
  PHOTO_ROOT,
  postLinks,
  POSTS_PER_DAY,
  loadMenuPosts,
  renderMenuPost,
  selectMenu,
  splitByPhotos,
  START_DATE,
  TAG_MAX,
  toPlainText,
  validateMenuPosts,
} from "../lib/blog/menu-posts.mjs";
import { BRANCH_IDS, BRANCHES } from "../lib/smartplace/branches.mjs";

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

test("지점별 가게 정면·내부 사진 파일이 있다", () => {
  for (const info of Object.values(BLOG_BRANCHES)) {
    for (const file of [info.storefront, info.interior]) assert.ok(existsSync(`${PHOTO_ROOT}${file}`), file);
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

test("하루 2편을 시작한 날은 이전 날 다음 메뉴부터 이어서 나간다", () => {
  const first = (branchId, slot) => selectMenu({ menus: bank.menus, branchId, date: at10(START_DATE), slot }).menu.id;
  assert.equal(first("pangyo", 0), bank.menus[4].id);
  assert.equal(first("pangyo", 1), bank.menus[5].id);
  assert.equal(first("moran", 0), bank.menus[18].id);
  assert.equal(first("moran", 1), bank.menus[19].id);
});

test("하루 네 편은 모두 다른 메뉴이고, 같은 메뉴는 두 블로그에 서로 다른 글감 벌이 나간다", () => {
  const n = bank.menus.length;
  const seen = { pangyo: new Map(), moran: new Map() };
  for (let day = 0; day < 56; day += 1) {
    const picks = [];
    for (const branchId of BRANCH_IDS) {
      for (let slot = 0; slot < POSTS_PER_DAY; slot += 1) {
        const pick = selectMenu({ menus: bank.menus, branchId, date: dayAfter(day), slot });
        picks.push(pick.menu.id);
        const cycle = Math.floor((4 + day * POSTS_PER_DAY + slot) / n);
        seen[branchId].set(`${cycle}:${pick.menu.id}`, pick.variant);
      }
    }
    assert.equal(new Set(picks).size, 4, picks.join(","));
  }
  for (const [key, variant] of seen.pangyo) {
    if (seen.moran.has(key)) assert.notEqual(seen.moran.get(key), variant, key);
  }
});

test("한 블로그에서 한 바퀴(14일) 동안 메뉴가 겹치지 않고, 다음 바퀴엔 다른 글감 벌이 나간다", () => {
  const n = bank.menus.length;
  const days = n / POSTS_PER_DAY;
  for (const branchId of BRANCH_IDS) {
    for (let day = 0; day < days; day += 1) {
      for (let slot = 0; slot < POSTS_PER_DAY; slot += 1) {
        const pick = selectMenu({ menus: bank.menus, branchId, date: dayAfter(day), slot });
        const next = selectMenu({ menus: bank.menus, branchId, date: dayAfter(day + days), slot });
        assert.equal(next.menu.id, pick.menu.id);
        assert.notEqual(next.variant, pick.variant);
      }
    }
    const ids = Array.from({ length: n }, (_, i) =>
      selectMenu({ menus: bank.menus, branchId, date: dayAfter(Math.floor(i / POSTS_PER_DAY)), slot: i % POSTS_PER_DAY }).menu.id,
    );
    assert.equal(new Set(ids).size, n);
  }
});

test("글에 메뉴 사진, 함께 추천 메뉴 사진(이름 포함), 가게 정면·내부 사진과 지점 정보가 들어간다", () => {
  for (const branchId of BRANCH_IDS) {
    for (let slot = 0; slot < POSTS_PER_DAY; slot += 1) {
      const post = renderMenuPost({ bank, branchId, date: at10(START_DATE), slot });
      const menu = bank.menus.find((m) => m.id === post.menuId);
      const text = toPlainText(post);
      const info = BLOG_BRANCHES[branchId];
      assert.doesNotMatch(text + post.title, /[{}]/);
      for (const value of [info.mapUrl, info.bookingUrl, info.address, info.parking]) assert.ok(text.includes(value), value);
      assert.equal(post.photos.length, 3 + menu.pairWith.length);
      assert.ok(post.photos.at(-2).endsWith(info.storefront));
      assert.ok(post.photos.at(-1).endsWith(info.interior));
      assert.ok(text.includes(`▲ ${BRANCHES[branchId].name} 가게 정면`) && text.includes(`▲ ${BRANCHES[branchId].name} 가게 내부`));
      assert.ok(post.photos[0].endsWith(menu.photo));
      for (const [i, name] of menu.pairWith.entries()) {
        assert.ok(post.photos[1 + i].endsWith(pairingPhoto(bank, name)), name);
        assert.ok(text.includes(`▲ ${name}`), name);
      }
      assert.ok(post.tags.length <= TAG_MAX);
      assert.equal(new Set(post.tags).size, post.tags.length);
    }
  }
});

test("같은 날 네 편의 인사말이 모두 다르다", () => {
  for (let day = 0; day < 14; day += 1) {
    const greetings = BRANCH_IDS.flatMap((branchId) =>
      Array.from({ length: POSTS_PER_DAY }, (_, slot) => JSON.stringify(renderMenuPost({ bank, branchId, date: dayAfter(day), slot }).blocks[0])),
    );
    assert.equal(new Set(greetings).size, 4);
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

test("모든 글에 양다리구이 30분 전 예약 안내와 눌러지는 예약·지도 링크가 들어간다", () => {
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

test("양다리구이 글 본문에도 30분 전 예약 문구가 있다", () => {
  const lambLeg = bank.menus.find((menu) => menu.id === "lamb-leg");
  for (const taste of lambLeg.tastes) assert.match(taste, /30분 전에 예약/);
});

test("본문은 글 → 메뉴 사진 → 글 → 함께 추천 사진들 → 글 → 가게 정면·내부 사진 → 글 순서로 나뉜다", () => {
  const post = renderMenuPost({ bank, branchId: "pangyo", date: at10(START_DATE) });
  const pairs = bank.menus.find((m) => m.id === post.menuId).pairWith.map(() => "photo");
  assert.deepEqual(splitByPhotos(post.blocks).map((part) => part.type), ["html", "photo", "html", ...pairs, "html", "photo", "photo", "html"]);
});

test("최종 발행까지 누른 글은 같은 날 같은 순번으로 다시 올리지 않는다", () => {
  const log = [
    { date: "2026-11-06", branch: "pangyo", slot: 0, submitted: true },
    { date: "2026-11-06", branch: "moran", slot: 1, submitted: false },
    { date: "2026-11-05", branch: "moran", submitted: true },
  ];
  assert.equal(alreadyPublished(log, "2026-11-06", "pangyo", 0), true);
  assert.equal(alreadyPublished(log, "2026-11-06", "pangyo", 1), false);
  assert.equal(alreadyPublished(log, "2026-11-06", "moran", 1), false);
  // 하루 1편이던 때의 기록(slot 없음)은 오전 글로 본다.
  assert.equal(alreadyPublished(log, "2026-11-05", "moran", 0), true);
  assert.equal(alreadyPublished(log, "2026-11-05", "moran", 1), false);
});

test("메뉴를 이름이나 id로 직접 골라 글을 만들 수 있다", () => {
  assert.equal(findMenu(bank, "어향육사").id, "yu-xiang-pork");
  assert.equal(findMenu(bank, "yu-xiang-pork").name, "어향육사");
  assert.throws(() => findMenu(bank, "없는메뉴"));
  const pangyo = renderMenuPost({ bank, branchId: "pangyo", menuId: "yu-xiang-pork" });
  const moran = renderMenuPost({ bank, branchId: "moran", menuId: "yu-xiang-pork" });
  assert.equal(pangyo.menuId, "yu-xiang-pork");
  assert.notEqual(pangyo.title, moran.title);
  // 11/6에 직접 올린 판교점 어향육사는, 11/9에 순서대로 나가는 판교점 어향육사와 다른 벌이다.
  const manual = renderMenuPost({ bank, branchId: "pangyo", date: at10("2026-11-06"), menuId: "yu-xiang-pork" });
  const scheduled = [0, 1].map((slot) => renderMenuPost({ bank, branchId: "pangyo", date: at10("2026-11-09"), slot }));
  const due = scheduled.find((post) => post.menuId === "yu-xiang-pork");
  assert.ok(due);
  assert.notEqual(manual.variant, due.variant);
});

test("글쓰기 화면과 발행된 글이 그 지점 블로그의 것인지 알아본다", () => {
  assert.equal(urlBelongsToBlog(["https://blog.naver.com/ruilian417/postwrite"], "ruilian417"), true);
  assert.equal(urlBelongsToBlog(["https://blog.naver.com/PostWriteForm.naver?blogId=ruilian417"], "ruilian417"), true);
  assert.equal(urlBelongsToBlog(["https://blog.naver.com/ruilian417/224087654321"], "ruilian417"), true);
  // 다른 아이디로 로그인돼 그 아이디의 글쓰기 화면이 열린 경우
  assert.equal(urlBelongsToBlog(["https://blog.naver.com/wangjing_lamb/postwrite", "about:blank"], "ruilian417"), false);
  assert.equal(urlBelongsToBlog(["https://evil.example/ruilian417/postwrite", "not a url"], "ruilian417"), false);
});

test("다른 블로그에 잘못 올라간 기록은 올린 것으로 치지 않는다", () => {
  const log = [{ date: "2026-11-13", branch: "moran", slot: 0, submitted: true, verified: false, wrongBlog: true }];
  assert.equal(alreadyPublished(log, "2026-11-13", "moran", 0), false);
});

test("실패해서 남긴 기록은 올린 것으로 치지 않는다", () => {
  const log = [{ date: "2026-11-13", branch: "moran", slot: 1, submitted: false, error: "네이버 로그인이 풀렸습니다." }];
  assert.equal(alreadyPublished(log, "2026-11-13", "moran", 1), false);
});

test("발행된 글 주소를 바깥 주소나 편집기 iframe 주소에서 찾는다", () => {
  assert.equal(findPostUrl(["https://blog.naver.com/ruilian417/postwrite"]), null);
  assert.equal(findPostUrl(["https://blog.naver.com/ruilian417/224087654321"]), "https://blog.naver.com/ruilian417/224087654321");
  assert.equal(
    findPostUrl(["https://blog.naver.com/wangjing_lamb", "https://blog.naver.com/PostView.naver?blogId=wangjing_lamb&logNo=224087654321"]),
    "https://blog.naver.com/PostView.naver?blogId=wangjing_lamb&logNo=224087654321",
  );
  assert.equal(findPostUrl(["about:blank", "https://blog.naver.com/PostWriteForm.naver?blogId=x"]), null);
});

test("편집기 선택자는 CSS와 role= 선택자를 쉼표로 섞지 않는다(섞으면 선택자 오류로 멈춘다)", () => {
  for (const [name, selector] of Object.entries(DEFAULT_BLOG_SELECTORS)) {
    if (selector.startsWith("role=")) assert.ok(!/,\s*[.#\[a-z]/i.test(selector.replace(/\/.*\//, "")), name);
    else assert.ok(!/(^|,\s*)role=/.test(selector), name);
  }
});

test("카테고리 버튼 선택자가 화면 아래 '글감 카테고리 열기' 버튼을 고르지 않는다", () => {
  assert.ok(!DEFAULT_BLOG_SELECTORS.categoryButton.includes("aria-label*='카테고리'"));
});

test("예약·지도 줄에 주소 글자가 들어가 있으면 링크가 걸린 것으로 본다(발행할 때 네이버가 링크로 바꾼다)", () => {
  const href = "https://booking.naver.com/booking/6/bizes/970819";
  assert.ok(hasUrlText(`📅 네이버 예약 바로가기 ${href}`, href));
  assert.ok(hasUrlText(`📅 네이버 예약 바로가기 ​${href}​`, href));
  assert.ok(!hasUrlText("📅 네이버 예약 바로가기", href));
});

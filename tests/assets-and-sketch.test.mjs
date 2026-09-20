import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const assetNames = [
  "hero-skewers.png",
  "roast-lamb.png",
  "spicy-skewers.png",
  "jingjiang-wraps.png",
  "mala-platter.png",
  "guobaorou.png",
  "mapo-tofu.png",
  "lamb-chops.png",
  "dining-room.jpg",
  "group-table.jpg",
  "lantern-interior.jpg",
  "storefront.jpg",
  "feast.jpg",
  "wangjing-logo.jpg",
  "moran-storefront.png",
];

test("all approved Wangjing images exist", async () => {
  for (const name of assetNames) {
    const image = await readFile(
      new URL(`../public/images/wangjing/${name}`, import.meta.url),
    );
    assert.ok(image.byteLength > 500, `${name} should not be empty`);
  }
});

test("Pencil source contains approved desktop and mobile frames", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const names = pencil.children.map((child) => child.name);
  const approvedNames = [
    "판교왕징 홈페이지 데스크톱",
    "판교왕징 홈페이지 모바일",
  ];
  for (const name of approvedNames) {
    assert.ok(names.includes(name), `${name} 프레임이 있어야 합니다`);
  }
  const approvedFrames = approvedNames.map((name) =>
    pencil.children.find((child) => child.name === name),
  );
  const navOrder =
    "브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문";

  for (const frame of approvedFrames) {
    assert.equal(frame.children.length, 11);
    const childNames = frame.children.map((child) => child.name);
    assert.ok(childNames[0].startsWith("상단 내비게이션"));
    assert.ok(childNames[0].includes(navOrder));
    assert.ok(childNames[1].startsWith("대표 영역"));
    for (const section of [
      "신뢰 정보",
      "대표 메뉴",
      "왕징 이야기",
      "단체 모임",
      "고객 리뷰",
      "자주 묻는 질문 · 6개 아코디언 초기 닫힘",
      "예약 안내",
      "푸터 · 왕징양다리양꼬치 로고 적용",
    ]) {
      assert.ok(childNames.includes(section), `${section} 섹션이 있어야 합니다`);
    }
    assert.ok(
      childNames.some((name) => name.includes("지점 안내")),
      "지점 안내 섹션이 있어야 합니다",
    );
  }
});

test("approved Wangjing promotional video exists", async () => {
  const video = await readFile(
    new URL("../public/videos/wangjing/lamb-leg-promo.mp4", import.meta.url),
  );
  assert.ok(video.byteLength > 1_000_000, "promotional MP4 should not be empty");
});

test("all four signature autoplay videos exist", async () => {
  for (const name of [
    "signature-01.mp4",
    "signature-02.mp4",
    "signature-03.mp4",
    "signature-04.mp4",
  ]) {
    const video = await readFile(
      new URL(`../public/videos/signature/${name}`, import.meta.url),
    );
    assert.ok(video.byteLength > 1_000, `${name} should not be empty`);
  }
});

test("Pencil source records all approved language selector states", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const expected = [
    ["언어 선택기 데스크톱 · 닫힘", 1440, 160],
    ["언어 선택기 데스크톱 · 열림", 1440, 420],
    ["언어 선택기 태블릿 · 열림", 910, 420],
    ["언어 선택기 모바일 메뉴 · 열림", 390, 720],
  ];

  for (const [name, width, height] of expected) {
    const frame = pencil.children.find((child) => child.name === name);
    assert.ok(frame, `${name} 프레임이 있어야 합니다`);
    assert.equal(frame.width, width);
    assert.equal(frame.height, height);
    const labels = JSON.stringify(frame);
    for (const label of ["한국어", "English", "简体中文", "日本語"]) {
      assert.ok(labels.includes(label), `${name}에 ${label}가 있어야 합니다`);
    }
  }
});

test("Pencil source records long translated tablet and mobile content layouts", async () => {
  const pencil = JSON.parse(await readFile(new URL("../초안", import.meta.url), "utf8"));
  for (const [name, width] of [["다국어 긴 문구 태블릿 · 910px", 910], ["다국어 긴 문구 모바일 · 390px", 390]]) {
    const frame = pencil.children.find((child) => child.name === name);
    assert.ok(frame, `${name} frame must exist`);
    assert.equal(frame.width, width);
    for (const label of ["Recommended occasions", "pre-wedding gatherings", "結婚報告の食事会", "婚前聚会"])
      assert.ok(JSON.stringify(frame).includes(label), `${name} must illustrate ${label}`);
    assert.ok(frame.children.some((child) => child.name.includes("레이블 위 · 값 아래")));
    if (width === 390) assert.ok(frame.children.some((child) => child.name.includes("모임 타일 · 2열")));
  }
});

test("Pencil Korean tablet branch cards stack headings above images in two columns", async () => {
  const pencil = JSON.parse(await readFile(new URL("../초안", import.meta.url), "utf8"));
  const frame = pencil.children.find((child) => child.name === "한국어 지점 카드 태블릿 · 910px");
  assert.ok(frame, "Korean tablet branch layout frame must exist");
  assert.equal(frame.width, 910);
  const grid = frame.children.find((child) => child.name === "지점 카드 · 2열 유지");
  assert.equal(grid.layout, "horizontal");
  assert.equal(grid.children.length, 2);
  for (const [index, branch] of ["모란본점", "판교점"].entries()) {
    const card = grid.children[index];
    assert.equal(card.layout, "vertical");
    assert.ok(JSON.stringify(card.children[0]).includes(branch));
    assert.equal(card.children[1].name, "지점 이미지 · 제목 아래");
  }
});

test("Pencil selectors match current labels, contrast, mobile columns and booking order", async () => {
  const pencil = JSON.parse(await readFile(new URL("../초안", import.meta.url), "utf8"));
  for (const id of ["language-selector-desktop-closed", "language-selector-desktop-open", "language-selector-tablet-open"]) {
    const frame = pencil.children.find((node) => node.id === id);
    const trigger = frame.children.find((node) => node.id.endsWith("-trigger"));
    assert.match(trigger.content, /^한국어 [▾▴]$/);
    assert.doesNotMatch(trigger.content, /언어 \/ Language/);
    if (!id.endsWith("closed")) {
      const menu = frame.children.find((node) => node.id.endsWith("-menu"));
      const current = menu.children[0];
      assert.equal(menu.fill, "#FFF8EC");
      assert.equal(current.type, "frame");
      assert.equal(current.fill, "#17110F");
      assert.equal(current.children[0].fill, "#C5A15A");
      assert.equal(current.children[0].content, "한국어");
    }
  }
  const mobile = pencil.children.find((node) => node.id === "language-selector-mobile-open");
  const menu = mobile.children.find((node) => node.id.endsWith("-menu"));
  assert.equal(menu.layout, "vertical");
  assert.equal(menu.children.length, 2);
  for (const row of menu.children) {
    assert.equal(row.layout, "horizontal");
    assert.equal(row.children.length, 2);
  }
  assert.equal(menu.children[0].children[0].fill, "#17110F");
  assert.equal(menu.children[0].children[0].children[0].fill, "#C5A15A");
  const bookings = mobile.children.filter((node) => node.id.includes("-naver-"));
  assert.deepEqual(bookings.map((node) => node.id.split("-").at(-1)), ["moran", "pangyo"]);
  assert.ok(bookings[0].y < bookings[1].y);
});

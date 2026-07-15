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
  assert.deepEqual(names, [
    "판교왕징 홈페이지 데스크톱",
    "판교왕징 홈페이지 모바일",
  ]);
  for (const frame of pencil.children) {
    assert.equal(frame.children.length, 10);
    assert.deepEqual(
      frame.children.map((child) => child.name),
      [
        "상단 내비게이션 · 왕징양다리양꼬치 로고 적용",
        "대표 영역",
        "신뢰 정보",
        "대표 메뉴",
        "왕징 이야기",
        "단체 모임",
        "고객 리뷰",
        "지점 안내",
        "예약 안내",
        "푸터 · 왕징양다리양꼬치 로고 적용",
      ],
    );
  }

});

test("approved Wangjing promotional video exists", async () => {
  const video = await readFile(
    new URL("../public/videos/wangjing/lamb-leg-promo.mp4", import.meta.url),
  );
  assert.ok(video.byteLength > 1_000_000, "promotional MP4 should not be empty");
});

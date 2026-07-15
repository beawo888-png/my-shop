import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(
  new URL("../lib/site-content.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("site content contains verified business details", () => {
  assert.match(
    source,
    /https:\/\/booking\.naver\.com\/booking\/6\/bizes\/970819/,
  );
  assert.match(source, /0507-1313-5688/);
  assert.match(source, /tel:050713135688/);
  assert.match(source, /대왕판교로606번길 10/);
});

test("site content defines both Wangjing locations", () => {
  assert.match(source, /export const LOCATIONS/);
  assert.match(source, /\{ label: "지점 안내", href: "#location" \}/);

  for (const value of [
    "왕징양다리양꼬치 모란본점",
    "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    "모란역 4번 출구에서 215m",
    "0507-1377-5688",
    "tel:050713775688",
    "https://map.naver.com/v5/entry/place/1938356292",
    "왕징양다리양꼬치 판교점",
    "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    "판교역 4번 출구에서 266m",
    "0507-1313-5688",
    "tel:050713135688",
    "https://map.naver.com/v5/entry/place/1873196958",
  ]) {
    assert.ok(source.includes(value), `site content should include ${value}`);
  }

  const moranIndex = source.indexOf('shortName: "모란본점"');
  const pangyoIndex = source.indexOf('shortName: "판교점"');
  assert.ok(moranIndex >= 0, "모란본점 데이터가 있어야 합니다");
  assert.ok(pangyoIndex >= 0, "판교점 데이터가 있어야 합니다");
  assert.ok(moranIndex < pangyoIndex, "모란본점이 판교점보다 먼저 와야 합니다");
});

test("site content defines the three approved signature menus", () => {
  for (const menu of ["양꼬치", "양갈비살꼬치", "꿔바로우"]) {
    assert.match(source, new RegExp(menu));
  }
  for (const price of ["15,000원", "18,000원", "22,000원"]) {
    assert.match(source, new RegExp(price));
  }
});

test("site content does not contain Unsplash or fake language links", () => {
  assert.doesNotMatch(source, /images\.unsplash\.com/);
  assert.doesNotMatch(source, /KO \| EN|English/);
});

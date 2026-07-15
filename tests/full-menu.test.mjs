import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("Pangyo menu data contains 52 items in five approved groups", async () => {
  const source = await read("lib/menu-content.ts");
  assert.equal(source.match(/\{ name: "[^"]+", price:/g)?.length, 52);
  for (const value of [
    'id: "lamb-skewers"',
    'title: "양고기·꼬치"',
    'id: "chinese-dishes"',
    'title: "중국요리·탕"',
    'id: "meals"',
    'title: "식사·면·디저트"',
    'id: "lunch"',
    'title: "점심특선"',
    'id: "drinks"',
    'title: "주류·하이볼"',
  ]) {
    assert.ok(source.includes(value), "missing menu group value: " + value);
  }
  assert.match(source, /PANGYO_MENU_COUNT = 52/);
});

test("Pangyo menu data preserves both lamb-leg prices without invented sizes", async () => {
  const source = await read("lib/menu-content.ts");
  assert.equal(
    source.match(/name: "비쥬얼 쇼크! 육즙 팡팡 양다리"/g)?.length,
    2,
  );
  assert.match(source, /price: "90,000원"/);
  assert.match(source, /price: "80,000원"/);
  assert.doesNotMatch(source, /대형|소형|큰 사이즈|작은 사이즈/);
});

test("Pangyo menu data records its source and checked date", async () => {
  const source = await read("lib/menu-content.ts");
  assert.match(
    source,
    /https:\/\/m\.place\.naver\.com\/restaurant\/1873196958\/menu\/list/,
  );
  assert.match(source, /2026년 7월 15일/);
});

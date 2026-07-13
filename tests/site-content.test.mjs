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

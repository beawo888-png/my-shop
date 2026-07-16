import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("every declared menu image is a non-empty local asset", async () => {
  const source = await read("lib/menu-content.ts");
  const files = [
    ...source.matchAll(/menuItem\([^\n]+, "([a-z0-9-]+\.(?:jpg|png))"(?:, "(?:cover|contain)")?\)/g),
  ].map((match) => match[1]);
  assert.equal(files.length, 47);
  for (const file of new Set(files)) {
    const url = new URL(`../public/images/wangjing/menu/${file}`, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 500, `${file} should not be empty`);
  }
});

test("menu card renders image, description, price, and fallback behavior", async () => {
  const [card, image] = await Promise.all([
    read("components/menu/full-menu-card.tsx"),
    read("components/menu/full-menu-image.tsx"),
  ]);
  assert.match(card, /<FullMenuImage/);
  assert.match(card, /<h3>\{item\.name\}<\/h3>/);
  assert.match(card, /<p>\{item\.description\}<\/p>/);
  assert.match(card, /<strong>\{item\.price\}<\/strong>/);
  assert.match(card, /style=\{\{ position: "relative" \}\}/);
  assert.match(image, /^"use client";/);
  assert.match(image, /import Image from "next\/image"/);
  assert.match(image, /alt=\{alt\}/);
  assert.match(image, /fill/);
  assert.match(image, /sizes=/);
  assert.doesNotMatch(image, /\b(?:loading|preload|priority)=/);
  assert.match(image, /onError=/);
  assert.match(image, /if \(currentSrc !== fallbackSrc\)/);
  assert.match(image, /setCurrentSrc\(fallbackSrc\)/);
});

test("menu catalog uses 28 food assets and six approved drink representatives", async () => {
  const source = await read("lib/menu-content.ts");
  const drinkFiles = [
    "chinese-liquor-toast.jpg",
    "chinese-liquor-pour-dark.jpg",
    "chinese-liquor-pour-clear.jpg",
    "beer-cheers-table.jpg",
    "beer-cheers-close.jpg",
    "cutty-sark-highball.jpg",
  ];
  for (const file of drinkFiles) assert.ok(source.includes(file));
  assert.doesNotMatch(source, /새우튀김|양꼬치 꿔바로우|점심특선|\.mp4/);
});

test("menu page renders photo cards and JSON-LD from the same 47-item source", async () => {
  const [page, structured] = await Promise.all([
    read("app/menu/page.tsx"),
    read("lib/menu-structured-data.ts"),
  ]);
  assert.match(page, /import \{ FullMenuCard \}/);
  assert.match(page, /<FullMenuCard/);
  assert.match(page, /fallbackImageSrc=\{group\.fallbackImageSrc\}/);
  assert.match(page, /buildPangyoMenuStructuredData/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(page, /replace\(\/<\/g, "\\\\u003c"\)/);
  assert.match(structured, /"@type": "Menu"/);
  assert.match(structured, /"@type": "MenuSection"/);
  assert.match(structured, /"@type": "MenuItem"/);
  assert.match(structured, /PANGYO_MENU_GROUPS\.map/);
  assert.match(structured, /item\.imageSrc/);
  assert.match(
    structured,
    /item\.price\.replace\("원", ""\)\.replaceAll\(",", ""\)/,
  );
});

test("photo menu uses approved 3-2-1 grid, fit modes, and readable type", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.full-menu-section__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 1199px\)[\s\S]*?\.full-menu-section__items[\s\S]*?repeat\(2/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.full-menu-section__items[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.full-menu-card__media\s*\{[\s\S]*?position:\s*relative/);
  assert.match(css, /\.full-menu-card__image--cover\s*\{[^}]*object-fit:\s*cover/);
  assert.match(css, /\.full-menu-card__image--contain\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.full-menu-card h3\s*\{[^}]*font-size:\s*1\.375rem/);
  assert.match(css, /\.full-menu-card strong\s*\{[^}]*font-size:\s*1\.125rem/);
  assert.doesNotMatch(
    css,
    /\.full-menu-[^{]*\{[^}]*font-size:\s*(?:0\.[0-9]+rem|1[0-5]px)/,
  );
});

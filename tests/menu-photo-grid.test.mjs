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

test("each Chinese spirit uses its own matching local product photo", async () => {
  const source = await read("lib/menu-content.ts");
  const chineseLiquorImages = new Map([
    ["연태구냥 500ml 34도", "yantai-guniang-500ml.jpg"],
    ["연태구냥 250ml 34도", "yantai-guniang-250ml.jpg"],
    ["연태구냥 125ml 34도", "yantai-guniang-125ml.jpg"],
    ["설원 450ml 30도", "seolwon-450ml.jpg"],
    ["설원 250ml 30도", "seolwon-250ml.jpg"],
    ["공부가주 500ml 33도", "gongbu-gaju-500ml.jpg"],
    ["노주탄 500ml 33도", "noju-tan-500ml.jpg"],
    ["이과두주 125ml 56도", "erguotou-125ml.jpg"],
    ["컵술 고량주 100ml 38도", "cup-gaoliang-100ml.jpg"],
  ]);

  assert.equal(new Set(chineseLiquorImages.values()).size, 9);
  for (const [name, file] of chineseLiquorImages) {
    const itemLine = source
      .split("\n")
      .find((line) => line.includes(`menuItem("${name}"`));
    assert.ok(
      itemLine?.includes(`"${file}", "contain")`),
      `${name} should use ${file} with contain`,
    );
  }

  for (const file of [
    "chinese-liquor-pour-dark.jpg",
    "chinese-liquor-pour-clear.jpg",
  ]) {
    assert.equal(
      source.match(new RegExp(file.replace(".", "\\."), "g"))?.length ?? 0,
      0,
      `${file} should no longer be assigned to a menu item`,
    );
  }

  assert.equal(
    source.match(/chinese-liquor-toast\.jpg/g)?.length,
    1,
    "the toast photo should remain only as the drinks fallback",
  );

  for (const unchanged of [
    'menuItem("칭다오 맥주 640ml 4.7도", "7,000원", "양꼬치와 잘 어울리는 청량한 맥주", "beer-cheers-table.jpg", "contain")',
    'menuItem("하얼빈 맥주 500ml 4.3도", "7,000원", "깔끔하고 시원한 중국 맥주", "beer-cheers-close.jpg", "contain")',
    'menuItem("타이거 맥주 640ml 5도", "7,000원", "산뜻한 탄산감의 라거 맥주", "beer-cheers-table.jpg", "contain")',
  ]) {
    assert.ok(source.includes(unchanged));
  }
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

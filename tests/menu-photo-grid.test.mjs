import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("every declared menu image is a non-empty local asset", async () => {
  const source = await read("lib/menu-content.ts");
  const files = [
    ...source.matchAll(/menuItem\([^\n]+, "([a-z0-9-]+\.(?:jpg|png))"(?:, "(?:cover|contain)")?(?:, "highball")?\)/g),
  ].map((match) => match[1]);
  assert.equal(files.length, 44);
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

test("remaining Chinese drinks use matching photos and removed drinks are absent", async () => {
  const source = await read("lib/menu-content.ts");
  const chineseDrinkImages = new Map([
    ["연태구냥 500ml 34도", "yantai-guniang-500ml.jpg"],
    ["연태구냥 250ml 34도", "yantai-guniang-250ml.jpg"],
    ["연태구냥 125ml 34도", "yantai-guniang-125ml.jpg"],
    ["설원 450ml 30도", "seolwon-450ml.jpg"],
    ["설원 250ml 30도", "seolwon-250ml.jpg"],
    ["공부가주 500ml 33도", "gongbu-gaju-500ml.jpg"],
    ["노주탄 500ml 33도", "noju-tan-500ml.jpg"],
    ["칭다오 맥주 640ml 4.7도", "tsingtao-beer-640ml.jpg"],
    ["하얼빈 맥주 500ml 4.3도", "harbin-beer-500ml.jpg"],
  ]);

  assert.equal(new Set(chineseDrinkImages.values()).size, 9);
  for (const [name, file] of chineseDrinkImages) {
    const itemLine = source
      .split("\n")
      .find((line) => line.includes(`menuItem("${name}"`));
    assert.ok(
      itemLine?.includes(`"${file}", "contain")`),
      `${name} should use ${file} with contain`,
    );
  }

  for (const removedLine of [
    'menuItem("이과두주 125ml 56도", "5,000원", "힘 있는 풍미를 작은 잔으로 즐기는 고도주", "erguotou-125ml.jpg", "contain")',
    'menuItem("컵술 고량주 100ml 38도", "5,000원", "양꼬치와 가볍게 곁들이는 컵 고량주", "cup-gaoliang-100ml.jpg", "contain")',
    'menuItem("타이거 맥주 640ml 5도", "7,000원", "산뜻한 탄산감의 라거 맥주", "beer-cheers-table.jpg", "contain")',
  ]) {
    assert.ok(!source.includes(removedLine), `${removedLine} should be removed`);
  }

  for (const file of ["erguotou-125ml.jpg", "cup-gaoliang-100ml.jpg"]) {
    const url = new URL(`../public/images/wangjing/menu/${file}`, import.meta.url);
    await assert.rejects(access(url), { code: "ENOENT" });
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

});

test("menu page renders photo cards and JSON-LD from the same 44-item source", async () => {
  const [wrapper, explorer, structured] = await Promise.all([
    read("components/menu/category-menu-page.tsx"),
    read("components/menu/menu-explorer.tsx"),
    read("lib/menu-structured-data.ts"),
  ]);
  assert.match(explorer, /import \{ FullMenuCard \}/);
  assert.match(explorer, /<FullMenuCard/);
  assert.match(explorer, /fallbackImageSrc=\{group\.fallbackImageSrc\}/);
  assert.match(wrapper, /buildPangyoMenuStructuredData/);
  assert.match(wrapper, /type="application\/ld\+json"/);
  assert.match(wrapper, /replace\(\/<\/g, "\\\\u003c"\)/);
  assert.match(structured, /"@type": "Menu"/);
  assert.match(structured, /"@type": "MenuSection"/);
  assert.match(structured, /"@type": "MenuItem"/);
  assert.match(structured, /groups = PANGYO_MENU_GROUPS/);
  assert.match(structured, /groups\.map/);
  assert.match(structured, /new URL\(path, siteUrl\)/);
  assert.match(structured, /item\.imageSrc/);
  assert.match(
    structured,
    /item\.price\.replace\("원", ""\)\.replaceAll\(",", ""\)/,
  );
  assert.match(
    structured,
    /groups\.length === 1 \? `\$\{groups\[0\]\.title\} 메뉴`/,
  );
  assert.match(structured, /name: menuName/);
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

test("highballs use supplied images, fixed prices, order, and subsection", async () => {
  const source = await read("lib/menu-content.ts");
  const expected = [
    ["산토리하이볼", "8,000원", "suntory-highball.png"],
    ["제임슨하이볼", "8,000원", "jameson-highball.png"],
    ["짐빔하이볼", "7,000원", "jim-beam-highball.png"],
    ["커티삭하이볼", "6,000원", "cutty-sark-highball.png"],
    ["봄베이하이볼", "8,000원", "bombay-highball.png"],
    ["연태하이볼", "7,000원", "yantai-highball.png"],
  ];

  const positions = expected.map(([name, price, file]) => {
    const line = source
      .split("\n")
      .find((row) => row.includes(`menuItem("${name}"`));
    assert.ok(line?.includes(`"${price}"`), `${name} should keep ${price}`);
    assert.ok(
      line?.includes(`"${file}", "contain", "highball"`),
      `${name} should use ${file} in the highball subsection`,
    );
    return source.indexOf(line);
  });

  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

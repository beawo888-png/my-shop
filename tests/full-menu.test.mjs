import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("Pangyo menu data contains 44 items in five approved groups", async () => {
  const source = await read("lib/menu-content.ts");
  const itemCalls = source.match(/^\s+menuItem\(/gm) ?? [];
  assert.equal(itemCalls.length, 44);
  const groupCounts = Object.fromEntries(
    [...source.matchAll(/id: "([^"]+)"[\s\S]*?items: \[([\s\S]*?)\n    \],/g)].map(
      ([, id, items]) => [id, items.match(/menuItem\(/g)?.length ?? 0],
    ),
  );
  assert.deepEqual(groupCounts, {
    "signature-lamb-leg": 2,
    "lamb-skewers": 5,
    "chinese-dishes": 16,
    meals: 6,
    drinks: 15,
  });
  for (const value of [
    'id: "signature-lamb-leg"',
    'title: "시그니처 양다리"',
    'id: "lamb-skewers"',
    'title: "양꼬치 &세트메뉴"',
    'id: "chinese-dishes"',
    'title: "중국요리·탕"',
    'id: "meals"',
    'title: "식사·면·디저트"',
    'id: "drinks"',
    'title: "주류·하이볼"',
  ]) {
    assert.ok(source.includes(value), "missing menu group value: " + value);
  }
  assert.doesNotMatch(source, /id: "lunch"|점심특선|홍소로우\+야채덮밥/);
  assert.match(source, /PANGYO_MENU_COUNT = 44/);
});

test("all menu rows define local accessible images and group fallbacks", async () => {
  const source = await read("lib/menu-content.ts");
  assert.match(source, /imageSrc: `\/images\/wangjing\/menu\/\$\{imageFile\}`/);
  assert.match(source, /imageAlt: `\$\{name\} 메뉴 사진`/);
  assert.match(source, /imageFit: MenuImageFit = "cover"/);

  const groups = [
    ...source.matchAll(
      /id: "([^"]+)"[\s\S]*?items: \[([\s\S]*?)\r?\n    \],/g,
    ),
  ];
  const itemLinePattern =
    /^\s+menuItem\("[^"]+", "[^"]+", "[^"]+", "([^"]+)"(?:, "(contain)")?(?:, "(highball)")?\),$/;
  const imageFilePattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png)$/;
  let foodItemCount = 0;
  let drinkItemCount = 0;

  for (const [, groupId, items] of groups) {
    const itemLines = items.match(/^\s+menuItem\(.*\),$/gm) ?? [];
    for (const line of itemLines) {
      const itemMatch = line.match(itemLinePattern);
      assert.ok(itemMatch, "invalid menu item image arguments: " + line.trim());
      const [, imageFile, imageFit, subsection] = itemMatch;
      assert.match(
        imageFile,
        imageFilePattern,
        "invalid menu image filename: " + imageFile,
      );
      if (groupId === "drinks") {
        drinkItemCount += 1;
        assert.equal(imageFit, "contain", "drink must explicitly use contain");
        assert.ok(
          subsection === undefined || subsection === "highball",
          "drink subsection must be highball when present",
        );
      } else {
        foodItemCount += 1;
        assert.equal(imageFit, undefined, "food must use the default cover fit");
        assert.equal(subsection, undefined, "food must not use a subsection");
      }
    }
  }

  assert.equal(foodItemCount, 29);
  assert.equal(drinkItemCount, 15);
  assert.equal(foodItemCount + drinkItemCount, 44);

  const fallbackLines = source.match(/^    fallbackImageSrc:.*$/gm) ?? [];
  assert.equal(fallbackLines.length, 5);
  for (const line of fallbackLines) {
    assert.match(
      line,
      /^    fallbackImageSrc: "\/images\/wangjing\/menu\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png)",$/,
      "invalid local menu fallback: " + line.trim(),
    );
  }
});

test("Pangyo menu data splits signature lamb legs from skewers and sets", async () => {
  const source = await read("lib/menu-content.ts");
  const signatureStart = source.indexOf('title: "시그니처 양다리"');
  const skewersStart = source.indexOf('title: "양꼬치 &세트메뉴"');
  const chineseDishesStart = source.indexOf('title: "중국요리·탕"');

  assert.ok(signatureStart >= 0);
  assert.ok(skewersStart > signatureStart);
  assert.ok(chineseDishesStart > skewersStart);

  const signatureGroup = source.slice(signatureStart, skewersStart);
  const skewersGroup = source.slice(skewersStart, chineseDishesStart);

  assert.match(
    signatureGroup,
    /menuItem\("400도 숯불로 완성한 겉바속촉 양다리구이 \(대\)", "90,000원"/,
  );
  assert.match(
    signatureGroup,
    /menuItem\("400도 숯불로 완성한 겉바속촉 양다리구이 \(중\)", "80,000원"/,
  );
  assert.equal(signatureGroup.match(/menuItem\(/g)?.length, 2);

  for (const name of [
    "고급양갈비",
    "생양꼬치",
    "양념양꼬치",
    "양갈비살꼬치",
    "새우꼬치",
  ]) {
    assert.ok(skewersGroup.includes(`menuItem("${name}"`));
  }
  assert.equal(skewersGroup.match(/menuItem\(/g)?.length, 5);
});

test("Pangyo menu data records its source and checked date", async () => {
  const source = await read("lib/menu-content.ts");
  assert.match(
    source,
    /https:\/\/m\.place\.naver\.com\/restaurant\/1873196958\/menu\/list/,
  );
  assert.match(source, /2026년 7월 15일/);
});

test("full menu page renders metadata, five groups, and conversion links", async () => {
  const [page, css] = await Promise.all([
    read("app/menu/page.tsx"),
    read("app/globals.css"),
  ]);

  for (const value of [
    "판교점 전체 메뉴 | 왕징양다리양꼬치",
    "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu",
    "PANGYO_MENU_GROUPS.map",
    "PANGYO_MENU_COUNT",
    "PANGYO_MENU_CHECKED_AT",
    "메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다",
    "https://booking.naver.com/booking/6/bizes/970819",
    "https://map.naver.com/v5/entry/place/1873196958",
  ]) {
    assert.ok(page.includes(value), "menu page should include " + value);
  }

  assert.match(page, /<h1[^>]*>판교점 전체 메뉴<\/h1>/);
  assert.match(page, /<h2/);
  assert.match(page, /44개 메뉴/);
  assert.doesNotMatch(page, /점심특선|47개 메뉴|47 MENUS|52개 메뉴/);
  assert.match(page, /target="_blank"/g);
  assert.match(page, /rel="noreferrer"/g);
  assert.match(css, /\.full-menu-page/);
  assert.match(css, /\.full-menu-section__items/);
  assert.match(
    css,
    /\.full-menu-section__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/,
  );
  assert.match(
    css,
    /@media \(max-width: 1199px\)[\s\S]*?\.full-menu-section__items[\s\S]*?grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.full-menu-section__items[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.doesNotMatch(
    css,
    /\.full-menu-[^{]*\{[^}]*font-size:\s*(?:0\.[0-9]+rem|1[0-5]px)/,
  );
});

test("all three full-menu entry points open /menu in a safe new tab", async () => {
  const [content, header, signature] = await Promise.all([
    read("lib/site-content.ts"),
    read("components/home/site-header.tsx"),
    read("components/home/signature-menu-section.tsx"),
  ]);

  assert.match(
    content,
    /\{ label: "대표 메뉴", href: "\/menu", newTab: true \}/,
  );
  assert.equal(
    header.match(/target=\{item\.newTab \? "_blank" : undefined\}/g)
      ?.length,
    2,
  );
  assert.equal(
    header.match(/rel=\{item\.newTab \? "noreferrer" : undefined\}/g)
      ?.length,
    2,
  );
  assert.match(signature, /href="\/menu"/);
  assert.match(signature, /target="_blank"/);
  assert.match(signature, /rel="noreferrer"/);
  assert.match(signature, />\s*전체 메뉴 보기\s*</);
});

test("full menu page uses Next Link for same-tab home navigation", async () => {
  const page = await read("app/menu/page.tsx");
  assert.match(page, /import Link from "next\/link"/);
  assert.equal(page.match(/<Link\b/g)?.length, 2);
  assert.doesNotMatch(page, /<a[^>]+href="\/"/);
});

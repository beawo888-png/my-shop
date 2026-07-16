# Chinese Liquor Menu Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tsingtao and Harbin beer photos with the user-provided files and completely remove Tiger beer, Erguotou, and cup gaoliang from the menu and local product assets.

**Architecture:** Keep the existing static menu-data architecture. Update the drinks entries in `lib/menu-content.ts`, store the two supplied JPG files beside the other menu assets, and express the complete expected state in the existing Node test suite before changing production data.

**Tech Stack:** Next.js 16.2.10, TypeScript, Node.js built-in test runner, local JPG assets

## Global Constraints

- Keep the names, prices, descriptions, ordering, and `contain` fit mode of Tsingtao and Harbin unchanged.
- Remove the complete menu records for Tiger beer, Erguotou, and cup gaoliang, including their displayed prices and descriptions.
- Remove only the dedicated `erguotou-125ml.jpg` and `cup-gaoliang-100ml.jpg` assets; retain shared beer photos because other behavior may still rely on them.
- Do not change card layout, styles, interactions, unrelated menu entries, or the Pencil sketch.
- Preserve the existing shared fallback-image behavior.

---

### Task 1: Update the Chinese-drinks menu and product photos

**Files:**
- Create: `public/images/wangjing/menu/tsingtao-beer-640ml.jpg`
- Create: `public/images/wangjing/menu/harbin-beer-500ml.jpg`
- Modify: `app/menu/page.tsx`
- Modify: `lib/menu-content.ts`
- Modify: `tests/full-menu.test.mjs`
- Modify: `tests/menu-photo-grid.test.mjs`
- Delete: `public/images/wangjing/menu/erguotou-125ml.jpg`
- Delete: `public/images/wangjing/menu/cup-gaoliang-100ml.jpg`
- Test: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: menu records declared by `menuItem(name, price, description, imageFile, fitMode)` and the supplied `D:\웹&모바일 업로드용\중국주류\칭도우.jpg` and `D:\웹&모바일 업로드용\중국주류\하얼빈.jpg`
- Produces: local URLs `/images/wangjing/menu/tsingtao-beer-640ml.jpg` and `/images/wangjing/menu/harbin-beer-500ml.jpg`, plus regression coverage for 44 menu records, nine remaining Chinese liquor/beer mappings, three absent menu records, and two absent dedicated assets

- [ ] **Step 1: Write the failing test**

In `tests/full-menu.test.mjs`, change the expected total count from 47 to 44, the drinks group count from 18 to 15, and all expected `47개 메뉴` copy to `44개 메뉴`. In `tests/menu-photo-grid.test.mjs`, change the declared-image count from 47 to 44 and rename the JSON-LD test to refer to 44 items. Replace the existing `each Chinese spirit uses its own matching local product photo` test with:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails for the requested changes**

Run: `npm test -- --test-name-pattern="declared menu image|remaining Chinese drinks"`

Expected: FAIL because the source still contains 47 images, the two beer entries still reference shared photos, all three deleted records are present, and both dedicated assets still exist.

- [ ] **Step 3: Copy the supplied product photos into local menu assets**

Run:

```powershell
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\중국주류\칭도우.jpg' -Destination 'public\images\wangjing\menu\tsingtao-beer-640ml.jpg'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\중국주류\하얼빈.jpg' -Destination 'public\images\wangjing\menu\harbin-beer-500ml.jpg'
```

Expected: both destination files exist and retain their original non-zero sizes.

- [ ] **Step 4: Make the minimal menu-data change**

Replace the five affected records in `lib/menu-content.ts` with exactly these two records:

```ts
      menuItem("칭다오 맥주 640ml 4.7도", "7,000원", "양꼬치와 잘 어울리는 청량한 맥주", "tsingtao-beer-640ml.jpg", "contain"),
      menuItem("하얼빈 맥주 500ml 4.3도", "7,000원", "깔끔하고 시원한 중국 맥주", "harbin-beer-500ml.jpg", "contain"),
```

Do not alter the surrounding records.

Also set `PANGYO_MENU_COUNT` to `44`. In `app/menu/page.tsx`, replace the three static `47` references in metadata and hero copy with `44`, including `PANGYO · 44 MENUS`.

- [ ] **Step 5: Delete the two dedicated assets for removed drinks**

Run:

```powershell
Remove-Item -LiteralPath 'public\images\wangjing\menu\erguotou-125ml.jpg'
Remove-Item -LiteralPath 'public\images\wangjing\menu\cup-gaoliang-100ml.jpg'
```

Expected: both paths no longer exist. Keep `beer-cheers-table.jpg` and `beer-cheers-close.jpg`.

- [ ] **Step 6: Run the focused test to verify it passes**

Run: `npm test -- --test-name-pattern="declared menu image|remaining Chinese drinks"`

Expected: PASS with the declared menu-image count at 44, both new beer mappings present, all three records absent, and both removed assets absent.

- [ ] **Step 7: Run complete verification**

Run in order:

```powershell
npm test
npm run lint
npm run build
```

Expected: each command exits with code 0 and no test failures, lint errors, or build errors.

- [ ] **Step 8: Review the scoped diff and commit**

Run:

```powershell
git diff --check
git status --short
git diff -- app/menu/page.tsx lib/menu-content.ts tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
git add -- app/menu/page.tsx lib/menu-content.ts tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs public/images/wangjing/menu/tsingtao-beer-640ml.jpg public/images/wangjing/menu/harbin-beer-500ml.jpg public/images/wangjing/menu/erguotou-125ml.jpg public/images/wangjing/menu/cup-gaoliang-100ml.jpg docs/superpowers/plans/2026-07-16-chinese-liquor-menu-cleanup.md
git commit -m "feat: update Chinese beer menu photos"
```

Expected: the diff contains only the approved menu/test changes and image additions/deletions; the commit succeeds without staging unrelated user files.

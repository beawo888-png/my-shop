# Lamb Menu Category Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the existing lamb-and-skewer menu group into `시그니처 양다리` and `양꼬치 &세트메뉴`, while renaming the two lamb-leg products and preserving all 44 menu items.

**Architecture:** Keep the menu page renderer unchanged and express the new presentation entirely in `PANGYO_MENU_GROUPS`. Extend the group ID union with one focused signature ID, retain `lamb-skewers` for the remaining five products, and update source-level regression tests to lock down membership, names, prices, group count, and total item count.

**Tech Stack:** TypeScript, Next.js 16, React 19, Node.js built-in test runner, ESLint

## Global Constraints

- `시그니처 양다리` contains exactly the two lamb-leg products.
- The products are named `400도 숯불로 완성한 겉바속촉 양다리구이 (대)` and `400도 숯불로 완성한 겉바속촉 양다리구이 (중)` at `90,000원` and `80,000원` respectively.
- `양꼬치 &세트메뉴` contains 고급양갈비, 생양꼬치, 양념양꼬치, 양갈비살꼬치, and 새우꼬치 in that order.
- Existing item descriptions, images, image fit values, and the total count of 44 menu items remain unchanged.
- Existing cards, grid, typography, responsive layout, and Pencil sketch remain unchanged because this is a data-only category split.

---

### Task 1: Split and rename the lamb menu groups

**Files:**
- Modify: `tests/full-menu.test.mjs:82-119`
- Modify: `lib/menu-content.ts:12-55`

**Interfaces:**
- Consumes: `FullMenuGroup`, `FullMenuItem`, and `menuItem()` from `lib/menu-content.ts`
- Produces: `PANGYO_MENU_GROUPS: FullMenuGroup[]` with five groups and unchanged `PANGYO_MENU_COUNT = 44`

- [ ] **Step 1: Write failing regression tests for the new category contract**

Change the expected fallback group count in `tests/full-menu.test.mjs`:

```js
  const fallbackLines = source.match(/^    fallbackImageSrc:.*$/gm) ?? [];
  assert.equal(fallbackLines.length, 5);
```

Replace the existing lamb-leg test with:

```js
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
```

Change the page test title to reflect the new group count:

```js
test("full menu page renders metadata, five groups, and conversion links", async () => {
```

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```powershell
npm test -- --test-name-pattern="Pangyo menu data|full menu page"
```

Expected: FAIL because only four fallback groups exist and the new category titles and lamb-leg names are absent.

- [ ] **Step 3: Implement the minimal menu data split**

Extend `FullMenuGroup["id"]` in `lib/menu-content.ts`:

```ts
export type FullMenuGroup = {
  id:
    | "signature-lamb-leg"
    | "lamb-skewers"
    | "chinese-dishes"
    | "meals"
    | "drinks";
  title: string;
  description: string;
  fallbackImageSrc: string;
  items: FullMenuItem[];
};
```

Replace the existing first menu group with these two groups:

```ts
  {
    id: "signature-lamb-leg",
    title: "시그니처 양다리",
    description: "400도 숯불로 완성한 왕징의 대표 양다리구이",
    fallbackImageSrc: "/images/wangjing/menu/lamb-leg.jpg",
    items: [
      menuItem("400도 숯불로 완성한 겉바속촉 양다리구이 (대)", "90,000원", "통양다리를 천천히 구워 즐기는 왕징 대표 메뉴", "lamb-leg.jpg"),
      menuItem("400도 숯불로 완성한 겉바속촉 양다리구이 (중)", "80,000원", "육즙과 불향을 풍성하게 즐기는 통양다리", "lamb-leg.jpg"),
    ],
  },
  {
    id: "lamb-skewers",
    title: "양꼬치 &세트메뉴",
    description: "불향과 육즙을 즐기는 왕징의 양꼬치와 세트 메뉴",
    fallbackImageSrc: "/images/wangjing/menu/lamb-leg.jpg",
    items: [
      menuItem("고급양갈비", "30,000원", "부드러운 육질과 진한 풍미의 양갈비", "premium-lamb-chops.jpg"),
      menuItem("생양꼬치", "17,000원", "담백한 양고기 본연의 맛을 살린 꼬치", "fresh-lamb-skewers.jpg"),
      menuItem("양념양꼬치", "18,000원", "왕징 특제 양념으로 풍미를 더한 양꼬치", "marinated-lamb-skewers.jpg"),
      menuItem("양갈비살꼬치", "18,000원", "쫄깃하고 고소한 양갈비살 꼬치", "lamb-rib-skewers.jpg"),
      menuItem("새우꼬치", "18,000원", "탱글한 새우를 노릇하게 구운 꼬치", "shrimp-skewers.png"),
    ],
  },
```

- [ ] **Step 4: Run the focused tests and verify the category split passes**

Run:

```powershell
npm test -- --test-name-pattern="Pangyo menu data|full menu page"
```

Expected: PASS for the menu data and full-menu-page tests, with non-matching tests reported as skipped by the Node.js test runner.

- [ ] **Step 5: Run the complete regression suite and lint**

Run:

```powershell
npm test
npm run lint
```

Expected: both commands exit with code 0; all tests pass and ESLint reports no errors.

- [ ] **Step 6: Review the exact diff and commit the implementation**

Run:

```powershell
git diff --check
git diff -- tests/full-menu.test.mjs lib/menu-content.ts
git add tests/full-menu.test.mjs lib/menu-content.ts
git commit -m "feat: split lamb menu categories"
```

Expected: `git diff --check` has no output, the diff contains only the planned test and menu-data changes, and the commit succeeds.


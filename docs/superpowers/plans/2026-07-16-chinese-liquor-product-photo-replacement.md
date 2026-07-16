# Chinese Liquor Product Photo Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three repeated Chinese-liquor scene photos with nine menu-specific, authentic bottle photos while preserving the existing menu layout and fallback behavior.

**Architecture:** Keep `lib/menu-content.ts` as the single source of truth for menu-to-image mapping and store every approved image under `public/images/wangjing/menu/`. Extend the existing Node test contract before adding assets, then map each of the nine Chinese spirits to one unique local file while retaining `chinese-liquor-toast.jpg` only as the drinks-group fallback.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript, `next/image`, Node.js built-in test runner

## Global Constraints

- Change only the nine Chinese-spirit images; do not change beer, highball, food images, menu copy, prices, order, or card layout.
- Prefer manufacturer or brand-official product images; use an official retailer only when no brand-official image is available.
- The pictured product name, volume, ABV, and package must match the menu entry.
- Prefer front-facing full-bottle photos on white or simple light backgrounds.
- Do not alter or regenerate trademarks, labels, or bottle shapes with AI.
- Reject images containing watermarks, prices, discount badges, or storefront UI.
- Preserve `contain` rendering and `chinese-liquor-toast.jpg` as the group fallback.

---

## File Structure

- Create `docs/assets/chinese-liquor-photo-sources.md`: records the exact source URL, source type, pictured volume, pictured ABV, and verification date for all nine assets.
- Create nine `.jpg` files under `public/images/wangjing/menu/`: the approved product photos.
- Modify `tests/menu-photo-grid.test.mjs`: locks the exact nine-file contract, uniqueness, `contain` fit, and unchanged beer/highball mappings.
- Modify `lib/menu-content.ts`: maps each Chinese-spirit menu entry to its matching local file.
- Do not modify `components/menu/full-menu-image.tsx` or CSS; existing `contain` and fallback behavior already satisfy the design.

---

### Task 1: Lock the nine-product image contract

**Files:**
- Modify: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: source text from `lib/menu-content.ts` and local files under `public/images/wangjing/menu/`
- Produces: an exact `chineseLiquorImages` mapping contract used to validate Task 2 and Task 3

- [ ] **Step 1: Replace the outdated representative-photo test with a failing product-photo contract**

Replace `test("menu catalog uses 28 food assets and six approved drink representatives", ...)` with:

```js
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
```

- [ ] **Step 2: Run the focused test and confirm the contract fails**

Run: `node --test --test-name-pattern="each Chinese spirit" tests/menu-photo-grid.test.mjs`

Expected: FAIL because `lib/menu-content.ts` still references `chinese-liquor-toast.jpg`, `chinese-liquor-pour-dark.jpg`, and `chinese-liquor-pour-clear.jpg` for the nine products.

- [ ] **Step 3: Commit the failing contract**

```bash
git add tests/menu-photo-grid.test.mjs
git commit -m "test: require product-specific Chinese liquor photos"
```

---

### Task 2: Acquire and verify nine authentic bottle photos

**Files:**
- Create: `docs/assets/chinese-liquor-photo-sources.md`
- Create: `public/images/wangjing/menu/yantai-guniang-500ml.jpg`
- Create: `public/images/wangjing/menu/yantai-guniang-250ml.jpg`
- Create: `public/images/wangjing/menu/yantai-guniang-125ml.jpg`
- Create: `public/images/wangjing/menu/seolwon-450ml.jpg`
- Create: `public/images/wangjing/menu/seolwon-250ml.jpg`
- Create: `public/images/wangjing/menu/gongbu-gaju-500ml.jpg`
- Create: `public/images/wangjing/menu/noju-tan-500ml.jpg`
- Create: `public/images/wangjing/menu/erguotou-125ml.jpg`
- Create: `public/images/wangjing/menu/cup-gaoliang-100ml.jpg`

**Interfaces:**
- Consumes: the filename contract from Task 1 and authenticated browser/web access to official product sources
- Produces: nine non-empty JPEG assets and a provenance table for Task 3

- [ ] **Step 1: Search official sources in fixed priority order**

For each exact menu label, search the full Korean label first, then the brand name plus volume and ABV. Use this priority: manufacturer/brand site, manufacturer/brand official store, official importer/distributor, official retailer. Reject any candidate whose visible label or product description does not confirm the menu's volume and ABV.

Search these exact strings:

```text
연태구냥 500ml 34도 공식
연태구냥 250ml 34도 공식
연태구냥 125ml 34도 공식
설원 450ml 30도 공식
설원 250ml 30도 공식
공부가주 500ml 33도 공식
노주탄 500ml 33도 공식
이과두주 125ml 56도 공식
컵술 고량주 100ml 38도 공식
```

- [ ] **Step 2: Save the original product image under the contracted filename**

Download the largest available original image, not a page screenshot or thumbnail containing site UI. Convert only the file container to JPEG when necessary; do not crop, retouch, remove backgrounds, alter labels, or generate missing areas. Save each accepted file at its exact Task 2 path.

- [ ] **Step 3: Record provenance and product-match evidence**

Create `docs/assets/chinese-liquor-photo-sources.md` with this header and table heading:

```markdown
# Chinese Liquor Photo Sources

Verified: 2026-07-16

| Menu item | Local file | Source type | Source URL | Verified evidence |
| --- | --- | --- | --- | --- |
```

Immediately after accepting each asset, add one completed row containing that menu label, its contracted local filename, either `Brand official` or `Official retailer`, the exact source page URL copied from the browser, and an evidence sentence stating the literal confirmed volume and ABV values. The finished table must contain exactly nine data rows in the same order as the search list above.

If any exact product cannot be verified, stop Task 2 and report that item instead of substituting a different volume, ABV, or package.

- [ ] **Step 4: Verify file integrity and visually inspect every asset**

Run:

```powershell
Get-ChildItem public\images\wangjing\menu\yantai-guniang-*.jpg, public\images\wangjing\menu\seolwon-*.jpg, public\images\wangjing\menu\gongbu-gaju-500ml.jpg, public\images\wangjing\menu\noju-tan-500ml.jpg, public\images\wangjing\menu\erguotou-125ml.jpg, public\images\wangjing\menu\cup-gaoliang-100ml.jpg | Select-Object Name,Length
```

Expected: exactly nine files, each larger than 500 bytes. Open all nine with the local image viewer and confirm full bottle visibility, readable label, simple background, no watermark/price/UI, and exact volume/ABV match.

- [ ] **Step 5: Commit the verified assets and provenance record**

```bash
git add docs/assets/chinese-liquor-photo-sources.md public/images/wangjing/menu/yantai-guniang-500ml.jpg public/images/wangjing/menu/yantai-guniang-250ml.jpg public/images/wangjing/menu/yantai-guniang-125ml.jpg public/images/wangjing/menu/seolwon-450ml.jpg public/images/wangjing/menu/seolwon-250ml.jpg public/images/wangjing/menu/gongbu-gaju-500ml.jpg public/images/wangjing/menu/noju-tan-500ml.jpg public/images/wangjing/menu/erguotou-125ml.jpg public/images/wangjing/menu/cup-gaoliang-100ml.jpg
git commit -m "assets: add verified Chinese liquor product photos"
```

---

### Task 3: Map each Chinese spirit to its product image

**Files:**
- Modify: `lib/menu-content.ts`
- Test: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: the nine exact asset filenames from Task 2
- Produces: nine unique `FullMenuItem.imageSrc` values with `imageFit: "contain"`

- [ ] **Step 1: Replace only the nine Chinese-spirit image arguments**

Keep every existing name, price, description, and fit argument unchanged. Replace the nine drink entries with:

```ts
menuItem("연태구냥 500ml 34도", "40,000원", "은은한 과실 향이 특징인 중국 백주", "yantai-guniang-500ml.jpg", "contain"),
menuItem("연태구냥 250ml 34도", "20,000원", "부드러운 향을 가볍게 즐기는 연태구냥", "yantai-guniang-250ml.jpg", "contain"),
menuItem("연태구냥 125ml 34도", "12,000원", "한 상에 곁들이기 좋은 작은 용량의 연태구냥", "yantai-guniang-125ml.jpg", "contain"),
menuItem("설원 450ml 30도", "25,000원", "깔끔한 목넘김의 중국 백주", "seolwon-450ml.jpg", "contain"),
menuItem("설원 250ml 30도", "15,000원", "부담 없이 나누기 좋은 설원 백주", "seolwon-250ml.jpg", "contain"),
menuItem("공부가주 500ml 33도", "50,000원", "깊고 부드러운 향을 지닌 중국 명주", "gongbu-gaju-500ml.jpg", "contain"),
menuItem("노주탄 500ml 33도", "30,000원", "진한 향과 긴 여운의 중국 백주", "noju-tan-500ml.jpg", "contain"),
menuItem("이과두주 125ml 56도", "5,000원", "힘 있는 풍미를 작은 잔으로 즐기는 고도주", "erguotou-125ml.jpg", "contain"),
menuItem("컵술 고량주 100ml 38도", "5,000원", "양꼬치와 가볍게 곁들이는 컵 고량주", "cup-gaoliang-100ml.jpg", "contain"),
```

- [ ] **Step 2: Run the focused contract test**

Run: `node --test --test-name-pattern="each Chinese spirit" tests/menu-photo-grid.test.mjs`

Expected: PASS; all nine mappings are unique, use `contain`, old pour photos are unused, the toast photo remains once as fallback, and beer mappings remain unchanged.

- [ ] **Step 3: Run the complete photo-grid test file**

Run: `node --test tests/menu-photo-grid.test.mjs`

Expected: all tests PASS, including the 47-image local-asset integrity test.

- [ ] **Step 4: Commit the mapping**

```bash
git add lib/menu-content.ts
git commit -m "feat: show product-specific Chinese liquor photos"
```

---

### Task 4: Verify the menu visually and run the full project checks

**Files:**
- Verify only: `app/menu/page.tsx`
- Verify only: `components/menu/full-menu-image.tsx`
- Verify only: `app/globals.css`

**Interfaces:**
- Consumes: the completed asset and menu mapping changes
- Produces: evidence that the unchanged responsive card system displays all nine products correctly

- [ ] **Step 1: Start the development server and inspect the drinks section**

Run: `npm run dev`

Open `http://localhost:3000/menu` and inspect all nine Chinese-spirit cards at desktop, tablet, and mobile widths. Confirm each card shows the correct bottle, the entire bottle is visible, labels are not clipped, spacing is consistent, and no image is stretched.

- [ ] **Step 2: Verify fallback behavior without committing a broken path**

In browser developer tools, block one product-image request and reload. Confirm the affected card switches to `/images/wangjing/menu/chinese-liquor-toast.jpg`; then remove the request block. Do not edit a committed source path for this check.

- [ ] **Step 3: Run the full automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: every test passes, ESLint exits with code 0, and Next.js production build completes successfully.

- [ ] **Step 4: Confirm the diff is limited to the approved scope**

Run: `git diff HEAD~3 --stat`

Then run: `git status --short`

Expected: only the nine product images, provenance document, `tests/menu-photo-grid.test.mjs`, and `lib/menu-content.ts` belong to this feature. Existing unrelated worktree changes remain untouched.

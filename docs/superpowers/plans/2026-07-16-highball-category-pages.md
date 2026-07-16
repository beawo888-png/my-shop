# Highball Images and Category Menu Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scrolling all-category menu with independent category routes and show six correctly photographed highballs in a dedicated final subsection without changing prices.

**Architecture:** Keep `lib/menu-content.ts` as the menu source of truth, add an explicit highball subsection marker, and resolve one menu group per dynamic Next.js route. A reusable server-rendered menu page component owns common navigation and card rendering, while `/menu` redirects to the first category and unknown category IDs call `notFound()`.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, CSS Grid, Node.js test runner, Next Image, Pencil MCP.

## Global Constraints

- Preserve all 44 menu items and every existing product name, description, and price.
- Preserve these highball prices exactly: 커티삭 6,000원, 산토리 8,000원, 봄베이 8,000원, 짐빔 7,000원, 제임슨 8,000원, 연태 7,000원.
- Store the six supplied PNG files without cropping, recompression, or format conversion.
- Place regular liquor and beer before the dedicated highball subsection on `/menu/drinks`.
- Order highballs as 산토리, 제임슨, 짐빔, 커티삭, 봄베이, 연태.
- Render the highball grid as 3 columns on desktop, 2 on tablet, and 1 on mobile.
- Read and follow the bundled Next.js 16 routing documentation before changing route code.
- Update the Pencil source before application UI code and preserve unrelated user work in the dirty worktree.

---

## File Map

- Modify `초안`: Pencil source of truth for the category page and responsive drinks layout.
- Modify `lib/menu-content.ts`: menu group lookup API, highball marker, order, image mapping, and unchanged product values.
- Modify `lib/menu-structured-data.ts`: build JSON-LD for one selected category and its canonical URL.
- Create `components/menu/category-menu-page.tsx`: shared category page shell, navigation, normal items, and highball subsection.
- Replace `app/menu/page.tsx`: redirect-only entry route.
- Create `app/menu/[category]/page.tsx`: static category routes, metadata, validation, and 404 behavior.
- Modify `app/globals.css`: active category state and responsive highball section styles.
- Modify `tests/menu-photo-grid.test.mjs`: exact image, order, section marker, price, and asset assertions.
- Modify `tests/full-menu.test.mjs`: redirect, dynamic routing, navigation, one-group rendering, JSON-LD, and responsive layout assertions.
- Copy six supplied files into `public/images/wangjing/menu/` using stable English names.

---

### Task 1: Update and verify the Pencil menu design

**Files:**
- Modify: `초안`

**Interfaces:**
- Consumes: approved layout from `docs/superpowers/specs/2026-07-16-highball-category-pages-design.md`
- Produces: one-category desktop menu screen, drinks screen with final 3×2 highball subsection, and mobile 1-column state

- [ ] **Step 1: Inspect the active Pencil document and schema**

Call `mcp__pencil__get_editor_state` with `include_schema: true`, then call `mcp__pencil__batch_get` for the top-level frames and patterns matching `menu`, `메뉴`, `desktop`, and `mobile` in `C:\vibecoding\my-shop\초안`.

- [ ] **Step 2: Create the independent category page states**

Use `mcp__pencil__batch_design` to preserve the current menu visual language while adding:

```text
Desktop category page
  shared header
  category navigation with one active item
  one category heading and one category product grid

Desktop drinks page
  regular liquor and beer grid
  "하이볼" heading below regular drinks
  six highball cards in 3 columns × 2 rows

Mobile drinks page
  same content order
  six highball cards in a single column
```

- [ ] **Step 3: Verify layout structure and appearance**

Run `mcp__pencil__snapshot_layout` with `problemsOnly: true` for each changed frame. Expected: no clipped or overlapping nodes. Then use `mcp__pencil__get_screenshot` once per completed desktop and mobile drinks frame and confirm the highball subsection is last.

- [ ] **Step 4: Commit the design source**

```powershell
git add -- '초안'
git commit -m "design: add category menu page states"
```

Expected: a commit containing only the Pencil source change.

---

### Task 2: Add exact highball assets and menu metadata

**Files:**
- Modify: `tests/menu-photo-grid.test.mjs`
- Modify: `lib/menu-content.ts`
- Create: `public/images/wangjing/menu/suntory-highball.png`
- Create: `public/images/wangjing/menu/jameson-highball.png`
- Create: `public/images/wangjing/menu/jim-beam-highball.png`
- Create: `public/images/wangjing/menu/cutty-sark-highball.png`
- Create: `public/images/wangjing/menu/bombay-highball.png`
- Create: `public/images/wangjing/menu/yantai-highball.png`

**Interfaces:**
- Produces: `MenuSubsection = "highball"`, `FullMenuItem.subsection`, `PANGYO_MENU_GROUP_IDS`, and `getPangyoMenuGroup(id)`
- Preserves: `PANGYO_MENU_GROUPS`, `PANGYO_MENU_COUNT`, and the existing `FullMenuItem` card fields

- [ ] **Step 1: Write failing highball mapping and price tests**

Add a test that asserts all six source lines contain the exact file, price, `contain`, and `highball` marker:

```js
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
    const line = source.split("\n").find((row) => row.includes(`menuItem("${name}"`));
    assert.ok(line?.includes(`"${price}"`));
    assert.ok(line?.includes(`"${file}", "contain", "highball"`));
    return source.indexOf(line);
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});
```

Extend the asset test to require each declared PNG to exist and exceed 500 bytes.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- --test-name-pattern="highballs use supplied images"`

Expected: FAIL because the six PNG mappings and subsection markers do not exist.

- [ ] **Step 3: Copy the original PNG files without transformation**

```powershell
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\산토리하이볼.png' -Destination 'public\images\wangjing\menu\suntory-highball.png'
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\제임슨하이볼.png' -Destination 'public\images\wangjing\menu\jameson-highball.png'
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\짐빔하이볼.png' -Destination 'public\images\wangjing\menu\jim-beam-highball.png'
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\커티삭하이볼.png' -Destination 'public\images\wangjing\menu\cutty-sark-highball.png'
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\봄베이하이볼.png' -Destination 'public\images\wangjing\menu\bombay-highball.png'
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\연태하이볼.png' -Destination 'public\images\wangjing\menu\yantai-highball.png'
```

Verify byte-for-byte equality with `Get-FileHash` for each source/destination pair.

- [ ] **Step 4: Add the subsection type and exact menu mappings**

Implement the following public shape in `lib/menu-content.ts`:

```ts
export type MenuSubsection = "highball";

export type FullMenuItem = {
  name: string;
  price: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFit: MenuImageFit;
  subsection?: MenuSubsection;
};

const menuItem = (
  name: string,
  price: string,
  description: string,
  imageFile: string,
  imageFit: MenuImageFit = "cover",
  subsection?: MenuSubsection,
): FullMenuItem => ({
  name,
  price,
  description,
  imageSrc: `/images/wangjing/menu/${imageFile}`,
  imageAlt: `${name} 메뉴 사진`,
  imageFit,
  subsection,
});
```

Move the six highball calls after the nine regular drinks, use the expected order and filenames from Step 1, and append `"contain", "highball"` without changing descriptions or prices.

Add stable category lookup helpers:

```ts
export type PangyoMenuGroupId = FullMenuGroup["id"];

export const PANGYO_MENU_GROUP_IDS = PANGYO_MENU_GROUPS.map(
  (group) => group.id,
) satisfies PangyoMenuGroupId[];

export function getPangyoMenuGroup(id: string) {
  return PANGYO_MENU_GROUPS.find((group) => group.id === id);
}
```

- [ ] **Step 5: Run focused and full menu tests**

Run: `npm test -- --test-name-pattern="highball|declared menu image|44 items"`

Expected: PASS with six unique PNG mappings, unchanged prices, 44 items, and highballs last.

- [ ] **Step 6: Commit the asset and data change**

```powershell
git add -- lib/menu-content.ts tests/menu-photo-grid.test.mjs public/images/wangjing/menu/*-highball.png
git commit -m "feat: add supplied highball menu photos"
```

---

### Task 3: Build independent category routes

**Files:**
- Modify: `tests/full-menu.test.mjs`
- Modify: `lib/menu-structured-data.ts`
- Create: `components/menu/category-menu-page.tsx`
- Replace: `app/menu/page.tsx`
- Create: `app/menu/[category]/page.tsx`

**Interfaces:**
- Consumes: `PANGYO_MENU_GROUPS`, `PANGYO_MENU_GROUP_IDS`, `getPangyoMenuGroup`, and `FullMenuGroup`
- Produces: `CategoryMenuPage({ group }: { group: FullMenuGroup })` and `buildPangyoMenuStructuredData(groups, path)`

- [ ] **Step 1: Write failing route and rendering tests**

Add assertions equivalent to:

```js
test("menu uses independent category routes", async () => {
  const [indexPage, categoryPage, component] = await Promise.all([
    read("app/menu/page.tsx"),
    read("app/menu/[category]/page.tsx"),
    read("components/menu/category-menu-page.tsx"),
  ]);
  assert.match(indexPage, /redirect\("\/menu\/signature-lamb-leg"\)/);
  assert.match(categoryPage, /params: Promise<\{ category: string \}>/);
  assert.match(categoryPage, /generateStaticParams/);
  assert.match(categoryPage, /getPangyoMenuGroup\(category\)/);
  assert.match(categoryPage, /if \(!group\) notFound\(\)/);
  assert.match(component, /href=\{`\/menu\/\$\{menuGroup\.id\}`\}/);
  assert.match(component, /aria-current=\{menuGroup\.id === group\.id \? "page" : undefined\}/);
  assert.doesNotMatch(component, /href=\{"#menu-/);
  assert.equal(component.match(/PANGYO_MENU_GROUPS\.map/g)?.length, 1);
});
```

Update the JSON-LD test to assert the builder accepts a selected group list and a canonical path.

- [ ] **Step 2: Run route tests and verify failure**

Run: `npm test -- --test-name-pattern="independent category routes|JSON-LD"`

Expected: FAIL because the dynamic page and shared component do not exist.

- [ ] **Step 3: Make structured data category-aware**

Change the builder signature and URL handling:

```ts
export function buildPangyoMenuStructuredData(
  groups = PANGYO_MENU_GROUPS,
  path = "/menu",
) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "판교 왕징양다리양꼬치 메뉴",
    url: new URL(path, siteUrl).toString(),
    hasMenuSection: groups.map((group) => ({
      "@type": "MenuSection",
      name: group.title,
      description: group.description,
      hasMenuItem: group.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        image: new URL(item.imageSrc, siteUrl).toString(),
        offers: {
          "@type": "Offer",
          priceCurrency: "KRW",
          price: item.price.replace("원", "").replaceAll(",", ""),
        },
      })),
    })),
  };
}
```

- [ ] **Step 4: Replace `/menu` with the immediate first-category redirect**

Use the documented Next.js 16 server redirect:

```tsx
import { redirect } from "next/navigation";

export default function MenuIndexPage() {
  redirect("/menu/signature-lamb-leg");
}
```

- [ ] **Step 5: Create the reusable selected-category page component**

Move the shared header, hero, category navigation, selected group card list, and footer from the old page into `CategoryMenuPage`. Render links with Next `Link`; render only `group.items` in this task. Pass the selected group to the category-aware structured-data builder:

```tsx
const menuStructuredData = buildPangyoMenuStructuredData(
  [group],
  `/menu/${group.id}`,
);
```

- [ ] **Step 6: Create and validate the dynamic route**

Implement the Next.js 16 async params contract:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryMenuPage } from "@/components/menu/category-menu-page";
import {
  PANGYO_MENU_GROUP_IDS,
  getPangyoMenuGroup,
} from "@/lib/menu-content";

export function generateStaticParams() {
  return PANGYO_MENU_GROUP_IDS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const group = getPangyoMenuGroup(category);
  if (!group) return {};
  return {
    title: `${group.title} | 판교 왕징양다리양꼬치`,
    description: group.description,
    alternates: { canonical: `/menu/${group.id}` },
  };
}

export default async function MenuCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const group = getPangyoMenuGroup(category);
  if (!group) notFound();
  return <CategoryMenuPage group={group} />;
}
```

- [ ] **Step 7: Run focused route tests and the production build**

Run: `npm test -- --test-name-pattern="independent category routes|JSON-LD|same-tab home"`

Expected: PASS.

Run: `npm run build`

Expected: PASS and static output for all five `/menu/[category]` paths.

- [ ] **Step 8: Commit the independent page architecture**

```powershell
git add -- app/menu/page.tsx 'app/menu/[category]/page.tsx' components/menu/category-menu-page.tsx lib/menu-structured-data.ts tests/full-menu.test.mjs
git commit -m "feat: add independent menu category pages"
```

---

### Task 4: Render the final highball subsection responsively

**Files:**
- Modify: `tests/full-menu.test.mjs`
- Modify: `components/menu/category-menu-page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `FullMenuItem.subsection === "highball"`
- Produces: `.full-menu-subsection`, `.full-menu-subsection__heading`, and `.full-menu-section__items--highballs`

- [ ] **Step 1: Write failing subsection and responsive CSS tests**

Add assertions equivalent to:

```js
test("drinks place a responsive highball subsection last", async () => {
  const [component, css] = await Promise.all([
    read("components/menu/category-menu-page.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(component, /item\.subsection !== "highball"/);
  assert.match(component, /item\.subsection === "highball"/);
  assert.match(component, />하이볼<\/h2>/);
  assert.match(component, /full-menu-section__items--highballs/);
  assert.match(css, /\.full-menu-section__items--highballs[\s\S]*repeat\(3/);
  assert.match(css, /@media \(max-width: 1199px\)[\s\S]*full-menu-section__items--highballs[\s\S]*repeat\(2/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*full-menu-section__items--highballs[\s\S]*grid-template-columns:\s*1fr/);
});
```

- [ ] **Step 2: Run the subsection test and verify failure**

Run: `npm test -- --test-name-pattern="responsive highball subsection"`

Expected: FAIL because the subsection rendering and modifier CSS do not exist.

- [ ] **Step 3: Split selected drink items at render time**

In `CategoryMenuPage`, derive:

```ts
const regularItems = group.items.filter(
  (item) => item.subsection !== "highball",
);
const highballItems = group.items.filter(
  (item) => item.subsection === "highball",
);
```

Render `regularItems` in the main category grid. After it, render the highball section only when `highballItems.length > 0`, with heading `하이볼` and the modifier class `full-menu-section__items--highballs`.

- [ ] **Step 4: Add active navigation and responsive highball styles**

Keep the existing grid defaults and add explicit rules:

```css
.full-menu-categories a[aria-current="page"] {
  color: var(--ink);
  text-decoration: underline;
  text-underline-offset: 8px;
}

.full-menu-subsection {
  margin-top: 64px;
}

.full-menu-subsection__heading {
  margin-bottom: 24px;
}

.full-menu-section__items--highballs {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1199px) {
  .full-menu-section__items--highballs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .full-menu-section__items--highballs {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Run menu and layout tests**

Run: `npm test -- --test-name-pattern="responsive highball subsection|photo menu|independent category routes"`

Expected: PASS.

- [ ] **Step 6: Commit the highball subsection UI**

```powershell
git add -- components/menu/category-menu-page.tsx app/globals.css tests/full-menu.test.mjs
git commit -m "feat: place highballs in a responsive final section"
```

---

### Task 5: Full verification and visual QA

**Files:**
- Verify only: all changed files

**Interfaces:**
- Confirms: routing, images, prices, ordering, accessibility, responsive layout, and no regressions

- [ ] **Step 1: Run the complete automated suite**

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests pass, ESLint exits 0, and Next.js production build succeeds.

- [ ] **Step 2: Verify the changed file set and whitespace**

```powershell
git diff --check HEAD~4..HEAD
git status --short
git diff --stat HEAD~4..HEAD
```

Expected: no whitespace errors; unrelated pre-existing dirty files remain unmodified.

- [ ] **Step 3: Start the local app for browser verification**

Run: `npm run dev`

Expected: the development server reports a local URL without compilation errors.

- [ ] **Step 4: Inspect desktop routes in the browser**

Verify:

```text
/menu redirects to /menu/signature-lamb-leg
/menu/signature-lamb-leg shows only 2 signature items
/menu/lamb-skewers shows only 5 skewer/set items
/menu/chinese-dishes shows only 16 Chinese dishes
/menu/meals shows only 6 meal items
/menu/drinks shows 9 regular drinks followed by 6 highballs
/menu/not-a-category returns the not-found UI
```

At a desktop width of at least 1200 px, confirm the highball order is 산토리, 제임슨, 짐빔 / 커티삭, 봄베이, 연태 in a 3×2 grid and all six supplied images render without fallback.

- [ ] **Step 5: Inspect tablet and mobile layouts**

At 768–1199 px confirm 2 highball columns. At 320–767 px confirm one card per row, readable navigation, no horizontal page overflow, and the highball subsection remains last.

- [ ] **Step 6: Record final evidence**

Capture the exact outputs of `npm test`, `npm run lint`, and `npm run build`, plus desktop and mobile screenshots of `/menu/drinks`, for the completion report.

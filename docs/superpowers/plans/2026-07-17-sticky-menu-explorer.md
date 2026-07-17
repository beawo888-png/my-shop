# Sticky Menu Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/menu` with the exact home-page header fixed at the top, rounded branch and category tabs that filter in place, and the shared 44-item Moran/Pangyo menu in a responsive 4-2-1 photo grid.

**Architecture:** Keep route pages and JSON-LD in Server Components, reuse the existing client `SiteHeader`, and isolate tab state and menu filtering in a focused `MenuExplorer` Client Component. Keep `PANGYO_MENU_GROUPS` as the single shared menu source for both branches; branch selection changes visible context while category selection determines which groups render.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, CSS, Node test runner, Pencil design source.

## Global Constraints

- Reuse the home page `SiteHeader`; do not create a second menu-only header.
- Keep the header sticky at `top: 0` with the existing Wangjing logo, navigation, booking dropdown, and mobile menu.
- Render branch tabs in this order: `전체메뉴`, `모란본점`, `판교점`.
- Moran and Pangyo share the same 44 menu items from `PANGYO_MENU_GROUPS`; do not duplicate menu data.
- Keep the existing five menu groups and existing `/menu/[category]` static routes.
- Tab clicks update content in place without changing the URL.
- Render menu cards at 4 columns on desktop, 2 on tablet, and 1 on mobile.
- On mobile, tab rows scroll horizontally while the document itself never overflows horizontally.
- Preserve local image fallback behavior, JSON-LD, safe external links, focus styling, and highball subsection ordering.
- Follow Pencil frames `CAY4c` (desktop) and `eVR1g` (mobile) in `C:\vibecoding\my-shop\초안`.

---

### Task 1: Make the home header reusable from menu routes

**Files:**
- Modify: `tests/full-menu.test.mjs`
- Modify: `components/home/site-header.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS` entries whose `href` may start with `#`.
- Produces: `SiteHeader({ sectionRoot?: "" | "/" })`, where `sectionRoot="/"` roots hash links at the home page.

- [ ] **Step 1: Write the failing header reuse test**

Add this test to `tests/full-menu.test.mjs`:

```js
test("shared header can root home section links from menu pages", async () => {
  const header = await read("components/home/site-header.tsx");

  assert.match(header, /type SiteHeaderProps = \{/);
  assert.match(header, /sectionRoot\?: "" \| "\/"/);
  assert.match(header, /sectionRoot = ""/);
  assert.match(header, /item\.href\.startsWith\("#"\)/);
  assert.match(header, /`\$\{sectionRoot\}\$\{item\.href\}`/);
  assert.match(header, /href=\{sectionRoot === "\/" \? "\/" : "#top"\}/);
});
```

- [ ] **Step 2: Run the test and confirm red**

Run:

```powershell
node --test --test-name-pattern="shared header can root" tests/full-menu.test.mjs
```

Expected: FAIL because `SiteHeaderProps` and `sectionRoot` do not exist.

- [ ] **Step 3: Add the smallest reusable-link implementation**

Update the beginning and link rendering in `components/home/site-header.tsx`:

```tsx
type SiteHeaderProps = {
  sectionRoot?: "" | "/";
};

export function SiteHeader({ sectionRoot = "" }: SiteHeaderProps) {
  const resolveNavHref = (href: string) =>
    href.startsWith("#") ? `${sectionRoot}${href}` : href;

  // existing state, refs, and effects stay unchanged
```

Use the contextual home target on the logo:

```tsx
<a
  className="wordmark"
  href={sectionRoot === "/" ? "/" : "#top"}
  aria-label="왕징양다리양꼬치 처음으로"
>
```

In both desktop and mobile `NAV_ITEMS.map` blocks, replace `href={item.href}` with:

```tsx
href={resolveNavHref(item.href)}
```

- [ ] **Step 4: Run the focused and full header tests**

Run:

```powershell
node --test --test-name-pattern="shared header can root|all three full-menu entry points|mobile menu exposes" tests/full-menu.test.mjs tests/page-structure.test.mjs
```

Expected: PASS for all selected tests.

- [ ] **Step 5: Commit the header boundary**

```powershell
git add tests/full-menu.test.mjs components/home/site-header.tsx
git commit -m "refactor: reuse home header across routes"
```

---

### Task 2: Add the in-place branch and category menu explorer

**Files:**
- Create: `components/menu/menu-explorer.tsx`
- Modify: `components/menu/category-menu-page.tsx`
- Modify: `app/menu/page.tsx`
- Modify: `app/menu/[category]/page.tsx`
- Modify: `tests/full-menu.test.mjs`
- Modify: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: `FullMenuGroup[]`, `FullMenuCard`, and optional `initialGroupId`.
- Produces: `MenuExplorer({ groups, initialGroupId? })` with client-side `activeBranch` and `activeGroupId` state.
- Produces: `CategoryMenuPage({ group? })`, used by `/menu` for all groups and `/menu/[category]` for an initial category.

- [ ] **Step 1: Replace route assumptions with failing explorer tests**

In `tests/full-menu.test.mjs`, replace the old `menu uses independent category routes` assertions with:

```js
test("menu index renders the explorer and category routes seed its initial group", async () => {
  const [indexPage, categoryPage, wrapper, explorer] = await Promise.all([
    read("app/menu/page.tsx"),
    read("app/menu/[category]/page.tsx"),
    read("components/menu/category-menu-page.tsx"),
    read("components/menu/menu-explorer.tsx"),
  ]);

  assert.doesNotMatch(indexPage, /redirect\(/);
  assert.match(indexPage, /<CategoryMenuPage \/>/);
  assert.match(categoryPage, /<CategoryMenuPage group=\{group\} \/>/);
  assert.match(wrapper, /<SiteHeader sectionRoot="\/" \/>/);
  assert.match(wrapper, /initialGroupId=\{group\?\.id\}/);
  assert.match(explorer, /^"use client";/);
  assert.match(explorer, /useState<MenuBranchId>\("all"\)/);
  assert.match(explorer, /useState\(initialGroupId \?\? "all"\)/);
});

test("menu explorer exposes rounded branch and category buttons", async () => {
  const explorer = await read("components/menu/menu-explorer.tsx");

  for (const label of ["전체메뉴", "모란본점", "판교점", "전체 분류"]) {
    assert.ok(explorer.includes(label), `missing explorer label: ${label}`);
  }
  assert.match(explorer, /aria-label="지점 메뉴 선택"/);
  assert.match(explorer, /aria-label="메뉴 분류 선택"/);
  assert.ok((explorer.match(/aria-pressed=/g)?.length ?? 0) >= 2);
  assert.match(explorer, /setActiveBranch/);
  assert.match(explorer, /setActiveGroupId/);
  assert.match(explorer, /등록된 메뉴가 없습니다/);
});

test("both branches share the same 44-item group source", async () => {
  const explorer = await read("components/menu/menu-explorer.tsx");

  assert.match(explorer, /const visibleGroups =/);
  assert.match(explorer, /groups\.filter\(\(group\) => group\.id === activeGroupId\)/);
  assert.doesNotMatch(explorer, /moranMenu|pangyoMenu|MORAN_MENU/);
  assert.match(explorer, /visibleGroups\.reduce/);
});
```

In `tests/menu-photo-grid.test.mjs`, update the page source path used by the JSON-LD/card test so it reads both the wrapper and explorer, and assert cards are rendered by `MenuExplorer`:

```js
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
});
```

- [ ] **Step 2: Run the menu tests and confirm red**

Run:

```powershell
node --test tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
```

Expected: FAIL because `/menu` still redirects and `menu-explorer.tsx` is absent.

- [ ] **Step 3: Create the client menu explorer**

Create `components/menu/menu-explorer.tsx`:

```tsx
"use client";

import { useState } from "react";
import { FullMenuCard } from "@/components/menu/full-menu-card";
import type { FullMenuGroup } from "@/lib/menu-content";

type MenuBranchId = "all" | "moran" | "pangyo";

const MENU_BRANCHES: { id: MenuBranchId; label: string }[] = [
  { id: "all", label: "전체메뉴" },
  { id: "moran", label: "모란본점" },
  { id: "pangyo", label: "판교점" },
];

type MenuExplorerProps = {
  groups: FullMenuGroup[];
  initialGroupId?: string;
};

export function MenuExplorer({ groups, initialGroupId }: MenuExplorerProps) {
  const [activeBranch, setActiveBranch] = useState<MenuBranchId>("all");
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId ?? "all");
  const visibleGroups =
    activeGroupId === "all"
      ? groups
      : groups.filter((group) => group.id === activeGroupId);
  const visibleCount = visibleGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const branchLabel =
    MENU_BRANCHES.find((branch) => branch.id === activeBranch)?.label ??
    "전체메뉴";

  return (
    <section className="full-menu-explorer" aria-label="메뉴 탐색">
      <div className="full-menu-filter-panel">
        <nav
          className="full-menu-tabs full-menu-shell"
          aria-label="지점 메뉴 선택"
        >
          <div className="full-menu-tabs__scroller">
            {MENU_BRANCHES.map((branch) => (
              <button
                className="full-menu-tab full-menu-tab--branch"
                type="button"
                key={branch.id}
                aria-pressed={activeBranch === branch.id}
                onClick={() => setActiveBranch(branch.id)}
              >
                {branch.label}
              </button>
            ))}
          </div>
        </nav>

        <nav
          className="full-menu-tabs full-menu-shell"
          aria-label="메뉴 분류 선택"
        >
          <div className="full-menu-tabs__scroller">
            <button
              className="full-menu-tab full-menu-tab--category"
              type="button"
              aria-pressed={activeGroupId === "all"}
              onClick={() => setActiveGroupId("all")}
            >
              전체 분류
            </button>
            {groups.map((group) => (
              <button
                className="full-menu-tab full-menu-tab--category"
                type="button"
                key={group.id}
                aria-pressed={activeGroupId === group.id}
                onClick={() => setActiveGroupId(group.id)}
              >
                {group.title} {group.items.length}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="full-menu-content full-menu-shell">
        <div className="full-menu-results-heading">
          <div>
            <p>{branchLabel}</p>
            <h2>{activeGroupId === "all" ? "전체 메뉴" : visibleGroups[0]?.title}</h2>
          </div>
          <strong>{visibleCount} MENUS · 두 지점 공통</strong>
        </div>

        {visibleGroups.length === 0 ? (
          <p className="full-menu-empty">등록된 메뉴가 없습니다.</p>
        ) : (
          visibleGroups.map((group) => {
            const regularItems = group.items.filter(
              (item) => item.subsection !== "highball",
            );
            const highballItems = group.items.filter(
              (item) => item.subsection === "highball",
            );

            return (
              <section
                className="full-menu-section"
                aria-labelledby={`menu-title-${group.id}`}
                key={group.id}
              >
                <div className="full-menu-section__heading">
                  <h2 id={`menu-title-${group.id}`}>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
                <ul className="full-menu-section__items">
                  {regularItems.map((item, index) => (
                    <FullMenuCard
                      item={item}
                      fallbackImageSrc={group.fallbackImageSrc}
                      key={`${group.id}-${item.name}-${item.price}-${index}`}
                    />
                  ))}
                </ul>
                {highballItems.length > 0 ? (
                  <section
                    className="full-menu-subsection"
                    aria-labelledby="highball-title"
                  >
                    <div className="full-menu-subsection__heading">
                      <h2 id="highball-title">하이볼</h2>
                      <p>각 브랜드의 개성을 시원하게 즐기는 하이볼 메뉴</p>
                    </div>
                    <ul className="full-menu-section__items full-menu-section__items--highballs">
                      {highballItems.map((item, index) => (
                        <FullMenuCard
                          item={item}
                          fallbackImageSrc={group.fallbackImageSrc}
                          key={`${group.id}-highball-${item.name}-${item.price}-${index}`}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Convert the menu wrapper to shared-header/server-shell composition**

In `components/menu/category-menu-page.tsx`:

- Remove `Link`, `BrandLogo`, the old `full-menu-header`, and category-link markup.
- Import `SiteHeader`, `MenuExplorer`, and `BOOKING_LOCATIONS`.
- Make `group` optional.
- Build JSON-LD from `[group]` for category routes and all groups for `/menu`.
- Render the exact shared header and explorer.

The resulting component body should follow this complete structure:

```tsx
import { SiteHeader } from "@/components/home/site-header";
import { MenuExplorer } from "@/components/menu/menu-explorer";
import {
  PANGYO_MENU_CHECKED_AT,
  PANGYO_MENU_COUNT,
  PANGYO_MENU_GROUPS,
  type FullMenuGroup,
} from "@/lib/menu-content";
import { buildPangyoMenuStructuredData } from "@/lib/menu-structured-data";
import { BOOKING_LOCATIONS } from "@/lib/site-content";

type CategoryMenuPageProps = {
  group?: FullMenuGroup;
};

export function CategoryMenuPage({ group }: CategoryMenuPageProps) {
  const structuredGroups = group ? [group] : PANGYO_MENU_GROUPS;
  const structuredPath = group ? `/menu/${group.id}` : "/menu";
  const menuStructuredData = buildPangyoMenuStructuredData(
    structuredGroups,
    structuredPath,
  );

  return (
    <div className="full-menu-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader sectionRoot="/" />

      <main>
        <section className="full-menu-hero" aria-labelledby="full-menu-title">
          <div className="full-menu-shell">
            <p className="full-menu-eyebrow">WANGJING · FULL MENU</p>
            <h1 id="full-menu-title">전체 메뉴</h1>
            <p className="full-menu-hero__description">
              {PANGYO_MENU_COUNT}개 메뉴 · 모란본점 · 판교점
            </p>
            <p className="full-menu-checked">
              모란본점과 판교점 공통 메뉴 · {PANGYO_MENU_CHECKED_AT} 확인
            </p>
          </div>
        </section>

        <MenuExplorer
          groups={PANGYO_MENU_GROUPS}
          initialGroupId={group?.id}
        />
      </main>

      <footer className="full-menu-footer">
        <div className="full-menu-shell">
          <h2>방문 전 확인해 주세요</h2>
          <p>
            메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다. 최신 정보는
            네이버 플레이스에서 확인해 주세요.
          </p>
          <p className="full-menu-checked">
            모란본점·판교점 공통 메뉴 · {PANGYO_MENU_CHECKED_AT} 확인
          </p>
          <div className="full-menu-footer__actions">
            {BOOKING_LOCATIONS.map((booking) => (
              <a
                href={booking.url}
                target="_blank"
                rel="noreferrer"
                key={booking.id}
              >
                {booking.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
```

- [ ] **Step 5: Render all menus at `/menu` and preserve category routes**

Replace `app/menu/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { CategoryMenuPage } from "@/components/menu/category-menu-page";

export const metadata: Metadata = {
  title: "전체 메뉴 | 왕징양다리양꼬치",
  description: "모란본점과 판교점에서 함께 제공하는 왕징 메뉴 44개",
};

export default function MenuIndexPage() {
  return <CategoryMenuPage />;
}
```

Keep `generateStaticParams`, metadata, and `notFound()` in `app/menu/[category]/page.tsx`. Its final render remains:

```tsx
return <CategoryMenuPage group={group} />;
```

- [ ] **Step 6: Run focused menu tests and confirm green**

Run:

```powershell
node --test tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
```

Expected: all menu structure, data, image, JSON-LD, and explorer tests PASS.

- [ ] **Step 7: Commit the interactive menu explorer**

```powershell
git add app/menu/page.tsx 'app/menu/[category]/page.tsx' components/menu/category-menu-page.tsx components/menu/menu-explorer.tsx tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
git commit -m "feat: add branch and category menu explorer"
```

---

### Task 3: Match the approved sticky-header, rounded-tab, and 4-2-1 layout

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/full-menu.test.mjs`
- Modify: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: `.site-header`, `.full-menu-filter-panel`, `.full-menu-tabs`, `.full-menu-tab`, `.full-menu-section__items`.
- Produces: desktop 4-column, tablet 2-column, mobile 1-column menu grids and horizontally scrollable pill rows.

- [ ] **Step 1: Write failing CSS contract tests**

Update the grid assertions in `tests/full-menu.test.mjs` and `tests/menu-photo-grid.test.mjs` from `repeat(3` to `repeat(4`.

Add this test to `tests/full-menu.test.mjs`:

```js
test("menu explorer uses sticky shared header and responsive rounded tabs", async () => {
  const css = await read("app/globals.css");

  assert.match(css, /\.site-header\s*\{[\s\S]*?position:\s*sticky/);
  assert.match(css, /\.full-menu-filter-panel/);
  assert.match(css, /\.full-menu-tabs__scroller\s*\{[\s\S]*?overflow-x:\s*auto/);
  assert.match(css, /\.full-menu-tab\s*\{[\s\S]*?border-radius:\s*999px/);
  assert.match(css, /\.full-menu-tab\[aria-pressed="true"\]/);
  assert.match(css, /\.full-menu-tab--branch\[aria-pressed="true"\]/);
  assert.match(
    css,
    /\.full-menu-section__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4/,
  );
  assert.match(
    css,
    /@media \(max-width: 1199px\)[\s\S]*?repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?grid-template-columns:\s*1fr/,
  );
});
```

- [ ] **Step 2: Run CSS tests and confirm red**

Run:

```powershell
node --test --test-name-pattern="photo menu uses|sticky shared header|category menu page" tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
```

Expected: FAIL because the grid is still 3 columns and tab selectors do not exist.

- [ ] **Step 3: Replace old menu-header/category-link CSS with explorer styles**

In `app/globals.css`:

- Delete `.full-menu-header`, `.full-menu-header__inner`, `.brand-logo--menu`, `.full-menu-home-link`, `.full-menu-categories`, and their mobile overrides.
- Keep the shared `.site-header` rules unchanged.
- Reduce the hero spacing and add the filter/tab/result styles below.

```css
.full-menu-hero {
  padding-block: 64px;
  background: #241a17;
  color: #fff8ec;
}

.full-menu-filter-panel {
  padding-block: 24px;
  display: grid;
  gap: 14px;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.full-menu-tabs {
  min-width: 0;
}

.full-menu-tabs__scroller {
  padding: 2px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}

.full-menu-tab {
  min-height: 44px;
  padding: 10px 18px;
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: white;
  color: #6f625a;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.full-menu-tab:hover {
  border-color: var(--red);
  color: var(--red);
}

.full-menu-tab[aria-pressed="true"] {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.full-menu-tab--branch[aria-pressed="true"] {
  border-color: var(--red);
  background: var(--red);
  color: var(--paper);
}

.full-menu-content {
  padding-block: 56px 96px;
  display: grid;
  gap: 64px;
}

.full-menu-results-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.full-menu-results-heading p,
.full-menu-results-heading strong {
  color: var(--red);
  font-size: 0.875rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.full-menu-results-heading h2 {
  margin-top: 8px;
  font-size: 2rem;
}

.full-menu-empty {
  padding: 72px 24px;
  border: 1px solid var(--line);
  background: var(--paper);
  text-align: center;
  font-size: 1.125rem;
}

.full-menu-section__items {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 18px;
  list-style: none;
}

.full-menu-section__items--highballs {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.full-menu-card {
  min-width: 0;
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 4px;
  box-shadow: none;
}
```

Keep the tablet query at `max-width: 1199px`, but ensure both normal and highball grids use two columns. In the `max-width: 767px` query add:

```css
.full-menu-shell {
  width: min(100% - 40px, 1248px);
}

.full-menu-hero {
  padding-block: 48px;
}

.full-menu-filter-panel {
  padding-block: 18px;
}

.full-menu-tabs__scroller {
  margin-inline: -2px;
}

.full-menu-tab {
  min-height: 44px;
  padding-inline: 16px;
}

.full-menu-content {
  padding-block: 44px 72px;
  gap: 48px;
}

.full-menu-results-heading {
  align-items: start;
  flex-direction: column;
  gap: 12px;
}

.full-menu-section__items,
.full-menu-section__items--highballs {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 4: Run the CSS contracts and full tests**

Run:

```powershell
node --test tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
npm.cmd test
```

Expected: all focused tests and all 40+ project tests PASS.

- [ ] **Step 5: Commit the approved visual system**

```powershell
git add app/globals.css tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
git commit -m "style: match sticky menu explorer design"
```

---

### Task 4: Verify routing, accessibility, responsive interaction, and production build

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: `/menu`, `/menu/signature-lamb-leg`, shared `SiteHeader`, branch/category buttons.
- Produces: evidence that tests, lint, build, and real browser behavior pass.

- [ ] **Step 1: Run complete automated verification**

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected:

- test command exits `0` with no failures;
- lint exits `0` with no errors;
- Next.js build exits `0` and statically generates `/menu` plus all five `/menu/[category]` pages.

- [ ] **Step 2: Start a local production-equivalent dev server**

```powershell
npm.cmd run dev -- --port 3108
```

Expected: Next.js reports ready at `http://localhost:3108`.

- [ ] **Step 3: Verify desktop behavior in the browser**

At `1440 × 1000`, open `http://localhost:3108/menu` and verify:

- the header DOM is `.site-header`, matches the home page, and remains at `top: 0` after scrolling;
- `전체메뉴`, `모란본점`, and `판교점` are rounded buttons on one row;
- `전체 분류` and all five category buttons are rounded;
- default result count is 44;
- selecting `중국요리·탕` changes the visible count to 16 without URL navigation;
- selecting `모란본점` keeps the same 16 items and updates the branch label;
- cards render in four equal columns;
- the browser console has no errors.

- [ ] **Step 4: Verify mobile behavior in the browser**

At `390 × 844`, reload `/menu` and verify:

- the home mobile header shows the existing logo and hamburger menu;
- opening and closing the hamburger works;
- branch and category tab rows scroll horizontally;
- each tab is at least 44px tall;
- cards render in one column;
- `document.documentElement.scrollWidth <= innerWidth`;
- category selection updates in place and the console remains error-free.

- [ ] **Step 5: Verify legacy category entry**

Open `http://localhost:3108/menu/drinks` and verify:

- the same menu explorer and shared header render;
- `주류·하이볼` starts selected;
- regular drinks appear before the highball subsection;
- clicking other category tabs updates in place without changing the URL.

- [ ] **Step 6: Stop the local server and inspect final state**

Stop only the process listening on port `3108`, remove only its temporary logs, then run:

```powershell
git status --short
git log --oneline --max-count=5
```

Expected: only pre-existing user-owned changes remain; the feature commits are present on the feature branch.

- [ ] **Step 7: Finish the feature branch**

Invoke `superpowers:finishing-a-development-branch`, rerun `npm.cmd test`, and offer the required merge/PR/keep/discard choices. Do not deploy unless the user explicitly asks after integration.


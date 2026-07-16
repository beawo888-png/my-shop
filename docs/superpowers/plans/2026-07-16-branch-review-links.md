# Branch Review Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/reviews` branch-selection page that sends users to the correct Moran or Pangyo Naver Place visitor-review page.

**Architecture:** Extend the existing `LOCATIONS` source of truth with a review URL, replace the homepage’s fixed review quotes with one internal call to action, and render the two locations through a focused `ReviewLocationCard` component on a new static route. The site never fetches or stores Naver review content; only external links open in a new tab.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, CSS Grid, Node.js test runner, Pencil MCP.

## Global Constraints

- Keep `LOCATIONS` as the only source of branch names, addresses, and review URLs.
- Show Moran first and Pangyo second.
- Use Place ID `1938356292` for Moran and `1873196958` for Pangyo.
- Use `https://m.place.naver.com/restaurant/<place-id>/review/visitor` without scraping or embedding review content.
- Open internal `/reviews` links in the same tab.
- Open Naver review links in a new tab with `target="_blank"` and `rel="noreferrer"`.
- Render two columns on desktop and one column on mobile.
- Update the Pencil source before application UI code.
- Preserve unrelated dirty-worktree files and existing menu, booking, and location behavior.

---

## File Map

- Modify `초안`: homepage review CTA and desktop/mobile review-selection screens.
- Modify `lib/site-content.ts`: add `reviewUrl`, update the customer-review nav link, and remove obsolete fixed-review data.
- Modify `components/home/reviews-section.tsx`: replace fixed quotes with a `/reviews` CTA.
- Create `components/reviews/review-location-card.tsx`: render one branch and its external review link.
- Create `app/reviews/page.tsx`: metadata, shared visual shell, branch-card list, and home navigation.
- Modify `app/globals.css`: homepage CTA and responsive review page styles.
- Modify `tests/site-content.test.mjs`: exact review URLs, order, and nav contract.
- Modify `tests/page-structure.test.mjs`: homepage CTA, page structure, link safety, and responsive layout contract.

---

### Task 1: Update and verify the Pencil review experience

**Files:**
- Modify: `초안`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-16-branch-review-links-design.md`
- Produces: homepage review CTA, desktop two-card selector, and mobile one-card-per-row selector

- [ ] **Step 1: Inspect the Pencil schema and existing review nodes**

Call `mcp__pencil__get_editor_state` with `include_schema: true`, load the `Web App` guide and the existing visual style, then call `mcp__pencil__batch_get` for patterns matching `고객 리뷰`, `reviews`, `모란`, and `판교` in `C:\vibecoding\my-shop\초안`.

- [ ] **Step 2: Add the approved desktop states**

Use `mcp__pencil__batch_design` to preserve the existing brand palette and create:

```text
Homepage review section
  title: 지점별 고객 리뷰
  description: 모란본점과 판교점의 실제 네이버 플레이스 리뷰 안내
  internal CTA: 지점별 고객 리뷰 보기

/reviews desktop
  shared brand header and home link
  title: 지점별 고객 리뷰
  two equal cards: 모란본점, 판교점
  each card: area label, address, 네이버 플레이스 리뷰 보기 ↗
```

- [ ] **Step 3: Add the mobile selector state**

Create the `/reviews` mobile state with Moran first, Pangyo second, one full-width card per row, and no horizontal overflow.

- [ ] **Step 4: Verify Pencil layout**

Run `mcp__pencil__snapshot_layout` with `problemsOnly: true` for each changed frame. Expected: no clipped or overlapping nodes. Use `mcp__pencil__get_screenshot` for the completed desktop and mobile selector frames.

---

### Task 2: Add branch review data and homepage navigation

**Files:**
- Modify: `tests/site-content.test.mjs`
- Modify: `tests/page-structure.test.mjs`
- Modify: `lib/site-content.ts`
- Modify: `components/home/reviews-section.tsx`

**Interfaces:**
- Produces: `Location.reviewUrl: string`
- Preserves: `LOCATIONS`, branch order, `mapUrl`, booking data, and the homepage `reviews` section ID

- [ ] **Step 1: Write failing data and homepage tests**

Add these contracts:

```js
test("site content defines branch review links and review navigation", () => {
  const moranReview =
    "https://m.place.naver.com/restaurant/1938356292/review/visitor";
  const pangyoReview =
    "https://m.place.naver.com/restaurant/1873196958/review/visitor";

  assert.match(source, /reviewUrl: string/);
  assert.ok(source.includes(moranReview));
  assert.ok(source.includes(pangyoReview));
  assert.ok(source.indexOf(moranReview) < source.indexOf(pangyoReview));
  assert.match(
    source,
    /\{ label: "고객 리뷰", href: "\/reviews" \}/,
  );
});
```

```js
test("homepage reviews section links to the branch selector", async () => {
  const section = await read("components/home/reviews-section.tsx");
  assert.match(section, /import Link from "next\/link"/);
  assert.match(section, /href="\/reviews"/);
  assert.match(section, /지점별 고객 리뷰 보기/);
  assert.doesNotMatch(section, /REVIEWS\.map|review-card|blockquote/);
  assert.match(section, /id="reviews"/);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm.cmd test -- --test-name-pattern="branch review links|branch selector"`

Expected: FAIL because `reviewUrl` and `/reviews` links do not exist.

- [ ] **Step 3: Add exact review URLs to location data**

Extend the type and objects:

```ts
export type Location = {
  id: "moran" | "pangyo";
  areaLabel: string;
  shortName: string;
  name: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  address: string;
  transit: string;
  phoneDisplay: string;
  phoneHref: `tel:${string}`;
  mapUrl: string;
  reviewUrl: string;
};
```

Add to Moran:

```ts
reviewUrl:
  "https://m.place.naver.com/restaurant/1938356292/review/visitor",
```

Add to Pangyo:

```ts
reviewUrl:
  "https://m.place.naver.com/restaurant/1873196958/review/visitor",
```

Change the nav item to:

```ts
{ label: "고객 리뷰", href: "/reviews" },
```

Remove the obsolete `Review` type and `REVIEWS` constant after `ReviewsSection` no longer consumes them.

- [ ] **Step 4: Replace fixed homepage quotes with an internal CTA**

Implement the section body as:

```tsx
import Link from "next/link";

export function ReviewsSection() {
  return (
    <section
      className="section section--dark reviews"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="section__heading section__heading--center">
        <p className="eyebrow eyebrow--gold">GUEST REVIEWS</p>
        <h2 id="reviews-title">지점별 고객 리뷰</h2>
        <p>모란본점과 판교점을 방문한 고객들의 실제 네이버 리뷰를 확인하세요.</p>
      </div>
      <div className="reviews__action">
        <Link className="button button--primary" href="/reviews">
          지점별 고객 리뷰 보기
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm.cmd test -- --test-name-pattern="branch review links|branch selector|approved anchor IDs"`

Expected: PASS.

- [ ] **Step 6: Commit data and homepage changes**

```powershell
git add -- lib/site-content.ts components/home/reviews-section.tsx tests/site-content.test.mjs tests/page-structure.test.mjs
git commit -m "feat: link homepage to branch reviews"
```

---

### Task 3: Build the reviews branch-selection page

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Create: `components/reviews/review-location-card.tsx`
- Create: `app/reviews/page.tsx`

**Interfaces:**
- Consumes: `Location` and `LOCATIONS`
- Produces: `ReviewLocationCard({ location }: { location: Location })`

- [ ] **Step 1: Write a failing page-structure test**

Add:

```js
test("reviews page renders two safe Naver review choices", async () => {
  const [page, card] = await Promise.all([
    read("app/reviews/page.tsx"),
    read("components/reviews/review-location-card.tsx"),
  ]);

  assert.match(page, /export const metadata: Metadata/);
  assert.match(page, /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com\/reviews/);
  assert.match(page, /LOCATIONS\.map/);
  assert.match(page, /<ReviewLocationCard/);
  assert.match(page, /지점별 고객 리뷰/);
  assert.match(card, /href=\{location\.reviewUrl\}/);
  assert.match(card, /target="_blank"/);
  assert.match(card, /rel="noreferrer"/);
  assert.match(card, /\$\{location\.shortName\} 네이버 플레이스 리뷰 열기/);
  assert.match(card, /네이버 플레이스 리뷰 보기/);
});
```

- [ ] **Step 2: Run the page test and verify RED**

Run: `npm.cmd test -- --test-name-pattern="safe Naver review choices"`

Expected: FAIL because the page and card component do not exist.

- [ ] **Step 3: Create the branch card component**

```tsx
import type { Location } from "@/lib/site-content";

type ReviewLocationCardProps = {
  location: Location;
};

export function ReviewLocationCard({ location }: ReviewLocationCardProps) {
  return (
    <article className="review-location-card">
      <p className="review-location-card__eyebrow">{location.areaLabel}</p>
      <h2>{location.shortName}</h2>
      <address>{location.address}</address>
      <a
        className="button button--primary"
        href={location.reviewUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${location.shortName} 네이버 플레이스 리뷰 열기`}
      >
        네이버 플레이스 리뷰 보기 ↗
      </a>
    </article>
  );
}
```

- [ ] **Step 4: Create `/reviews` with metadata and shared branding**

Implement `app/reviews/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/home/brand-logo";
import { ReviewLocationCard } from "@/components/reviews/review-location-card";
import { LOCATIONS } from "@/lib/site-content";

const canonical =
  "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/reviews";

export const metadata: Metadata = {
  title: "지점별 고객 리뷰 | 왕징양다리양꼬치",
  description: "왕징양다리양꼬치 모란본점과 판교점의 네이버 플레이스 방문자 리뷰를 확인하세요.",
  alternates: { canonical },
  openGraph: {
    title: "지점별 고객 리뷰 | 왕징양다리양꼬치",
    description: "모란본점과 판교점의 실제 네이버 방문자 리뷰 안내",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};
```

The page body must include the existing menu-style header, one `h1`, explanatory copy, `LOCATIONS.map((location) => <ReviewLocationCard ... />)`, and a same-tab home link.

- [ ] **Step 5: Run focused tests and production type checking**

Run: `npm.cmd test -- --test-name-pattern="safe Naver review choices|branch review links"`

Expected: PASS.

Run: `npx.cmd tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit the route and card component**

```powershell
git add -- app/reviews/page.tsx components/reviews/review-location-card.tsx tests/page-structure.test.mjs
git commit -m "feat: add branch review selection page"
```

---

### Task 4: Add responsive review page styling

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `.reviews__action`, `.reviews-page`, `.reviews-page__grid`, and `.review-location-card`

- [ ] **Step 1: Write failing responsive CSS assertions**

```js
test("reviews page uses a responsive two-to-one column layout", async () => {
  const css = await read("app/globals.css");
  assert.match(
    css,
    /\.reviews-page__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.reviews-page__grid[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(css, /\.reviews__action/);
  assert.match(css, /\.review-location-card/);
});
```

- [ ] **Step 2: Run the layout test and verify RED**

Run: `npm.cmd test -- --test-name-pattern="responsive two-to-one"`

Expected: FAIL because the review page classes do not exist.

- [ ] **Step 3: Add minimal responsive styles**

Add styles following existing brand tokens:

```css
.reviews__action {
  margin-top: 32px;
  display: flex;
  justify-content: center;
}

.reviews-page {
  min-height: 100vh;
  background: var(--cream);
}

.reviews-page__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.review-location-card {
  padding: 40px;
  background: var(--paper);
  border: 1px solid var(--line);
}

@media (max-width: 767px) {
  .reviews-page__grid {
    grid-template-columns: 1fr;
  }

  .review-location-card {
    padding: 28px 24px;
  }
}
```

Complete the component-specific heading, address, button, header, hero, and spacing rules by reusing the existing menu-page visual rhythm and tokens without changing unrelated selectors.

- [ ] **Step 4: Run focused and full tests**

Run: `npm.cmd test -- --test-name-pattern="reviews|branch review|responsive two-to-one"`

Expected: PASS.

Run: `npm.cmd test`

Expected: all tests pass.

- [ ] **Step 5: Commit the responsive styling**

```powershell
git add -- app/globals.css tests/page-structure.test.mjs
git commit -m "style: add responsive review branch cards"
```

---

### Task 5: Full verification, review, integration, and deployment

**Files:**
- Verify only: all changed files

**Interfaces:**
- Confirms: routing, branch order, external URLs, accessibility, responsive layout, production build, and deployment

- [ ] **Step 1: Run fresh automated verification**

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
git diff --check
```

Expected: all tests pass; ESLint, build, and whitespace checks exit 0.

- [ ] **Step 2: Request a read-only code review**

Use `requesting-code-review` against the feature branch range. Fix every Critical or Important issue, add a failing regression test first for behavioral changes, and rerun Step 1.

- [ ] **Step 3: Verify the local browser flow**

Start the local app and verify at desktop and mobile widths:

```text
Homepage customer-review navigation opens /reviews in the same tab.
Homepage review CTA opens /reviews in the same tab.
/reviews shows Moran first and Pangyo second.
Desktop shows two cards; mobile shows one card per row with no page overflow.
Each review button has the correct reviewUrl and opens a new tab.
No browser console errors are present.
```

- [ ] **Step 4: Integrate using the approved branch-completion workflow**

Use `finishing-a-development-branch`, merge only after all checks pass, preserve unrelated main-worktree files, and rerun `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build` on merged `main`.

- [ ] **Step 5: Deploy the merged main branch to Vercel production**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npx.cmd vercel --prod --yes
```

Expected: deployment target `production`, state `READY`, and the custom domain alias attached.

- [ ] **Step 6: Verify public production pages**

Use Node with `--use-system-ca` to confirm HTTP 200 for:

```text
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/reviews
```

Confirm the production `/reviews` HTML contains both `모란본점` and `판교점` and the two exact Naver review URLs.

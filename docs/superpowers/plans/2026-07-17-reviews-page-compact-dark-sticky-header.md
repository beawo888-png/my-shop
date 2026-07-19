# Compact Dark Reviews Page With Sticky Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the complete reviews-page header fixed while making the dark reviews layout compact enough to show both branch review buttons in the first desktop viewport.

**Architecture:** Replace the reviews page's reduced header with the existing shared `SiteHeader` used by the homepage. Keep the compact dark reviews layout scoped to the reviews page and add source-level regression assertions for the shared header integration.

**Tech Stack:** Next.js, React, CSS, Node.js built-in test runner

## Global Constraints

- Reuse the homepage `SiteHeader` without changing its existing behavior.
- Render the complete logo, navigation, branch guidance, and Naver booking controls on the reviews page.
- Keep the desktop two-column and mobile one-column review-card layout.
- Extend the dark brown background through the bottom of the reviews page.

---

### Task 1: Reviews-page sticky header and compact layout

**Files:**
- Modify: `app/reviews/page.tsx`
- Modify: `tests/page-structure.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing reviews markup classes in `app/reviews/page.tsx`
- Produces: shared `SiteHeader` integration plus reviews-only CSS for `.reviews-page`, `.reviews-page__hero`, `.reviews-page__content`, and `.review-location-card`

- [ ] **Step 1: Write the failing regression test**

Add assertions to the existing reviews-page layout test:

```js
assert.match(page, /import \{ SiteHeader \} from "@\/components\/home\/site-header"/);
assert.match(page, /<SiteHeader sectionRoot="\/" \/>/);
assert.doesNotMatch(page, /reviews-page__header|brand-logo--menu/);
assert.match(css, /\.site-header\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?z-index:/);
assert.match(css, /\.reviews-page\s*\{[\s\S]*?background:\s*var\(--ink-soft\);/);
assert.match(css, /\.review-location-card\s*\{[\s\S]*?min-height:\s*2\d{2}px;/);
```

- [ ] **Step 2: Run the targeted test and verify failure**

Run: `node --test tests/page-structure.test.mjs`

Expected: FAIL because the reviews page still renders its reduced custom header instead of the shared homepage `SiteHeader`.

- [ ] **Step 3: Add minimal reviews-only CSS**

Replace the reduced reviews header in `app/reviews/page.tsx`:

```tsx
import { SiteHeader } from "@/components/home/site-header";

<SiteHeader sectionRoot="/" />
```

Remove the obsolete `Link`, `BrandLogo`, `reviews-page__header`, and `brand-logo--menu` code. Implement the compact dark layout in `app/globals.css` without changing shared homepage selectors:

```css
.reviews-page {
  min-height: 100vh;
  background: var(--ink-soft);
}

.reviews-page__hero {
  padding-block: clamp(2rem, 4vw, 3.5rem);
}

.reviews-page__content {
  padding-block: clamp(1.5rem, 3vw, 2.5rem);
}

.review-location-card {
  min-height: 260px;
  padding: clamp(1.5rem, 3vw, 2.25rem);
}
```

In the existing mobile media query, reduce the hero/content padding and retain the one-column card layout with content-safe height. The shared `SiteHeader` supplies the existing mobile menu and booking controls.

- [ ] **Step 4: Run targeted tests**

Run: `node --test tests/page-structure.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Run full verification**

Run: `npm test`

Expected: all project tests pass.

Run: `npm run lint`

Expected: lint exits successfully.

Run: `npm run build`

Expected: production build succeeds and includes `/reviews`.

- [ ] **Step 6: Visually verify the reviews page**

Open `/reviews` at 1440 × 900 and confirm both branch buttons appear in the first viewport. Scroll and confirm the logo plus `홈으로` remain together in the fixed top bar. Check a mobile viewport to confirm the logo stays within the header and cards remain readable.

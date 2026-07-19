# Home Header Logo Size Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enlarge the Wangjing logo only in the home-page header to 250px on desktop and 170px on mobile without changing header height or other pages.

**Architecture:** Add a boolean `home` prop to `SiteHeader`, use it to add a `site-header--home` modifier and home-specific responsive image sizes, and pass the prop only from `app/page.tsx`. Scope all new CSS to the modifier so menu and reviews headers retain their existing logo sizes.

**Tech Stack:** Next.js 16, React, TypeScript, CSS, Node test runner.

## Global Constraints

- Home desktop logo maximum width: `250px`.
- Home mobile logo width: `170px`.
- Keep the header height, navigation position, booking button, and sticky behavior unchanged.
- Do not change logo sizing on menu or reviews pages.

---

### Task 1: Home-only larger header logo

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/site-header.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `SiteHeaderProps`
- Produces: `SiteHeader({ sectionRoot, home })` with the `site-header--home` modifier

- [ ] **Step 1: Write the failing test**

Assert that `app/page.tsx` renders `<SiteHeader home />`, `site-header.tsx` declares `home?: boolean` and `site-header--home`, and CSS contains a desktop `250px` and mobile `170px` home-logo rule.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/page-structure.test.mjs`

Expected: FAIL because the home prop and modifier do not exist.

- [ ] **Step 3: Implement the minimal home modifier**

Add `home?: boolean` to `SiteHeaderProps`, default it to `false`, conditionally add `site-header--home`, and use `sizes="(max-width: 767px) 170px, 250px"` only for the home variant. Pass `home` from `app/page.tsx`. Add `.site-header--home .brand-logo--header { width: clamp(200px, 19vw, 250px); }` and a mobile override of `170px`.

- [ ] **Step 4: Verify focused and full checks**

Run `node --test tests/page-structure.test.mjs`, then `npm.cmd test`, then `npm.cmd run build`. All commands must exit with code 0.

- [ ] **Step 5: Verify preview**

Open `http://localhost:3001/` at 1440px and 390px and confirm the logo is larger without horizontal overflow or navigation overlap.

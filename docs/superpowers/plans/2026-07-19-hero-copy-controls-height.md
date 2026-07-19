# Hero Copy, Controls, and Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the homepage hero copy, remove only its two action buttons and summary bar, and reduce its full-width video area height by about 10%.

**Architecture:** Keep the existing `HeroSection` and full-bleed background video architecture. Lock the requested output in the existing source-level regression suite, then make the smallest component and CSS changes needed to pass.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node.js test runner

## Global Constraints

- Preserve `불향으로 완성한 양고기, 중요한 자리를 위한 왕징`.
- Preserve the header-level Naver booking control.
- Keep the hero video full-width with `object-fit: cover` and no outer whitespace.
- Use 730px desktop and 740px mobile minimum hero heights.

---

### Task 1: Lock and implement the hero content and sizing

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/hero-section.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Existing `HeroSection` markup and `.hero`, `.hero__video`, `.hero__poster` styles.
- Produces: Updated static hero markup and responsive hero sizing.

- [ ] **Step 1: Write the failing test**

Add a test that requires the new English and Korean copy, preserves the heading, rejects `hero__actions`, `trust-bar`, and `TRUST_ITEMS`, and requires `min-height: 730px` plus mobile `min-height: 740px` while retaining `object-fit: cover`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/page-structure.test.mjs`

Expected: FAIL because the old copy, hero actions, trust bar, and old heights still exist.

- [ ] **Step 3: Write minimal implementation**

In `hero-section.tsx`, replace the eyebrow and lead copy, preserve the `h1`, remove the `SITE` and `TRUST_ITEMS` import, remove `.hero__actions`, and remove `.trust-bar`. In `globals.css`, set desktop hero height to 730px, mobile height to 740px, and reduce obsolete bottom padding while keeping full-width cover styles.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/page-structure.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Review scoped diff**

Run: `git diff --check && git diff -- tests/page-structure.test.mjs components/home/hero-section.tsx app/globals.css`

Expected: no whitespace errors and only approved hero changes in the scoped diff.


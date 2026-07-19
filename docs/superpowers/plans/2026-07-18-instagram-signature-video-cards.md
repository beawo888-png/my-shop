# Instagram Signature Video Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage signature menu image cards with four Instagram video players that play inside the page.

**Architecture:** Define the four approved Instagram embed URLs in the signature section and render them as lazy-loaded iframes. Add section-specific responsive grid styles so desktop shows four columns, tablet two columns, and mobile one column without changing the full menu page.

**Tech Stack:** Next.js, React, CSS, Instagram embed player, Node.js test runner

## Global Constraints

- Use exactly the four approved Instagram posts in the supplied order.
- Playback stays inside the homepage.
- Preserve the section heading and full-menu action.
- Desktop uses four columns, tablet two, mobile one.
- Do not modify unrelated homepage sections.

---

### Task 1: Render four Instagram video players

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/signature-menu-section.tsx`

**Interfaces:**
- Consumes: four Instagram post URLs.
- Produces: four titled, lazy-loaded iframe players inside `.signature-video-grid`.

- [ ] **Step 1: Write the failing test**

Assert that the signature section contains all four `/embed/` URLs, four iframe renders, descriptive titles, lazy loading, and the `signature-video-grid` hook.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/page-structure.test.mjs`
Expected: FAIL because the section still renders static menu cards.

- [ ] **Step 3: Implement the players**

Replace the static menu-card map with a four-item Instagram embed map. Render each item in an article with a responsive iframe wrapper.

- [ ] **Step 4: Run the focused test**

Run: `node --test tests/page-structure.test.mjs`
Expected: PASS.

### Task 2: Add responsive video-card styling

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `.signature-video-grid`, `.signature-video-card`, and `.signature-video-card__frame`.
- Produces: 4/2/1 responsive columns with stable portrait media sizing.

- [ ] **Step 1: Write the failing style test**

Assert four desktop columns, two tablet columns, and one mobile column for the section-specific grid.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/page-structure.test.mjs`
Expected: FAIL because the new responsive CSS does not exist.

- [ ] **Step 3: Add minimal styles**

Add cream-compatible cards, rounded borders, a stable portrait aspect ratio, full-size borderless iframes, and 4/2/1 responsive columns.

- [ ] **Step 4: Verify all automated checks**

Run: `npm.cmd test`
Expected: all tests pass.

Run: `npm.cmd run build`
Expected: production build succeeds.

Run: `git diff --check`
Expected: no whitespace errors.

- [ ] **Step 5: Verify the preview**

Confirm the four Instagram players appear inside the homepage, retain play controls, and do not cause horizontal overflow at desktop, tablet, or mobile widths.


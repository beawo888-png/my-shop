# Reference Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the homepage footer in the exact four-column information arrangement shown in the supplied Yukjeup reference.

**Architecture:** Keep `SiteFooter` as the single server-rendered footer component, source branch details from `LOCATIONS`, and render social/navigation link lists locally. Use existing global responsive CSS conventions for four, two, and one-column layouts.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner

## Global Constraints

- Desktop order is Brand, MORAN, PANGYO, NAV.
- The bottom row places the menu disclaimer left and Instagram handle right.
- External links open in a new tab; internal navigation stays in the current tab.
- Tablet uses two columns and mobile uses one column.

---

### Task 1: Footer structure, links, and responsive styling

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/site-footer.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `LOCATIONS` and `BOOKING_LOCATIONS` from `lib/site-content.ts`
- Produces: `SiteFooter(): JSX.Element` with `.site-footer__main`, `.site-footer__socials`, `.site-footer__branch`, `.site-footer__nav`, and `.site-footer__bottom`

- [ ] **Step 1: Write the failing footer structure test**

Add assertions for the four ordered sections, all four social URLs, both phone links, three NAV destinations, disclaimer, handle, and four-column CSS.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test --test-name-pattern="reference footer" tests/page-structure.test.mjs`

Expected: FAIL because the new footer classes and copy are absent.

- [ ] **Step 3: Implement the footer component**

Replace the old logo/address/navigation grid with the four ordered blocks. Map `LOCATIONS` for MORAN and PANGYO content, use semantic links and accessible labels, and add the separate bottom row.

- [ ] **Step 4: Implement responsive CSS**

Set `.site-footer__main` to `grid-template-columns: 1.15fr 1fr 1fr .8fr`, switch to two columns below 1024px and one column below 768px, and preserve the reference spacing, gold labels, muted body copy, divider, and split bottom row.

- [ ] **Step 5: Run the focused test to verify it passes**

Run: `node --test --test-name-pattern="reference footer" tests/page-structure.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 7: Preview in browser**

Start the local development server, open the homepage, scroll to the footer, and capture desktop and mobile screenshots confirming the requested arrangement.

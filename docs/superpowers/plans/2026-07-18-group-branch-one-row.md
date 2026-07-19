# Group Branch One-Row Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Moran and Pangyo group-dining branch cards side by side on PC and tablet widths, while stacking them only on mobile.

**Architecture:** Preserve the existing two-column base grid and remove only the tablet breakpoint override that forces one column. Keep the mobile breakpoint override so narrow screens remain readable.

**Tech Stack:** Next.js, React, CSS, Node.js test runner

## Global Constraints

- PC and tablet widths use a two-column branch grid.
- Mobile widths at 767px and below use a one-column branch grid.
- Do not change branch content, images, or unrelated homepage sections.

---

### Task 1: Protect the responsive branch layout

**Files:**
- Modify: `tests/home-seo-content.test.mjs`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `.group-seo__branch-grid` responsive CSS.
- Produces: a two-column PC/tablet layout and one-column mobile layout.

- [ ] **Step 1: Write the failing test**

Add an assertion that the 1023px tablet media block does not override `.group-seo__branch-grid` to one column.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: FAIL because the tablet media query currently contains `grid-template-columns: 1fr`.

- [ ] **Step 3: Write minimal implementation**

Remove only the `.group-seo__branch-grid { grid-template-columns: 1fr; }` rule from the 1023px media query.

- [ ] **Step 4: Run verification**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: PASS.

Run: `npm.cmd test`
Expected: all tests pass.

Run: `npm.cmd run build`
Expected: production build succeeds.

- [ ] **Step 5: Verify in the browser**

At tablet preview width, confirm two branch cards share one row without horizontal overflow. At mobile width, confirm the cards stack in one column.


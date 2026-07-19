# Group Dining Reference Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home `#group` section to match the complete supplied dining-and-location reference layout and use the approved Moran and Pangyo composite images.

**Architecture:** Keep the section data-driven from `LOCATIONS` and `BOOKING_LOCATIONS`, extend the existing component with compact branch headers, recommendation cards, a shared-principles band, and a four-item feature band. Keep all text and links as semantic HTML for SEO and accessibility; use CSS Grid for desktop and a single-column mobile flow.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, `next/image`, CSS, Node test runner.

## Global Constraints

- Preserve the existing cream, paper, dark brown, gold, and red brand palette.
- Use `/images/wangjing/moran-group-dining.jpg` and `/images/wangjing/pangyo-group-dining.jpg` in the matching branch cards.
- Desktop must show two branch cards side by side; mobile must show one column without horizontal overflow.
- Preserve the existing booking and map links from `BOOKING_LOCATIONS` and `LOCATIONS`.
- Keep visible Korean copy as real HTML text, not text embedded in a screenshot.

---

### Task 1: Lock the complete reference structure with a failing test

**Files:**
- Modify: `tests/home-seo-content.test.mjs`
- Test: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: the source text of `components/home/group-dining-section.tsx` and `app/globals.css`
- Produces: regression assertions for all required reference-layout elements and responsive CSS hooks

- [ ] **Step 1: Write the failing assertions**

Add assertions for these exact section hooks and copy: `group-seo__branch-top`, `group-seo__principle-band`, `group-seo__recommendation-grid`, `group-seo__recommendation-card`, `group-seo__feature-band`, `48시간 숙성`, `400℃ 숯불`, `60분 정성 구이`, and `모든 모임을 위한 공간`. Assert the two composite image paths remain present and that CSS defines two branch columns and a mobile single column.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/home-seo-content.test.mjs`

Expected: FAIL because the principle, recommendation, and feature bands do not exist yet.

### Task 2: Implement the complete reference layout

**Files:**
- Modify: `components/home/group-dining-section.tsx`
- Modify: `app/globals.css`
- Test: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: `LOCATIONS`, `BOOKING_LOCATIONS`, and the two local composite image paths
- Produces: a semantic, responsive `GroupDiningSection` matching the supplied reference structure

- [ ] **Step 1: Add data for occasions, branch guides, recommendations, and feature summaries**

Keep the six dining occasions. Extend each branch guide with a recommendation title and paragraph. Add four feature entries with the exact values `48시간 숙성`, `400℃ 숯불`, `60분 정성 구이`, and `모든 모임을 위한 공간`.

- [ ] **Step 2: Rebuild branch card markup**

Render a `group-seo__branch-top` containing branch identity/catchline and the approved composite image. Below it render four compact definition-list rows and the existing booking/map actions. After the branch grid render the shared principle band, two recommendation cards with matching branch images, and the four-item feature band.

- [ ] **Step 3: Style the reference layout**

Use a 1248px centered cream section, six equal occasion pills on desktop, two paper branch cards, compact top images, gold row markers, red primary actions, a centered principle band, two recommendation cards, and a four-column feature band. At `max-width: 767px`, switch all grids to one column except the occasion pills, which remain two columns.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/home-seo-content.test.mjs`

Expected: all focused tests pass.

Run: `npm.cmd test`

Expected: all tests pass with zero failures.

Run: `npm.cmd run build`

Expected: production build exits with code 0.

- [ ] **Step 5: Verify the live preview**

Open `http://127.0.0.1:3001/#group`, verify two desktop columns, both composite images, all four lower summary items, and no horizontal overflow at 390px.

# Brand Story Four Promises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home story section with the approved Wangjing brand story and four promises while preserving the existing brand palette and responsive behavior.

**Architecture:** Keep the existing `#story` section and data-driven card pattern. Store the four promise texts in a local readonly array, render semantic cards from that array, and update only the navigation label and story-specific styles.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, CSS, Node test runner

## Global Constraints

- Preserve the `#story` anchor.
- Use the exact middle temperature `400°C`.
- Keep existing dark brown, cream, gold, and red brand tokens.
- Keep all text as semantic HTML, not baked into an image.
- Do not change the Restaurant structured data or other home sections.

---

### Task 1: Add the regression contract

**Files:**
- Modify: `tests/home-seo-content.test.mjs`
- Test: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: current source files as UTF-8 text
- Produces: assertions for navigation copy, story copy, four cards, and responsive CSS

- [ ] **Step 1: Write the failing test**

Add assertions for `브랜드 스토리`, `한 번의 감동을,`, all four promise titles, `초벌 180°C`, `중간 400°C`, `최종 180°C`, `48시간 숙성`, and `60분 동안`. Assert that the component maps `WANGJING_PROMISES` and CSS defines a four-column desktop grid and one-column mobile grid.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/home-seo-content.test.mjs`

Expected: FAIL because the fourth promise and approved brand-story copy are absent.

- [ ] **Step 3: Keep the failing output as the implementation contract**

Confirm the failure names the missing approved phrase rather than a syntax or file error.

### Task 2: Implement the brand story and navigation label

**Files:**
- Modify: `components/home/story-section.tsx`
- Modify: `lib/site-content.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `WANGJING_PROMISES` local readonly array
- Produces: four `.story__promise-card` articles and updated `브랜드 스토리` navigation label

- [ ] **Step 1: Replace the three standards with four promises**

Define `WANGJING_PROMISES` with the four approved titles and descriptions. Render the title, full user-approved brand-story paragraphs, four cards, and closing statement inside the existing `#story` section.

- [ ] **Step 2: Update navigation copy**

Change only the `NAV_ITEMS` label from `왕징 이야기` to `브랜드 스토리`; retain `href: "#story"`.

- [ ] **Step 3: Implement responsive styling**

Use a readable two-part desktop composition with a four-card promise grid. At `max-width: 1023px`, stack story and promises. At `max-width: 767px`, use one promise card per row and preserve comfortable body line height.

- [ ] **Step 4: Run targeted tests**

Run: `node --test tests/home-seo-content.test.mjs`

Expected: PASS.

### Task 3: Verify the complete home page

**Files:**
- Verify: `components/home/story-section.tsx`
- Verify: `lib/site-content.ts`
- Verify: `app/globals.css`

**Interfaces:**
- Consumes: completed home implementation
- Produces: verified local preview

- [ ] **Step 1: Run full automated checks**

Run `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build`.

Expected: all tests pass, lint exits zero, and Next.js generates the home route successfully.

- [ ] **Step 2: Inspect the browser at desktop width**

Open `http://127.0.0.1:3001/#story`. Confirm four promise cards, fixed header, readable story text, and no horizontal overflow.

- [ ] **Step 3: Inspect the responsive layout**

Confirm the promise cards become a single column on mobile and the full story remains readable without clipping.

# Group Dining Branch Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved Pangyo and Moran composite group-seating images to the home page dining section with accessible copy and responsive branch cards.

**Architecture:** Keep `LOCATIONS` as the source for branch addresses, parking, booking, and map links. Extend the existing branch guide map with image metadata, render each image through `next/image`, and style the card as image plus content without changing global navigation or other home sections.

**Tech Stack:** Next.js App Router, React Server Components, `next/image`, CSS, Node test runner.

## Global Constraints

- Preserve the existing cream, paper, red, gold, and ink palette.
- Use `/images/wangjing/pangyo-group-dining.jpg` and `/images/wangjing/moran-group-dining.jpg`.
- Keep desktop cards in two columns and mobile cards in one column.
- Keep real branch details, booking links, and map links data-driven from `lib/site-content.ts`.
- Provide Korean alternative text that identifies each branch and its group seating.

---

### Task 1: Branch image rendering contract

**Files:**
- Modify: `tests/home-seo-content.test.mjs`
- Modify: `components/home/group-dining-section.tsx`
- Test: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: `LOCATIONS`, `BOOKING_LOCATIONS`
- Produces: `BRANCH_DINING_GUIDES[id].image`, `imageAlt`, and `.group-seo__branch-image`

- [ ] **Step 1: Write the failing test**

```js
assert.match(group, /import Image from "next\/image"/);
for (const asset of ["moran-group-dining.jpg", "pangyo-group-dining.jpg"]) {
  assert.ok(group.includes(asset));
}
assert.match(group, /className="group-seo__branch-image"/);
assert.match(group, /alt=\{guide\.imageAlt\}/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: FAIL because the component has no branch image import or asset paths.

- [ ] **Step 3: Write minimal implementation**

```tsx
import Image from "next/image";

const BRANCH_DINING_GUIDES = {
  moran: {
    image: "/images/wangjing/moran-group-dining.jpg",
    imageAlt: "왕징양다리양꼬치 모란본점 단체석과 통양다리구이 식사 공간",
  },
  pangyo: {
    image: "/images/wangjing/pangyo-group-dining.jpg",
    imageAlt: "왕징양다리양꼬치 판교점 단체석과 통양다리구이 식사 공간",
  },
} as const;

<div className="group-seo__branch-image">
  <Image src={guide.image} alt={guide.imageAlt} fill sizes="(max-width: 767px) 100vw, 50vw" />
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: PASS.

### Task 2: Responsive image-card presentation

**Files:**
- Modify: `tests/home-seo-content.test.mjs`
- Modify: `app/globals.css`
- Test: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: `.group-seo__branch-image` markup from Task 1
- Produces: responsive 16:9 image treatment and mobile card stacking

- [ ] **Step 1: Write the failing test**

```js
assert.match(css, /\.group-seo__branch-image\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9;/);
assert.match(css, /\.group-seo__branch-image img\s*\{[^}]*object-fit:\s*cover;/);
assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.group-seo__branch-grid[\s\S]*?grid-template-columns:\s*1fr;/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: FAIL because the image wrapper styles are absent.

- [ ] **Step 3: Write minimal implementation**

```css
.group-seo__branch-image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 16px;
}

.group-seo__branch-image img {
  object-fit: cover;
}
```

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/home-seo-content.test.mjs`
Expected: PASS.

Run: `npm.cmd test`
Expected: all tests PASS.

Run: `npm.cmd run build`
Expected: production build succeeds.

- [ ] **Step 5: Inspect the home page in the local browser**

Open `http://127.0.0.1:3001/#group` and verify two desktop cards, one-column mobile stacking, readable text, visible actions, and correctly cropped images.

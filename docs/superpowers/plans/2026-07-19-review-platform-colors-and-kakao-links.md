# Review Platform Colors and Kakao Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the approved Naver, Kakao, and Google review button colors and replace both branch Kakao URLs with direct review URLs.

**Architecture:** Keep the existing `Location` data model and review card layout. Add platform modifier classes to each existing anchor, restore the three modifier CSS rules after the shared gray rule so they win the cascade, and update only the two `kakaoReviewUrl` values.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node.js built-in test runner

## Global Constraints

- Preserve the existing button size, 10px radius, hover/focus behavior, desktop three-column layout, and mobile one-column layout.
- Naver uses `#03c75a` / `#02ad4f` / `#fff`.
- Kakao uses `#fee500` / `#e4ce00` / `#191919`.
- Google uses `#4285f4` / `#2f6fd8` / `#fff`.
- Moran Kakao URL is `https://place.map.kakao.com/1387600612#review`.
- Pangyo Kakao URL is `https://place.map.kakao.com/1537703881#review`.
- Do not change Naver or Google URLs, button order, new-tab behavior, or accessible labels.

---

### Task 1: Restore platform styling and direct Kakao review links

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `tests/site-content.test.mjs`
- Modify: `components/reviews/review-location-card.tsx`
- Modify: `app/globals.css`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Consumes: `Location.reviewUrl`, `Location.kakaoReviewUrl`, and `Location.googleReviewUrl`.
- Produces: Three platform modifier class names and two direct Kakao review URL values used by the existing review card.

- [x] **Step 1: Write failing regression tests**

Add assertions that `review-location-card.tsx` contains `review-location-card__button--naver`, `--kakao`, and `--google`; that `globals.css` contains the exact approved background, border, and text colors; and that `site-content.ts` contains both direct Kakao review URLs in Moran-then-Pangyo order.

- [x] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/page-structure.test.mjs tests/site-content.test.mjs`

Expected: FAIL because the modifier classes, platform color rules, and direct Kakao URLs are absent.

- [x] **Step 3: Implement the minimal restoration**

Use these class combinations:

```tsx
className="button review-location-card__button review-location-card__button--naver"
className="button review-location-card__button review-location-card__button--kakao"
className="button review-location-card__button review-location-card__button--google"
```

Add these rules after the shared `.review-location-card__button` rule:

```css
.review-location-card__button--naver {
  background: #03c75a;
  border-color: #02ad4f;
  color: #fff;
}

.review-location-card__button--kakao {
  background: #fee500;
  border-color: #e4ce00;
  color: #191919;
}

.review-location-card__button--google {
  background: #4285f4;
  border-color: #2f6fd8;
  color: #fff;
}
```

Replace only the Kakao values:

```ts
kakaoReviewUrl: "https://place.map.kakao.com/1387600612#review"
kakaoReviewUrl: "https://place.map.kakao.com/1537703881#review"
```

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/page-structure.test.mjs tests/site-content.test.mjs`

Expected: all focused tests pass with zero failures.

- [x] **Step 5: Run full verification**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: every command exits with code 0.

- [x] **Step 6: Review the final diff**

Run: `git diff --check` and `git diff -- components/reviews/review-location-card.tsx app/globals.css lib/site-content.ts tests/page-structure.test.mjs tests/site-content.test.mjs`.

Expected: no whitespace errors and no unrelated edits introduced by this task.

# Header Hero Reference Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage header and hero presentation with the approved reference-image layout while preserving the existing logo, video, navigation, booking chooser, accessibility, and mobile behavior.

**Architecture:** Keep `SiteHeader` and `HeroSection` as the existing component boundaries. Update the Pencil source first, encode the approved visual/content contract in the existing Node test suite, then make the smallest JSX and CSS changes needed to satisfy that contract. Do not alter lower homepage sections or non-home header sizing.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript, plain CSS, Node built-in test runner, Pencil JSON source

## Global Constraints

- Reuse `/images/wangjing/wangjing-logo.jpg`, `/images/wangjing/hero-skewers.png`, and `/videos/wangjing/lamb-leg-promo.mp4`.
- Preserve the desktop booking branch chooser, outside-click close, Escape close, mobile menu, and safe external-link attributes.
- Keep the desktop navigation order: `대표 메뉴`, `브랜드 스토리`, `단체 모임`, `고객 리뷰`, `지점 안내`.
- Use the exact approved hero copy from the design specification.
- Remove the trust-information bar from the hero and from the approved Pencil page flow.
- Stack the two hero buttons only at viewport widths of 430px and below.
- Do not change homepage sections below the hero or any non-home page.
- Do not overwrite or revert unrelated existing worktree changes.
- Update `초안` before modifying application code.

---

### Task 1: Update the approved Pencil source

**Files:**
- Modify: `초안`
- Test: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: approved desktop reference at 1820×831 and the existing frame IDs `wangjing-desktop`, `wangjing-mobile`, `desktop-header`, `desktop-hero`, `mobile-header`, and `mobile-hero`
- Produces: nine-section desktop and mobile page flows whose first two children remain the header and hero frames

- [ ] **Step 1: Write the failing Pencil contract test**

Replace the current `Pencil source contains approved desktop and mobile frames` test body with this exact contract:

```js
test("Pencil source contains the approved reference header and hero flow", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const approvedNames = [
    "판교왕징 홈페이지 데스크톱",
    "판교왕징 홈페이지 모바일",
  ];
  const approvedFrames = approvedNames.map((name) =>
    pencil.children.find((child) => child.name === name),
  );

  for (const frame of approvedFrames) {
    assert.ok(frame, "승인된 홈페이지 프레임이 있어야 합니다");
    assert.equal(frame.children.length, 9);
    const childNames = frame.children.map((child) => child.name);
    assert.ok(childNames[0].includes("참고 이미지"));
    assert.ok(childNames[1].includes("불향으로 완성한 양고기"));
    assert.ok(!childNames.includes("신뢰 정보"));
    for (const section of [
      "대표 메뉴",
      "왕징 이야기",
      "단체 모임",
      "고객 리뷰",
      "예약 안내",
      "푸터 · 왕징양다리양꼬치 로고 적용",
    ]) {
      assert.ok(childNames.includes(section), `${section} 섹션이 있어야 합니다`);
    }
    assert.ok(
      childNames.some((name) => name.includes("지점 안내")),
      "지점 안내 섹션이 있어야 합니다",
    );
  }
});
```

- [ ] **Step 2: Run the Pencil test and verify it fails**

Run: `node --test tests/assets-and-sketch.test.mjs`

Expected: FAIL because each approved frame still has 10 children and includes `신뢰 정보`.

- [ ] **Step 3: Apply the approved frame changes to `초안`**

Use `apply_patch` to make these exact JSON changes while retaining every existing frame ID:

```json
{
  "desktop-header": {
    "name": "상단 내비게이션 · 참고 이미지 메뉴와 네이버 예약",
    "height": 100
  },
  "desktop-hero": {
    "y": 100,
    "name": "대표 영역 · 불향으로 완성한 양고기, 중요한 자리를 위한 왕징",
    "height": 740
  },
  "desktop-trust": "remove",
  "desktop-section-y": {
    "desktop-menu": 840,
    "desktop-story": 1740,
    "desktop-group": 2500,
    "desktop-reviews": 3260,
    "desktop-location": 3960,
    "desktop-reserve": 5000,
    "desktop-footer": 5560
  },
  "wangjing-desktop-height": 5920,
  "mobile-header": {
    "name": "상단 내비게이션 · 참고 이미지 모바일 메뉴와 지점 예약",
    "height": 72
  },
  "mobile-hero": {
    "y": 72,
    "name": "대표 영역 · 불향으로 완성한 양고기, 중요한 자리를 위한 왕징 · 모바일",
    "height": 720
  },
  "mobile-trust": "remove",
  "mobile-section-y": {
    "mobile-menu": 792,
    "mobile-story": 2242,
    "mobile-group": 3062,
    "mobile-reviews": 3962,
    "mobile-location": 5042,
    "mobile-reserve": 6602,
    "mobile-footer": 7022
  },
  "wangjing-mobile-height": 7382
}
```

The object above is the change map, not new file content: remove only the two trust frame objects, update the listed properties, and retain every unlisted property and section.

- [ ] **Step 4: Run the Pencil test and verify it passes**

Run: `node --test tests/assets-and-sketch.test.mjs`

Expected: all tests in the file PASS.

- [ ] **Step 5: Commit the Pencil contract**

```bash
git add 초안 tests/assets-and-sketch.test.mjs
git commit -m "design: align header hero sketch to reference"
```

---

### Task 2: Encode the approved hero content and layout contract

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Test: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: `SiteHeader`, `HeroSection`, `NAV_ITEMS`, `BOOKING_LOCATIONS`, and the existing global CSS class names
- Produces: regression tests for exact copy, trust-bar removal, home-only header dimensions, hero height/width, responsive button layout, and reduced-motion behavior

- [ ] **Step 1: Add the failing content test**

Append this test after `hero renders the approved autoplaying promotional video`:

```js
test("hero renders the approved reference copy without the trust bar", async () => {
  const hero = await read("components/home/hero-section.tsx");

  for (const copy of [
    "PANGYO · CHINESE LAMB DINING",
    "불향으로 완성한 양고기,",
    "중요한 자리를 위한 왕징",
    "판교역 가까이에서 만나는 품격 있는 중국 양고기 요리.",
    "회식부터 가족 모임까지 편안하게 준비해 드립니다.",
    "네이버 예약",
    "단체 모임 안내",
  ]) {
    assert.ok(hero.includes(copy), `hero should include ${copy}`);
  }

  assert.doesNotMatch(hero, /TRUST_ITEMS|trust-bar|trust-item/);
});
```

- [ ] **Step 2: Add the failing visual-contract test**

Append this test after the new content test:

```js
test("home header and hero match the approved reference proportions", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.site-header--home\s*\{[^}]*min-height:\s*100px;/,
  );
  assert.match(
    css,
    /\.site-header--home \.header-booking__trigger\s*\{[^}]*min-height:\s*68px;/,
  );
  assert.match(
    css,
    /\.hero\s*\{[^}]*min-height:\s*max\(680px,\s*calc\(100svh - 100px\)\);/,
  );
  assert.match(
    css,
    /\.hero__content\s*\{[^}]*width:\s*min\(1516px,\s*83\.333vw\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 430px\)[\s\S]*?\.hero__actions \.button\s*\{[^}]*flex:\s*1 1 100%;/,
  );
});
```

- [ ] **Step 3: Run the focused tests and verify they fail for the intended reasons**

Run: `node --test tests/page-structure.test.mjs`

Expected: the content test fails on `TRUST_ITEMS`/`trust-bar`; the visual test fails because the approved 100px, 68px, viewport-height, 1516px, and 430px rules do not yet exist.

- [ ] **Step 4: Commit the failing contract tests**

```bash
git add tests/page-structure.test.mjs
git commit -m "test: define reference header hero contract"
```

---

### Task 3: Implement the approved header and hero

**Files:**
- Modify: `components/home/hero-section.tsx`
- Modify: `app/globals.css`
- Verify unchanged: `components/home/site-header.tsx`
- Verify unchanged: `lib/site-content.ts`
- Test: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: `SITE.bookingUrl`, `NAV_ITEMS`, `BOOKING_LOCATIONS`, `BrandLogo`, the existing poster and MP4 assets
- Produces: `HeroSection(): JSX.Element` without trust items and a home-only reference-style header/hero CSS contract

- [ ] **Step 1: Remove the trust bar from `HeroSection`**

Change the import and delete only the trust-bar JSX:

```tsx
import Image from "next/image";
import { SITE } from "@/lib/site-content";
```

The end of the component must be:

```tsx
        <div className="hero__actions">
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
          <a className="button button--outline" href="#group">
            단체 모임 안내
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Apply the desktop reference proportions**

Add or replace these rules in `app/globals.css`, leaving the base `.site-header` rule unchanged so non-home pages retain their existing header:

```css
.site-header--home {
  min-height: 100px;
}

.site-header--home .desktop-nav a {
  font-size: 1.05rem;
}

.site-header--home .header-booking__trigger {
  min-height: 68px;
  padding-inline: 2rem;
  font-size: 1.15rem;
}

.hero {
  position: relative;
  min-height: max(680px, calc(100svh - 100px));
  display: flex;
  align-items: center;
  color: var(--paper);
  overflow: hidden;
  isolation: isolate;
}

.hero__overlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(16, 11, 10, 0.94) 0%, rgba(23, 17, 15, 0.72) 50%, rgba(23, 17, 15, 0.18) 100%),
    linear-gradient(0deg, rgba(16, 11, 10, 0.5), transparent 42%);
}

.hero__content {
  width: min(1516px, 83.333vw);
  margin: 0 auto;
  padding: clamp(3rem, 8vh, 6rem) 0;
}

.hero h1 {
  max-width: 1000px;
  margin: 1.4rem 0 1.5rem;
  font-family: var(--font-serif);
  font-size: clamp(2.75rem, 5.3vw, 4.9rem);
  font-weight: 800;
  line-height: 1.17;
  letter-spacing: -0.045em;
}
```

Remove the now-unused `.trust-bar`, `.trust-item`, and `.trust-item:last-child` blocks from the base and responsive sections.

- [ ] **Step 3: Apply the mobile reference behavior**

Inside `@media (max-width: 767px)`, replace only the hero-specific rules with:

```css
  .site-header--home {
    min-height: 72px;
  }

  .hero {
    min-height: max(720px, calc(100svh - 72px));
    align-items: flex-start;
  }

  .hero__poster,
  .hero__video {
    object-position: 58% center;
  }

  .hero__overlay {
    background: linear-gradient(0deg, rgba(16, 11, 10, 0.96) 0%, rgba(23, 17, 15, 0.72) 64%, rgba(23, 17, 15, 0.35) 100%);
  }

  .hero__content {
    width: calc(100% - 40px);
    padding: 5rem 0 6rem;
  }

  .hero h1 {
    font-size: clamp(2.35rem, 11vw, 3.2rem);
  }

  .hero h1 br,
  .hero__lead br {
    display: none;
  }

  .hero__actions .button {
    flex: 0 0 auto;
  }
```

Add a new breakpoint after the 767px block:

```css
@media (max-width: 430px) {
  .hero__actions .button {
    flex: 1 1 100%;
  }
}
```

- [ ] **Step 4: Run the focused tests and make them pass**

Run: `node --test tests/page-structure.test.mjs tests/assets-and-sketch.test.mjs`

Expected: all tests PASS, including the existing video, reduced-motion, booking chooser, mobile menu, and logo-isolation tests.

- [ ] **Step 5: Run lint for the edited application files**

Run: `npx eslint components/home/hero-section.tsx app/globals.css`

Expected: no TypeScript/React lint errors. ESLint may report that CSS is ignored; that notice is acceptable if the command exits successfully.

- [ ] **Step 6: Commit the implementation**

```bash
git add components/home/hero-section.tsx app/globals.css
git commit -m "feat: match homepage header hero reference"
```

---

### Task 4: Full regression and visual verification

**Files:**
- Verify: `app/page.tsx`
- Verify: `components/home/site-header.tsx`
- Verify: `components/home/hero-section.tsx`
- Verify: `app/globals.css`
- Verify: `초안`

**Interfaces:**
- Consumes: the completed homepage and all existing Node test contracts
- Produces: evidence that desktop/mobile visuals and the full project remain healthy

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`

Expected: every test passes with zero failures.

- [ ] **Step 2: Run the full linter**

Run: `npm run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Create a production build**

Run: `npm run build`

Expected: Next.js completes the production build and reports the `/`, `/menu`, `/menu/[category]`, and `/reviews` routes without errors.

- [ ] **Step 4: Start the local site for visual QA**

Run: `npm run dev`

Expected: the server reports a local URL and the homepage responds successfully.

- [ ] **Step 5: Verify the 1820×831 desktop viewport**

Open the homepage at 1820×831 and confirm all of the following:

- 100px dark header with the logo at left, five centered links, and 68px red booking button at right.
- Hero fills the remaining viewport height without showing a trust bar.
- Video/poster fills the hero, with the lamb footage visible on the right.
- Eyebrow, two-line title, two-line lead, and two buttons match the reference order and alignment.
- Booking button opens both branch choices and closes on outside click and Escape.

- [ ] **Step 6: Verify the 390×844 mobile viewport**

Open the homepage at 390×844 and confirm all of the following:

- Logo and hamburger fit without horizontal overflow.
- Mobile navigation exposes all five links and both branch booking links.
- Hero copy remains readable over the video/poster.
- The two hero buttons stack and remain at least 48px tall.
- No trust bar overlays the hero or pushes content off-screen.

- [ ] **Step 7: Verify reduced motion and non-home regression**

Enable reduced motion and confirm the poster remains visible while the hero video is hidden. Open `/reviews` and `/menu` and confirm their shared headers retain the original 92px base sizing rather than the home-only 100px sizing.

- [ ] **Step 8: Record any visual-only correction in the existing CSS and rerun verification**

If alignment differs from the supplied reference, change only the numeric values in the home-only header, hero overlay, hero content, or responsive rules documented in Task 3. Then rerun `npm test`, `npm run lint`, and `npm run build`; all must return exit code 0 before completion.

- [ ] **Step 9: Commit any verified visual correction**

```bash
git add app/globals.css
git commit -m "fix: refine header hero reference alignment"
```

Skip this commit when Step 8 produces no changes.

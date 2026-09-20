# Vertical Language Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage language options a single vertical list on PC, tablet, and mobile while preserving the existing four locales and accessible behavior.

**Architecture:** Keep the existing `LanguageSelector`, `LocaleLink`, locale registry, and mobile header markup unchanged because they already own the correct navigation and accessibility behavior. Express the approved visual change in CSS, and update the checked-in Pencil source so the design artifact and implementation describe the same four-row mobile menu.

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS, Node test runner, Pencil JSON source

## Global Constraints

- Keep exactly four languages in this order: `한국어`, `English`, `简体中文`, `日本語`.
- Do not add Vietnamese.
- Preserve `/`, `/en`, `/zh`, `/ja`, approved homepage hashes, modified clicks, outside click, `Escape`, and focus restoration.
- Do not change translated homepage copy, menu/review localization boundaries, business facts, booking, map, or phone links.
- PC and tablet use a text-style trigger with a vertical dropdown; mobile uses one full-width language per row inside the hamburger menu.
- Keep the current-language state accessible with gold text on the dark brand background.
- Reuse the existing Vercel project `my-shop-39ab`; do not create a project or trigger a manual deployment.

---

### Task 1: Specify the Vertical Layout in Tests

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: existing CSS class names `.language-selector__trigger`, `.language-selector__menu`, and `.mobile-nav__languages`.
- Produces: failing source-level contracts for a borderless desktop trigger, one-column dropdown, and four-row mobile language list.

- [ ] **Step 1: Replace the compact-size CSS test with the approved layout contract**

Add this test to `tests/page-structure.test.mjs` in place of `desktop language selector uses the approved compact size`:

```js
test("desktop and mobile language menus use one vertical list", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.language-selector__trigger\s*\{[\s\S]*?min-height:\s*48px;[\s\S]*?padding:\s*0 0\.25rem;[\s\S]*?border:\s*0;/,
  );
  assert.match(
    css,
    /\.language-selector__menu\s*\{[\s\S]*?top:\s*100%;[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?padding:\s*0\.5rem 0;/,
  );
  assert.doesNotMatch(css, /\.language-selector__menu a \+ a\s*\{/);
  assert.match(
    css,
    /\.mobile-nav__languages > div\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?gap:\s*0;/,
  );
  assert.match(
    css,
    /\.mobile-nav__languages a\s*\{[\s\S]*?min-height:\s*48px;[\s\S]*?justify-content:\s*flex-start;[\s\S]*?border-left:\s*3px solid transparent;/,
  );
});
```

- [ ] **Step 2: Change the Pencil mobile selector assertion to four vertical items**

Replace the two-row assertions in `tests/assets-and-sketch.test.mjs` with:

```js
  assert.equal(menu.layout, "vertical");
  assert.equal(menu.children.length, 4);
  assert.deepEqual(
    menu.children.map((item) => item.children[0].content),
    ["한국어", "English", "简体中文", "日本語"],
  );
  for (const item of menu.children) {
    assert.equal(item.layout, "horizontal");
    assert.equal(item.width, "fill_container");
    assert.equal(item.height, 52);
  }
  assert.equal(menu.children[0].fill, "#17110F");
  assert.equal(menu.children[0].children[0].fill, "#C5A15A");
```

- [ ] **Step 3: Run the targeted tests and verify RED**

Run: `node --test tests/page-structure.test.mjs tests/assets-and-sketch.test.mjs`

Expected: FAIL because the desktop trigger still uses `padding: 0 1.25rem` and a border, the mobile CSS still uses a wrapping two-column flex layout, and the Pencil mobile frame still contains two horizontal rows.

- [ ] **Step 4: Commit the failing specifications**

```bash
git add tests/page-structure.test.mjs tests/assets-and-sketch.test.mjs
git commit -m "test: specify vertical language menus"
```

---

### Task 2: Implement the Unified Vertical Menu

**Files:**
- Modify: `app/globals.css`
- Modify: `초안`
- Test: `tests/page-structure.test.mjs`
- Test: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: unchanged `LanguageSelector` and `LocaleLink` markup from `components/home/language-selector.tsx`, plus unchanged mobile language markup from `components/home/site-header.tsx`.
- Produces: responsive one-column styling and a matching four-item Pencil mobile frame.

- [ ] **Step 1: Restyle the PC and tablet trigger and dropdown**

Update the relevant selectors in `app/globals.css` to this behavior:

```css
.language-selector__trigger {
  min-height: 48px;
  padding: 0 0.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: transparent;
  color: var(--cream);
  border: 0;
  border-radius: 0;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: color 180ms ease;
}

.language-selector__trigger:hover,
.language-selector__trigger:focus-visible {
  color: var(--gold);
}

.language-selector__menu {
  position: absolute;
  z-index: 70;
  top: 100%;
  right: 0;
  min-width: 170px;
  padding: 0.5rem 0;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--paper);
  color: var(--text);
  border: 0;
  box-shadow: 0 16px 32px rgba(16, 11, 10, 0.28);
}

.language-selector__menu a {
  min-height: 52px;
  padding: 0 1.25rem;
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 700;
}
```

Remove the `.language-selector__menu a + a` border rule. Keep the existing hidden, hover/focus, expanded-chevron, and current-language declarations; the current language must retain `background: var(--ink)` and `color: var(--gold)`.

- [ ] **Step 2: Make the mobile language group a one-column list**

Replace the mobile language grid declarations in `app/globals.css` with:

```css
.mobile-nav__languages > div {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.mobile-nav__languages a {
  min-height: 48px;
  justify-content: flex-start;
  padding-inline: 1rem;
  border: 0;
  border-left: 3px solid transparent;
  border-bottom: 1px solid rgba(255, 248, 236, 0.1);
}

.mobile-nav__languages a:hover,
.mobile-nav__languages a:focus-visible,
.mobile-nav__languages a[aria-current="page"] {
  background: var(--ink);
  color: var(--gold);
  border-left-color: var(--gold);
}
```

- [ ] **Step 3: Update the Pencil mobile menu to four direct children**

In the `language-selector-mobile-open` frame in `초안`, set `language-mobile-open-menu` to `height: 220`, `gap: 0`, and `padding: 6`. Replace the two row wrappers with four direct `frame` children in this exact order:

```json
[
  { "id": "language-mobile-open-korean-item", "content": "한국어", "fill": "#C5A15A" },
  { "id": "language-mobile-open-english-item", "content": "English", "fill": "#FFF8EC" },
  { "id": "language-mobile-open-chinese-item", "content": "简体中文", "fill": "#FFF8EC" },
  { "id": "language-mobile-open-japanese-item", "content": "日本語", "fill": "#FFF8EC" }
]
```

Each direct item is a horizontal `frame` with `width: "fill_container"`, `height: 52`, and `padding: 12`; each contains its existing text node. Preserve the two Naver booking labels and their order.

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run: `node --test tests/page-structure.test.mjs tests/assets-and-sketch.test.mjs`

Expected: PASS with no failed assertions.

- [ ] **Step 5: Run the full local verification suite**

Run: `npm test`

Expected: 216 tests pass, with the two updated layout contracts included and zero failures.

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

Run: `npm run build`

Expected: production build succeeds and statically generates `/`, `/en`, `/zh`, and `/ja`.

- [ ] **Step 6: Commit the implementation**

```bash
git add app/globals.css 초안
git commit -m "style: unify vertical language menus"
```

---

### Task 3: Browser QA, Release, and Preview

**Files:**
- Verify only: working tree and production deployment

**Interfaces:**
- Consumes: the tested CSS, unchanged locale navigation behavior, GitHub `main`, and the linked Vercel project.
- Produces: browser evidence at desktop/tablet/mobile sizes, a pushed `main`, a READY automatic deployment, and a visible production preview.

- [ ] **Step 1: Run local browser QA**

At 1440px and 910px, open the language trigger and confirm the panel is directly below it with four vertically stacked links in the approved order. At 390px and 320px, open the hamburger and confirm four full-width language rows, both booking links, vertical scrolling, and no horizontal overflow.

Verify `Escape` closes the desktop dropdown and restores focus, outside click closes it, and switching from `#location` preserves `#location` on `/en`, `/zh`, and `/ja`.

- [ ] **Step 2: Confirm repository state and push main**

Run: `git diff --check && git status --short --branch`

Expected: no whitespace errors; `main` is ahead only by the planned commits and the working tree is clean.

Run: `git push origin main`

Expected: the new commits are accepted by GitHub `main`. If the remote advanced, fetch and integrate the remote commit without force-pushing, rerun verification, then push again.

- [ ] **Step 3: Verify existing Vercel automatic deployment**

Run: `vercel ls my-shop-39ab --format json --limit 5 --yes`

Expected: a production deployment for the pushed Git commit in existing project `my-shop-39ab` reaches `READY`.

Run: `vercel inspect my-shop-39ab-git-main-cindy-kim.vercel.app --wait --timeout 60s --format json`

Expected: `readyState` is `READY`, and aliases include `my-shop-39ab.vercel.app`, `xn--vr0bn4e2wh79mca68ih9mf4j.com`, and `www.xn--vr0bn4e2wh79mca68ih9mf4j.com`.

- [ ] **Step 4: Smoke-test production and open the preview**

For all three production hosts, confirm `/`, `/en`, `/zh`, and `/ja` return 200 with localized content and `/fr` returns 404. Open `https://왕징양다리양꼬치.com/` visibly in the in-app browser and leave the page at the top with the language menu ready for inspection.

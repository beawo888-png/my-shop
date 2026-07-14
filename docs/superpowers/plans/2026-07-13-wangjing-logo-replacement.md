# Wangjing Logo Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every header and footer wordmark with the supplied 왕징양다리양꼬치 logo while preserving the existing dark backgrounds and responsive navigation.

**Architecture:** Store the supplied JPG as a public asset and render it through one shared `BrandLogo` component backed by Next.js 16 `Image`. Header and footer choose their own responsive sizes, while a shared screen blend removes the black rectangle visually without redrawing the Korean artwork. Tests lock the asset, Pencil annotations, component usage, copyright copy, and CSS contract.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, global CSS, Node.js test runner, Pencil JSON source, Vercel CLI 55.0.0.

## Global Constraints

- Use the supplied source file exactly: `D:\왕징\왕징양다리양꼬치 세로 로고.jpg` (1339×451).
- Preserve the existing header color as solid `#17110f` via `var(--ink)` so the opaque JPG cannot flatten a semi-transparent backdrop; keep the footer background `#100b0a` unchanged.
- Replace the header and footer visual wordmarks only; keep body copy that mentions 판교 or 왕징.
- Set the copyright to `© 2026 왕징양다리양꼬치. All rights reserved.`.
- Update `초안` before application code because it is the project’s Pencil source of truth.
- Use Next.js 16 `preload`, not the deprecated `priority` image prop.
- Work on `main`; preserve unrelated untracked local files.
- Push only to the existing GitHub repository and let its existing Vercel integration deploy. Never run `vercel deploy`, `vercel --prod`, `vercel link`, or create a Vercel project.

## File Map

- Create `public/images/wangjing/wangjing-logo.jpg`: exact web copy of the user-provided logo.
- Create `components/home/brand-logo.tsx`: shared accessible Next.js image renderer.
- Modify `초안`: annotate desktop/mobile header and footer frames with the approved logo direction.
- Modify `components/home/site-header.tsx`: replace the old `SITE.hanja`/`SITE.name` wordmark.
- Modify `components/home/site-footer.tsx`: replace the old footer wordmark and update copyright.
- Modify `app/globals.css`: remove obsolete text-mark styles and size/blend the shared logo responsively.
- Modify `tests/assets-and-sketch.test.mjs`: lock the approved asset and Pencil annotations.
- Modify `tests/page-structure.test.mjs`: lock shared component usage, copy, accessibility, and styling.

---

### Task 1: Approved Asset and Pencil Source

**Files:**
- Create: `public/images/wangjing/wangjing-logo.jpg`
- Modify: `초안`
- Test: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: user source image `D:\왕징\왕징양다리양꼬치 세로 로고.jpg`.
- Produces: `/images/wangjing/wangjing-logo.jpg` and Pencil frame names consumed by Task 2 and visual QA.

- [ ] **Step 1: Write the failing asset and sketch tests**

Add `"wangjing-logo.jpg"` to `assetNames`. Replace the expected inner frame names so the complete expectation is:

```js
assert.deepEqual(
  frame.children.map((child) => child.name),
  [
    "상단 내비게이션 · 왕징양다리양꼬치 로고 적용",
    "대표 영역",
    "신뢰 정보",
    "대표 메뉴",
    "왕징 이야기",
    "단체 모임",
    "고객 리뷰",
    "지점 안내",
    "예약 안내",
    "푸터 · 왕징양다리양꼬치 로고 적용",
  ],
);
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: FAIL because `wangjing-logo.jpg` does not exist and the current Pencil names are still `상단 내비게이션` and `푸터`.

- [ ] **Step 3: Copy the approved asset and update Pencil first**

Copy the source without recompression:

```powershell
Copy-Item -LiteralPath 'D:\왕징\왕징양다리양꼬치 세로 로고.jpg' -Destination 'C:\vibecoding\my-shop\public\images\wangjing\wangjing-logo.jpg'
```

In both desktop and mobile children arrays in `초안`, make these exact substitutions:

```json
{ "type": "frame", "id": "desktop-header", "x": 0, "y": 0, "name": "상단 내비게이션 · 왕징양다리양꼬치 로고 적용", "width": 1440, "height": 92, "fill": "#17110F", "layout": "none" }
```

```json
{ "type": "frame", "id": "desktop-footer", "x": 0, "y": 5326, "name": "푸터 · 왕징양다리양꼬치 로고 적용", "width": 1440, "height": 360, "fill": "#100B0A", "layout": "none" }
```

```json
{ "type": "frame", "id": "mobile-header", "x": 0, "y": 0, "name": "상단 내비게이션 · 왕징양다리양꼬치 로고 적용", "width": 390, "height": 72, "fill": "#17110F", "layout": "none" }
```

```json
{ "type": "frame", "id": "mobile-footer", "x": 0, "y": 6470, "name": "푸터 · 왕징양다리양꼬치 로고 적용", "width": 390, "height": 360, "fill": "#100B0A", "layout": "none" }
```

- [ ] **Step 4: Run the focused test and verify success**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit the asset and Pencil contract**

```powershell
git add -- tests/assets-and-sketch.test.mjs public/images/wangjing/wangjing-logo.jpg 초안
git commit -m "test: lock approved Wangjing logo asset"
```

---

### Task 2: Shared Logo in Header and Footer

**Files:**
- Create: `components/home/brand-logo.tsx`
- Modify: `components/home/site-header.tsx`
- Modify: `components/home/site-footer.tsx`
- Modify: `app/globals.css`
- Test: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: `/images/wangjing/wangjing-logo.jpg` from Task 1.
- Produces: `BrandLogo({ className, sizes, preload? })` for the header and footer.

- [ ] **Step 1: Write the failing brand-rendering test**

Append this exact test to `tests/page-structure.test.mjs`:

```js
test("header and footer use the approved Wangjing logo", async () => {
  const [brandLogo, header, footer, css] = await Promise.all([
    read("components/home/brand-logo.tsx"),
    read("components/home/site-header.tsx"),
    read("components/home/site-footer.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(brandLogo, /from "next\/image"/);
  assert.match(brandLogo, /src="\/images\/wangjing\/wangjing-logo\.jpg"/);
  assert.match(brandLogo, /width=\{1339\}/);
  assert.match(brandLogo, /height=\{451\}/);
  assert.match(brandLogo, /alt="왕징양다리양꼬치"/);
  assert.match(header, /BrandLogo/);
  assert.match(header, /brand-logo--header/);
  assert.match(header, /aria-label="왕징양다리양꼬치 처음으로"/);
  assert.doesNotMatch(header, /SITE\.(?:hanja|name)/);
  assert.match(footer, /BrandLogo/);
  assert.match(footer, /brand-logo--footer/);
  assert.doesNotMatch(footer, /SITE\.(?:hanja|name)/);
  assert.match(footer, /© 2026 왕징양다리양꼬치\. All rights reserved\./);
  assert.match(css, /\.brand-logo\s*\{[\s\S]*?mix-blend-mode: screen;/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
node --test tests/page-structure.test.mjs
```

Expected: FAIL because `components/home/brand-logo.tsx` does not exist and the old `SITE.hanja`/`SITE.name` wordmarks remain.

- [ ] **Step 3: Create the shared Next.js 16 image component**

Create `components/home/brand-logo.tsx` with:

```tsx
import Image from "next/image";

type BrandLogoProps = {
  className: string;
  sizes: string;
  preload?: boolean;
};

export function BrandLogo({
  className,
  sizes,
  preload = false,
}: BrandLogoProps) {
  return (
    <Image
      className={`brand-logo ${className}`}
      src="/images/wangjing/wangjing-logo.jpg"
      width={1339}
      height={451}
      sizes={sizes}
      preload={preload}
      alt="왕징양다리양꼬치"
    />
  );
}
```

- [ ] **Step 4: Replace the header and footer wordmarks**

Add this import to `components/home/site-header.tsx`:

```tsx
import { BrandLogo } from "@/components/home/brand-logo";
```

Replace the current `wordmark` link with:

```tsx
<a
  className="wordmark"
  href="#top"
  aria-label="왕징양다리양꼬치 처음으로"
>
  <BrandLogo
    className="brand-logo--header"
    sizes="(max-width: 767px) 132px, 190px"
    preload
  />
</a>
```

In `components/home/site-footer.tsx`, replace the `SITE` import with:

```tsx
import { BrandLogo } from "@/components/home/brand-logo";
import { SITE } from "@/lib/site-content";
```

Replace the contents of `.site-footer__brand` with:

```tsx
<div className="site-footer__brand">
  <BrandLogo
    className="brand-logo--footer"
    sizes="(max-width: 767px) 220px, 260px"
  />
  <p>불향으로 기억되는 판교의 중국 양고기 다이닝</p>
</div>
```

Replace the copyright element with:

```tsx
<p className="site-footer__copyright">
  © 2026 왕징양다리양꼬치. All rights reserved.
</p>
```

- [ ] **Step 5: Add responsive logo styling and remove obsolete styles**

Set the `.site-header` background to `var(--ink)`, add `isolation: isolate;` to both `.site-header` and `.site-footer`, and replace the existing `.wordmark`, `.wordmark span`, `.site-footer__brand span`, and `.site-footer__brand strong` rules with:

```css
.wordmark {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}

.brand-logo {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
}

.brand-logo--header {
  width: clamp(150px, 15vw, 190px);
}

.brand-logo--footer {
  width: min(260px, 100%);
}
```

Add spacing to the existing footer copy rule:

```css
.site-footer__brand p {
  margin-top: 1rem;
}
```

Inside `@media (max-width: 767px)`, remove the old `.wordmark` font and `.wordmark span` size rules and add:

```css
.brand-logo--header {
  width: 132px;
}

.brand-logo--footer {
  width: min(220px, 100%);
}
```

- [ ] **Step 6: Run focused tests and lint**

Run:

```powershell
node --test tests/page-structure.test.mjs
npm run lint
```

Expected: all page-structure tests PASS; ESLint exits 0 with no errors.

- [ ] **Step 7: Commit the shared logo implementation**

```powershell
git add -- components/home/brand-logo.tsx components/home/site-header.tsx components/home/site-footer.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: replace site wordmarks with Wangjing logo"
```

---

### Task 3: Full Verification, Push, and Existing Vercel Deployment

**Files:**
- Verify only: all tracked files changed in Tasks 1–2.

**Interfaces:**
- Consumes: committed logo implementation on local `main`.
- Produces: pushed GitHub `main` and a verified Ready deployment behind all three provided domains.

- [ ] **Step 1: Run the full automated verification suite**

```powershell
npm test
npm run lint
npm run build
git diff --check
git status --short --branch
```

Expected: all tests pass with 0 failures, ESLint exits 0, Next.js production build completes successfully, `git diff --check` prints nothing, and only the pre-existing unrelated untracked local files remain.

- [ ] **Step 2: Run local visual QA**

Start the app on port 3100:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3100
```

Use the in-app browser to inspect `http://127.0.0.1:3100` at desktop (1440×900) and mobile (390×844) sizes. Confirm all of the following:

```text
Header: supplied logo is legible; no 한자 circle or 판교왕징 text remains.
Header background: unchanged dark brown; no black rectangular image edge is visible.
Desktop: logo does not collide with navigation or 네이버 예약.
Mobile: logo does not collide with the menu button and the 72px header remains intact.
Footer: same supplied logo appears; background remains #100b0a.
Footer copyright: © 2026 왕징양다리양꼬치. All rights reserved.
```

- [ ] **Step 3: Push the tested commits to GitHub main**

```powershell
git push origin main
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Expected: push succeeds and the local HEAD SHA equals the remote `refs/heads/main` SHA.

- [ ] **Step 4: Wait for the existing Vercel auto-deployment**

Do not issue a deploy command. Poll the existing production alias only:

```powershell
vercel.cmd inspect my-shop-39ab.vercel.app --wait --timeout 5m --format=json
```

Expected: JSON reports the aliased deployment as `READY`/`Ready` and identifies the already linked project. If the alias still points at the previous commit when the first check completes, repeat the same inspect command until the deployment created after the GitHub push is Ready.

- [ ] **Step 5: Verify production and custom domains**

Use the in-app browser to open each address and confirm the new header and footer logo:

```text
https://my-shop-39ab.vercel.app
https://왕징양다리양꼬치.com
https://www.왕징양다리양꼬치.com
```

Also open the immutable logo asset through the production alias:

```text
https://my-shop-39ab.vercel.app/images/wangjing/wangjing-logo.jpg
```

Expected: all three sites load successfully over HTTPS, show the new wordmarks and updated copyright, and the logo asset returns the supplied image. This verifies the GitHub-triggered deployment reached the existing project without creating a new one.

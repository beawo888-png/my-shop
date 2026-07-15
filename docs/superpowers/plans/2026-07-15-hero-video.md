# Hero Promotional Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage hero background image with the provided lamb-leg promotional MP4 while preserving the current Wangjing layout, poster fallback, controls, and text contrast.

**Architecture:** Keep the existing Next.js `HeroSection` as the only owner of hero media. Render the current optimized `Image` as a permanent poster/fallback layer and place a decorative native `video` above it; CSS controls cropping, pointer behavior, and the reduced-motion fallback without client-side JavaScript.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Node.js test runner

## Global Constraints

- Use `D:\웹&모바일 업로드용\양다리 홍보 영상.mp4` as the source asset.
- Autoplay must be muted, looping, and inline on mobile.
- Keep all hero copy, buttons, trust information, Wangjing colors, dimensions, and existing dark overlays unchanged.
- Keep `/images/wangjing/hero-skewers.png` as the poster and playback fallback.
- Users with `prefers-reduced-motion: reduce` must see only the poster image.
- Do not add an external video host, new dependency, playback controls, or client-side state.
- The approved Pencil sketch is stored in `C:\vibecoding\my-shop\초안` on the `desktop-hero` and `mobile-hero` frames.

---

## File Structure

- Create `public/videos/wangjing/lamb-leg-promo.mp4`: deployable local promotional video asset.
- Modify `components/home/hero-section.tsx`: render poster and accessible decorative video layers.
- Modify `app/globals.css`: size and crop the video, preserve interaction behavior, and apply reduced-motion fallback.
- Modify `tests/assets-and-sketch.test.mjs`: prove the copied MP4 exists and is non-empty.
- Modify `tests/page-structure.test.mjs`: prove required video attributes and responsive accessibility styles remain present.

### Task 1: Add the Video Asset and Hero Media Markup

**Files:**
- Create: `public/videos/wangjing/lamb-leg-promo.mp4`
- Modify: `components/home/hero-section.tsx:1-16`
- Modify: `tests/assets-and-sketch.test.mjs:23-31`
- Modify: `tests/page-structure.test.mjs:73-91`

**Interfaces:**
- Consumes: source file `D:\웹&모바일 업로드용\양다리 홍보 영상.mp4` and poster `/images/wangjing/hero-skewers.png`.
- Produces: public URL `/videos/wangjing/lamb-leg-promo.mp4` and DOM classes `hero__poster` and `hero__video` used by Task 2.

- [ ] **Step 1: Write failing asset and markup tests**

Append this test to `tests/assets-and-sketch.test.mjs`:

```js
test("approved Wangjing promotional video exists", async () => {
  const video = await readFile(
    new URL("../public/videos/wangjing/lamb-leg-promo.mp4", import.meta.url),
  );
  assert.ok(video.byteLength > 1_000_000, "promotional MP4 should not be empty");
});
```

Append this test to `tests/page-structure.test.mjs`:

```js
test("hero renders the approved autoplaying promotional video", async () => {
  const hero = await read("components/home/hero-section.tsx");

  assert.match(hero, /className="hero__poster"/);
  assert.match(hero, /<video[\s\S]*className="hero__video"/);
  assert.match(hero, /autoPlay/);
  assert.match(hero, /muted/);
  assert.match(hero, /loop/);
  assert.match(hero, /playsInline/);
  assert.match(hero, /preload="metadata"/);
  assert.match(hero, /poster="\/images\/wangjing\/hero-skewers\.png"/);
  assert.match(hero, /aria-hidden="true"/);
  assert.match(hero, /tabIndex=\{-1\}/);
  assert.match(
    hero,
    /<source\s+src="\/videos\/wangjing\/lamb-leg-promo\.mp4"\s+type="video\/mp4"/,
  );
  assert.doesNotMatch(hero, /<video[\s\S]*?controls/);
});
```

- [ ] **Step 2: Run the tests and verify they fail for the missing feature**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs tests/page-structure.test.mjs
```

Expected: FAIL because the MP4 path does not exist and `hero-section.tsx` does not contain `hero__poster` or `hero__video`.

- [ ] **Step 3: Copy the approved video into the public asset directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path public\videos\wangjing
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\양다리 홍보 영상.mp4' -Destination 'public\videos\wangjing\lamb-leg-promo.mp4'
```

Expected: `public/videos/wangjing/lamb-leg-promo.mp4` exists and remains approximately 5 MB.

- [ ] **Step 4: Replace the single hero image layer with poster and video layers**

In `components/home/hero-section.tsx`, replace the existing hero `Image` block with:

```tsx
      <Image
        className="hero__poster"
        src="/images/wangjing/hero-skewers.png"
        alt="숯불 위에서 구워지는 왕징양다리양꼬치 대표 메뉴"
        fill
        priority
        sizes="100vw"
      />
      <video
        className="hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/wangjing/hero-skewers.png"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source
          src="/videos/wangjing/lamb-leg-promo.mp4"
          type="video/mp4"
        />
      </video>
```

Do not modify the following `hero__overlay`, `hero__content`, actions, or trust bar markup.

- [ ] **Step 5: Run the focused tests and verify they pass**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs tests/page-structure.test.mjs
```

Expected: all tests in both files PASS.

- [ ] **Step 6: Commit Task 1**

```powershell
git add public/videos/wangjing/lamb-leg-promo.mp4 components/home/hero-section.tsx tests/assets-and-sketch.test.mjs tests/page-structure.test.mjs
git commit -m "feat: add hero promotional video"
```

### Task 2: Style Video Cropping and Reduced-Motion Fallback

**Files:**
- Modify: `app/globals.css:187-190`
- Modify: `app/globals.css:772-774`
- Modify: `app/globals.css:920-932`
- Modify: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: `hero__poster` and `hero__video` elements from Task 1.
- Produces: full-bleed, non-interactive hero video on desktop/mobile and poster-only rendering under reduced motion.

- [ ] **Step 1: Write the failing CSS contract test**

Append this test to `tests/page-structure.test.mjs`:

```js
test("hero video fills the background and respects reduced motion", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.hero__poster,\s*\.hero__video\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?object-fit:\s*cover;[\s\S]*?pointer-events:\s*none;/,
  );
  assert.match(css, /\.hero__video\s*\{[\s\S]*?z-index:\s*-2;/);
  assert.match(css, /\.hero__poster\s*\{[\s\S]*?z-index:\s*-3;/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.hero__poster,\s*\.hero__video\s*\{[\s\S]*?object-position:\s*58% center;/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hero__video\s*\{[\s\S]*?display:\s*none;/,
  );
});
```

- [ ] **Step 2: Run the CSS contract test and verify it fails**

Run:

```powershell
node --test --test-name-pattern="hero video fills" tests/page-structure.test.mjs
```

Expected: FAIL because `hero__poster` and `hero__video` styling does not yet exist.

- [ ] **Step 3: Add full-bleed hero media styles**

Replace the current `.hero__image` rule in `app/globals.css` with:

```css
.hero__poster,
.hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.hero__poster {
  z-index: -3;
  object-position: center 48%;
}

.hero__video {
  z-index: -2;
  object-position: center;
}
```

The existing `.hero__overlay` remains at `z-index: -1`, so text contrast is unchanged.

- [ ] **Step 4: Preserve mobile framing**

Replace the mobile `.hero__image` rule inside `@media (max-width: 767px)` with:

```css
  .hero__poster,
  .hero__video {
    object-position: 58% center;
  }
```

- [ ] **Step 5: Add the poster-only reduced-motion rule**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, before the universal selector, add:

```css
  .hero__video {
    display: none;
  }
```

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
node --test --test-name-pattern="hero" tests/page-structure.test.mjs
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: every test PASS, ESLint exits with code 0, and the Next.js production build generates `/` successfully.

- [ ] **Step 7: Verify the result in the local browser**

Start or reuse the development server at `http://localhost:3000`. Confirm desktop and mobile views show the looping muted video, hero text and buttons remain readable and clickable, no native video controls appear, and emulated reduced motion shows the poster instead.

- [ ] **Step 8: Commit Task 2**

```powershell
git add app/globals.css tests/page-structure.test.mjs
git commit -m "feat: style responsive hero video"
```

### Task 3: Production Deployment Verification

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: verified production build from Tasks 1 and 2.
- Produces: production deployment on the existing `my-shop-39ab` Vercel project and custom Wangjing domain.

- [ ] **Step 1: Confirm the linked Vercel project**

Run:

```powershell
Get-Content -Raw .vercel\project.json
```

Expected: `projectName` is `my-shop-39ab` and `projectId` is `prj_spgCkKDVPxdLEbz1twnbzIXsOzUQ`.

- [ ] **Step 2: Deploy with the standing production flags**

Run:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
vercel.cmd --prod --yes
```

Expected: deployment status is Ready and aliases include `https://xn--vr0bn4e2wh79mca68ih9mf4j.com`.

- [ ] **Step 3: Verify the public video and homepage**

Run:

```powershell
$base='https://xn--vr0bn4e2wh79mca68ih9mf4j.com'
$page=Invoke-WebRequest -Uri "$base/" -UseBasicParsing -TimeoutSec 30
$video=Invoke-WebRequest -Uri "$base/videos/wangjing/lamb-leg-promo.mp4" -Method Head -UseBasicParsing -TimeoutSec 30
Write-Output "PAGE=$($page.StatusCode) VIDEO=$($video.StatusCode) TYPE=$($video.Headers['Content-Type'])"
```

Expected: `PAGE=200`, `VIDEO=200`, and the video content type contains `video/mp4`.

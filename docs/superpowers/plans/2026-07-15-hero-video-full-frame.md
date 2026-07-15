# Full-Frame Hero Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the complete lamb-grilling promotional video in the homepage hero while filling unused space with a blurred Wangjing poster backdrop.

**Architecture:** Keep the current `HeroSection` markup and one MP4 playback element. Reuse the existing `hero__poster` image as a blurred cover backdrop, switch `hero__video` to centered `contain`, and turn the poster into an unblurred contained fallback for reduced-motion users.

**Tech Stack:** Next.js 16 App Router, React 19, CSS, Node.js test runner, Vercel CLI

## Global Constraints

- Keep the current `public/videos/wangjing/lamb-leg-promo.mp4` and do not add another video file.
- Keep muted autoplay, looping, mobile inline playback, the existing poster, copy, buttons, trust bar, hero dimensions, Wangjing colors, and dark overlay.
- The foreground video must use `object-fit: contain` and `object-position: center` on desktop and mobile.
- The existing poster must fill, blur, and scale only as a decorative normal-motion backdrop.
- Under `prefers-reduced-motion: reduce`, hide the video and show the poster unblurred with `object-fit: contain`.
- Do not add JavaScript state, dependencies, external video hosting, or a second playing video.
- The approved Pencil sketch is stored in `C:\vibecoding\my-shop\초안` on `desktop-hero` and `mobile-hero`.

---

## File Structure

- Modify `app/globals.css`: control backdrop blur, full-frame video fitting, mobile centering, and reduced-motion fallback.
- Modify `tests/page-structure.test.mjs`: replace the old cover-crop contract with the approved full-frame contract.

### Task 1: Change the Hero from Cover Crop to Full-Frame Video

**Files:**
- Modify: `tests/page-structure.test.mjs:180-198`
- Modify: `app/globals.css:187-205`
- Modify: `app/globals.css:787-790`
- Modify: `app/globals.css:936-944`

**Interfaces:**
- Consumes: existing `.hero__poster`, `.hero__video`, `.hero__overlay`, and `/images/wangjing/hero-skewers.png`.
- Produces: one centered, uncropped video layer over one blurred static poster layer, plus a poster-only reduced-motion fallback.

- [ ] **Step 1: Replace the old CSS contract with a failing full-frame contract**

Replace the existing `hero video fills the background and respects reduced motion` test in `tests/page-structure.test.mjs` with:

```js
test("hero shows the complete video over a blurred poster backdrop", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.hero__poster\s*\{[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*center;[\s\S]*?filter:\s*blur\(18px\);[\s\S]*?transform:\s*scale\(1\.08\);/,
  );
  assert.match(
    css,
    /\.hero__video\s*\{[\s\S]*?object-fit:\s*contain;[\s\S]*?object-position:\s*center;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.hero__poster,\s*\.hero__video\s*\{[\s\S]*?object-position:\s*center;/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hero__poster\s*\{[\s\S]*?filter:\s*none;[\s\S]*?transform:\s*none;[\s\S]*?object-fit:\s*contain;[\s\S]*?\.hero__video\s*\{[\s\S]*?display:\s*none;/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the old crop behavior**

Run:

```powershell
node --test --test-name-pattern="hero shows the complete" tests/page-structure.test.mjs
```

Expected: FAIL because the poster has no blur or scale, the video still inherits `object-fit: cover`, mobile uses `58% center`, and reduced motion does not convert the poster to `contain`.

- [ ] **Step 3: Add the blurred poster backdrop and contained video styles**

Replace the current hero media rules in `app/globals.css` with:

```css
.hero__poster,
.hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hero__poster {
  z-index: -3;
  object-fit: cover;
  object-position: center;
  filter: blur(18px);
  transform: scale(1.08);
}

.hero__video {
  z-index: -2;
  object-fit: contain;
  object-position: center;
  background: rgba(16, 11, 10, 0.18);
}
```

Keep `.hero__overlay` unchanged at `z-index: -1` so the existing text contrast remains intact.

- [ ] **Step 4: Center both media layers on mobile**

Replace the current mobile hero media rule with:

```css
  .hero__poster,
  .hero__video {
    object-position: center;
  }
```

- [ ] **Step 5: Turn the poster into the reduced-motion foreground fallback**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, place these rules before the universal animation rule:

```css
  .hero__poster {
    filter: none;
    transform: none;
    object-fit: contain;
  }

  .hero__video {
    display: none;
  }
```

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
node --test --test-name-pattern="hero shows the complete" tests/page-structure.test.mjs
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: the focused test and all 18 project tests PASS, ESLint exits with code 0, and the Next.js production build generates `/` successfully.

- [ ] **Step 7: Verify the local rendered contract**

Start or reuse `http://localhost:3000` and confirm:

```powershell
$html=(Invoke-WebRequest -Uri 'http://localhost:3000/' -UseBasicParsing -TimeoutSec 30).Content
$css=(Invoke-WebRequest -Uri 'http://localhost:3000/_next/static/css/app_globals.css' -UseBasicParsing -TimeoutSec 30).Content
```

If the generated CSS filename is hashed, obtain it from the homepage `<link rel="stylesheet">` URL instead. Confirm the video tag still has `autoPlay`, `muted`, `loop`, and `playsInline`, and the served CSS contains `object-fit:contain`, `blur(18px)`, and `scale(1.08)`.

- [ ] **Step 8: Commit the full-frame Hero change**

```powershell
git add app/globals.css tests/page-structure.test.mjs
git commit -m "fix: show full lamb video in hero"
```

### Task 2: Production Deployment Verification

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: verified full-frame Hero CSS from Task 1.
- Produces: a production deployment on existing Vercel project `my-shop-39ab` and the official Wangjing domain.

- [ ] **Step 1: Confirm the linked production project**

Run:

```powershell
Get-Content -Raw .vercel\project.json
```

Expected: `projectName` is `my-shop-39ab` and `projectId` is `prj_spgCkKDVPxdLEbz1twnbzIXsOzUQ`.

- [ ] **Step 2: Deploy using the standing production flags**

Run:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
vercel.cmd --prod --yes
```

Expected: deployment status is Ready and aliases include `https://xn--vr0bn4e2wh79mca68ih9mf4j.com`.

- [ ] **Step 3: Verify the official homepage and video asset**

Run:

```powershell
$base='https://xn--vr0bn4e2wh79mca68ih9mf4j.com'
$page=Invoke-WebRequest -Uri "$base/?verify=full-frame-video" -UseBasicParsing -TimeoutSec 30 -Headers @{'Cache-Control'='no-cache'}
$video=Invoke-WebRequest -Uri "$base/videos/wangjing/lamb-leg-promo.mp4" -Method Head -UseBasicParsing -TimeoutSec 30
Write-Output "PAGE=$($page.StatusCode) VIDEO=$($video.StatusCode) TYPE=$($video.Headers['Content-Type'])"
```

Expected: `PAGE=200`, `VIDEO=200`, and the video content type contains `video/mp4`.

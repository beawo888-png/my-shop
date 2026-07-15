# Hero Video Cover Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the immediately previous full-bleed Hero video presentation that the user preferred.

**Architecture:** Keep the existing Hero component and MP4 unchanged. Restore only the Hero media CSS and its structural test to the verified `0ece698` state, then redeploy the existing Vercel project.

**Tech Stack:** Next.js 16 App Router, React 19, CSS, Node.js test runner, Vercel CLI

## Global Constraints

- Restore the exact Hero media CSS behavior from commit `0ece698`.
- Both poster and video use `object-fit: cover`.
- Desktop poster uses `center 48%`; desktop video uses `center`.
- Mobile poster and video use `58% center`.
- Remove poster blur and scale, contained video fitting, and the translucent video background.
- Keep the MP4, poster, autoplay, muted, loop, playsInline, copy, buttons, trust bar, dimensions, overlay, and all other sections unchanged.
- Under reduced motion, hide only the video and leave the normal cover poster visible.
- Deploy to `my-shop-39ab` with `--prod --yes`.

---

## File Structure

- Modify `tests/page-structure.test.mjs`: restore the previous full-bleed CSS contract.
- Modify `app/globals.css`: restore the previous cover, focus, and reduced-motion styles.

### Task 1: Restore the Previous Full-Bleed Hero Contract

**Files:**
- Modify: `tests/page-structure.test.mjs:180-200`
- Modify: `app/globals.css:187-210`
- Modify: `app/globals.css:790-794`
- Modify: `app/globals.css:942-953`

**Interfaces:**
- Consumes: existing `.hero__poster`, `.hero__video`, and `.hero__overlay` layers.
- Produces: the exact cover-cropped Hero behavior previously deployed from commit `0ece698`.

- [ ] **Step 1: Replace the full-frame test with the previous cover contract**

Replace the current Hero CSS test with:

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

- [ ] **Step 2: Run the focused test and verify it fails against the current full-frame CSS**

Run:

```powershell
node --test --test-name-pattern="hero video fills" tests/page-structure.test.mjs
```

Expected: FAIL because the shared rule no longer contains `object-fit: cover` and mobile no longer uses `58% center`.

- [ ] **Step 3: Restore the previous Hero media CSS exactly**

Replace the current Hero media rules with:

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

This removes `filter`, `transform`, `object-fit: contain`, and the translucent video background while leaving `.hero__overlay` unchanged.

- [ ] **Step 4: Restore the previous mobile focus**

Replace the mobile Hero media rule with:

```css
  .hero__poster,
  .hero__video {
    object-position: 58% center;
  }
```

- [ ] **Step 5: Restore the previous reduced-motion rule**

Delete the reduced-motion `.hero__poster` override. Keep only:

```css
  .hero__video {
    display: none;
  }
```

- [ ] **Step 6: Run focused and full verification**

Run:

```powershell
node --test --test-name-pattern="hero video fills" tests/page-structure.test.mjs
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: the focused test and all 18 tests PASS, ESLint exits with code 0, and the production build generates `/`.

- [ ] **Step 7: Commit the restoration**

```powershell
git add app/globals.css tests/page-structure.test.mjs
git commit -m "fix: restore full-bleed hero video"
```

### Task 2: Deploy and Verify the Restoration

**Files:**
- No source changes expected.

**Interfaces:**
- Consumes: verified restored cover CSS from Task 1.
- Produces: a production deployment on the official Wangjing domain.

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

Expected: deployment status is Ready and the aliases include `https://xn--vr0bn4e2wh79mca68ih9mf4j.com`.

- [ ] **Step 3: Verify the official cover CSS and MP4**

Fetch the official homepage, its linked CSS files, and `/videos/wangjing/lamb-leg-promo.mp4`. Confirm page and video status 200, video type `video/mp4`, shared Hero `object-fit: cover`, mobile `58% center`, and absence of `blur(18px)` and `object-fit: contain` in the Hero video rule.

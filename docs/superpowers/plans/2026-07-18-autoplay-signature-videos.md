# Autoplay Signature Videos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace click-to-play Instagram embeds with four locally hosted signature videos that move immediately without interaction.

**Architecture:** Save stable MP4 copies of the four approved Wangjing posts under `public/videos/signature/`. Render native HTML video elements with muted autoplay, looping, and inline mobile playback while preserving the current responsive card grid.

**Tech Stack:** Next.js, React, HTML5 video, CSS, Node.js test runner

## Global Constraints

- Preserve the four approved videos and their order.
- Start playback without a click.
- Autoplay must be muted, looped, and inline on mobile.
- Preserve desktop 4 columns, tablet 2 columns, and mobile 1 column.
- Do not change unrelated homepage sections.

---

### Task 1: Add stable local MP4 assets

**Files:**
- Create: `public/videos/signature/signature-01.mp4`
- Create: `public/videos/signature/signature-02.mp4`
- Create: `public/videos/signature/signature-03.mp4`
- Create: `public/videos/signature/signature-04.mp4`
- Modify: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: the four approved public Instagram video sources.
- Produces: four non-empty local MP4 assets.

- [ ] **Step 1: Write the failing asset test**

Assert that all four named MP4 files exist and contain more than 1 KB.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/assets-and-sketch.test.mjs`
Expected: FAIL because the four MP4 assets do not exist.

- [ ] **Step 3: Download the approved videos**

Resolve the current HTTPS video source from each approved Instagram embed and save it to the matching local MP4 path.

- [ ] **Step 4: Run the asset test**

Run: `node --test tests/assets-and-sketch.test.mjs`
Expected: PASS.

### Task 2: Replace embeds with autoplay videos

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/signature-menu-section.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: the four local MP4 paths.
- Produces: four native video elements using `autoPlay`, `muted`, `loop`, `playsInline`, and `preload="metadata"`.

- [ ] **Step 1: Write the failing component test**

Assert local MP4 paths and native video autoplay attributes are present, and iframe embeds are absent.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/page-structure.test.mjs`
Expected: FAIL because the section still renders iframe embeds.

- [ ] **Step 3: Implement native autoplay video cards**

Replace iframe data and markup with local video paths and native video elements. Keep accessible labels and original Instagram attribution URLs.

- [ ] **Step 4: Update media styling**

Change the frame selector from iframe to video and use `object-fit: cover`. Add reduced-motion handling that pauses animation through the component's media-query-aware client behavior only if required by browser testing.

- [ ] **Step 5: Run automated verification**

Run: `npm.cmd test`
Expected: all tests pass.

Run: `npm.cmd run build`
Expected: production build succeeds.

Run: `git diff --check`
Expected: no whitespace errors.

- [ ] **Step 6: Verify autoplay in the browser**

Load the local homepage without clicking. Confirm four video elements are unpaused and their `currentTime` values increase. Confirm desktop, tablet, and mobile layouts have no horizontal overflow.


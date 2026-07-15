# Header Booking Branch Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single Pangyo-only header booking link with an accessible branch selector for Moran headquarters and Pangyo while preserving every other booking CTA.

**Architecture:** Add a typed shared booking-link array to `lib/site-content.ts`. Keep the interaction in the existing client `SiteHeader`: one desktop trigger controls a positioned link panel, while the mobile navigation renders the same data as two direct links. Use React state/effect/ref for toggle, outside-click, and Escape handling, and keep styling in the existing global stylesheet.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, Tailwind CSS v4 global CSS, Node test runner, ESLint, Vercel CLI.

## Global Constraints

- Pencil source `C:\vibecoding\my-shop\초안` has already been updated before application code.
- Moran booking URL is exactly `https://booking.naver.com/booking/6/bizes/721603`.
- Pangyo booking URL remains exactly `https://booking.naver.com/booking/6/bizes/970819`.
- Moran headquarters must appear before Pangyo.
- Existing Wangjing black, cream, gold, and red tokens remain unchanged.
- Booking option text remains at least 16px and each target remains at least 48px high.
- Hero, group dining, reservation banner, footer, and fixed mobile booking CTA keep their existing Pangyo destination.
- Existing unrelated dirty and untracked files must not be staged or changed.

---

### Task 1: Add typed branch booking data

**Files:**
- Modify: `tests/site-content.test.mjs`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Produces: `BookingLocation` and `BOOKING_LOCATIONS: BookingLocation[]`.
- Ordering contract: `BOOKING_LOCATIONS[0].id === "moran"` and `BOOKING_LOCATIONS[1].id === "pangyo"`.
- Preserves: `SITE.bookingUrl` as the current Pangyo default for all non-header CTAs.

- [ ] **Step 1: Write the failing content test**

Add this test after the existing verified-business-details test:

```js
test("site content defines Moran and Pangyo booking choices in order", () => {
  assert.match(source, /export const BOOKING_LOCATIONS/);

  const moranUrl =
    "https://booking.naver.com/booking/6/bizes/721603";
  const pangyoUrl =
    "https://booking.naver.com/booking/6/bizes/970819";

  for (const value of [
    'id: "moran"',
    'label: "모란본점 예약"',
    moranUrl,
    'id: "pangyo"',
    'label: "판교점 예약"',
    pangyoUrl,
  ]) {
    assert.ok(source.includes(value), `booking data should include ${value}`);
  }

  assert.ok(source.indexOf(moranUrl) < source.lastIndexOf(pangyoUrl));
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="Moran and Pangyo booking choices" tests/site-content.test.mjs
```

Expected: FAIL because `BOOKING_LOCATIONS` and the Moran URL do not exist.

- [ ] **Step 3: Add the minimal shared data**

Add the type beside the other content types:

```ts
export type BookingLocation = {
  id: "moran" | "pangyo";
  label: string;
  url: string;
};
```

Add the array immediately after `SITE` so other components can import it:

```ts
export const BOOKING_LOCATIONS: BookingLocation[] = [
  {
    id: "moran",
    label: "모란본점 예약",
    url: "https://booking.naver.com/booking/6/bizes/721603",
  },
  {
    id: "pangyo",
    label: "판교점 예약",
    url: SITE.bookingUrl,
  },
];
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the same focused command. Expected: PASS with one test and zero failures.

- [ ] **Step 5: Commit the data contract**

```powershell
git add -- lib/site-content.ts tests/site-content.test.mjs
git commit -m "feat: add branch booking links"
```

---

### Task 2: Implement the desktop selector and mobile branch links

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/site-header.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `BOOKING_LOCATIONS` from Task 1.
- Produces: desktop trigger `#booking-branch-menu`, `aria-expanded={bookingOpen}`, and two mapped external links.
- Behavior: toggle on trigger; close on outside pointer, Escape, or link selection; mobile menu closes when either branch link is selected.

- [ ] **Step 1: Write the failing header contract test**

Add this test after `mobile menu exposes its state and target`:

```js
test("header offers accessible Moran and Pangyo booking choices", async () => {
  const [header, css] = await Promise.all([
    read("components/home/site-header.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(header, /BOOKING_LOCATIONS/);
  assert.match(header, /const \[bookingOpen, setBookingOpen\] = useState\(false\)/);
  assert.match(header, /aria-expanded=\{bookingOpen\}/);
  assert.match(header, /aria-controls="booking-branch-menu"/);
  assert.match(header, /id="booking-branch-menu"/);
  assert.match(header, /event\.key === "Escape"/);
  assert.match(header, /document\.addEventListener\("pointerdown"/);
  assert.match(header, /BOOKING_LOCATIONS\.map/g);
  assert.match(header, /className="mobile-nav__booking"/);
  assert.match(css, /\.header-booking__menu/);
  assert.match(css, /\.mobile-nav__booking/);
  assert.match(css, /min-height:\s*48px/);
  assert.match(css, /font-size:\s*1rem/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node --test --test-name-pattern="accessible Moran and Pangyo booking choices" tests/page-structure.test.mjs
```

Expected: FAIL because the header still contains a single `SITE.bookingUrl` anchor.

- [ ] **Step 3: Add header state and close behavior**

Update imports at the top of `site-header.tsx`:

```tsx
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/home/brand-logo";
import { BOOKING_LOCATIONS, NAV_ITEMS } from "@/lib/site-content";
```

Add this state and effect immediately after `const [open, setOpen] = useState(false);`:

```tsx
const [bookingOpen, setBookingOpen] = useState(false);
const bookingMenuRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!bookingOpen) return;

  const closeOnPointerDown = (event: PointerEvent) => {
    if (!bookingMenuRef.current?.contains(event.target as Node)) {
      setBookingOpen(false);
    }
  };
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setBookingOpen(false);
    }
  };

  document.addEventListener("pointerdown", closeOnPointerDown);
  document.addEventListener("keydown", closeOnEscape);
  return () => {
    document.removeEventListener("pointerdown", closeOnPointerDown);
    document.removeEventListener("keydown", closeOnEscape);
  };
}, [bookingOpen]);
```

- [ ] **Step 4: Replace the desktop header booking anchor**

Replace the existing `.header-booking` anchor with:

```tsx
<div className="header-booking" ref={bookingMenuRef}>
  <button
    className="button button--primary header-booking__trigger"
    type="button"
    aria-haspopup="true"
    aria-expanded={bookingOpen}
    aria-controls="booking-branch-menu"
    onClick={() => setBookingOpen((value) => !value)}
  >
    네이버 예약
    <ChevronDown aria-hidden="true" />
  </button>
  <nav
    className="header-booking__menu"
    id="booking-branch-menu"
    aria-label="예약 지점 선택"
    hidden={!bookingOpen}
  >
    {BOOKING_LOCATIONS.map((booking) => (
      <a
        href={booking.url}
        key={booking.id}
        target="_blank"
        rel="noreferrer"
        onClick={() => setBookingOpen(false)}
      >
        {booking.label}
      </a>
    ))}
  </nav>
</div>
```

- [ ] **Step 5: Replace the single mobile booking link**

Replace the final `SITE.bookingUrl` link inside `#mobile-navigation` with:

```tsx
<div className="mobile-nav__booking">
  <p>네이버 예약</p>
  {BOOKING_LOCATIONS.map((booking) => (
    <a
      href={booking.url}
      key={booking.id}
      target="_blank"
      rel="noreferrer"
      onClick={() => setOpen(false)}
    >
      {booking.label}
    </a>
  ))}
</div>
```

- [ ] **Step 6: Add the desktop selector styles**

Add these rules after `.mobile-nav { display: none; }`:

```css
.header-booking {
  position: relative;
  flex: 0 0 auto;
}

.header-booking__trigger {
  gap: 0.55rem;
  cursor: pointer;
}

.header-booking__trigger svg {
  width: 18px;
  height: 18px;
  transition: transform 180ms ease;
}

.header-booking__trigger[aria-expanded="true"] svg {
  transform: rotate(180deg);
}

.header-booking__menu {
  position: absolute;
  z-index: 70;
  top: calc(100% + 10px);
  right: 0;
  min-width: 200px;
  padding: 0.35rem;
  display: grid;
  background: var(--paper);
  color: var(--text);
  border: 1px solid var(--line);
  box-shadow: 0 16px 32px rgba(16, 11, 10, 0.28);
}

.header-booking__menu[hidden] {
  display: none;
}

.header-booking__menu a {
  min-height: 52px;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 700;
}

.header-booking__menu a + a {
  border-top: 1px solid var(--line);
}

.header-booking__menu a:hover {
  background: var(--cream);
  color: var(--red);
}
```

- [ ] **Step 7: Update the mobile navigation styles**

In `@media (max-width: 1023px)`, replace `.mobile-nav a:last-child` with:

```css
.mobile-nav__booking {
  margin-top: 0.75rem;
  display: grid;
  gap: 0.5rem;
}

.mobile-nav__booking p {
  margin: 0;
  color: var(--gold);
  font-size: 1rem;
  font-weight: 800;
}

.mobile-nav__booking a {
  min-height: 48px;
  justify-content: center;
  background: var(--red);
  border-bottom: 0;
  color: var(--paper);
  font-size: 1rem;
}
```

Keep the existing `@media (max-width: 767px) .header-booking { display: none; }` rule so the desktop selector does not crowd the phone header.

- [ ] **Step 8: Run the focused test and verify GREEN**

Run the same focused command. Expected: PASS with one test and zero failures.

- [ ] **Step 9: Run the full regression suite**

Run:

```powershell
npm.cmd test
npm.cmd run lint
```

Expected: all Node tests pass and ESLint exits with code 0.

- [ ] **Step 10: Commit the header feature**

```powershell
git add -- components/home/site-header.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: add branch booking selector"
```

---

### Task 3: Verify production and deploy

**Files:**
- Verify only: `.vercel/project.json`
- Do not stage: existing unrelated modified or untracked files.

**Interfaces:**
- Consumes: completed Tasks 1 and 2.
- Produces: a READY Vercel production deployment aliased to `https://xn--vr0bn4e2wh79mca68ih9mf4j.com`.

- [ ] **Step 1: Run a clean production build**

```powershell
npm.cmd run build
```

Expected: Next.js exits 0 and statically generates `/`. If Windows denies `.next/trace-build`, rerun the same command with the required workspace permission approval.

- [ ] **Step 2: Verify the exact committed diff and project link**

```powershell
git log -5 --oneline
git status --short
Get-Content .vercel\project.json
```

Expected: the two feature commits are on `main`; only pre-existing unrelated files remain dirty; project name is `my-shop-39ab`.

- [ ] **Step 3: Deploy with the standing production options**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
vercel.cmd --prod --yes
```

Expected: JSON reports `readyState: READY`, `target: production`, and an HTTPS deployment URL.

- [ ] **Step 4: Inspect aliases**

```powershell
$env:NODE_OPTIONS='--use-system-ca'
vercel.cmd inspect my-shop-39ab.vercel.app
```

Expected aliases include both `https://xn--vr0bn4e2wh79mca68ih9mf4j.com` and its `www` variant.

- [ ] **Step 5: Verify the official domain output**

Fetch the official homepage and assert HTTP 200 plus both URLs:

```powershell
$page = Invoke-WebRequest -Uri 'https://xn--vr0bn4e2wh79mca68ih9mf4j.com/' -UseBasicParsing
$page.StatusCode
$page.Content.Contains('https://booking.naver.com/booking/6/bizes/721603')
$page.Content.Contains('https://booking.naver.com/booking/6/bizes/970819')
```

Expected: `200`, `True`, `True`.

- [ ] **Step 6: Run final verification before completion**

```powershell
npm.cmd test
npm.cmd run lint
```

Expected: every test passes, zero failures, and ESLint exits 0. Report the official domain and immutable Vercel deployment URL.

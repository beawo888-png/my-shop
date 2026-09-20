# Homepage Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the desktop/tablet header booking dropdown with an accessible language selector and publish fully translated homepage-only routes at `/`, `/en`, `/zh`, and `/ja` while preserving Korean menu/review pages, business facts, responsive behavior, and the existing Vercel project.

**Architecture:** Keep operational facts and outbound URLs in `lib/site-content.ts`, place all homepage display copy in a typed `lib/home-i18n/` module, and render every locale through one shared server component. A small client language-selector component owns only dropdown/anchor behavior, while page metadata, JSON-LD, static locale routing, and sitemap entries remain server-side.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5, CSS, Node test runner with `tsx`, Pencil JSON source, GitHub `main`, existing Vercel project `my-shop-39ab`.

## Global Constraints

- Korean homepage stays at `/`; English, Simplified Chinese, and Japanese use `/en`, `/zh`, and `/ja` respectively.
- Only homepage content is localized. `/menu`, `/menu/[category]`, `/reviews`, and admin screens remain Korean.
- Chinese copy is Simplified Chinese and the selector label is exactly `简体中文`.
- The four selector labels are exactly `한국어`, `English`, `简体中文`, and `日本語`.
- Desktop/tablet replaces only the top-right `네이버 예약` dropdown; the bottom reservation banner, mobile fixed booking bar, and mobile Moran/Pangyo reservation links remain.
- Language changes preserve only approved homepage hashes: `#top`, `#story`, `#menu`, `#location`, `#group`, `#reviews`, `#faq`, and `#reservation`; unknown hashes are dropped.
- Current brand colors and logo remain. The language trigger is at least 48px high, transparent/dark with cream text/border, and gold on hover/focus.
- The selector supports outside click, `Escape`, `aria-haspopup`, `aria-expanded`, `aria-controls`, an explicit navigation label, and `aria-current="page"`.
- Address, telephone, booking URL, map URL, review URL, image, prices, quantities, people counts, temperatures, and durations must not change across locales.
- The external full-menu link continues to open Korean `/menu` in a new tab; the review CTA continues to route to Korean `/reviews`.
- Unsupported locale segments return 404 instead of silently falling back to Korean.
- Read the relevant files under `node_modules/next/dist/docs/` before changing App Router pages or metadata.
- Update the Pencil source `초안` before implementation and keep it covered by `tests/assets-and-sketch.test.mjs`.
- Use TDD for every behavior change, run the full test/lint/build suite, push only to GitHub `main`, create no new Vercel project, and verify automatic deployment on `my-shop-39ab`.

---

## File Map and Ownership

### New files

- `lib/home-i18n/types.ts` — locale, section-copy, branch-copy, metadata-copy, and structured-data-copy contracts.
- `lib/home-i18n/config.ts` — supported locale records, HTML/OG codes, static paths, approved hashes, and pure URL helpers.
- `lib/home-i18n/ko.ts` — exact existing Korean homepage copy moved out of components.
- `lib/home-i18n/en.ts` — complete English homepage copy.
- `lib/home-i18n/zh.ts` — complete Simplified Chinese homepage copy.
- `lib/home-i18n/ja.ts` — complete Japanese homepage copy.
- `lib/home-i18n/index.ts` — typed locale registry and strict lookup functions.
- `lib/home-metadata.ts` — localized homepage metadata builder and shared hreflang map.
- `components/home/localized-homepage.tsx` — shared server composition for all four homepages and localized JSON-LD.
- `components/home/language-selector.tsx` — accessible client dropdown plus hash-preserving locale links.
- `app/[locale]/page.tsx` — static `en`, `zh`, and `ja` homepage routes with strict validation.
- `tests/home-i18n.test.mts` — locale registry, copy completeness, factual invariants, and URL-helper tests.

### Modified files

- `초안` — approved selector states for desktop, tablet, and mobile.
- `tests/assets-and-sketch.test.mjs` — Pencil-frame assertions.
- `components/home/site-header.tsx` — localized navigation, desktop selector, and mobile language group while retaining mobile booking links.
- `components/home/hero-section.tsx`, `signature-menu-section.tsx`, `story-section.tsx`, `group-dining-section.tsx`, `reviews-section.tsx`, `location-section.tsx`, `location-card.tsx`, `faq-section.tsx`, `reservation-banner.tsx`, `mobile-booking-bar.tsx`, `site-footer.tsx` — receive typed copy instead of owning Korean prose.
- `app/page.tsx` — render the shared Korean homepage and export Korean metadata.
- `app/layout.tsx` — retain site-wide metadata base/verification while moving homepage-specific canonical metadata to page level.
- `app/sitemap.ts` — include all four localized homepage paths.
- `lib/site-structured-data.ts` — accept locale-specific descriptive copy and localized page path while reusing factual branch data.
- `lib/site-content.ts` — retain business facts and remove homepage-only `NAV_ITEMS` after consumers migrate.
- `lib/faq-content.ts` — retain reusable FAQ segment types and export the Korean list as a compatibility alias from the new copy registry.
- `app/globals.css` — language selector, mobile language group, long-copy wrapping, and current-language styles.
- `tests/page-structure.test.mjs`, `tests/home-seo-content.test.mjs`, `tests/site-content.test.mjs`, `tests/faq-content.test.mjs`, `tests/search-discovery.test.mjs` — update source assertions to the new boundaries and add route/metadata coverage.

---

### Task 1: Record the Approved Language Selector in Pencil

**Files:**
- Modify: `초안`
- Modify: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: Existing top-level Pencil JSON with `children` frames and the approved brand palette.
- Produces: Four top-level frames whose names and geometry are stable test hooks for implementation review.

- [ ] **Step 1: Write the failing Pencil-source test**

Append this test to `tests/assets-and-sketch.test.mjs`:

```js
test("Pencil source records all approved language selector states", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const expected = [
    ["언어 선택기 데스크톱 · 닫힘", 1440, 160],
    ["언어 선택기 데스크톱 · 열림", 1440, 420],
    ["언어 선택기 태블릿 · 열림", 910, 420],
    ["언어 선택기 모바일 메뉴 · 열림", 390, 720],
  ];

  for (const [name, width, height] of expected) {
    const frame = pencil.children.find((child) => child.name === name);
    assert.ok(frame, `${name} 프레임이 있어야 합니다`);
    assert.equal(frame.width, width);
    assert.equal(frame.height, height);
    const labels = JSON.stringify(frame);
    for (const label of ["한국어", "English", "简体中文", "日本語"]) {
      assert.ok(labels.includes(label), `${name}에 ${label}가 있어야 합니다`);
    }
  }
});
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `node --test tests/assets-and-sketch.test.mjs`

Expected: FAIL with `언어 선택기 데스크톱 · 닫힘 프레임이 있어야 합니다`.

- [ ] **Step 3: Add four concrete frames to the Pencil document**

Use `apply_patch` to append four frame objects to the root `children` array. Every frame must include four text children with the exact language labels, use the existing colors `#17110F` (header), `#F6F0E5` (cream), `#B9935A` (gold), and place the desktop/tablet trigger at the upper-right. Use these exact frame IDs and names:

```json
{
  "type": "frame",
  "id": "language-selector-desktop-closed",
  "x": 6500,
  "y": 300,
  "name": "언어 선택기 데스크톱 · 닫힘",
  "width": 1440,
  "height": 160,
  "fill": "#17110F",
  "layout": "none"
}
```

Create corresponding frames with IDs `language-selector-desktop-open`, `language-selector-tablet-open`, and `language-selector-mobile-open`; widths/heights must be `1440×420`, `910×420`, and `390×720`. The open frames show a cream-bordered dark menu containing `한국어`, `English`, `简体中文`, and `日本語`; the current item has gold text. The mobile frame shows the four links under a `언어 / Language` label and retains the two Naver reservation links below it.

- [ ] **Step 4: Run the focused test and verify green**

Run: `node --test tests/assets-and-sketch.test.mjs`

Expected: all Pencil and asset tests PASS.

- [ ] **Step 5: Commit the design-source change**

```powershell
git add -- '초안' 'tests/assets-and-sketch.test.mjs'
git commit -m "design: add homepage language selector states"
```

---

### Task 2: Build the Typed Locale Registry and Complete Copy Sets

**Files:**
- Create: `lib/home-i18n/types.ts`
- Create: `lib/home-i18n/config.ts`
- Create: `lib/home-i18n/ko.ts`
- Create: `lib/home-i18n/en.ts`
- Create: `lib/home-i18n/zh.ts`
- Create: `lib/home-i18n/ja.ts`
- Create: `lib/home-i18n/index.ts`
- Create: `tests/home-i18n.test.mts`
- Modify: `lib/faq-content.ts`

**Interfaces:**
- Consumes: `FaqEntry` from `lib/faq-content.ts`, branch IDs `moran | pangyo`, and the approved Korean copy currently embedded in homepage components.
- Produces: `Locale`, `LocalizedLocale`, `HomeCopy`, `HOME_COPY`, `LOCALE_CONFIG`, `getHomeCopy(locale)`, `getHomePath(locale)`, `buildLocaleHref(locale, hash)`, `isLocalizedLocale(value)`, and `LOCALIZED_LOCALES`.

- [ ] **Step 1: Write failing locale-contract and fact-invariant tests**

Create `tests/home-i18n.test.mts` with these exact behaviors:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  HOME_COPY,
  HOME_LOCALES,
  LOCALIZED_LOCALES,
  LOCALE_CONFIG,
  buildLocaleHref,
  getHomePath,
  isLocalizedLocale,
} from "../lib/home-i18n/index";

test("home locale registry exposes the four approved languages and paths", () => {
  assert.deepEqual(HOME_LOCALES, ["ko", "en", "zh", "ja"]);
  assert.deepEqual(LOCALIZED_LOCALES, ["en", "zh", "ja"]);
  assert.deepEqual(HOME_LOCALES.map(getHomePath), ["/", "/en", "/zh", "/ja"]);
  assert.deepEqual(
    HOME_LOCALES.map((locale) => LOCALE_CONFIG[locale].label),
    ["한국어", "English", "简体中文", "日本語"],
  );
});

test("every locale has the same navigation, six FAQs, two branches, and four promises", () => {
  for (const locale of HOME_LOCALES) {
    const copy = HOME_COPY[locale];
    assert.equal(copy.header.nav.length, 5);
    assert.deepEqual(copy.header.nav.map((item) => item.href), [
      "#story", "/menu", "#location", "#group", "#faq",
    ]);
    assert.equal(copy.story.promises.length, 4);
    assert.equal(copy.faq.items.length, 6);
    assert.deepEqual(copy.faq.items.map((item) => item.id), [
      "lamb-aroma", "whole-lamb-order", "group-dining",
      "parking", "reservation", "other-menu",
    ]);
    assert.deepEqual(Object.keys(copy.branches), ["moran", "pangyo"]);
  }
});

test("foreign display-copy modules contain no accidental Hangul", () => {
  for (const locale of LOCALIZED_LOCALES) {
    assert.doesNotMatch(JSON.stringify(HOME_COPY[locale]), /[가-힣]/);
  }
});

test("Simplified Chinese uses approved simplified forms", () => {
  const source = JSON.stringify(HOME_COPY.zh);
  for (const word of ["简体中文", "常见问题", "预约", "停车", "菜单"]) {
    assert.ok(source.includes(word), `Chinese copy should include ${word}`);
  }
  assert.doesNotMatch(source, /簡體中文|常見問題|預約|停車|菜單/);
});

test("critical numeric business facts remain present in every locale", () => {
  const required = [
    "15", "24", "48", "400", "60", "1,700", "1,500",
    "90,000", "80,000", "46", "70", "215", "266", "4", "3",
  ];
  for (const locale of HOME_LOCALES) {
    const source = JSON.stringify(HOME_COPY[locale]);
    for (const fact of required) {
      assert.ok(source.includes(fact), `${locale} should preserve ${fact}`);
    }
  }
});

test("locale URL helper preserves only approved homepage hashes", () => {
  assert.equal(buildLocaleHref("ko", "#faq"), "/#faq");
  assert.equal(buildLocaleHref("en", "#group"), "/en#group");
  assert.equal(buildLocaleHref("zh", "#reservation"), "/zh#reservation");
  assert.equal(buildLocaleHref("ja", "#not-approved"), "/ja");
  assert.equal(buildLocaleHref("en", ""), "/en");
  assert.equal(isLocalizedLocale("en"), true);
  assert.equal(isLocalizedLocale("ko"), false);
  assert.equal(isLocalizedLocale("fr"), false);
});
```

- [ ] **Step 2: Run the new test and confirm missing-module failure**

Run: `npx tsx --test tests/home-i18n.test.mts`

Expected: FAIL with `Cannot find module '../lib/home-i18n/index'`.

- [ ] **Step 3: Define the complete type contract**

Create `lib/home-i18n/types.ts`. Use readonly arrays throughout and define every user-visible field so missing translations fail TypeScript rather than falling back at runtime. The required public shape is:

```ts
import type { FaqEntry } from "@/lib/faq-content";

export type Locale = "ko" | "en" | "zh" | "ja";
export type LocalizedLocale = Exclude<Locale, "ko">;
export type BranchId = "moran" | "pangyo";
export type HomeNavItem = {
  label: string;
  href: "#story" | "/menu" | "#location" | "#group" | "#faq";
  newTab?: boolean;
};
export type PromiseCopy = {
  number: string;
  title: string;
  description: string;
  points: readonly string[];
};
export type BranchCopy = {
  shortName: string;
  name: string;
  imageAlt: string;
  transit: string;
  parking: string;
  groupTitle: string;
  groupOccasions: string;
  groupMenu: string;
  groupImageAlt: string;
  recommendationTitle: string;
  recommendation: string;
};
export type HomeCopy = {
  metadata: { title: string; description: string; ogDescription: string };
  header: {
    homeAria: string;
    desktopNavAria: string;
    mobileNavAria: string;
    openMenuAria: string;
    closeMenuAria: string;
    languageMenuAria: string;
    languageGroupLabel: string;
    bookingGroupLabel: string;
    bookingLabels: Record<BranchId, string>;
    nav: readonly HomeNavItem[];
  };
  hero: { eyebrow: string; titleLine1: string; titleLine2: string; leadLine1: string; leadLine2: string; imageAlt: string };
  signature: { eyebrow: string; title: string; description: string; allMenu: string; videoLabels: readonly [string, string, string, string] };
  story: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    imageAlt: string;
    paragraphs: readonly string[];
    closingLead: string;
    closingStrong: string;
    closingTail: string;
    promiseEyebrow: string;
    promiseTitle: string;
    promiseDescription: string;
    promises: readonly [PromiseCopy, PromiseCopy, PromiseCopy, PromiseCopy];
    promiseLine: string;
  };
  group: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    occasionsAria: string;
    occasions: readonly { label: string; icon: string }[];
    detailLabels: readonly [string, string, string, string];
    reserveLabel: string;
    directionsLabel: string;
    principle: string;
    featureAria: string;
    features: readonly { value: string; detail: string; icon: string }[];
  };
  reviews: { eyebrow: string; title: string; description: string; action: string };
  locations: {
    eyebrow: string;
    title: string;
    description: string;
    jumpAria: string;
    placeAria: string;
    labels: { address: string; transit: string; phone: string; parking: string };
    naverDirections: string;
    googleDirections: string;
    naverDirectionsAria: string;
    googleDirectionsAria: string;
  };
  branches: Record<BranchId, BranchCopy>;
  faq: { eyebrow: string; title: string; items: readonly FaqEntry[] };
  reservation: { eyebrow: string; title: string; description: string; naver: string; phone: string; imageAlt: string };
  mobileBooking: { aria: string; linkAria: string; label: string };
  footer: {
    brandName: string;
    channelAria: string;
    newWindowAria: string;
    navAria: string;
    navTitle: string;
    menu: string;
    group: string;
    reservation: string;
    legal: string;
    socialLabels: Record<"instagram" | "youtube" | "kakao" | "tiktok", string>;
  };
  structuredData: {
    description: Record<BranchId, string>;
    addressLocality: string;
    addressRegion: string;
    cuisines: readonly string[];
  };
};
```

- [ ] **Step 4: Implement locale configuration and pure helpers**

Create `lib/home-i18n/config.ts` with this exact API and behavior:

```ts
import type { Locale, LocalizedLocale } from "./types";

export const HOME_LOCALES = ["ko", "en", "zh", "ja"] as const satisfies readonly Locale[];
export const LOCALIZED_LOCALES = ["en", "zh", "ja"] as const satisfies readonly LocalizedLocale[];
export const HOME_HASHES = [
  "#top", "#story", "#menu", "#location", "#group",
  "#reviews", "#faq", "#reservation",
] as const;

export const LOCALE_CONFIG = {
  ko: { label: "한국어", path: "/", htmlLang: "ko", hrefLang: "ko-KR", openGraphLocale: "ko_KR" },
  en: { label: "English", path: "/en", htmlLang: "en", hrefLang: "en", openGraphLocale: "en_US" },
  zh: { label: "简体中文", path: "/zh", htmlLang: "zh-CN", hrefLang: "zh-CN", openGraphLocale: "zh_CN" },
  ja: { label: "日本語", path: "/ja", htmlLang: "ja", hrefLang: "ja", openGraphLocale: "ja_JP" },
} as const satisfies Record<Locale, {
  label: string;
  path: string;
  htmlLang: string;
  hrefLang: string;
  openGraphLocale: string;
}>;

export const getHomePath = (locale: Locale) => LOCALE_CONFIG[locale].path;
export const isLocale = (value: string): value is Locale =>
  HOME_LOCALES.includes(value as Locale);
export const isLocalizedLocale = (value: string): value is LocalizedLocale =>
  LOCALIZED_LOCALES.includes(value as LocalizedLocale);
export function buildLocaleHref(locale: Locale, hash = "") {
  const safeHash = HOME_HASHES.includes(hash as (typeof HOME_HASHES)[number]) ? hash : "";
  return `${getHomePath(locale)}${safeHash}`;
}
```

- [ ] **Step 5: Move the Korean copy and write all three complete translations**

Create `ko.ts`, `en.ts`, `zh.ts`, and `ja.ts`, each exporting one object with `satisfies HomeCopy`. Move every existing Korean user-visible string from the components without editing its wording. Translate every string-valued field for the other three modules; do not retain Hangul in foreign copy. Use these fixed terminology and factual rules:

| Meaning | English | Simplified Chinese | Japanese |
| --- | --- | --- | --- |
| Brand | Wangjing Lamb Leg & Skewers | 王京羊腿羊肉串 | 王京 羊もも肉・羊串 |
| Moran branch | Moran Main Branch | 牡丹总店 | モラン本店 |
| Pangyo branch | Pangyo Branch | 板桥店 | パンギョ店 |
| Brand Story | Brand Story | 品牌故事 | ブランドストーリー |
| Signature Menu | Signature Menu | 招牌菜单 | 看板メニュー |
| Locations | Locations | 门店指南 | 店舗案内 |
| Group Dining | Group Dining | 团体聚餐 | 団体利用 |
| FAQ | Frequently Asked Questions | 常见问题 | よくある質問 |
| Naver booking | Naver Reservation | Naver 预约 | Naver予約 |
| Naver directions | Open in Naver Map | 在 Naver 地图中查看 | Naverマップで見る |

Translate official station/parking descriptions in `branches`, but keep all numeric tokens identical to Korean. Keep official street addresses out of the translation objects; they continue to come directly from `LOCATIONS`. Preserve FAQ segment boundaries and `strong: true` on the complete `1,700g(3~4 people, 90,000 won)` and `1,500g(2~3 people, 80,000 won)` facts plus the `46`- and `70`-guest facts. Use natural punctuation for each language while retaining the exact ASCII numeric forms asserted by the test.

The four localized nav arrays must use exactly these labels, hrefs, and `newTab` flags:

```ts
const navByLocale = {
  ko: [
    { label: "브랜드 스토리", href: "#story" },
    { label: "대표 메뉴", href: "/menu", newTab: true },
    { label: "지점 안내", href: "#location" },
    { label: "단체 모임", href: "#group" },
    { label: "자주 묻는 질문", href: "#faq" },
  ],
  en: [
    { label: "Brand Story", href: "#story" },
    { label: "Signature Menu", href: "/menu", newTab: true },
    { label: "Locations", href: "#location" },
    { label: "Group Dining", href: "#group" },
    { label: "FAQ", href: "#faq" },
  ],
  zh: [
    { label: "品牌故事", href: "#story" },
    { label: "招牌菜单", href: "/menu", newTab: true },
    { label: "门店指南", href: "#location" },
    { label: "团体聚餐", href: "#group" },
    { label: "常见问题", href: "#faq" },
  ],
  ja: [
    { label: "ブランドストーリー", href: "#story" },
    { label: "看板メニュー", href: "/menu", newTab: true },
    { label: "店舗案内", href: "#location" },
    { label: "団体利用", href: "#group" },
    { label: "よくある質問", href: "#faq" },
  ],
} as const;
```

Use the matching array as each locale object's `header.nav`. `paragraphs`, all four promises, all six FAQs, both branch descriptions, reservation/footer copy, accessibility labels, metadata, and JSON-LD descriptions must all be present in each locale object.

- [ ] **Step 6: Add the strict registry and Korean FAQ compatibility export**

Create `lib/home-i18n/index.ts`:

```ts
export * from "./config";
export type { BranchId, HomeCopy, HomeNavItem, Locale, LocalizedLocale } from "./types";

import { enHomeCopy } from "./en";
import { jaHomeCopy } from "./ja";
import { koHomeCopy } from "./ko";
import type { HomeCopy, Locale } from "./types";
import { zhHomeCopy } from "./zh";

export const HOME_COPY = {
  ko: koHomeCopy,
  en: enHomeCopy,
  zh: zhHomeCopy,
  ja: jaHomeCopy,
} as const satisfies Record<Locale, HomeCopy>;

export const getHomeCopy = (locale: Locale): HomeCopy => HOME_COPY[locale];
```

Keep `FaqSegment` and `FaqEntry` in `lib/faq-content.ts`, remove the duplicated Korean object, import `koHomeCopy`, and export:

```ts
export const FAQ_ITEMS = koHomeCopy.faq.items;
```

Because `types.ts` uses a type-only import and each locale module also imports `HomeCopy` as a type, this creates no runtime cycle. There must be no runtime fallback and no duplicate Korean FAQ list.

- [ ] **Step 7: Run the locale test and type/build guard**

Run: `npx tsx --test tests/home-i18n.test.mts`

Expected: all locale contract, Simplified Chinese, fact, and URL-helper tests PASS.

Run: `npm run build`

Expected: Next.js build succeeds; any omitted translation key fails TypeScript before this step can pass.

- [ ] **Step 8: Commit the locale data layer**

```powershell
git add -- 'lib/home-i18n' 'lib/faq-content.ts' 'tests/home-i18n.test.mts'
git commit -m "feat: add typed homepage translations"
```

---

### Task 3: Make Every Homepage Section Copy-Driven

**Files:**
- Create: `components/home/localized-homepage.tsx`
- Modify: `components/home/hero-section.tsx`
- Modify: `components/home/signature-menu-section.tsx`
- Modify: `components/home/story-section.tsx`
- Modify: `components/home/group-dining-section.tsx`
- Modify: `components/home/reviews-section.tsx`
- Modify: `components/home/location-section.tsx`
- Modify: `components/home/location-card.tsx`
- Modify: `components/home/faq-section.tsx`
- Modify: `components/home/reservation-banner.tsx`
- Modify: `components/home/mobile-booking-bar.tsx`
- Modify: `components/home/site-footer.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/page-structure.test.mjs`
- Modify: `tests/home-seo-content.test.mjs`
- Modify: `tests/faq-content.test.mjs`

**Interfaces:**
- Consumes: `HomeCopy`, `Locale`, `getHomeCopy(locale)`, and factual `SITE`, `LOCATIONS`, and `BOOKING_LOCATIONS`.
- Produces: `<LocalizedHomepage locale: Locale>` and section components whose public copy props are exact `HomeCopy` subsections.

- [ ] **Step 1: Replace brittle embedded-copy tests with copy-boundary tests**

Update the affected source assertions so tests require the shared renderer and props instead of Korean literals inside section files. Add these assertions to `tests/page-structure.test.mjs`:

```js
test("shared homepage passes typed locale copy to every visible section", async () => {
  const page = await read("components/home/localized-homepage.tsx");
  assert.match(page, /type LocalizedHomepageProps = \{[\s\S]*?locale: Locale/);
  assert.match(page, /const copy = getHomeCopy\(locale\)/);
  for (const component of [
    "SiteHeader", "HeroSection", "SignatureMenuSection", "StorySection",
    "GroupDiningSection", "ReviewsSection", "LocationSection", "FaqSection",
    "ReservationBanner", "SiteFooter", "MobileBookingBar",
  ]) {
    assert.match(page, new RegExp(`<${component}[\\s\\S]*?copy=`));
  }
  assert.match(page, /lang=\{LOCALE_CONFIG\[locale\]\.htmlLang\}/);
});

test("root homepage renders the shared Korean implementation", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /<LocalizedHomepage locale="ko" \/>/);
});
```

Update `tests/home-seo-content.test.mjs` to read `lib/home-i18n/ko.ts` for Korean story/group phrases and to require `copy.story.promises.map`, `copy.group.occasions.map`, `copy.group.features.map`, and `copy.branches[location.id]` in the section sources. Update `tests/faq-content.test.mjs` so it checks the six Korean FAQs through `koHomeCopy.faq.items` and verifies `FAQ_ITEMS` is a compatibility alias.

- [ ] **Step 2: Run focused tests and confirm they fail against the old ownership model**

Run: `node --test tests/page-structure.test.mjs tests/home-seo-content.test.mjs tests/faq-content.test.mjs`

Expected: FAIL because `components/home/localized-homepage.tsx` is absent and section components do not accept copy props.

- [ ] **Step 3: Convert leaf sections to exact typed props**

Use these signatures, replacing local Korean constants with the passed subsection. Do not change class names or DOM order.

```ts
export function HeroSection({ copy }: { copy: HomeCopy["hero"] })
export function SignatureMenuSection({ copy }: { copy: HomeCopy["signature"] })
export function StorySection({ copy }: { copy: HomeCopy["story"] })
export function GroupDiningSection({ copy, branches }: {
  copy: HomeCopy["group"];
  branches: HomeCopy["branches"];
})
export function ReviewsSection({ copy }: { copy: HomeCopy["reviews"] })
export function LocationSection({ copy, branches }: {
  copy: HomeCopy["locations"];
  branches: HomeCopy["branches"];
})
export function LocationCard({ location, copy, labels }: {
  location: Location;
  copy: BranchCopy;
  labels: HomeCopy["locations"];
})
export function FaqSection({ copy }: { copy: HomeCopy["faq"] })
export function ReservationBanner({ copy }: { copy: HomeCopy["reservation"] })
export function MobileBookingBar({ copy }: { copy: HomeCopy["mobileBooking"] })
export function SiteFooter({ copy, branches, homePath }: {
  copy: HomeCopy["footer"];
  branches: HomeCopy["branches"];
  homePath: string;
})
```

Keep media paths, icons, map URLs, phone hrefs, booking URLs, and `LOCATIONS.map` in the components. Use `copy.branches[location.id]` for translated branch names, image alt, transit, parking, and group descriptions; use `location.address`, `location.phoneDisplay`, and all outbound URLs directly from `site-content.ts`. Set `id="reservation"` on the reservation section. In the footer, `/menu` stays Korean, while group/reservation anchors are `${homePath}#group` and `${homePath}#reservation`.

For story emphasis, store complete translated paragraphs as strings and render paragraphs without injecting HTML. Keep the three Korean emphasis spans by adding optional `highlights` to `StoryCopy` only if the existing visual weight must be preserved; apply the same structure in every locale rather than parsing text.

- [ ] **Step 4: Add the shared homepage server composition**

Create `components/home/localized-homepage.tsx` with this complete composition contract:

```tsx
import { FaqSection } from "@/components/home/faq-section";
import { GroupDiningSection } from "@/components/home/group-dining-section";
import { HeroSection } from "@/components/home/hero-section";
import { LocationSection } from "@/components/home/location-section";
import { MobileBookingBar } from "@/components/home/mobile-booking-bar";
import { ReservationBanner } from "@/components/home/reservation-banner";
import { ReviewsSection } from "@/components/home/reviews-section";
import { SignatureMenuSection } from "@/components/home/signature-menu-section";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { StorySection } from "@/components/home/story-section";
import { getHomeCopy, getHomePath, LOCALE_CONFIG, type Locale } from "@/lib/home-i18n";
import { buildSiteRestaurantStructuredData } from "@/lib/site-structured-data";

type LocalizedHomepageProps = { locale: Locale };

export function LocalizedHomepage({ locale }: LocalizedHomepageProps) {
  const copy = getHomeCopy(locale);
  const homePath = getHomePath(locale);
  const structuredData = buildSiteRestaurantStructuredData(locale, copy.structuredData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div lang={LOCALE_CONFIG[locale].htmlLang}>
        <SiteHeader locale={locale} copy={copy.header} homePath={homePath} home />
        <main>
          <HeroSection copy={copy.hero} />
          <SignatureMenuSection copy={copy.signature} />
          <StorySection copy={copy.story} />
          <GroupDiningSection copy={copy.group} branches={copy.branches} />
          <ReviewsSection copy={copy.reviews} />
          <LocationSection copy={copy.locations} branches={copy.branches} />
          <FaqSection copy={copy.faq} />
          <ReservationBanner copy={copy.reservation} />
        </main>
        <SiteFooter copy={copy.footer} branches={copy.branches} homePath={homePath} />
        <MobileBookingBar copy={copy.mobileBooking} />
      </div>
    </>
  );
}
```

Temporarily keep the current `SiteHeader` signature compiling by widening it in Task 4 immediately after this task; if implementing tasks in isolation, pass the new props through and let the focused Task 3 tests run before the full build.

- [ ] **Step 5: Make the root page use the shared renderer**

Replace `app/page.tsx` body with:

```tsx
import { LocalizedHomepage } from "@/components/home/localized-homepage";

export default function Home() {
  return <LocalizedHomepage locale="ko" />;
}
```

Metadata is added in Task 5 so SEO concerns remain independently reviewable.

- [ ] **Step 6: Run focused structural/content tests**

Run: `node --test tests/page-structure.test.mjs tests/home-seo-content.test.mjs tests/faq-content.test.mjs`

Expected: all focused tests PASS; no section source owns a hardcoded Korean heading or FAQ list.

- [ ] **Step 7: Commit the copy-driven homepage**

```powershell
git add -- 'components/home' 'app/page.tsx' 'tests/page-structure.test.mjs' 'tests/home-seo-content.test.mjs' 'tests/faq-content.test.mjs'
git commit -m "refactor: render homepage from locale copy"
```

---

### Task 4: Replace the Header Booking Dropdown with the Accessible Language Selector

**Files:**
- Create: `components/home/language-selector.tsx`
- Modify: `components/home/site-header.tsx`
- Modify: `app/globals.css`
- Modify: `tests/page-structure.test.mjs`
- Modify: `tests/site-content.test.mjs`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Consumes: `Locale`, `HomeCopy["header"]`, `HOME_LOCALES`, `LOCALE_CONFIG[locale].label`, `buildLocaleHref`, and `BOOKING_LOCATIONS` for mobile booking only.
- Produces: `<LanguageSelector locale>` and `<LocaleLink targetLocale currentLocale onSelect?>`; `SiteHeader` accepts `locale`, `copy`, `homePath`, and `home` with Korean defaults for `/menu` and `/reviews`.

- [ ] **Step 1: Add failing header source tests**

Replace obsolete desktop-booking assertions and add:

```js
test("header exposes an accessible language selector and keeps mobile branch booking", async () => {
  const [header, selector] = await Promise.all([
    read("components/home/site-header.tsx"),
    read("components/home/language-selector.tsx"),
  ]);
  assert.match(header, /<LanguageSelector locale=\{locale\}/);
  assert.match(header, /mobile-nav__languages/);
  assert.match(header, /HOME_LOCALES\.map/);
  assert.match(header, /mobile-nav__booking/);
  assert.match(header, /BOOKING_LOCATIONS\.map/);
  assert.doesNotMatch(header, /header-booking__trigger/);
  assert.match(selector, /aria-haspopup="true"/);
  assert.match(selector, /aria-expanded=\{open\}/);
  assert.match(selector, /aria-current=\{targetLocale === locale \? "page" : undefined\}/);
  assert.match(selector, /document\.addEventListener\("pointerdown"/);
  assert.match(selector, /event\.key === "Escape"/);
  assert.match(selector, /window\.location\.hash/);
  assert.match(selector, /buildLocaleHref/);
});
```

Add CSS assertions for `.language-selector`, `.language-selector__trigger`, `.language-selector__menu`, `.mobile-nav__languages`, `min-height: 48px`, gold hover/focus, and `[aria-current="page"]`.

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `node --test tests/page-structure.test.mjs tests/site-content.test.mjs`

Expected: FAIL because `LanguageSelector` and the new class hooks do not exist.

- [ ] **Step 3: Implement the client selector and hash-safe links**

Create `components/home/language-selector.tsx` as a client component. The component must:

```tsx
"use client";

import { ChevronDown } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  buildLocaleHref,
  LOCALE_CONFIG,
  type Locale,
} from "@/lib/home-i18n";

export function LocaleLink({
  targetLocale,
  currentLocale,
  children,
  onSelect,
}: {
  targetLocale: Locale;
  currentLocale: Locale;
  children: ReactNode;
  onSelect?: () => void;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = buildLocaleHref(targetLocale, window.location.hash);
    if (event.currentTarget.getAttribute("href") !== href) {
      event.preventDefault();
      window.location.assign(href);
    }
    onSelect?.();
  };
  return (
    <a
      href={buildLocaleHref(targetLocale)}
      hrefLang={targetLocale === "zh" ? "zh-CN" : targetLocale}
      aria-current={targetLocale === currentLocale ? "page" : undefined}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
```

`LanguageSelector` wraps the trigger/menu in a `ref`, closes on outside `pointerdown` and `Escape`, rotates the chevron when expanded, renders all four `LocaleLink`s, and uses `LOCALE_CONFIG[locale].label` for the trigger. Its `aria-label` comes from `copy.languageMenuAria`; the menu ID is `language-menu`.

- [ ] **Step 4: Refactor `SiteHeader` around localized nav and mobile language links**

Use this prop contract and defaults:

```ts
type SiteHeaderProps = {
  locale?: Locale;
  copy?: HomeCopy["header"];
  homePath?: string;
  home?: boolean;
};

export function SiteHeader({
  locale = "ko",
  copy = HOME_COPY.ko.header,
  homePath = "/",
  home = false,
}: SiteHeaderProps) {
  const resolveNavHref = (item: HomeNavItem) =>
    item.href.startsWith("#") ? `${home ? "" : homePath}${item.href}` : item.href;
```

Render `<LanguageSelector locale={locale} copy={copy} />` where `.header-booking` currently appears. Render `copy.nav` in both navs. In mobile nav, add:

```tsx
<div className="mobile-nav__languages">
  <p>{copy.languageGroupLabel}</p>
  <div>
    {HOME_LOCALES.map((targetLocale) => (
      <LocaleLink
        key={targetLocale}
        targetLocale={targetLocale}
        currentLocale={locale}
        onSelect={() => setOpen(false)}
      >
        {LOCALE_CONFIG[targetLocale].label}
      </LocaleLink>
    ))}
  </div>
</div>
```

Keep the existing `.mobile-nav__booking` block directly after it and translate only its heading/booking labels through the current locale copy. `BOOKING_LOCATIONS` remains the URL source. On menu/review pages, default Korean props keep existing behavior; choosing another language goes to that localized homepage.

Set the logo href to `home ? "#top" : homePath`, and render the translated mobile booking text from `copy.bookingLabels[booking.id]` while retaining each `booking.url` unchanged.

- [ ] **Step 5: Apply the approved responsive styles**

Rename/rework the old `.header-booking*` declarations into `.language-selector*`. Required CSS behavior:

```css
.language-selector { position: relative; justify-self: end; }
.language-selector__trigger {
  min-height: 48px;
  background: transparent;
  color: var(--cream);
  border: 1px solid color-mix(in srgb, var(--cream) 72%, transparent);
}
.language-selector__trigger:hover,
.language-selector__trigger:focus-visible { color: var(--gold); border-color: var(--gold); }
.language-selector__menu a[aria-current="page"] { color: var(--gold); font-weight: 800; }
```

Retain the current tablet first-row placement and second-row nav at `768–1023px`. Hide the desktop selector only at `max-width: 767px`. Style `.mobile-nav__languages` to wrap four links, with current-language gold state and no fixed text height. Verify no selector styles alter the mobile booking links.

- [ ] **Step 6: Remove obsolete homepage nav data after all consumers migrate**

Delete `NavItem` and `NAV_ITEMS` from `lib/site-content.ts`. Update `tests/site-content.test.mjs` to assert the facts/booking/location data only, while localized navigation order remains covered by `tests/home-i18n.test.mts`.

- [ ] **Step 7: Run selector/header tests and a production build**

Run: `node --test tests/page-structure.test.mjs tests/site-content.test.mjs`

Expected: PASS.

Run: `npm run build`

Expected: PASS, including unchanged `/menu`, all menu categories, and `/reviews`.

- [ ] **Step 8: Commit the language selector**

```powershell
git add -- 'components/home/language-selector.tsx' 'components/home/site-header.tsx' 'app/globals.css' 'lib/site-content.ts' 'tests/page-structure.test.mjs' 'tests/site-content.test.mjs'
git commit -m "feat: add accessible homepage language selector"
```

---

### Task 5: Add Static Locale Routes, Metadata, JSON-LD, and Sitemap Entries

**Files:**
- Create: `app/[locale]/page.tsx`
- Create: `lib/home-metadata.ts`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/sitemap.ts`
- Modify: `lib/site-structured-data.ts`
- Modify: `tests/home-i18n.test.mts`
- Modify: `tests/home-seo-content.test.mjs`
- Modify: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `LOCALIZED_LOCALES`, `isLocalizedLocale`, `LOCALE_CONFIG`, `getHomeCopy`, factual `LOCATIONS`, and `<LocalizedHomepage locale>`.
- Produces: static localized pages, `buildHomeMetadata(locale): Metadata`, localized JSON-LD, canonical/hreflang metadata, and sitemap entries.

- [ ] **Step 1: Read the installed Next.js documentation before route work**

Run:

```powershell
rg -n "generateStaticParams|generateMetadata|dynamicParams|notFound" node_modules/next/dist/docs
```

Read the matching App Router page and metadata documents in full enough to confirm Next 16 async `params`. Record no code changes in this step.

- [ ] **Step 2: Add failing source and helper tests**

Add to `tests/home-seo-content.test.mjs`:

```js
test("localized homepage route is static, strict, and metadata-aware", async () => {
  const route = await read("app/[locale]/page.tsx");
  assert.match(route, /generateStaticParams/);
  assert.match(route, /LOCALIZED_LOCALES\.map/);
  assert.match(route, /export const dynamicParams = false/);
  assert.match(route, /isLocalizedLocale/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /buildHomeMetadata/);
  assert.match(route, /<LocalizedHomepage locale=\{locale\} \/>/);
});
```

Update `tests/search-discovery.test.mjs` to require literal paths `"/en"`, `"/zh"`, and `"/ja"`, and add metadata tests in `tests/home-i18n.test.mts` that assert canonical paths and the exact language map:

```ts
assert.deepEqual(buildHomeMetadata("zh").alternates, {
  canonical: "/zh",
  languages: {
    "ko-KR": "/",
    en: "/en",
    "zh-CN": "/zh",
    ja: "/ja",
    "x-default": "/",
  },
});
```

- [ ] **Step 3: Run focused tests and confirm red**

Run: `node --test tests/home-seo-content.test.mjs tests/search-discovery.test.mjs`

Run: `npx tsx --test tests/home-i18n.test.mts`

Expected: FAIL because the localized route and metadata builder do not exist and sitemap lacks three paths.

- [ ] **Step 4: Implement one localized metadata builder**

Create `lib/home-metadata.ts`:

```ts
import type { Metadata } from "next";
import { getHomeCopy, getHomePath, LOCALE_CONFIG, type Locale } from "@/lib/home-i18n";

const languages = {
  "ko-KR": "/",
  en: "/en",
  "zh-CN": "/zh",
  ja: "/ja",
  "x-default": "/",
} as const;

export function buildHomeMetadata(locale: Locale): Metadata {
  const copy = getHomeCopy(locale);
  const path = getHomePath(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: { canonical: path, languages },
    openGraph: {
      title: copy.metadata.title,
      description: copy.metadata.ogDescription,
      locale: LOCALE_CONFIG[locale].openGraphLocale,
      type: "website",
      url: path,
    },
  };
}
```

In `app/layout.tsx`, keep `metadataBase`, `applicationName`, Korean keywords, Naver verification, and the root `<html lang="ko">`; remove homepage canonical/title/description/Open Graph values that would conflict with child pages. In `app/page.tsx`, add `export const metadata = buildHomeMetadata("ko")`.

- [ ] **Step 5: Implement strict static foreign-language routes**

Create `app/[locale]/page.tsx` using Next 16 async params:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalizedHomepage } from "@/components/home/localized-homepage";
import { isLocalizedLocale, LOCALIZED_LOCALES } from "@/lib/home-i18n";
import { buildHomeMetadata } from "@/lib/home-metadata";

type LocalizedHomePageProps = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALIZED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalizedHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocalizedLocale(locale)) notFound();
  return buildHomeMetadata(locale);
}

export default async function LocalizedHomePage({ params }: LocalizedHomePageProps) {
  const { locale } = await params;
  if (!isLocalizedLocale(locale)) notFound();
  return <LocalizedHomepage locale={locale} />;
}
```

- [ ] **Step 6: Localize descriptive JSON-LD without duplicating facts**

Change `buildSiteRestaurantStructuredData` to:

```ts
export function buildSiteRestaurantStructuredData(
  locale: Locale,
  copy: HomeCopy["structuredData"],
) {
  const pagePath = getHomePath(locale);
  const homeUrl = `${SITE_URL}${pagePath === "/" ? "" : pagePath}`;
  return {
    "@context": "https://schema.org",
    "@graph": LOCATIONS.map((location) => {
      const booking = BOOKING_LOCATIONS.find((item) => item.id === location.id);
      return {
        "@type": "Restaurant",
        "@id": `${homeUrl}#restaurant-${location.id}`,
        name: location.name,
        description: copy.description[location.id],
        url: `${homeUrl}#location-${location.id}`,
        image: `${SITE_URL}${location.image}`,
        telephone: location.phoneDisplay,
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: copy.addressLocality,
          addressRegion: copy.addressRegion,
          addressCountry: "KR",
        },
        servesCuisine: copy.cuisines,
        hasMenu: `${SITE_URL}/menu`,
        acceptsReservations: booking?.url,
        sameAs: [location.mapUrl, location.reviewUrl],
      };
    }),
  };
}
```

The official Korean restaurant `name`, street address, phone, images, booking URLs, and sameAs URLs remain from `LOCATIONS`/`BOOKING_LOCATIONS`; only descriptions, locality/region labels, and cuisines are localized.

- [ ] **Step 7: Add all locale roots to the sitemap**

Add `{ path: "/en", changeFrequency: "weekly", priority: 0.9 }`, `/zh`, and `/ja` to `STATIC_PAGES` immediately after `/`. Do not add translated menu/review routes.

- [ ] **Step 8: Run focused tests and production build**

Run: `node --test tests/home-seo-content.test.mjs tests/search-discovery.test.mjs`

Run: `npx tsx --test tests/home-i18n.test.mts`

Run: `npm run build`

Expected: PASS; build output includes `/`, `/en`, `/zh`, `/ja`, `/menu`, `/reviews`, and existing menu category routes. `/fr` is not generated.

- [ ] **Step 9: Commit routes and SEO**

```powershell
git add -- 'app/[locale]/page.tsx' 'app/page.tsx' 'app/layout.tsx' 'app/sitemap.ts' 'lib/home-metadata.ts' 'lib/site-structured-data.ts' 'tests/home-i18n.test.mts' 'tests/home-seo-content.test.mjs' 'tests/search-discovery.test.mjs'
git commit -m "feat: publish localized homepage routes"
```

---

### Task 6: Full Regression, Responsive Browser QA, Review, Push, and Existing Vercel Verification

**Files:**
- Modify only if a failing test or observed regression requires a focused fix: files from Tasks 1–5 and their owning tests.

**Interfaces:**
- Consumes: The complete four-locale implementation and existing Git/Vercel linkage.
- Produces: Verified commits on `main`, a pushed GitHub revision, and a Ready deployment on the existing `my-shop-39ab` project.

- [ ] **Step 1: Run the complete automated suite**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests PASS, ESLint exits 0, and Next production build exits 0. If any check fails, first add or refine a focused failing regression test, make the smallest owning-file fix, rerun the focused test, then rerun all three commands.

- [ ] **Step 2: Start a production preview on an unused local port**

Run: `npm start -- --hostname 127.0.0.1 --port 3011`

Expected: Next reports the production server ready at `http://127.0.0.1:3011`. Keep the session ID for shutdown after QA.

- [ ] **Step 3: Perform desktop browser QA at 1440px**

Check `/`, `/en`, `/zh`, and `/ja` at 1440px. For each route verify:

- The current-language trigger is visible at upper right and `네이버 예약` is absent there.
- The dropdown opens, shows all four exact labels, marks the current language, closes on outside click, and closes on `Escape`.
- Switching from `#story`, `#group`, `#location`, `#faq`, and `#reservation` preserves that hash.
- Every homepage section, FAQ answer, footer label, image alt behavior, and accessibility label is in the selected language.
- `/menu` opens Korean in a new tab and `/reviews` remains Korean.
- Bottom reservation CTA still works and targets the existing Naver booking URL.
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 4: Perform tablet browser QA at 910px**

For all four locales verify the logo/language selector stay on row one, all five nav items remain visible on row two, long English/Japanese labels do not overlap, the dropdown is not clipped, every target anchor lands below the sticky header, and no horizontal overflow exists.

- [ ] **Step 5: Perform mobile browser QA at 390px**

For all four locales verify the desktop selector is hidden, hamburger opens/closes, `언어 / Language` (localized where applicable) contains all four links, the current item is gold/`aria-current`, selecting a locale closes the menu and preserves an approved hash, both Moran/Pangyo Naver booking links remain below the language group, and the fixed booking bar remains visible and functional.

- [ ] **Step 6: Verify strict routing and static SEO output**

Visit `/fr` and confirm 404. Inspect rendered metadata or page source on `/`, `/en`, `/zh`, `/ja` to verify distinct title/description/canonical, all five hreflang values (`ko-KR`, `en`, `zh-CN`, `ja`, `x-default`), localized OG locale, two Restaurant JSON-LD entities, and unchanged telephone/address/booking/map URLs.

- [ ] **Step 7: Review the final diff and commit only evidence-backed fixes**

Run:

```powershell
git status --short
git diff --check
git diff --stat origin/main...HEAD
git log --oneline --decorate -8
```

Expected: no whitespace errors, no unrelated user files, and only the approved localization/design/test changes. Any QA fix must have its focused test and its own commit such as `fix: prevent localized header overflow`.

- [ ] **Step 8: Push the verified `main` branch**

Run: `git push origin main`

Expected: GitHub accepts the push and reports the new `main` revision. Do not create a pull request or a new branch unless the user explicitly changes the delivery instruction.

- [ ] **Step 9: Verify the existing Vercel automatic deployment**

Use the already-linked Vercel project or Vercel dashboard/CLI to find the deployment whose Git SHA equals `git rev-parse HEAD`. Confirm:

- Project name is exactly `my-shop-39ab`.
- State is `Ready`.
- Deployment was triggered by the pushed `main` commit.
- No new Vercel project was created.
- `https://my-shop-39ab.vercel.app`, `https://왕징양다리양꼬치.com`, and `https://www.왕징양다리양꼬치.com` serve that revision.
- `/`, `/en`, `/zh`, and `/ja` return 200 on the production domains and `/fr` returns 404.

- [ ] **Step 10: Repeat a concise production smoke test**

On the custom domain, open the selector on desktop, switch Korean → English → Simplified Chinese → Japanese while on `#group`, then verify mobile hamburger language links at 390px. Confirm the production header, all translated content, hash preservation, menu/review boundaries, and reservation links match local QA before reporting completion.

---

## Final Acceptance Checklist

- [ ] Four home routes exist: `/`, `/en`, `/zh`, `/ja`; unsupported locale routes 404.
- [ ] The complete homepage, including accessibility labels, FAQ, footer, metadata, and JSON-LD descriptions, is localized.
- [ ] Simplified Chinese contains no Traditional Chinese selector/FAQ/reservation/menu terms.
- [ ] Desktop/tablet header has the language selector instead of the booking dropdown.
- [ ] Mobile hamburger has language links and still has both branch booking links.
- [ ] Lower reservation surfaces and all factual URLs/numbers are unchanged.
- [ ] Approved hashes survive language changes; unknown hashes do not.
- [ ] Korean `/menu`, category pages, and `/reviews` remain intact.
- [ ] 1440px, 910px, and 390px have no clipping or horizontal overflow.
- [ ] Full tests, lint, and production build pass.
- [ ] GitHub `main` is pushed and the matching commit is Ready in existing Vercel project `my-shop-39ab`.

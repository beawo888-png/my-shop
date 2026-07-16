import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("home page renders every approved section", async () => {
  const page = await read("app/page.tsx");
  for (const component of [
    "SiteHeader",
    "HeroSection",
    "SignatureMenuSection",
    "StorySection",
    "GroupDiningSection",
    "ReviewsSection",
    "LocationSection",
    "ReservationBanner",
    "MobileBookingBar",
    "SiteFooter",
  ]) {
    assert.match(page, new RegExp(`<${component}`));
  }
});

test("section components expose the approved anchor IDs", async () => {
  const files = await Promise.all(
    [
      "signature-menu-section.tsx",
      "story-section.tsx",
      "group-dining-section.tsx",
      "reviews-section.tsx",
      "location-section.tsx",
    ].map((name) => read(`components/home/${name}`)),
  );
  for (const [index, id] of [
    "menu",
    "story",
    "group",
    "reviews",
    "location",
  ].entries()) {
    assert.match(files[index], new RegExp(`id=["']${id}["']`));
  }
});

test("homepage reviews section links to the branch selector", async () => {
  const section = await read("components/home/reviews-section.tsx");
  assert.match(section, /import Link from "next\/link"/);
  assert.match(section, /href="\/reviews"/);
  assert.match(section, /지점별 고객 리뷰 보기/);
  assert.doesNotMatch(section, /REVIEWS\.map|review-card|blockquote/);
  assert.match(section, /id="reviews"/);
});

test("reviews page renders two safe Naver review choices", async () => {
  const [page, card] = await Promise.all([
    read("app/reviews/page.tsx"),
    read("components/reviews/review-location-card.tsx"),
  ]);

  assert.match(page, /export const metadata: Metadata/);
  assert.match(
    page,
    /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com\/reviews/,
  );
  assert.match(page, /LOCATIONS\.map/);
  assert.match(page, /<ReviewLocationCard/);
  assert.match(page, /지점별 고객 리뷰/);
  assert.match(card, /href=\{location\.reviewUrl\}/);
  assert.match(card, /target="_blank"/);
  assert.match(card, /rel="noreferrer"/);
  assert.match(card, /\$\{location\.shortName\} 네이버 플레이스 리뷰 열기/);
  assert.match(card, /네이버 플레이스 리뷰 보기/);
});

test("external actions use safe links and accessible labels", async () => {
  const files = await Promise.all(
    [
      "hero-section.tsx",
      "location-section.tsx",
      "location-card.tsx",
      "reservation-banner.tsx",
      "mobile-booking-bar.tsx",
    ].map((name) => read(`components/home/${name}`)),
  );
  const source = files.join("\n");
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(source, /네이버 예약/);
  assert.match(source, /전화/);
});

test("mobile menu exposes its state and target", async () => {
  const header = await read("components/home/site-header.tsx");
  assert.match(header, /^"use client";/m);
  assert.match(header, /aria-expanded=\{open\}/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(header, /id="mobile-navigation"/);
  assert.match(header, /setOpen\(false\)/);
});

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

test("global styles contain brand tokens and responsive contracts", async () => {
  const css = await read("app/globals.css");
  for (const token of [
    "--ink: #17110f",
    "--cream: #f6f0e5",
    "--gold: #c5a15a",
    "--red: #8f1d1d",
  ]) {
    assert.match(css.toLowerCase(), new RegExp(token));
  }
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.mobile-booking/);
  assert.match(css, /position: fixed/);
});

test("layout declares Korean language and Wangjing metadata", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /판교왕징 \| 판교 양꼬치·중국 양고기 다이닝/);
  assert.match(layout, /대왕판교로606번길/);
});

test("location section renders two data-driven branch cards", async () => {
  const [section, card, css] = await Promise.all([
    read("components/home/location-section.tsx"),
    read("components/home/location-card.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(section, /import \{ LOCATIONS \}/);
  assert.match(section, /import \{ LocationCard \}/);
  assert.match(section, /LOCATIONS\.map/);
  assert.match(section, /두 곳에서 만나요/);
  assert.match(section, /href=\{location\.mapUrl\}/);
  assert.match(section, /target="_blank"/);
  assert.match(section, /rel="noreferrer"/);
  assert.match(section, /네이버 플레이스 열기/);
  assert.doesNotMatch(section, /#location-/);

  assert.match(card, /from "next\/image"/);
  assert.match(card, /id=\{`location-\$\{location\.id\}`\}/);
  assert.match(card, /location\.phoneHref/);
  assert.match(card, /location\.mapUrl/);
  assert.match(card, /target="_blank"/);
  assert.match(card, /rel="noreferrer"/);
  assert.match(card, /네이버 플레이스/);

  assert.match(
    css,
    /\.location-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.location-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(css, /\.location-jump\s*\{[\s\S]*?min-height:\s*48px/);
});

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

  const headerRule = css.match(/\.site-header\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(headerRule, /isolation: isolate;/);
  assert.match(headerRule, /background: var\(--ink\);/);
});

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

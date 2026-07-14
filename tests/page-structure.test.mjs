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

test("external actions use safe links and accessible labels", async () => {
  const files = await Promise.all(
    [
      "hero-section.tsx",
      "location-section.tsx",
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

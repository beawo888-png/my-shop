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

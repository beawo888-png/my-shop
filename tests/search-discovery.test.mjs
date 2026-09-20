import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("sitemap exposes every public canonical route", async () => {
  const sitemap = await read("app/sitemap.ts");

  assert.match(sitemap, /MetadataRoute\.Sitemap/);
  assert.match(sitemap, /PANGYO_MENU_GROUP_IDS\.map/);
  for (const route of ["/", "/en", "/zh", "/ja", "/menu", "/reviews"]) {
    assert.ok(sitemap.includes(`"${route}"`));
  }
  assert.match(sitemap, /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com/);
  assert.doesNotMatch(sitemap, /#location-|naver\.com|kakao\.com/);
  assert.doesNotMatch(sitemap, /\/(?:en|zh|ja)\/(?:menu|reviews)/);
});

test("robots permits crawling and advertises the canonical sitemap", async () => {
  const robots = await read("app/robots.ts");

  assert.match(robots, /MetadataRoute\.Robots/);
  assert.match(robots, /userAgent:\s*"\*"/);
  assert.match(robots, /allow:\s*"\/"/);
  assert.match(
    robots,
    /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com\/sitemap\.xml/,
  );
});

test("menu index declares its own canonical route", async () => {
  const menuPage = await read("app/menu/page.tsx");

  assert.match(
    menuPage,
    /alternates:\s*\{\s*canonical:\s*"\/menu"\s*\}/,
  );
});

test("root metadata publishes the Naver ownership verification token", async () => {
  const layout = await read("app/layout.tsx");

  assert.match(layout, /verification:\s*\{/);
  assert.match(
    layout,
    /"naver-site-verification":\s*"d03494c18b6c877e56cbcf21fdccb87639bf62d8"/,
  );
});

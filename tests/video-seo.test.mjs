import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("every site video has a watch page entry, thumbnail and video file", async () => {
  const source = await read("lib/video-content.ts");
  const slugs = [...source.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(slugs, [
    "lamb-leg-promo",
    "signature-01",
    "signature-02",
    "signature-03",
    "signature-04",
  ]);
  for (const path of [...source.matchAll(/(?:src|thumbnail): "([^"]+)"/g)].map((m) => m[1])) {
    await access(new URL(`../public${path}`, import.meta.url));
  }
});

test("watch pages render a playable video with VideoObject data", async () => {
  const page = await read("app/videos/[slug]/page.tsx");
  assert.match(page, /<video[\s\S]*?poster=\{video\.thumbnail\}[\s\S]*?controls/);
  assert.doesNotMatch(page, /autoPlay|aria-hidden/);
  assert.match(page, /application\/ld\+json/);
  assert.match(page, /buildVideoObject\(video\)/);

  const data = await read("lib/video-content.ts");
  for (const field of ["name", "description", "thumbnailUrl", "uploadDate", "contentUrl", "duration"]) {
    assert.match(data, new RegExp(`\\b${field}:`), `VideoObject needs ${field}`);
  }
});

test("sitemap lists video pages with video entries", async () => {
  const sitemap = await read("app/sitemap.ts");
  assert.match(sitemap, /\/videos"/);
  assert.match(sitemap, /videos: \[/);
  assert.match(sitemap, /thumbnail_loc/);
  assert.match(sitemap, /content_loc/);
});

test("homepage signature cards link to their watch pages", async () => {
  const section = await read("components/home/signature-menu-section.tsx");
  for (let i = 1; i <= 4; i += 1) {
    assert.match(section, new RegExp(`page: "/videos/signature-0${i}"`));
    assert.match(section, new RegExp(`poster: "/images/videos/signature-0${i}.jpg"`));
  }
  assert.match(section, /href=\{video\.page\}/);
});

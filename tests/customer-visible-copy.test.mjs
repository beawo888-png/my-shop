import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const publicFiles = [
  "app/page.tsx",
  "app/reviews/page.tsx",
  "app/menu/page.tsx",
  "components/home/site-header.tsx",
  "components/home/site-footer.tsx",
  "components/home/hero-section.tsx",
  "components/home/story-section.tsx",
  "components/home/signature-menu-section.tsx",
  "components/home/group-dining-section.tsx",
  "components/home/reviews-section.tsx",
  "components/home/location-section.tsx",
];

test("customer-facing pages do not expose admin links or developer terminology", async () => {
  const source = (
    await Promise.all(
      publicFiles.map((path) =>
        readFile(new URL(`../${path}`, import.meta.url), "utf8"),
      ),
    )
  ).join("\n");

  assert.doesNotMatch(source, /\/admin(?:\/|["'])/);
  for (const term of ["SEO", "GEO", "LLM", "JSON-LD", "schema.org", "구조화 데이터"]) {
    assert.equal(source.includes(term), false, `customer source exposes ${term}`);
  }
});

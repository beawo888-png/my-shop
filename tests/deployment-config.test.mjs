import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const vercelIgnore = await readFile(
  new URL("../.vercelignore", import.meta.url),
  "utf8",
).catch(() => "");

test("Vercel deployment excludes local-only work files", () => {
  const ignoredEntries = new Set(vercelIgnore.split(/\r?\n/));
  for (const entry of [
    ".vercel",
    ".superpowers",
    "GEO SEO SEO.pdf",
    "*.log",
    "초안",
    "초안-exports",
  ]) {
    assert.ok(ignoredEntries.has(entry), `${entry} should be ignored`);
  }
});

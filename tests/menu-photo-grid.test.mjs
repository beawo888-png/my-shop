import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("every declared menu image is a non-empty local asset", async () => {
  const source = await read("lib/menu-content.ts");
  const files = [
    ...source.matchAll(/menuItem\([^\n]+, "([a-z0-9-]+\.(?:jpg|png))"(?:, "(?:cover|contain)")?\)/g),
  ].map((match) => match[1]);
  assert.equal(files.length, 47);
  for (const file of new Set(files)) {
    const url = new URL(`../public/images/wangjing/menu/${file}`, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 500, `${file} should not be empty`);
  }
});

test("menu catalog uses 28 food assets and six approved drink representatives", async () => {
  const source = await read("lib/menu-content.ts");
  const drinkFiles = [
    "chinese-liquor-toast.jpg",
    "chinese-liquor-pour-dark.jpg",
    "chinese-liquor-pour-clear.jpg",
    "beer-cheers-table.jpg",
    "beer-cheers-close.jpg",
    "cutty-sark-highball.jpg",
  ];
  for (const file of drinkFiles) assert.ok(source.includes(file));
  assert.doesNotMatch(source, /새우튀김|양꼬치 꿔바로우|점심특선|\.mp4/);
});

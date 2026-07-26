# Search Sitemap and Robots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish valid `/sitemap.xml` and `/robots.txt` metadata routes for every public Wangjing page and verify them in production.

**Architecture:** Use the Next.js 16 App Router metadata conventions `app/sitemap.ts` and `app/robots.ts`. Derive menu-category sitemap entries from the existing `PANGYO_MENU_GROUP_IDS` source so route generation and discovery remain synchronized.

**Tech Stack:** Next.js 16.2.10, TypeScript, Node.js test runner, Vercel

## Global Constraints

- Canonical origin: `https://xn--vr0bn4e2wh79mca68ih9mf4j.com`
- Include exactly the eight public routes described by the approved design.
- Do not include fragment URLs, external booking URLs, query variants, nonexistent location routes, or internal Next.js assets.
- Permit all search crawlers and advertise the canonical sitemap URL.
- This is non-visual work; do not modify the Pencil source `초안`.
- Follow the installed Next.js documentation in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/`.

---

### Task 1: Add failing metadata-route contract tests

**Files:**
- Create: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `PANGYO_MENU_GROUP_IDS` source text and Next.js metadata file conventions.
- Produces: Static contract tests for `app/sitemap.ts` and `app/robots.ts`.

- [ ] **Step 1: Write the failing tests**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("sitemap exposes every public canonical route", async () => {
  const sitemap = await read("app/sitemap.ts");

  assert.match(sitemap, /MetadataRoute\.Sitemap/);
  assert.match(sitemap, /PANGYO_MENU_GROUP_IDS\.map/);
  for (const route of ["/", "/menu", "/reviews"]) {
    assert.ok(sitemap.includes(`"${route}"`));
  }
  assert.match(sitemap, /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com/);
  assert.doesNotMatch(sitemap, /#location-|naver\.com|kakao\.com/);
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
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `node --test tests/search-discovery.test.mjs`

Expected: two failures because `app/sitemap.ts` and `app/robots.ts` do not exist.

- [ ] **Step 3: Commit the red tests**

```bash
git add tests/search-discovery.test.mjs
git commit -m "test: define search discovery metadata contracts"
```

### Task 2: Implement the sitemap metadata route

**Files:**
- Create: `app/sitemap.ts`
- Test: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `PANGYO_MENU_GROUP_IDS: PangyoMenuGroupId[]` from `@/lib/menu-content`.
- Produces: default function `sitemap(): MetadataRoute.Sitemap`, served by Next.js as `/sitemap.xml`.

- [ ] **Step 1: Add the minimal sitemap implementation**

```ts
import type { MetadataRoute } from "next";
import { PANGYO_MENU_GROUP_IDS } from "@/lib/menu-content";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryPages: MetadataRoute.Sitemap =
    PANGYO_MENU_GROUP_IDS.map((category) => ({
      url: `${SITE_URL}/menu/${category}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/menu`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reviews`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...categoryPages,
  ];
}
```

- [ ] **Step 2: Run the sitemap contract test**

Run: `node --test --test-name-pattern="sitemap exposes" tests/search-discovery.test.mjs`

Expected: PASS.

- [ ] **Step 3: Commit the sitemap**

```bash
git add app/sitemap.ts
git commit -m "feat: publish canonical sitemap"
```

### Task 3: Implement the robots metadata route

**Files:**
- Create: `app/robots.ts`
- Test: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: canonical production origin.
- Produces: default function `robots(): MetadataRoute.Robots`, served by Next.js as `/robots.txt`.

- [ ] **Step 1: Add the minimal robots implementation**

```ts
import type { MetadataRoute } from "next";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Run all focused discovery tests**

Run: `node --test tests/search-discovery.test.mjs`

Expected: two passing tests.

- [ ] **Step 3: Commit the robots route**

```bash
git add app/robots.ts
git commit -m "feat: publish crawler policy"
```

### Task 4: Verify the complete application

**Files:**
- Verify: `app/sitemap.ts`
- Verify: `app/robots.ts`
- Verify: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: completed metadata routes.
- Produces: test and build evidence that the routes compile with Next.js 16.

- [ ] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass, including the two new search-discovery tests.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0 and route output containing `/robots.txt` and `/sitemap.xml`.

- [ ] **Step 4: Confirm the worktree contains only intended implementation changes**

Run: `git status --short`

Expected: no uncommitted files after Tasks 1–3.

### Task 5: Deploy and verify production endpoints

**Files:**
- Read: `vercel.json`
- Read: `.vercel/project.json` when available

**Interfaces:**
- Consumes: verified commits and the existing Vercel project binding.
- Produces: production `/sitemap.xml` and `/robots.txt` endpoints.

- [ ] **Step 1: Inspect the existing deployment binding**

Run: `Get-Content -Raw -LiteralPath '.vercel\\project.json'`

Expected: an existing Vercel project ID and organization ID for this site. If the binding is absent, use the existing repository deployment workflow rather than creating a new project.

- [ ] **Step 2: Deploy the verified source**

Run the repository's existing production deployment command. For a bound Vercel project:

```powershell
npx vercel --prod
```

Expected: a successful production deployment URL for the already configured Wangjing project.

- [ ] **Step 3: Verify the production sitemap**

Open: `https://왕징양다리양꼬치.com/sitemap.xml`

Expected: HTTP 200 XML containing the homepage, `/menu`, `/reviews`, and five menu-category URLs.

- [ ] **Step 4: Verify the production robots policy**

Open: `https://왕징양다리양꼬치.com/robots.txt`

Expected:

```text
User-Agent: *
Allow: /

Sitemap: https://xn--vr0bn4e2wh79mca68ih9mf4j.com/sitemap.xml
```

- [ ] **Step 5: Submit the sitemap in Search Console**

In the verified Domain property, open **Sitemaps**, enter `sitemap.xml`, and select **Submit**.

Expected: Search Console accepts the sitemap. Processing may remain pending before changing to success.

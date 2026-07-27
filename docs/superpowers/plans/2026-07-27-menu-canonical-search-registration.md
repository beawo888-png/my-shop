# Menu Canonical and Search Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the `/menu` canonical URL, verify the production SEO endpoints, and prepare the verified site for Google Search Console and Naver Search Advisor submission.

**Architecture:** Keep the existing Next.js metadata-route architecture unchanged. Add page-local canonical metadata to `/menu`, protect it with a focused source-contract test, then verify all local and production SEO signals before performing authenticated search-engine registration.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript, Node.js test runner, ESLint, Vercel, Google Search Console, Naver Search Advisor

## Global Constraints

- Use `https://xn--vr0bn4e2wh79mca68ih9mf4j.com` as the canonical origin.
- `/menu` must emit `https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu` as its canonical URL.
- Do not alter the existing sitemap route list or crawler policy.
- Do not alter any user-facing screen, component, layout, or interaction.
- Preserve all existing commits and unrelated files.
- Pause for the user when login, CAPTCHA, DNS access, or final external submission confirmation is required.

---

### Task 1: Protect and correct the `/menu` canonical

**Files:**
- Modify: `tests/search-discovery.test.mjs`
- Modify: `app/menu/page.tsx`

**Interfaces:**
- Consumes: Next.js `Metadata` and the root `metadataBase`.
- Produces: page-local `metadata.alternates.canonical` equal to `"/menu"`.

- [ ] **Step 1: Write the failing test**

Append this test to `tests/search-discovery.test.mjs`:

```js
test("menu index declares its own canonical route", async () => {
  const menuPage = await read("app/menu/page.tsx");

  assert.match(
    menuPage,
    /alternates:\s*\{\s*canonical:\s*"\/menu"\s*\}/,
  );
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
node --test tests/search-discovery.test.mjs
```

Expected: the new `menu index declares its own canonical route` test fails because `app/menu/page.tsx` does not yet contain `alternates: { canonical: "/menu" }`.

- [ ] **Step 3: Add the minimal page-local metadata**

Change the metadata in `app/menu/page.tsx` to:

```tsx
export const metadata: Metadata = {
  title: "전체 메뉴 | 왕징양다리양꼬치",
  description: "모란본점과 판교점에서 제공하는 왕징 메뉴 44개",
  alternates: { canonical: "/menu" },
};
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
node --test tests/search-discovery.test.mjs
```

Expected: all tests in `tests/search-discovery.test.mjs` pass.

- [ ] **Step 5: Commit the tested correction**

```bash
git add tests/search-discovery.test.mjs app/menu/page.tsx
git commit -m "fix: declare menu canonical route"
```

### Task 2: Verify the complete application

**Files:**
- Verify only; no expected file changes.

**Interfaces:**
- Consumes: the corrected metadata and all existing application tests.
- Produces: test, lint, and production-build evidence.

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all Node tests pass with zero failures.

- [ ] **Step 2: Run ESLint**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Build the production application**

Run:

```bash
npm run build
```

Expected: Next.js exits successfully and lists `/`, `/menu`, `/reviews`, `/robots.txt`, `/sitemap.xml`, and the five menu category routes.

- [ ] **Step 4: Confirm no generated or accidental files were added**

Run:

```bash
git status --short
git diff --check
```

Expected: no uncommitted files and no whitespace errors.

### Task 3: Synchronize GitHub and verify Vercel production

**Files:**
- No source-file changes.

**Interfaces:**
- Consumes: verified local `main` commits and configured `origin`.
- Produces: synchronized GitHub history and a successful Vercel production deployment.

- [ ] **Step 1: Review commits that are not yet on GitHub**

Run:

```bash
git log --oneline origin/main..main
```

Expected: only the previously reviewed local commits plus the canonical correction and its documentation are listed.

- [ ] **Step 2: Push the verified `main` branch**

Run:

```bash
git push origin main
```

Expected: `main` is updated successfully on `https://github.com/beawo888-png/my-shop.git`.

- [ ] **Step 3: Wait for the connected Vercel production deployment**

Use the connected Vercel project `my-shop-39ab` or its deployment UI and wait until the production deployment reports `Ready`.

- [ ] **Step 4: Verify production SEO responses**

Request:

```text
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/robots.txt
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/sitemap.xml
```

Expected:

- `/menu` returns HTTP 200 and contains `<link rel="canonical" href="https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu">`.
- `/robots.txt` returns HTTP 200, allows `/`, and references the production sitemap.
- `/sitemap.xml` returns HTTP 200 as XML and contains all eight public canonical routes.

### Task 4: Register and submit in Google Search Console

**Files:**
- No source-file changes unless Google requires an HTML verification token instead of DNS verification.

**Interfaces:**
- Consumes: the deployed production domain, DNS-provider access, and the user's authenticated Google account.
- Produces: a verified Search Console property with a submitted sitemap.

- [ ] **Step 1: Add a Domain property**

Open Google Search Console, choose **Add property**, select **Domain**, and enter:

```text
xn--vr0bn4e2wh79mca68ih9mf4j.com
```

- [ ] **Step 2: Complete DNS ownership verification**

Copy Google's exact TXT record into the domain's DNS provider. Do not modify the token. Wait for DNS propagation, then select **Verify**.

Expected: Google reports ownership verified for the Domain property.

- [ ] **Step 3: Submit the sitemap**

Open **Sitemaps** and submit:

```text
sitemap.xml
```

Expected: the sitemap status becomes `Success`; processing may take time.

- [ ] **Step 4: Request indexing for priority pages**

Use URL Inspection for:

```text
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/reviews
```

Request indexing once for each URL. Do not repeatedly resubmit the same URL.

### Task 5: Register and submit in Naver Search Advisor

**Files:**
- No source-file changes unless Naver requires an HTML meta verification token.

**Interfaces:**
- Consumes: the deployed production domain and the user's authenticated Naver account.
- Produces: a verified Naver site with submitted sitemap and crawl requests.

- [ ] **Step 1: Add the site**

Open Naver Search Advisor **웹마스터 도구** and add:

```text
https://xn--vr0bn4e2wh79mca68ih9mf4j.com
```

- [ ] **Step 2: Complete site ownership verification**

Prefer the HTML meta-tag method for the Next.js site if Naver offers it. Copy the exact verification token, add it to Next.js metadata, deploy, verify ownership, and keep the tag after verification. If DNS verification is offered and preferred, add Naver's exact DNS record instead.

Expected: Naver reports site ownership verified.

- [ ] **Step 3: Submit the sitemap**

Open **요청 → 사이트맵 제출** and submit:

```text
https://xn--vr0bn4e2wh79mca68ih9mf4j.com/sitemap.xml
```

Expected: the sitemap appears in the submitted sitemap list.

- [ ] **Step 4: Request collection for priority pages**

Open **요청 → 웹 페이지 수집** and request:

```text
/
/menu
/reviews
```

Expected: each request is accepted for processing. Indexing remains subject to Naver's crawler and quality evaluation.


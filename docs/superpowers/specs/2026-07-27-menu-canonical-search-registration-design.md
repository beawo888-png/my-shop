# Menu canonical and search registration design

## Goal

Ensure every public page on `왕징양다리양꼬치.com` declares its own canonical URL, then verify the deployed SEO endpoints before registering the site with Google Search Console and Naver Search Advisor.

## Current state

- The production site serves a valid `/robots.txt`.
- The production site serves a valid `/sitemap.xml` containing eight public routes.
- The homepage, review page, and menu category pages have appropriate canonical URLs.
- `/menu` inherits the root layout canonical and incorrectly declares the homepage as canonical.
- The local `main` branch is clean but is ten commits ahead of `origin/main`.
- The project is a Next.js 16 application connected to Vercel project `my-shop-39ab`.

## Chosen approach

Apply the smallest targeted metadata correction:

1. Add an explicit `/menu` canonical to the menu index page.
2. Extend the existing search-discovery test to prevent canonical regression.
3. Run focused tests, the complete test suite, lint, and a production build.
4. Verify canonical, robots, and sitemap responses from the production domain after deployment.
5. Register the canonical Punycode domain property with Google and Naver, submit `sitemap.xml`, and request indexing for the main public pages.

This is non-visual metadata work, so the Pencil-first workflow does not apply.

## URL policy

Use `https://xn--vr0bn4e2wh79mca68ih9mf4j.com` as the canonical origin. This is the ASCII/Punycode representation of `https://왕징양다리양꼬치.com`.

The `/menu` page must emit:

`https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu`

The sitemap remains unchanged because it already lists all eight public routes correctly.

## Verification

- A focused test reads `app/menu/page.tsx` and asserts that the page declares `/menu` as its canonical.
- Existing sitemap and robots tests continue to pass.
- The complete Node test suite passes.
- ESLint passes.
- `next build` succeeds.
- The deployed `/menu` HTML exposes the exact `/menu` canonical.
- Production `/robots.txt` and `/sitemap.xml` return HTTP 200 with the expected content types and URLs.

## Deployment and registration

Do not overwrite or discard existing commits. Push the clean `main` history to the configured GitHub origin only after verification. Confirm the Vercel production deployment before submitting the sitemap.

Google Search Console and Naver Search Advisor registration require the user's authenticated browser sessions and may require DNS ownership verification. Pause for the user when login, CAPTCHA, DNS access, or final external submission confirmation is required.


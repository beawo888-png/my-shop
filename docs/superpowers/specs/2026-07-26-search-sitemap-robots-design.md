# Search sitemap and robots design

## Goal

Expose a valid XML sitemap and robots.txt for `왕징양다리양꼬치.com` so Google Search Console can discover the site's public pages and associate the sitemap with the verified Domain property.

## Scope

Add Next.js metadata routes for:

- `/sitemap.xml`
- `/robots.txt`

This is a non-visual search-engine integration. The Pencil-first workflow does not apply because no user-facing screen, layout, component, or interaction changes.

## Canonical origin

Use the existing canonical origin from `app/layout.tsx`:

`https://xn--vr0bn4e2wh79mca68ih9mf4j.com`

This is the ASCII/Punycode form of `https://왕징양다리양꼬치.com` and avoids inconsistent URL encoding across generated metadata.

## Sitemap contents

The sitemap contains the eight public, indexable routes currently defined by the application:

1. `/`
2. `/menu`
3. `/reviews`
4. `/menu/signature-lamb-leg`
5. `/menu/lamb-skewers`
6. `/menu/chinese-dishes`
7. `/menu/meals`
8. `/menu/drinks`

The category routes are derived from `PANGYO_MENU_GROUP_IDS`, the same source used by `generateStaticParams`, so the sitemap remains aligned with the statically generated menu pages.

The homepage receives the highest priority. Menu and review landing pages receive the next priority, and category pages receive a lower priority. Change frequencies are descriptive hints only and do not promise Google crawling behavior.

## Robots policy

Allow all user agents to crawl the public site and advertise the canonical sitemap URL. Do not add crawl-delay or bot-specific directives.

## Error prevention

- Keep the canonical origin in one sitemap module constant.
- Generate category URLs from the authoritative menu category list.
- Do not include nonexistent location routes, fragment links, external booking links, or query-string variants.
- Do not include internal Next.js assets or 404 routes.

## Verification

Add focused tests that verify:

- the sitemap metadata route exists;
- all eight canonical URLs are generated;
- no unsupported route is included;
- robots.txt permits crawling;
- robots.txt points to the canonical sitemap;
- the production build succeeds.

After deployment, verify that both production endpoints return successful responses and that `/sitemap.xml` is XML rather than the previous 404 page.

## Deployment and Search Console handoff

Deploy through the project's existing Vercel deployment configuration. After production verification, submit `sitemap.xml` in Google Search Console. Do not repeatedly request indexing for the already indexed homepage.

# Verification Gates Repair Design

## Goal

Restore trustworthy repository verification without changing the approved user-facing design. The repository is complete only when the full test suite, ESLint, production build, and diff checks all pass.

## Scope

- Diagnose the six currently failing tests against the implementation and approved requirements.
- Preserve tests that represent real product requirements.
- Update assertions only when they are stale or coupled to irrelevant source ordering.
- Fix ESLint scope so generated files inside local worktrees are not linted.
- Ignore local preview logs and update the existing implementation-plan checklist to reflect verified work.
- Do not alter the Pencil source or application visuals unless investigation proves an actual product defect.

## Approach

For every failing test, compare its assertion with the corresponding component, content data, and CSS. If the behavior is absent, add the smallest product fix after proving the failure. If the behavior exists and only the source-text assertion is stale, replace it with a focused assertion that checks the current contract without depending on unrelated selector or media-query order.

ESLint will continue to inspect application and test source, while generated output under `.worktrees/**` is excluded. Local `dev-preview*.log` files will be ignored because they are runtime artifacts rather than project source.

## Files

Expected changes are limited to:

- `tests/page-structure.test.mjs`
- `tests/home-seo-content.test.mjs`
- `tests/site-content.test.mjs`
- `eslint.config.mjs`
- `.gitignore`
- `docs/superpowers/plans/2026-07-19-review-platform-colors-and-kakao-links.md`

Application files may change only if root-cause investigation demonstrates that a tested requirement is genuinely missing.

## Verification

Run each failing test during diagnosis, then run these complete gates from the repository root:

1. `npm test`
2. `npm run lint`
3. `npm run build`
4. `git diff --check`

Success requires zero test failures, zero lint errors, a successful production build, and no whitespace errors. The final diff must contain no unrelated changes and must preserve the review-button colors, direct Kakao review URLs, link safety attributes, responsive behavior, and accessible labels.

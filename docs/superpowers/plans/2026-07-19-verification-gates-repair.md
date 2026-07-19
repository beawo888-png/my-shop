# Verification Gates Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repository's test, lint, build, and diff verification gates pass without changing the approved user-facing design.

**Architecture:** Treat application behavior and verification infrastructure as separate responsibilities. First prove whether each failing assertion represents a missing requirement or a stale source-text check, then apply the smallest correction; separately exclude generated worktree output and local preview logs from source verification.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, CSS, Node.js built-in test runner, ESLint 9

## Global Constraints

- Preserve the approved review-button colors, direct Kakao review URLs, link order, new-tab behavior, accessible labels, and responsive layouts.
- Do not change application visuals unless a failing test proves an approved requirement is genuinely absent.
- Do not modify the Pencil source because this work repairs verification infrastructure rather than visual design.
- Keep source assertions focused on the relevant selector block instead of depending on unrelated media-query order.
- Success requires `npm test`, `npm run lint`, `npm run build`, and `git diff --check` to exit with code 0.

---

### Task 1: Repair stale and malformed regression assertions

**Files:**
- Modify: `tests/page-structure.test.mjs:91-310`
- Modify if evidence requires it: `tests/home-seo-content.test.mjs:82-120`
- Modify if evidence requires it: `tests/site-content.test.mjs:73-95`
- Inspect only unless a real requirement is missing: `app/globals.css`
- Inspect only unless a real requirement is missing: `lib/site-content.ts`

**Interfaces:**
- Consumes: CSS selector blocks and `LOCATIONS` fields as plain source text.
- Produces: Regression assertions that check the approved contracts without accidental argument placement or cross-media-query matching.

- [x] **Step 1: Reproduce each of the six failures independently**

Run:

```powershell
node --test --test-name-pattern="home exposes two Restaurant|homepage Instagram videos|reviews page uses|home header uses|mobile menu exposes|location data defines" tests/home-seo-content.test.mjs tests/page-structure.test.mjs tests/site-content.test.mjs
```

Expected: six failures matching the current full-suite output.

- [x] **Step 2: Compare each assertion with its exact source block**

Inspect selector blocks independently rather than searching from the first matching media query:

```powershell
Select-String -Path app/globals.css -Pattern "signature-video-grid|reviews-page__grid|site-header--home|desktop-nav|story__standards|story__promise-grid|group-seo__branch-grid" -Context 2,8
Select-String -Path lib/site-content.ts -Pattern "parking:|googleDirectionsUrl:" -Context 0,2
```

Expected: evidence identifying malformed assertions separately from genuinely stale names or values.

- [x] **Step 3: Correct malformed `assert.match` calls**

Every call must use exactly the source and one regular expression, for example:

```js
assert.match(
  css,
  /\.signature-video-card__frame\s*\{[^}]*aspect-ratio:/,
);
```

Remove accidental duplicated `css` arguments and restore any regular expressions that were displaced into another assertion's message parameter.

- [x] **Step 4: Make responsive assertions target bounded blocks**

Where repeated `@media (max-width: 767px)` blocks make a global regex ambiguous, assert the relevant selector and declaration together using the current source contract, for example:

```js
assert.match(
  css,
  /@media \(max-width: 767px\)\s*\{[^}]*(?:\}[^}]*)*?\.reviews-page__grid\s*\{[^}]*grid-template-columns:\s*1fr;/s,
);
```

If investigation shows this expression is still coupled to unrelated braces, extract the matching media block with the existing test helper pattern and assert against that block. Do not weaken the required declaration.

- [x] **Step 5: Align stale content expectations with approved current copy**

If both locations already provide non-empty `parking` and `googleDirectionsUrl` values, assert those current exact approved strings and URLs rather than obsolete copy. Keep assertions for both branches and their order.

- [x] **Step 6: Run the focused tests and verify green**

Run:

```powershell
node --test tests/home-seo-content.test.mjs tests/page-structure.test.mjs tests/site-content.test.mjs
```

Expected: all tests in the three files pass with zero failures.

- [x] **Step 7: Review the task diff**

Run:

```powershell
git diff -- tests/page-structure.test.mjs tests/home-seo-content.test.mjs tests/site-content.test.mjs app/globals.css lib/site-content.ts
```

Expected: only assertion repairs unless investigation proved an application requirement was missing.

---

### Task 2: Restrict lint and ignore runtime artifacts

**Files:**
- Modify: `eslint.config.mjs:9-15`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: repository-local worktrees and preview server output.
- Produces: ESLint scope limited to maintained source and Git ignore rules for local logs.

- [x] **Step 1: Preserve the lint failure as the regression reproduction**

Run:

```powershell
npm run lint
```

Expected: FAIL with errors under `.worktrees/group-card-safe/.next/**`.

- [x] **Step 2: Add generated-worktree ignores**

Extend `globalIgnores`:

```js
globalIgnores([
  ".next/**",
  "out/**",
  "build/**",
  "next-env.d.ts",
  ".worktrees/**",
]);
```

- [x] **Step 3: Ignore local preview logs**

Add to the debug section of `.gitignore`:

```gitignore
dev-preview*.log
```

- [x] **Step 4: Verify lint is clean**

Run:

```powershell
npm run lint
```

Expected: exit code 0 with no lint errors.

- [x] **Step 5: Verify preview logs are ignored**

Run:

```powershell
git status --short --ignored dev-preview.log dev-preview-error.log
```

Expected: both files appear with `!!` and not `??`.

---

### Task 3: Reconcile documentation and run all gates

**Files:**
- Modify: `docs/superpowers/plans/2026-07-19-review-platform-colors-and-kakao-links.md`
- Modify: `docs/superpowers/plans/2026-07-19-verification-gates-repair.md`

**Interfaces:**
- Consumes: fresh command results from Tasks 1 and 2.
- Produces: Accurate task checklists and a fully verified working tree.

- [x] **Step 1: Run full verification**

Run each command separately and record only observed success:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits with code 0; the test output reports zero failures.

- [x] **Step 2: Update the earlier implementation checklist**

Change each completed item in `2026-07-19-review-platform-colors-and-kakao-links.md` from `- [ ]` to `- [x]` only after its corresponding command or diff has been verified.

- [x] **Step 3: Update this plan checklist**

Mark only executed and verified steps complete. Leave no completed claim unsupported by fresh command output.

- [x] **Step 4: Review final scope**

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: no preview logs are untracked, no whitespace errors exist, and all changes belong to the approved verification repair or the pre-existing review-button task.

# AI·검색 봇 방문 분석 Implementation Plan

> **For agentic workers:** Use `superpowers-dispatching-parallel-agents` with Hermes `delegate_task`, or use `superpowers-executing-plans` inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 왕징양다리양꼬치 공개 페이지에 들어오는 검색·AI 봇 요청을 개인정보 최소화 원칙으로 기록하고, 인증된 운영자가 최근 30일 통계를 확인하는 관리자 화면을 구축한다.

**Architecture:** Next.js 16 `proxy.ts`가 공개 GET 요청을 선별하고 User-Agent를 분류한 뒤 `after()`에서 Neon Postgres에 비동기 기록한다. 분류·요청 정책·이벤트 정제·통계·인증을 순수 모듈로 분리해 먼저 테스트하고, `/admin/login`과 `/admin/ai-visits`가 서명된 HttpOnly 세션을 사용한다.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Node test runner + tsx, Neon serverless Postgres, Node `crypto`, Vercel

## Global Constraints

- 일반 고객 화면에는 SEO, GEO, LLM, JSON-LD, schema.org, 구조화 데이터 같은 개발자 용어를 추가로 노출하지 않는다.
- raw IP, 이름, 전화번호, Cookie 원문, Session 원문, URL query·fragment를 분석 이벤트에 저장하지 않는다.
- 관리자 인증과 DB 설정이 없거나 잘못되면 fail-closed로 동작한다.
- 방문 기록 실패는 공개 홈페이지 응답을 중단하지 않는다.
- Next.js 16 API는 `node_modules/next/dist/docs/`의 현재 문서를 기준으로 구현한다.
- 관리자 UI를 코드로 만들기 전에 Pencil 파일 `C:\vibecoding\my-shop\초안`을 먼저 갱신한다.
- Neon·Vercel 약관, 요금제, 결제, 본인 확인은 사용자 승인 없이 진행하지 않는다.
- 모든 프로덕션 함수는 예상 이유로 실패한 테스트를 먼저 확인한 뒤 구현한다.

---

## File Map

**Create**

- `lib/ai-visits/types.ts` — 목적·봇·이벤트·통계 타입
- `lib/ai-visits/bot-catalog.ts` — 단일 봇 분류표
- `lib/ai-visits/classify-ai-bot.ts` — User-Agent 분류
- `lib/ai-visits/request-policy.ts` — 추적 가능한 공개 요청 판정
- `lib/ai-visits/event.ts` — 개인정보를 제거한 이벤트 생성
- `lib/ai-visits/summarize.ts` — 최근/직전 30일 집계
- `lib/ai-visits/repository.ts` — Neon INSERT·SELECT와 마이그레이션 연결
- `lib/ai-visits/record.ts` — 실패 비차단 기록 경계
- `lib/admin/session.ts` — 세션 발급·검증
- `lib/admin/password.ts` — scrypt 비밀번호 검증
- `lib/admin/redirect.ts` — 안전한 next 및 관리자 URL 보정
- `lib/admin/rate-limit.ts` — HMAC 식별값 기반 로그인 제한
- `proxy.ts` — URL 보정과 앱 레벨 방문 수집
- `app/admin/admin.css` — 관리자 전용 스타일
- `app/admin/layout.tsx` — 관리자 전용 레이아웃
- `app/admin/login/page.tsx` — 로그인 화면
- `app/admin/ai-visits/page.tsx` — 대시보드
- `app/api/admin/login/route.ts` — 로그인 처리
- `app/api/admin/logout/route.ts` — 로그아웃 처리
- `scripts/migrate-ai-visits.mjs` — DB 스키마 적용
- `scripts/generate-admin-secrets.mjs` — 비밀번호 해시와 세션 비밀키 생성
- `tests/ai-bot-classifier.test.mts`
- `tests/ai-visit-policy.test.mts`
- `tests/ai-visit-event.test.mts`
- `tests/ai-visit-summary.test.mts`
- `tests/admin-security.test.mts`
- `tests/admin-dashboard.test.mts`
- `tests/proxy.test.mts`
- `tests/customer-visible-copy.test.mjs`

**Modify**

- `package.json` — `tsx`, Neon 드라이버와 DB 스크립트
- `package-lock.json` — 잠금 파일
- `.env.example` — 비밀값 이름만 문서화
- `.gitignore` — 로컬 환경변수·검증 산출물 제외 확인
- `초안` — 관리자 로그인·대시보드 Pencil 프레임

---

### Task 1: TypeScript 테스트 실행기와 봇 분류기

**Files:**
- Modify: `package.json`
- Create: `lib/ai-visits/types.ts`
- Create: `lib/ai-visits/bot-catalog.ts`
- Create: `lib/ai-visits/classify-ai-bot.ts`
- Create: `tests/ai-bot-classifier.test.mts`

**Interfaces:**
- Produces: `classifyAiBot(userAgent: string | null): ClassifiedBot | null`
- Produces: `Purpose = "search_indexing" | "training" | "realtime_citation" | "other"`

- [ ] **Step 1: Install only the required runtime and test dependencies**

Run:

```bash
npm install @neondatabase/serverless
npm install --save-dev tsx
```

Expected: `package.json` and `package-lock.json` update with no audit install failure.

- [ ] **Step 2: Add the TypeScript test command**

Set scripts to preserve existing `.mjs` tests and add `.mts` tests:

```json
{
  "test": "node --test tests/*.test.mjs && tsx --test tests/*.test.mts",
  "test:ts": "tsx --test tests/*.test.mts",
  "db:migrate": "node scripts/migrate-ai-visits.mjs",
  "admin:secrets": "node scripts/generate-admin-secrets.mjs"
}
```

- [ ] **Step 3: Write the failing classifier tests**

The test must contain a table covering every requested token and expected purpose, including overlapping Google tokens and the generic fallback:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAiBot } from "../lib/ai-visits/classify-ai-bot";

const cases = [
  ["GPTBot/1.0", "gptbot", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "realtime_citation"],
  ["OAI-AdsBot/1.0", "oai-adsbot", "other"],
  ["ClaudeBot/1.0", "claudebot", "training"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "search_indexing"],
  ["Claude-User/1.0", "claude-user", "realtime_citation"],
  ["Claude-Web/1.0", "claude-web", "realtime_citation"],
  ["anthropic-ai", "anthropic-ai", "training"],
  ["PerplexityBot/1.0", "perplexitybot", "search_indexing"],
  ["Perplexity-User/1.0", "perplexity-user", "realtime_citation"],
  ["Googlebot/1.0", "googlebot", "search_indexing"],
  ["Googlebot-Image/1.0", "googlebot-image", "search_indexing"],
  ["Googlebot-Video/1.0", "googlebot-video", "search_indexing"],
  ["GoogleOther/1.0", "googleother", "search_indexing"],
  ["GoogleOther-Image/1.0", "googleother-image", "search_indexing"],
  ["GoogleOther-Video/1.0", "googleother-video", "search_indexing"],
  ["Google-Extended", "google-extended", "training"],
  ["Yeti/1.1", "yeti", "search_indexing"],
  ["NaverBot/1.0", "naverbot", "search_indexing"],
  ["bingbot/2.0", "bingbot", "search_indexing"],
  ["msnbot/2.0", "msnbot", "search_indexing"],
  ["BingPreview/1.0", "bingpreview", "search_indexing"],
  ["MicrosoftPreview/1.0", "microsoftpreview", "search_indexing"],
  ["Applebot/1.0", "applebot", "search_indexing"],
  ["Applebot-Extended/1.0", "applebot-extended", "training"],
  ["DuckAssistBot/1.2", "duckassistbot", "realtime_citation"],
  ["DuckDuckBot/1.0", "duckduckbot", "search_indexing"],
  ["Amazonbot/0.1", "amazonbot", "training"],
  ["Amzn-SearchBot/0.1", "amzn-searchbot", "search_indexing"],
  ["Amzn-User/0.1", "amzn-user", "realtime_citation"],
  ["Meta-WebIndexer/1.1", "meta-webindexer", "search_indexing"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "realtime_citation"],
  ["Meta-ExternalAgent/1.1", "meta-externalagent", "training"],
  ["Meta-ExternalAds/1.1", "meta-externalads", "other"],
  ["FacebookExternalHit/1.1", "facebookexternalhit", "other"],
  ["CCBot/2.0", "ccbot", "training"],
  ["Bytespider/1.0", "bytespider", "training"],
  ["YouBot/1.0", "youbot", "search_indexing"],
  ["cohere-ai", "cohere-ai", "training"],
  ["MistralAI-User/1.0", "mistralai-user", "realtime_citation"],
] as const;

for (const [ua, botId, purpose] of cases) {
  test(`${ua} => ${purpose}`, () => {
    const result = classifyAiBot(ua);
    assert.ok(result);
    assert.equal(result.botId, botId);
    assert.equal(result.purpose, purpose);
  });
}

test("specific tokens win over shorter overlapping tokens", () => {
  assert.equal(classifyAiBot("Googlebot-Image/1.0")?.botId, "googlebot-image");
  assert.equal(classifyAiBot("Applebot-Extended/1.0")?.botId, "applebot-extended");
});

test("generic crawler is other", () => {
  assert.equal(classifyAiBot("ExampleCrawler/1.0")?.purpose, "other");
});

test("normal browser and empty UA are ignored", () => {
  assert.equal(classifyAiBot("Mozilla/5.0 Chrome/140"), null);
  assert.equal(classifyAiBot(null), null);
});
```

- [ ] **Step 4: Run the classifier test and verify RED**

Run: `npx tsx --test tests/ai-bot-classifier.test.mts`

Expected: FAIL because `classify-ai-bot.ts` does not exist.

- [ ] **Step 5: Implement focused types, catalog, and longest-token-first classification**

Use this catalog shape:

```ts
export type BotCatalogEntry = {
  token: string;
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};
```

Export a catalog sorted in the classifier with:

```ts
const orderedCatalog = [...BOT_CATALOG].sort((a, b) => b.token.length - a.token.length);
```

The generic fallback returns stable values:

```ts
{
  botId: "other-crawler",
  botName: "기타 크롤러",
  vendor: "Unknown",
  purpose: "other"
}
```

- [ ] **Step 6: Run RED-to-GREEN verification**

Run: `npx tsx --test tests/ai-bot-classifier.test.mts`

Expected: all classifier cases PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json lib/ai-visits tests/ai-bot-classifier.test.mts
git commit -m "feat: classify AI and search bots"
```

---

### Task 2: 공개 요청 정책과 개인정보 안전 이벤트

**Files:**
- Create: `lib/ai-visits/request-policy.ts`
- Create: `lib/ai-visits/event.ts`
- Create: `tests/ai-visit-policy.test.mts`
- Create: `tests/ai-visit-event.test.mts`

**Interfaces:**
- Consumes: `ClassifiedBot`
- Produces: `isTrackablePublicRequest({ method, pathname }): boolean`
- Produces: `createVisitEvent({ pathname, userAgent, referrer, bot, now }): AiVisitInsert`

- [ ] **Step 1: Write failing request-policy tests**

Cover allowed paths `/`, `/menu`, `/menu/yang-kkochi`, `/reviews`; reject POST, `/admin`, `/api`, `/_next`, `/favicon.ico`, images, videos, CSS, JS, fonts, uploads, robots, sitemap, and unknown routes.

- [ ] **Step 2: Run policy test and verify RED**

Run: `npx tsx --test tests/ai-visit-policy.test.mts`

Expected: FAIL because request policy module is missing.

- [ ] **Step 3: Implement an explicit public route allow-list**

```ts
const EXACT_PUBLIC_PATHS = new Set(["/", "/menu", "/reviews"]);
const PUBLIC_PREFIXES = ["/menu/"];

export function isTrackablePublicRequest(input: { method: string; pathname: string }) {
  if (input.method !== "GET") return false;
  return EXACT_PUBLIC_PATHS.has(input.pathname) ||
    PUBLIC_PREFIXES.some((prefix) => input.pathname.startsWith(prefix));
}
```

Reject paths containing a file extension before applying prefixes.

- [ ] **Step 4: Verify policy GREEN**

Run: `npx tsx --test tests/ai-visit-policy.test.mts`

Expected: PASS.

- [ ] **Step 5: Write failing event privacy tests**

Assert that:

- `path` is pathname only and length-limited.
- User-Agent is length-limited.
- referrer keeps only same sanitized origin/path representation and removes query/fragment.
- event has no `ip`, `ipHash`, `cookie`, or `session` property.
- invalid referrer becomes `null`.

- [ ] **Step 6: Run event test and verify RED**

Run: `npx tsx --test tests/ai-visit-event.test.mts`

Expected: FAIL because event module is missing.

- [ ] **Step 7: Implement event normalization**

Use `new URL(referrer)` inside try/catch, return `${url.origin}${url.pathname}`, cap path/referrer at 2048 characters and User-Agent at 512 characters, and construct a new object from the allow-listed fields only.

- [ ] **Step 8: Verify event GREEN and commit**

Run:

```bash
npx tsx --test tests/ai-visit-policy.test.mts tests/ai-visit-event.test.mts
git add lib/ai-visits tests/ai-visit-policy.test.mts tests/ai-visit-event.test.mts
git commit -m "feat: sanitize AI visit events"
```

Expected: both test files PASS and commit succeeds.

---

### Task 3: 30일 통계와 Neon 저장소

**Files:**
- Create: `lib/ai-visits/summarize.ts`
- Create: `lib/ai-visits/repository.ts`
- Create: `lib/ai-visits/record.ts`
- Create: `scripts/migrate-ai-visits.mjs`
- Create: `tests/ai-visit-summary.test.mts`
- Create: `tests/ai-visit-record.test.mts`
- Create: `.env.example`

**Interfaces:**
- Produces: `summarizeVisits(rows: AiVisitRow[], now: Date): VisitSummary`
- Produces: `recordVisit(event, repository, logger): Promise<boolean>`
- Produces: `visitRepository.insert(event)` and `visitRepository.listSince(date)`

- [ ] **Step 1: Write failing summary tests**

Use a fixed `now` and rows around 30-day and 60-day boundaries. Assert purpose KPI, bot count, latest timestamp, deterministic top path, signed delta, percentage, and `isNew` when previous count is zero.

- [ ] **Step 2: Run summary test and verify RED**

Run: `npx tsx --test tests/ai-visit-summary.test.mts`

Expected: FAIL because summarizer is missing.

- [ ] **Step 3: Implement pure summary logic**

Use half-open periods:

```ts
current: createdAt >= now-30d && createdAt <= now
previous: createdAt >= now-60d && createdAt < now-30d
```

Sort bot rows by current count descending, then Korean bot name using `localeCompare("ko")`.

- [ ] **Step 4: Verify summary GREEN**

Run: `npx tsx --test tests/ai-visit-summary.test.mts`

Expected: PASS.

- [ ] **Step 5: Write failing non-blocking record test**

Inject a fake repository that throws and a logger spy. Assert `recordVisit()` resolves `false`, logs one warning without event values, and does not throw.

- [ ] **Step 6: Run record test and verify RED**

Run: `npx tsx --test tests/ai-visit-record.test.mts`

Expected: FAIL because record module is missing.

- [ ] **Step 7: Implement repository and record boundary**

Use `neon(process.env.DATABASE_URL)` only inside functions so test imports do not connect. Parameterize every SQL value. Throw a configuration error when `DATABASE_URL` is absent; catch it only at the public `recordVisit` boundary.

- [ ] **Step 8: Add migration script**

Create `ai_visits`, purpose CHECK constraint, three indexes, and the login rate-limit table with `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. The script must exit nonzero if `DATABASE_URL` is absent or SQL fails.

- [ ] **Step 9: Document environment variable names without secrets**

`.env.example` contains only:

```dotenv
DATABASE_URL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
ADMIN_IP_HASH_SECRET=
```

- [ ] **Step 10: Verify and commit**

Run:

```bash
npx tsx --test tests/ai-visit-summary.test.mts tests/ai-visit-record.test.mts
git diff --check
git add lib/ai-visits scripts/migrate-ai-visits.mjs tests .env.example
git commit -m "feat: persist and summarize AI visits"
```

Expected: tests PASS, diff check clean, commit succeeds.

---

### Task 4: 관리자 인증·리디렉션·로그인 제한

**Files:**
- Create: `lib/admin/password.ts`
- Create: `lib/admin/session.ts`
- Create: `lib/admin/redirect.ts`
- Create: `lib/admin/rate-limit.ts`
- Create: `scripts/generate-admin-secrets.mjs`
- Create: `tests/admin-security.test.mts`

**Interfaces:**
- Produces: `verifyPassword(candidate, encodedHash): boolean`
- Produces: `createSession(secret, now): string`
- Produces: `verifySession(token, secret, now): SessionPayload | null`
- Produces: `sanitizeAdminNext(value): "/admin/ai-visits"`
- Produces: `canonicalizeAdminPath(pathname): string | null`
- Produces: `hashLoginSource(rawIp, secret): string`

- [ ] **Step 1: Write failing security tests**

Cover valid/invalid scrypt password, tampered/expired session, missing secrets, external and scheme-relative next URLs, encoded quote URL correction, singular URL correction, stable HMAC output, and absence of raw IP in the rate-limit record.

- [ ] **Step 2: Run security test and verify RED**

Run: `npx tsx --test tests/admin-security.test.mts`

Expected: FAIL because admin modules are missing.

- [ ] **Step 3: Implement password and session primitives**

Password format:

```text
scrypt$N$r$p$saltBase64url$hashBase64url
```

Use `timingSafeEqual`. Session payload contains only `role: "admin"`, `iat`, and `exp`; encode payload and HMAC-SHA256 signature as base64url. Reject malformed values before comparison.

- [ ] **Step 4: Implement redirect sanitization**

`sanitizeAdminNext` always returns `/admin/ai-visits` unless the decoded input exactly matches the allow-listed route. Reject `//`, `\\`, a URL scheme, control characters, and decode errors.

`canonicalizeAdminPath` recognizes only the three approved malformed forms and returns `/admin/ai-visits`; all other paths return `null`.

- [ ] **Step 5: Implement login source hashing and DB window limiter**

Use `createHmac("sha256", secret).update(rawIp).digest("hex").slice(0, 16)`. Store only this value and expiration. Allow five failures per 15 minutes; a successful login clears the row.

- [ ] **Step 6: Implement the local secret generator**

The script accepts the password through a hidden prompt when interactive, never as a command-line argument, emits `ADMIN_PASSWORD_HASH`, and generates random 32-byte session and IP-HMAC secrets. It must never write secrets to git-tracked files.

- [ ] **Step 7: Verify and commit**

Run:

```bash
npx tsx --test tests/admin-security.test.mts
git diff --check
git add lib/admin scripts/generate-admin-secrets.mjs tests/admin-security.test.mts
git commit -m "feat: secure admin sessions"
```

Expected: security tests PASS and commit succeeds.

---

### Task 5: Proxy 수집과 잘못된 URL 보정

**Files:**
- Create: `proxy.ts`
- Create: `tests/proxy.test.mts`

**Interfaces:**
- Consumes: classifier, request policy, event builder, recorder, canonicalizer
- Produces: Next.js `proxy(request, event)` and static matcher

- [ ] **Step 1: Write failing Proxy tests**

Use `next/experimental/testing/server` where supported by the installed Next.js 16 docs. Assert matcher exclusion for static/API paths, 308 correction for approved malformed admin paths, no recording for human UA, and scheduled recording for classified public GET requests.

- [ ] **Step 2: Run Proxy test and verify RED**

Run: `npx tsx --test tests/proxy.test.mts`

Expected: FAIL because `proxy.ts` is missing.

- [ ] **Step 3: Implement Proxy**

Order:

1. canonical admin redirect
2. public request policy
3. User-Agent classification
4. sanitized event creation
5. `after(() => recordVisit(event))`
6. `NextResponse.next()`

Use a constant negative matcher excluding `_next/static`, `_next/image`, API, and common asset extensions. Keep code-level request policy as the second gate.

- [ ] **Step 4: Verify Proxy GREEN and commit**

Run:

```bash
npx tsx --test tests/proxy.test.mts
npm test
git add proxy.ts tests/proxy.test.mts
git commit -m "feat: collect AI bot page visits"
```

Expected: Proxy test and all existing tests PASS.

---

### Task 6: Pencil-first 관리자 화면과 인증 라우트

**Files:**
- Modify: `초안`
- Create: `app/admin/admin.css`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/ai-visits/page.tsx`
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/admin/logout/route.ts`
- Create: `tests/admin-dashboard.test.mts`
- Create: `tests/customer-visible-copy.test.mjs`

**Interfaces:**
- Consumes: cookies, session verifier, rate limiter, repository, summarizer
- Produces: protected dashboard and login/logout HTTP endpoints

- [ ] **Step 1: Update and inspect the Pencil source of truth**

Add desktop and mobile frames for login and dashboard to `초안`, preserving existing frames. Include KPI cards, bot table, three explanation cards, empty state, warning note, and logout control. Export screenshots for implementation comparison without replacing `초안`.

- [ ] **Step 2: Write failing dashboard and customer-copy tests**

Dashboard source/render tests assert:

- authentication is checked before data access
- all four KPI labels
- required table columns and operating words
- three purpose explanation texts
- empty state text
- logout form

Customer tests scan only non-admin rendered/source content and reject the prohibited terms as visible copy.

- [ ] **Step 3: Run tests and verify RED**

Run:

```bash
npx tsx --test tests/admin-dashboard.test.mts
node --test tests/customer-visible-copy.test.mjs
```

Expected: FAIL because admin pages do not exist.

- [ ] **Step 4: Implement login and logout route handlers**

Login flow:

1. validate same-origin form submission
2. derive HMAC source ID from forwarded IP without persisting raw input
3. enforce rate limit
4. verify password against `ADMIN_PASSWORD_HASH`
5. set signed `admin_session` cookie with HttpOnly/Secure/SameSite=Lax/path `/admin`/8-hour max age
6. redirect with 303 to sanitized next

Logout clears the cookie and redirects to `/admin/login`.

- [ ] **Step 5: Implement protected pages and admin-only styling**

`/admin/ai-visits` verifies the cookie itself, redirects unauthenticated users, loads at most 60 days of visits, computes summary, and renders Korean labels. Set `export const dynamic = "force-dynamic"` and prevent caching of private data.

- [ ] **Step 6: Verify dashboard GREEN and visual fidelity**

Run tests again, then start the local server and compare desktop/mobile screenshots to Pencil. Check keyboard focus, table overflow, 320px width, and color contrast.

- [ ] **Step 7: Commit**

```bash
git add 초안 app/admin app/api/admin tests/admin-dashboard.test.mts tests/customer-visible-copy.test.mjs
git commit -m "feat: add protected AI visit dashboard"
```

---

### Task 7: 전체 로컬 검증과 synthetic User-Agent 실동작

**Files:**
- Modify only if a failing verification produces a regression test first.

**Interfaces:**
- Verifies the complete local system.

- [ ] **Step 1: Provision approved Neon free storage and pull local environment**

Run only after account-plan confirmation if prompted:

```bash
npx vercel install neon --name ai-visit-analytics --plan free -e production -e preview
npx vercel env pull .env.local
```

Expected: connected `DATABASE_URL` appears in untracked `.env.local`.

- [ ] **Step 2: Generate and set admin secrets safely**

Run `npm run admin:secrets`, enter the chosen password through hidden input, and set the three generated values with `vercel env add` without committing them.

- [ ] **Step 3: Apply schema**

Run: `npm run db:migrate`

Expected: migration exits 0 and reports both tables/indexes ready.

- [ ] **Step 4: Run all quality gates fresh**

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0 with zero failed tests and zero lint/build errors.

- [ ] **Step 5: Start production server and verify HTTP behavior**

Run `npm run start` as a tracked background process. Verify `/`, `/menu`, `/reviews` return 200; unauthenticated `/admin/ai-visits` enters login flow; valid login returns the dashboard; malformed admin URLs return a redirect instead of 404.

- [ ] **Step 6: Send all 15 synthetic User-Agent requests**

Use exact supplied UAs against `/` and record the request time window. Query Neon for those rows and verify each `bot_id` and `purpose`. Use a sanitized `https://synthetic.invalid/check` referrer so verification rows can be identified.

- [ ] **Step 7: Verify browser and logs**

Open public and admin pages in browser automation, verify responsive rendering and console error count 0. Inspect server output for `EACCES`, `permission denied`, `TypeError`, and `ReferenceError`; all counts must be 0.

- [ ] **Step 8: Remove local synthetic rows and commit any test-led fixes**

Delete only rows in the recorded time window whose referrer is `https://synthetic.invalid/check`. If fixes were needed, include the failing regression test and commit them; otherwise leave the working tree clean.

---

### Task 8: 운영 배포·실제 기록·최종 보고

**Files:**
- No code changes unless a production-only defect is reproduced by a failing test.

**Interfaces:**
- Deploys and verifies the production release.

- [ ] **Step 1: Record rollback target and pre-deploy state**

Capture the current production deployment URL, Git commit, domain response, and Vercel project settings. Confirm Neon is persistent and production environment variables exist by name without printing secret values.

- [ ] **Step 2: Deploy the verified commit**

Push the verified branch and deploy through the existing Vercel production flow. Do not proceed if tests, lint, build, migration, or required environment checks fail.

- [ ] **Step 3: Verify production endpoints**

Check the custom domain homepage 200, login page 200, authenticated AI visits page 200, malformed admin path redirect, assets 200, and no customer-visible prohibited terminology.

- [ ] **Step 4: Verify one production synthetic request per required UA**

Send all required UAs with the synthetic referrer, query the production DB for the exact time window, compare expected `bot_id` and `purpose`, save the non-secret result table, then delete only those synthetic rows.

- [ ] **Step 5: Verify browser console and Vercel logs**

Use browser automation for console error count 0. Inspect recent Vercel runtime logs and confirm no `EACCES`, `permission denied`, `TypeError`, or `ReferenceError`.

- [ ] **Step 6: Rebuild the code-review graph and inspect blast radius**

Run an incremental graph update, detect changed flows, review authentication/Proxy/public-page impacts, and rerun any tests identified by the graph.

- [ ] **Step 7: Produce the required final report**

Use exactly these sections:

```text
상태:
의미:
조치:
검증:
지금 할 일:
PASS/FAIL:
- 기능 구현
- 테스트
- 빌드
- 배포
- 실제 기록
- 관리자 화면
```

Include real command counts, production URL, synthetic mapping result, browser console result, and any externally blocked item as FAIL rather than inferred PASS.

- [ ] **Step 8: Update the wiki only with user-confirmed reusable decisions**

If the user confirms the analytics operating policy, update an existing website operations page where possible, add source/date/internal links, update `index.md` only if a new page is necessary, and append `log.md`. Do not record passwords, tokens, URLs containing secrets, synthetic data, or temporary task progress.

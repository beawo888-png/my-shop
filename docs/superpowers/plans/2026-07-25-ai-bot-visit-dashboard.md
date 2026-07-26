# AI·검색봇 방문 추적 관리자 대시보드 구현 계획

> **For agentic workers:** Use `superpowers-dispatching-parallel-agents` with Hermes `delegate_task`, or use `superpowers-executing-plans` inline. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 왕징 홈페이지의 공개 HTML 요청에서 AI·검색봇 User-Agent를 개인정보 없이 기록하고, 인증된 관리자 대시보드에서 최근 30일 통계를 보여준다.

**Architecture:** Next.js 16 루트 `proxy.ts`가 공개 페이지 GET/HEAD 요청을 분류하고 `waitUntil()`로 저장을 예약한다. 로컬은 프로젝트 밖 JSONL, 운영은 Neon PostgreSQL을 사용하며, 관리자 페이지는 scrypt 비밀번호와 HMAC 세션 쿠키로 보호한다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript, Node 24 test runner + tsx, postgres.js, Vercel, Neon PostgreSQL

## Global Constraints

- 기존 고객 홈페이지의 콘텐츠와 레이아웃은 변경하지 않는다.
- 관리자 UI 코드를 쓰기 전에 Git 추적 중인 Pencil JSON `초안`에 데스크톱·모바일 프레임을 먼저 추가한다.
- raw IP, 쿠키 원문, 세션 원문, 이름, 전화번호를 저장하지 않는다.
- 운영 Vercel 파일시스템에는 JSONL을 쓰지 않는다.
- 수집 실패는 공개 페이지 응답을 실패시키지 않는다.
- 최근 30일은 직전 30일과 비교한다.
- 고객 화면에는 SEO, GEO, LLM, JSON-LD, schema.org, 구조화 데이터 용어를 새로 노출하지 않는다.
- 이번 구현에서는 로컬 synthetic 검증까지 완료하고 Neon 생성·비밀값 입력·운영 배포는 보류한다.
- 모든 기능은 RED → GREEN → REFACTOR 순서로 구현하고 각 Task 끝에서 커밋한다.

---

## File Map

- `proxy.ts`: 관리자 오타 URL 보정과 공개 봇 요청 비동기 기록 진입점
- `lib/ai-visits/types.ts`: 방문·분류·통계 공용 타입
- `lib/ai-visits/bot-catalog.ts`: 봇 식별 규칙 단일 원장
- `lib/ai-visits/classify-ai-bot.ts`: User-Agent 분류
- `lib/ai-visits/request-event.ts`: 경로 필터, UA/referrer 정제, IP HMAC
- `lib/ai-visits/store.ts`: 저장소 인터페이스·환경별 선택
- `lib/ai-visits/file-store.ts`: 로컬 JSONL 저장
- `lib/ai-visits/postgres-store.ts`: 운영 PostgreSQL 저장
- `lib/ai-visits/record-visit.ts`: 실패 허용 기록 오케스트레이션
- `lib/ai-visits/summarize-visits.ts`: 최근/직전 30일 통계
- `lib/admin-auth/password.ts`: scrypt 비밀번호 해시·검증
- `lib/admin-auth/session.ts`: HMAC 세션 발급·검증
- `lib/admin-auth/redirects.ts`: 안전한 next·관리자 오타 경로 보정
- `lib/admin-auth/server.ts`: Next cookies 기반 관리자 인증
- `app/admin/layout.tsx`, `app/admin/admin.css`: 관리자 전용 레이아웃·스타일
- `app/admin/login/page.tsx`, `app/admin/login/route.ts`: 로그인 화면·처리
- `app/admin/logout/route.ts`: 로그아웃
- `app/admin/ai-visits/page.tsx`: 인증·조회 서버 페이지
- `components/admin/ai-visits-dashboard.tsx`: 테스트 가능한 표시 컴포넌트
- `db/migrations/001_ai_visits.sql`: 운영 테이블·인덱스
- `scripts/synthetic-ai-visits.mjs`: 실제 HTTP synthetic 요청 검사
- `.env.example`: 비밀값 이름과 안전한 저장 모드 문서
- `tests/ai-bot-classifier.test.ts`: 분류표
- `tests/ai-visit-event.test.ts`: 요청 필터·개인정보
- `tests/ai-visit-store.test.ts`: 파일 저장·실패
- `tests/ai-visit-summary.test.ts`: 통계
- `tests/admin-auth.test.ts`: 비밀번호·세션·리다이렉트
- `tests/admin-dashboard.test.tsx`: KPI·표·빈 상태·금지 문구
- `tests/ai-visit-proxy.test.mjs`: Proxy 연결 구조

---

### Task 1: Pencil 관리자 화면 원본

**Files:**
- Modify: `tests/assets-and-sketch.test.mjs`
- Modify: `초안`

**Interfaces:**
- Consumes: 기존 Pencil JSON top-level `children` 배열
- Produces: `AI 방문 관리자 데스크톱`, `AI 방문 관리자 모바일` 프레임과 고정 섹션 이름

- [ ] **Step 1: 실패하는 Pencil 계약 시험 추가**

`tests/assets-and-sketch.test.mjs`에 다음 시험을 추가한다.

```js
test("Pencil source contains AI visit admin desktop and mobile frames", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  for (const [name, width] of [
    ["AI 방문 관리자 데스크톱", 1440],
    ["AI 방문 관리자 모바일", 390],
  ]) {
    const frame = pencil.children.find((child) => child.name === name);
    assert.ok(frame, `${name} 프레임이 있어야 합니다`);
    assert.equal(frame.width, width);
    const childNames = frame.children.map((child) => child.name);
    for (const section of [
      "관리자 헤더",
      "AI 어시스턴트별 방문",
      "KPI 카드",
      "봇별 방문 표",
      "목적 설명 카드",
      "빈 상태",
    ]) {
      assert.ok(childNames.includes(section), `${section}이 있어야 합니다`);
    }
  }
});
```

- [ ] **Step 2: RED 확인**

Run: `npm test -- --test-name-pattern="Pencil source contains AI visit"`
Expected: FAIL — 두 프레임을 찾지 못함

- [ ] **Step 3: Pencil JSON에 화면 프레임 추가**

기존 노드 형식을 그대로 사용해 top-level `children` 끝에 두 frame을 추가한다.

```json
{
  "type": "frame",
  "id": "ai-visits-admin-desktop",
  "name": "AI 방문 관리자 데스크톱",
  "x": 8960,
  "y": 4500,
  "width": 1440,
  "height": 1320,
  "fill": "#F5F1EA",
  "children": [
    { "type": "frame", "id": "ai-admin-header-d", "name": "관리자 헤더" },
    { "type": "frame", "id": "ai-admin-title-d", "name": "AI 어시스턴트별 방문" },
    { "type": "frame", "id": "ai-admin-kpi-d", "name": "KPI 카드" },
    { "type": "frame", "id": "ai-admin-table-d", "name": "봇별 방문 표" },
    { "type": "frame", "id": "ai-admin-purpose-d", "name": "목적 설명 카드" },
    { "type": "frame", "id": "ai-admin-empty-d", "name": "빈 상태" }
  ]
}
```

모바일 프레임은 id suffix `-m`, `x: 10480`, `y: 4500`, `width: 390`, `height: 1680`을 사용하고 같은 섹션 이름을 가진다. 각 섹션에는 실제 KPI 제목과 표 열, 목적 설명을 text 노드로 배치하여 단순 이름표가 아니라 읽을 수 있는 와이어프레임으로 만든다.

- [ ] **Step 4: GREEN 확인**

Run: `npm test -- --test-name-pattern="Pencil source contains AI visit"`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add 초안 tests/assets-and-sketch.test.mjs
git commit -m "design: add AI visit admin frames"
```

---

### Task 2: 봇 분류와 개인정보 안전 이벤트

**Files:**
- Create: `lib/ai-visits/types.ts`
- Create: `lib/ai-visits/bot-catalog.ts`
- Create: `lib/ai-visits/classify-ai-bot.ts`
- Create: `lib/ai-visits/request-event.ts`
- Create: `tests/ai-bot-classifier.test.ts`
- Create: `tests/ai-visit-event.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `classifyAiBot(userAgent: string): BotIdentity | null`
- Produces: `createAiVisitEvent(input: VisitRequestInput): AiVisitEvent | null`
- Produces: `isCollectablePublicPath(pathname: string): boolean`

- [ ] **Step 1: TypeScript 테스트 실행기 설치**

Run: `npm install --save-dev tsx`

`package.json`의 test script를 다음으로 바꾼다.

```json
"test": "node --test tests/*.test.mjs && tsx --test tests/*.test.ts tests/*.test.tsx"
```

- [ ] **Step 2: 분류 실패 시험 작성**

`tests/ai-bot-classifier.test.ts`에서 제공된 모든 User-Agent와 목적을 테이블 시험한다.

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAiBot } from "../lib/ai-visits/classify-ai-bot";

const cases = [
  ["GPTBot/1.0", "gptbot", "GPTBot", "OpenAI", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "OAI-SearchBot", "OpenAI", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "ChatGPT-User", "OpenAI", "realtime_citation"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "Claude-SearchBot", "Anthropic", "search_indexing"],
  ["Googlebot-Image/1.0", "googlebot-image", "Googlebot-Image", "Google", "search_indexing"],
  ["Google-Extended/1.0", "google-extended", "Google-Extended", "Google", "training"],
  ["DuckAssistBot/1.2", "duckassistbot", "DuckAssistBot", "DuckDuckGo", "realtime_citation"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "Meta-ExternalFetcher", "Meta", "realtime_citation"],
] as const;

for (const [ua, id, name, vendor, purpose] of cases) {
  test(`classifies ${id}`, () => {
    assert.deepEqual(classifyAiBot(ua), {
      botId: id,
      botName: name,
      vendor,
      purpose,
    });
  });
}

test("classifies a generic crawler as other", () => {
  assert.equal(classifyAiBot("ExampleSpider/1.0")?.purpose, "other");
});

test("ignores a normal browser", () => {
  assert.equal(classifyAiBot("Mozilla/5.0 Chrome/124"), null);
});
```

실제 파일에는 설계 문서 6절의 전체 카탈로그를 데이터 행으로 넣고 `Googlebot-Image`/`Googlebot`, `Applebot-Extended`/`Applebot` 우선순위를 별도 검증한다.

- [ ] **Step 3: 이벤트·개인정보 실패 시험 작성**

`tests/ai-visit-event.test.ts`에 공개 경로, 제외 경로, raw IP 부재, HMAC 안정성, salt 변화, UA 제어문자·길이, referrer query 제거 시험을 작성한다.

```ts
const event = createAiVisitEvent({
  method: "GET",
  pathname: "/menu",
  userAgent: "GPTBot/1.0\r\nInjected: value",
  ip: "203.0.113.10",
  ipSalt: "test-salt",
  referrer: "https://example.com/find?q=phone#person",
  now: new Date("2026-07-25T00:00:00.000Z"),
});
assert.equal(event?.purpose, "training");
assert.equal(event?.referrer, "https://example.com/find");
assert.equal("ip" in (event ?? {}), false);
assert.match(event?.ipHash ?? "", /^[0-9a-f]{16}$/);
```

제외 목록은 `/admin`, `/api`, `/_next`, `/images/a.png`, `/file.js`, `/style.css`, `/uploads/a.pdf`, POST 요청을 포함한다.

- [ ] **Step 4: RED 확인**

Run: `npm test`
Expected: FAIL — 모듈이 존재하지 않음

- [ ] **Step 5: 타입·카탈로그·분류 최소 구현**

```ts
export type AiVisitPurpose =
  | "search_indexing"
  | "training"
  | "realtime_citation"
  | "other";

export type BotIdentity = {
  botId: string;
  botName: string;
  vendor: string;
  purpose: AiVisitPurpose;
};
```

`BOT_RULES`는 `{ token, botId, botName, vendor, purpose }` 배열이며 export 시 token 길이 내림차순으로 고정한다. `classifyAiBot`은 case-insensitive substring 검사 후 generic crawler 정규식 `/bot|crawler|spider|fetcher|slurp/i`를 적용한다.

- [ ] **Step 6: 이벤트 최소 구현**

`PUBLIC_PATHS`는 `/`, `/menu`, `/reviews`, `/menu/<허용 slug>`를 지원한다. `sanitizeUserAgent`, `sanitizeReferrer`, `hashIp`는 각각 독립 export하여 단위시험한다. HMAC은 다음 계약을 사용한다.

```ts
createHmac("sha256", ipSalt).update(ip).digest("hex").slice(0, 16)
```

- [ ] **Step 7: GREEN·리팩터 확인**

Run: `npm test`
Expected: 모든 기존 57개와 신규 분류·이벤트 시험 PASS

- [ ] **Step 8: 커밋**

```bash
git add package.json package-lock.json lib/ai-visits tests/ai-bot-classifier.test.ts tests/ai-visit-event.test.ts
git commit -m "feat: classify AI bot visits safely"
```

---

### Task 3: 로컬/운영 저장소와 30일 통계

**Files:**
- Create: `lib/ai-visits/store.ts`
- Create: `lib/ai-visits/file-store.ts`
- Create: `lib/ai-visits/postgres-store.ts`
- Create: `lib/ai-visits/record-visit.ts`
- Create: `lib/ai-visits/summarize-visits.ts`
- Create: `db/migrations/001_ai_visits.sql`
- Create: `tests/ai-visit-store.test.ts`
- Create: `tests/ai-visit-summary.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `AiVisitStore.append(event): Promise<void>`
- Produces: `AiVisitStore.listSince(since): Promise<AiVisitEvent[]>`
- Produces: `createVisitStore(env): AiVisitStore | null`
- Produces: `summarizeVisits(events, now): AiVisitSummary`

- [ ] **Step 1: 저장·통계 실패 시험 작성**

파일 저장 시험은 OS 임시 디렉터리를 사용하되 실제 경로가 프로젝트 밖인지 확인한다. JSONL 두 이벤트 append/read, malformed line 건너뛰기, 운영에서 `file` 거부, disabled 저장소를 시험한다.

통계 시험 데이터는 최근 30일 4건과 직전 30일 2건을 넣고 다음을 검증한다.

```ts
assert.equal(summary.kpis.total, 4);
assert.equal(summary.kpis.searchIndexing, 2);
assert.equal(summary.kpis.training, 1);
assert.equal(summary.kpis.realtimeCitation, 1);
assert.equal(summary.bots[0].topPath, "/menu");
assert.equal(summary.bots[0].changeCount, 1);
```

경계는 `[now-30d, now)`, `[now-60d, now-30d)`로 고정한다.

- [ ] **Step 2: RED 확인**

Run: `npm test`
Expected: FAIL — 저장·통계 모듈이 존재하지 않음

- [ ] **Step 3: PostgreSQL 클라이언트 설치**

Run: `npm install postgres`

- [ ] **Step 4: 저장소 최소 구현**

`createVisitStore` 계약:

```ts
if (env.AI_VISIT_STORAGE === "disabled" || !env.AI_VISIT_STORAGE) return null;
if (env.AI_VISIT_STORAGE === "file") {
  if (env.NODE_ENV === "production") throw new Error("file storage is disabled in production");
  return new JsonlAiVisitStore(requireSafeAbsolutePath(env.AI_VISIT_FILE_PATH));
}
if (env.AI_VISIT_STORAGE === "postgres") {
  return new PostgresAiVisitStore(requireValue(env.DATABASE_URL));
}
throw new Error("unsupported AI_VISIT_STORAGE");
```

`recordVisit`은 저장소 생성·append 오류를 `console.warn("[ai-visits] ...")`로 축약해 남기고 throw하지 않는다.

- [ ] **Step 5: SQL migration 작성**

```sql
CREATE TABLE IF NOT EXISTS ai_visits (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  path TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  bot_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('search_indexing','training','realtime_citation','other')),
  ip_hash VARCHAR(16),
  referrer TEXT
);
CREATE INDEX IF NOT EXISTS ai_visits_created_at_idx ON ai_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS ai_visits_purpose_created_at_idx ON ai_visits (purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_visits_bot_created_at_idx ON ai_visits (bot_id, created_at DESC);
```

- [ ] **Step 6: 통계 최소 구현**

봇 그룹은 `botId` 기준이며 최근 방문 내림차순으로 정렬한다. 최다 path 동률은 path 오름차순으로 결정한다. 변화율은 이전값 0이고 현재값이 양수면 `null`로 두고 화면에서 `신규`로 표시한다.

- [ ] **Step 7: GREEN 확인**

Run: `npm test`
Expected: 저장·통계 포함 전체 PASS

- [ ] **Step 8: 커밋**

```bash
git add package.json package-lock.json lib/ai-visits db/migrations tests/ai-visit-store.test.ts tests/ai-visit-summary.test.ts
git commit -m "feat: store and summarize AI visits"
```

---

### Task 4: 관리자 인증과 안전한 URL 보정

**Files:**
- Create: `lib/admin-auth/password.ts`
- Create: `lib/admin-auth/session.ts`
- Create: `lib/admin-auth/redirects.ts`
- Create: `lib/admin-auth/server.ts`
- Create: `tests/admin-auth.test.ts`

**Interfaces:**
- Produces: `hashAdminPassword(password): string`
- Produces: `verifyAdminPassword(password, encoded): boolean`
- Produces: `createAdminSession(secret, now): string`
- Produces: `verifyAdminSession(token, secret, now): boolean`
- Produces: `sanitizeAdminNext(value): string`
- Produces: `canonicalizeAdminPath(pathname): string | null`

- [ ] **Step 1: 인증·리다이렉트 실패 시험 작성**

시험 항목:
- 올바른 비밀번호 통과, 틀린 비밀번호 실패
- 같은 비밀번호도 random salt로 다른 hash
- 세션 유효, 서명 변조·만료·다른 secret 실패
- `/admin/ai-visits` next 허용
- `https://evil.test`, `//evil.test`, `/\\evil`, 제어문자, URL-encoded 외부경로 거부
- `/admin/ai-visits%22`, `/admin/ai-visits"`, `/admin/ai-visit` 정식 경로 보정

- [ ] **Step 2: RED 확인**

Run: `npm test`
Expected: FAIL — admin-auth 모듈이 존재하지 않음

- [ ] **Step 3: scrypt·HMAC 최소 구현**

비밀번호 형식은 `scrypt$16384$8$1$<salt-base64url>$<hash-base64url>`로 고정한다. 검증은 `timingSafeEqual`을 사용한다.

세션 payload는 `{ "v": 1, "exp": <unix seconds> }`를 base64url로 인코딩하고 `HMAC-SHA256(secret, payload)`를 붙인다. 수명은 12시간이다.

- [ ] **Step 4: Next 서버 인증 어댑터 구현**

`server.ts`는 `cookies()`에서 `wangjing_admin_session`을 읽고 환경변수 `AI_VISIT_SESSION_SECRET`으로 검증한다. secret이 없으면 항상 비인증으로 처리한다.

- [ ] **Step 5: GREEN 확인**

Run: `npm test`
Expected: 인증·URL 시험 포함 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add lib/admin-auth tests/admin-auth.test.ts
git commit -m "feat: protect AI visit admin routes"
```

---

### Task 5: Next.js Proxy 수집과 synthetic 연결

**Files:**
- Create: `proxy.ts`
- Create: `tests/ai-visit-proxy.test.mjs`
- Create: `scripts/synthetic-ai-visits.mjs`

**Interfaces:**
- Consumes: `createAiVisitEvent`, `recordVisit`, `canonicalizeAdminPath`
- Produces: Next.js 16 `proxy(request, event)`

- [ ] **Step 1: Proxy 구조 실패 시험 작성**

`tests/ai-visit-proxy.test.mjs`는 source contract를 확인한다.

```js
assert.match(source, /export function proxy/);
assert.match(source, /event\.waitUntil\(/);
assert.match(source, /createAiVisitEvent/);
assert.match(source, /recordVisit/);
assert.match(source, /canonicalizeAdminPath/);
assert.match(source, /_next\/static/);
assert.match(source, /_next\/image/);
```

또한 `recordVisit`을 주입한 순수 helper 시험으로 저장 promise가 reject해도 response 결정이 throw하지 않는지 검증한다.

- [ ] **Step 2: RED 확인**

Run: `npm test`
Expected: FAIL — `proxy.ts`가 없음

- [ ] **Step 3: Proxy 최소 구현**

```ts
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const canonical = canonicalizeAdminPath(request.nextUrl.pathname);
  if (canonical) return NextResponse.redirect(new URL(canonical, request.url));

  const visit = createAiVisitEvent({
    method: request.method,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent") ?? "",
    ip: firstForwardedIp(request.headers),
    ipSalt: process.env.AI_VISIT_IP_SALT,
    referrer: request.headers.get("referer") ?? undefined,
    now: new Date(),
  });
  if (visit) event.waitUntil(recordVisit(visit));
  return NextResponse.next();
}
```

matcher는 admin typo 보정에 필요한 `/admin/:path*`와 공개 페이지를 포함하고, `api`, `_next/static`, `_next/image`, favicon 및 확장자 파일을 제외한다.

- [ ] **Step 4: synthetic 요청 스크립트 작성**

스크립트는 환경변수 `AI_VISIT_BASE_URL`에 설계 문서의 15개 User-Agent로 `/menu` GET을 보내고 모두 200인지 확인한다. `AI_VISIT_FILE_PATH`가 있으면 JSONL을 읽어 각 기대 `botId`, `purpose`가 추가됐는지 확인하고 하나라도 다르면 exit 1 한다.

- [ ] **Step 5: GREEN 확인**

Run: `npm test && npm run lint && npm run build`
Expected: 모두 exit 0, 빌드 route 표에 Proxy 포함

- [ ] **Step 6: 커밋**

```bash
git add proxy.ts tests/ai-visit-proxy.test.mjs scripts/synthetic-ai-visits.mjs
git commit -m "feat: record public AI bot requests"
```

---

### Task 6: 관리자 로그인과 대시보드 UI

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/admin.css`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/route.ts`
- Create: `app/admin/logout/route.ts`
- Create: `app/admin/ai-visits/page.tsx`
- Create: `components/admin/ai-visits-dashboard.tsx`
- Create: `tests/admin-dashboard.test.tsx`
- Modify: `tests/home-seo-content.test.mjs`

**Interfaces:**
- Consumes: `isAdminAuthenticated`, `sanitizeAdminNext`, `summarizeVisits`, `AiVisitSummary`
- Produces: 인증된 `/admin/ai-visits` 화면과 POST 로그인/로그아웃

- [ ] **Step 1: 표시·고객화면 실패 시험 작성**

`renderToStaticMarkup(<AiVisitsDashboard summary={fixture} />)`로 다음 문구와 값이 있는지 검증한다.

- `AI 어시스턴트별 방문`
- `검색 인덱싱`, `학습`, `실시간 인용`
- 봇 이름, vendor, 목적, 방문 수, 최근 방문, 최다 페이지, 변화
- 빈 summary의 `아직 기록된 AI·검색봇 방문이 없습니다.`

기존 공개 페이지·고객 컴포넌트 파일 집합에는 금지 용어가 새로 들어가지 않았는지 별도 source 시험한다. 관리자 파일은 검사 대상에서 제외한다.

- [ ] **Step 2: RED 확인**

Run: `npm test`
Expected: FAIL — dashboard 컴포넌트가 없음

- [ ] **Step 3: 관리자 레이아웃·로그인 구현**

레이아웃 metadata에 `robots: { index: false, follow: false }`를 설정한다. 로그인 form은 password와 sanitized next만 전송한다. 성공 시 303으로 next, 실패 시 최소 500ms 지연 후 일반 오류 문구와 함께 로그인 페이지로 보낸다. 쿠키 옵션은 `httpOnly`, `secure: production`, `sameSite: "strict"`, `path: "/admin"`, `maxAge: 43200`이다.

- [ ] **Step 4: 대시보드 서버 페이지 구현**

`export const dynamic = "force-dynamic"`, `export const revalidate = 0`을 사용한다. 인증 실패 시 로그인으로 redirect한다. 저장소가 disabled이면 빈 summary와 `로컬 저장소가 연결되지 않았습니다.` 운영 상태를 전달한다. 저장 오류 세부내용이나 경로는 화면에 노출하지 않는다.

- [ ] **Step 5: Pencil 기준 반응형 UI 구현**

데스크톱은 4개 KPI grid, 7열 표, 3개 설명 카드다. 모바일은 KPI 2열, 표 컨테이너 가로 스크롤, 설명 카드 1열이다. 고객용 `globals.css`를 수정하지 않고 `app/admin/admin.css`에만 스타일을 둔다.

- [ ] **Step 6: GREEN 확인**

Run: `npm test && npm run lint && npm run build`
Expected: 모두 PASS, `/admin/login`과 `/admin/ai-visits`는 dynamic route

- [ ] **Step 7: 커밋**

```bash
git add app/admin components/admin tests/admin-dashboard.test.tsx tests/home-seo-content.test.mjs
git commit -m "feat: add AI visit admin dashboard"
```

---

### Task 7: 로컬 실사용 검증과 운영 문서

**Files:**
- Create: `.env.example`
- Create: `docs/operations/ai-visit-dashboard.md`
- Modify: `.vercelignore`

**Interfaces:**
- Produces: 비밀값을 포함하지 않는 설정·운영 절차와 재현 가능한 검증 증거

- [ ] **Step 1: 설정 문서 작성**

`.env.example`에는 값 없이 다음 이름과 주석만 둔다.

```env
AI_VISIT_STORAGE=disabled
AI_VISIT_FILE_PATH=
DATABASE_URL=
AI_VISIT_IP_SALT=
AI_VISIT_ADMIN_PASSWORD_HASH=
AI_VISIT_SESSION_SECRET=
```

`.vercelignore`에는 로컬 analytics 파일명·디렉터리 패턴을 추가한다. 운영 문서에는 scrypt hash 생성, 로컬 실행, Neon migration, Vercel 환경변수, 배포 전후 점검과 rollback을 기록한다.

- [ ] **Step 2: 전체 정적 검증**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: 모두 exit 0

- [ ] **Step 3: 로컬 서버 실행**

프로젝트 밖 임시 JSONL 경로와 테스트용 비밀값을 환경변수로 설정하고 fresh production server를 시작한다.

```bash
ADMIN_HASH="$(node --import tsx --input-type=module -e "import { hashAdminPassword } from './lib/admin-auth/password.ts'; console.log(hashAdminPassword('local-dashboard-test'))")"
AI_VISIT_STORAGE=file \
AI_VISIT_FILE_PATH='C:/Users/USER/Desktop/ai-visits-local-test.jsonl' \
AI_VISIT_IP_SALT='local-verification-salt' \
AI_VISIT_ADMIN_PASSWORD_HASH="$ADMIN_HASH" \
AI_VISIT_SESSION_SECRET='local-session-verification-secret-20260725' \
npm run start -- --hostname 127.0.0.1 --port 3100
```

- [ ] **Step 4: synthetic User-Agent 실제 기록**

Run:

```bash
AI_VISIT_BASE_URL='http://127.0.0.1:3100' \
AI_VISIT_FILE_PATH='C:/Users/USER/Desktop/ai-visits-local-test.jsonl' \
node scripts/synthetic-ai-visits.mjs
```

Expected: 15 HTTP 200, 15개 기대 botId/purpose 기록 확인, exit 0

- [ ] **Step 5: 인증·URL·브라우저 검증**

- 공개 `/`와 `/menu` 200
- 비인증 `/admin/ai-visits`는 로그인으로 redirect
- 테스트 비밀번호 로그인 후 `/admin/ai-visits` 200
- `/admin/ai-visits%22`, `/admin/ai-visits"`, `/admin/ai-visit`가 정식 경로로 보정
- `browser_snapshot`으로 KPI·표·목적 설명의 실제 한국어 확인
- `browser_vision`으로 데스크톱·모바일 배치만 확인
- browser console error 0
- 서버 로그에서 `EACCES|permission denied|TypeError|ReferenceError` 0

- [ ] **Step 6: 코드 그래프·독립 리뷰**

`build_or_update_graph` 후 `BASE_REF="$(git merge-base main HEAD)"`를 계산하고 `detect_changes(base=$BASE_REF)`로 Proxy, 인증, 저장소, 관리자 화면 영향 범위를 확인한다. 독립 리뷰는 개인정보 유출, 인증 우회, open redirect, Vercel 임시 파일, 저장 실패의 사이트 장애 가능성을 fail-closed로 검토한다. 발견된 결함은 재현 실패시험부터 추가한다.

- [ ] **Step 7: 최종 검증 후 커밋**

```bash
git add .env.example .vercelignore docs/operations/ai-visit-dashboard.md
git commit -m "docs: add AI visit operations guide"
npm test && npm run lint && npm run build && git diff --check
git status --short
```

Expected: 깨끗한 feature worktree, 모든 명령 exit 0

- [ ] **Step 8: 통합과 보고**

리뷰 통과 후 main에 fast-forward 통합하고 main에서 전체 검증을 한 번 더 실행한다. 운영 Neon/배포를 실행하지 않았으므로 최종 표기는 다음과 같다.

- 기능 구현: PASS
- 테스트: PASS
- 빌드: PASS
- 배포: 보류
- 실제 기록: 로컬 PASS / 운영 보류
- 관리자 화면: 로컬 PASS / 운영 보류

# AI·검색봇 방문 추적 관리자 대시보드 설계

**작성일:** 2026-07-25
**대상 프로젝트:** `C:\vibecoding\my-shop`
**운영 도메인:** `https://왕징양다리양꼬치.com` (`https://xn--vr0bn4e2wh79mca68ih9mf4j.com`)
**운영 플랫폼:** Vercel 프로젝트 `my-shop-39ab`
**기술 스택:** Next.js 16.2.10 App Router, React 19, TypeScript

## 1. 목표와 범위

공개 HTML 페이지에 들어오는 AI·검색 크롤러의 User-Agent를 애플리케이션 수준에서 판별하고, 관리자 전용 `/admin/ai-visits` 화면에서 다음 네 목적별로 집계한다.

- `search_indexing`: 검색 결과나 AI 검색 결과의 후보 페이지 수집
- `training`: 모델 학습·지식 수집
- `realtime_citation`: 사용자 질문에 대한 답변·출처 확인
- `other`: 역할이 명확하지 않은 크롤러

고객이 보는 기존 홈페이지, 메뉴, 리뷰 화면의 콘텐츠와 디자인은 변경하지 않는다. 관리자 화면에서만 운영 용어와 분류 설명을 표시한다.

## 2. 확인된 현재 상태

- 공개 경로는 `/`, `/menu`, `/menu/[category]`, `/reviews`이며 현재 모두 정적 생성된다.
- 관리자 경로, 로그인, 서버 API, 미들웨어/Proxy, DB가 없다.
- 실제 도메인은 Vercel 프로덕션 배포를 가리킨다.
- Vercel 함수 파일시스템은 영구 저장소가 아니므로 운영 JSONL 저장은 허용하지 않는다.
- 현재 기준선은 자동시험 57개 통과, Next.js 프로덕션 빌드 통과다.
- `초안`은 Git 추적 중인 Pencil JSON이며 새 관리자 화면의 시각 원본도 여기에 먼저 반영한다.

## 3. 선택한 접근

### 3.1 운영 구조

운영에서는 Vercel Marketplace의 Neon PostgreSQL을 영구 저장소로 사용한다. Next.js 16의 루트 `proxy.ts`가 요청 완료 전에 실행되며, 공개 HTML 요청 중 분류 가능한 봇 요청만 비동기 기록한다.

`proxy.ts`는 페이지 응답을 기다리게 하지 않도록 `NextFetchEvent.waitUntil()`을 사용한다. 기록이 실패해도 오류를 경고 수준으로 남기고 원래 사이트 응답은 계속 제공한다.

### 3.2 로컬 구조

로컬 개발·synthetic 검증에서는 프로젝트 배포 산출물 밖의 명시적 디렉터리에 JSONL을 저장할 수 있다. 파일 저장은 개발 환경에서만 명시적으로 켰을 때 허용한다. 운영 환경에서 DB 설정이 없으면 임시 파일로 자동 대체하지 않고 기록을 중단해 데이터 유실을 숨기지 않는다.

### 3.3 대안 제외 사유

- Vercel 로그만 사용: 앱 수준 수집 우선 요구와 맞지 않고 가공·보존·누락 제어가 부족하다.
- 고객 브라우저 JavaScript 수집: JavaScript를 실행하지 않는 검색봇 방문을 놓치므로 사용할 수 없다.
- Vercel 배포 파일에 JSONL 저장: 재배포·함수 인스턴스 교체 후 유지되지 않으므로 금지한다.

## 4. 모듈 경계

### 4.1 봇 분류

`lib/ai-visits/bot-catalog.ts`
- 사용자가 승인한 봇 식별자, 표시명, vendor, purpose를 한 파일에서 관리한다.
- 긴·구체적인 토큰을 짧은 토큰보다 먼저 비교한다.

`lib/ai-visits/classify-ai-bot.ts`
- `classifyAiBot(userAgent: string)` 인터페이스를 제공한다.
- 알려진 식별자는 정규화된 `botId`, `botName`, `vendor`, `purpose`를 반환한다.
- 알려지지 않았지만 `bot`, `crawler`, `spider`, `fetcher`, `slurp`가 포함되면 `other`를 반환한다.
- 일반 브라우저는 `null`을 반환한다.

### 4.2 요청 필터와 개인정보

`lib/ai-visits/request-event.ts`
- GET/HEAD 공개 HTML 요청만 이벤트 후보로 만든다.
- `/admin`, `/api`, `/_next`, 정적 파일, 이미지, JS, CSS, 업로드 및 확장자 자산을 제외한다.
- User-Agent는 제어문자를 제거하고 최대 512자로 제한한다.
- raw IP는 저장 객체에 넣지 않는다.
- IP 중복 판단값은 비밀 salt를 키로 한 HMAC-SHA256 앞 16개 16진수 문자만 사용한다.
- referrer는 선택값이며, 저장 시 사용자정보·쿼리·fragment를 제거한 origin과 pathname만 남긴다.
- 쿠키, 세션 원문, 이름, 전화번호는 이벤트 타입에 포함하지 않는다.

### 4.3 저장소

`lib/ai-visits/store.ts`
- 기록·최근 기간 조회를 제공하는 작은 저장소 인터페이스를 정의한다.

`lib/ai-visits/file-store.ts`
- 로컬 개발 전용 JSONL 구현이다.
- 기본 경로는 프로젝트 밖의 사용자 지정 절대경로이며, 운영에서는 생성되지 않는다.
- 한 줄 쓰기 실패는 호출자에게 오류를 반환하되 사이트 요청은 실패시키지 않는다.

`lib/ai-visits/postgres-store.ts`
- 운영 Neon PostgreSQL 구현이다.
- `ai_visits` 테이블에 `created_at`, `path`, `user_agent`, `bot_id`, `bot_name`, `vendor`, `purpose`, `ip_hash`, `referrer`를 저장한다.
- `created_at`, `purpose`, `bot_id`에 필요한 인덱스를 둔다.
- SQL 파라미터 바인딩을 사용한다.

`lib/ai-visits/record-visit.ts`
- 환경에 맞는 저장소를 선택하고 이벤트를 기록한다.
- 운영 DB 미설정과 쓰기 실패를 warning으로 기록하고 요청 처리는 계속한다.

### 4.4 통계

`lib/ai-visits/summarize-visits.ts`
- 최근 30일과 그 직전 30일을 비교한다.
- 전체·검색 인덱싱·학습·실시간 인용 합계를 계산한다.
- 봇별 방문 수, 최근 방문 시간, 최다 path, 이전 30일 대비 절대 변화량과 변화율을 계산한다.
- 이벤트가 없는 경우 0과 빈 배열을 반환한다.

### 4.5 관리자 인증

`lib/admin-auth/*`
- 관리자 비밀번호는 평문 소스에 두지 않고 scrypt 해시 환경변수로 관리한다.
- 로그인 성공 시 12시간 유효한 HMAC 서명 세션을 `HttpOnly`, `Secure`, `SameSite=Strict`, `/admin` 경로 쿠키로 설정한다.
- 관리자 페이지와 관리자용 Route Handler/Server Action은 각각 인증을 재검증한다. Proxy 인증만 믿지 않는다.
- 로그인 실패 응답은 계정 정보 차이를 드러내지 않는다.

### 4.6 URL 보정

- 정식 경로는 `/admin/ai-visits`다.
- `/admin/ai-visits%22`, `/admin/ai-visits"`, `/admin/ai-visit`는 정식 경로로만 리다이렉트한다.
- 로그인 `next`는 `/admin/`으로 시작하는 단일 슬래시 상대경로만 허용한다.
- `//host`, 절대 URL, backslash, 제어문자, 인코딩 우회는 `/admin/ai-visits`로 대체한다.

### 4.7 관리자 화면

Pencil `초안`에 관리자 데스크톱·모바일 프레임을 먼저 만든 다음 구현한다.

`/admin/ai-visits` 구성:
- 제목: `AI 어시스턴트별 방문`
- KPI: 전체 AI/크롤러 방문, 검색 인덱싱, 학습, 실시간 인용
- 표: 봇 이름, 회사, 목적, 방문 수, 최근 방문, 최다 페이지, 변화
- 목적 설명 카드 3개
- 데이터가 없을 때의 명확한 빈 상태
- 모바일에서는 표를 읽을 수 있는 카드/가로 스크롤 구조

기존 고객 화면에는 `SEO`, `GEO`, `LLM`, `JSON-LD`, `schema.org`, `구조화 데이터`라는 개발자 용어를 새로 노출하지 않는다.

## 5. 요청 흐름

1. 공개 페이지 요청이 Vercel에 도착한다.
2. `proxy.ts`가 경로·메서드·요청 목적을 검사한다.
3. 제외 대상 또는 일반 방문이면 즉시 원래 응답으로 진행한다.
4. 분류 가능한 봇이면 개인정보가 제거된 이벤트를 만든다.
5. `waitUntil(recordVisit(event))`로 저장을 예약한다.
6. 페이지 응답은 저장 성공 여부와 무관하게 계속된다.
7. 인증된 관리자가 대시보드를 열면 최근 60일 자료를 조회해 최근 30일과 직전 30일 통계를 계산한다.

## 6. 봇 카탈로그

사용자가 제공한 다음 그룹을 모두 포함한다.

- OpenAI: GPTBot, OAI-SearchBot, ChatGPT-User, OAI-AdsBot
- Anthropic: ClaudeBot, Claude-SearchBot, Claude-User, Claude-Web, anthropic-ai
- Perplexity: PerplexityBot, Perplexity-User
- Google: Googlebot, Googlebot-Image, Googlebot-Video, GoogleOther, GoogleOther-Image, GoogleOther-Video, Google-Extended
- Naver: Yeti, NaverBot
- Microsoft: bingbot, msnbot, BingPreview, MicrosoftPreview
- Apple: Applebot, Applebot-Extended
- DuckDuckGo: DuckAssistBot, DuckDuckBot
- Amazon: Amazonbot, Amzn-SearchBot, Amzn-User
- Meta: Meta-WebIndexer, Meta-ExternalFetcher, Meta-ExternalAgent, Meta-ExternalAds, FacebookExternalHit
- 기타: CCBot, Bytespider, YouBot, cohere-ai, MistralAI-User

카탈로그의 의미는 운영 정책이며 향후 공급자 공식 문서가 바뀌면 별도 검토 후 갱신한다. User-Agent는 위조 가능하므로 이 화면은 “식별된 User-Agent 방문”을 보여줄 뿐, 공급자가 실제로 보낸 트래픽임을 암호학적으로 증명하지 않는다.

## 7. 오류 처리와 보안

- 수집 실패로 공개 페이지가 5xx가 되지 않는다.
- DB 연결 문자열, 관리자 비밀번호 해시, 세션 비밀, IP salt는 환경변수에만 둔다.
- 관리자 응답에는 저장소 경로나 내부 오류 세부정보를 노출하지 않는다.
- 관리자 데이터 응답은 캐시하지 않는다.
- 세션 검증은 timing-safe 비교를 사용한다.
- User-Agent와 path는 화면에서 React 기본 escaping을 유지한다.
- 관리자 로그인에는 기본적인 실패 지연 또는 시도 제한을 적용할 수 있도록 경계를 둔다. 1차 구현에서는 공급자 인프라와 충돌하지 않는 최소 실패 지연을 사용한다.

## 8. 테스트 전략

반드시 RED → GREEN 순서로 구현한다.

1. 분류표 전체와 긴 토큰 우선순위 시험
2. 일반 브라우저·generic crawler 시험
3. 제외 경로·메서드·정적 자산 시험
4. raw IP 미포함, salt HMAC, UA/referrer 정제 시험
5. 기록 성공·실패 시 원래 응답 보존 시험
6. 최근 30일/직전 30일 purpose·bot·최다 path·변화량 시험
7. 관리자 비밀번호·세션·만료·변조 시험
8. `next`와 잘못된 관리자 URL 보정 및 open redirect 방지 시험
9. 관리자 대시보드 렌더링·빈 상태 시험
10. 공개 고객 화면 금지 용어 신규 노출 방지 시험
11. 제공된 15개 synthetic User-Agent 실제 HTTP 요청 기록 시험
12. 전체 `npm test`, `npm run lint`, `npm run build`
13. 로컬 브라우저 로그인·대시보드·모바일 레이아웃·콘솔 오류 0 확인

## 9. 구현·배포 경계

이번 승인 범위는 코드, 로컬 JSONL synthetic 검증, 관리자 로그인과 대시보드의 로컬 실행 검증까지다.

다음은 사용자 계정·비밀값이 필요한 별도 운영 단계이므로 자동 실행하지 않는다.

- Neon/Vercel Marketplace 약관 동의와 DB 생성
- 운영 관리자 비밀번호 결정 및 해시 입력
- 운영 세션 비밀과 IP salt 입력
- 운영 배포

운영 배포 전에는 기존 릴리스 확인, DB 마이그레이션, 환경변수, persistent storage 접근을 검증한다. 배포 후에는 서비스 상태, 공개 페이지, 인증 후 관리자 화면, synthetic User-Agent 실제 DB 기록, 브라우저 콘솔, Vercel 최근 오류 로그를 확인한다.

## 10. 완료 기준

로컬 구현 완료는 다음을 모두 만족해야 한다.

- 분류·개인정보·기록·통계·인증·URL·화면 시험 PASS
- 전체 기존 시험 PASS
- 린트 PASS
- 프로덕션 빌드 PASS
- synthetic User-Agent의 `botId`와 `purpose`가 로컬 영구경로 JSONL에 정확히 저장
- 인증 후 관리자 화면 200
- 잘못된 관리자 URL이 정식 경로로 보정
- 공개 화면 200 및 금지 용어 신규 노출 없음
- 브라우저 콘솔 오류 0
- 최근 로컬 서버 로그에 EACCES, permission denied, TypeError, ReferenceError 없음

운영 DB와 배포가 실행되지 않은 상태에서는 최종 보고의 `배포`, `실제 운영 기록`을 PASS로 표기하지 않고 `보류`로 명확히 표시한다.

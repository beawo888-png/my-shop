# AI·검색 봇 방문 분석 관리자 기능 설계

작성일: 2026-07-26
대상: 왕징양다리양꼬치 운영 홈페이지
운영 주소: https://왕징양다리양꼬치.com
기술 환경: Next.js 16.2.10, React 19, Vercel
상태: 구현 승인 기본값 적용(사용자 응답 시간 초과에 따른 권장안)

## 1. 목표

공개 홈페이지에 들어오는 검색봇·AI 봇·LLM 어시스턴트 요청을 애플리케이션 레벨에서 분류하고, 관리자만 볼 수 있는 `/admin/ai-visits` 화면에서 다음 네 목적으로 집계한다.

- `search_indexing`: 검색 인덱싱
- `training`: 학습
- `realtime_citation`: 실시간 인용
- `other`: 기타

일반 고객 화면에는 관리자 기능이나 SEO, GEO, LLM, JSON-LD, schema.org, 구조화 데이터 같은 개발자 용어를 추가로 노출하지 않는다.

## 2. 확인된 현재 상태와 제약

- App Router 기반 Next.js 16 프로젝트다.
- 배포 대상은 Vercel의 `cindy-kim/my-shop` 프로젝트다.
- 현재 관리자 경로, 인증 모듈, 데이터베이스가 없다.
- Vercel 배포 파일시스템은 영구 분석 저장소로 사용하지 않는다.
- 운영 홈페이지는 2026-07-26 현재 정상 응답한다.
- User-Agent는 요청자가 스스로 제시하는 문자열이므로 실제 회사 봇의 신원을 100% 증명하지 않는다. 대시보드에는 이 한계를 짧게 고지한다.

## 3. 검토한 방식

### 3.1 권장: Neon Postgres + Next.js Proxy

- Vercel Marketplace의 무료 Neon Postgres를 연결한다.
- Next.js 16의 `proxy.ts`에서 공개 페이지 요청을 선별한다.
- 응답을 막지 않도록 `after()`에서 이벤트를 기록한다.
- 동시 쓰기, 30일 집계, 배포 간 영속성에 적합하다.

### 3.2 제외: Vercel Blob JSONL

- 파일 형태는 단순하지만 동시 쓰기 시 덮어쓰기와 이벤트 유실 위험이 있다.
- 기간·봇·경로별 집계 비용이 커져 이번 요구에 맞지 않는다.

### 3.3 제외: 범용 외부 분석 서비스

- 원하는 분류표와 개인정보 최소화 정책을 직접 통제하기 어렵다.
- 작은 매장 사이트의 요구에 비해 의존성과 운영 복잡도가 커진다.

## 4. 구성 요소

### 4.1 봇 카탈로그와 분류기

- `lib/ai-visits/bot-catalog.ts`: 봇 식별자, 표시명, vendor, purpose, User-Agent 토큰을 한 곳에서 관리한다.
- `lib/ai-visits/classify-ai-bot.ts`: `classifyAiBot(userAgent)`를 제공한다.
- 판정은 대소문자를 구분하지 않는다.
- `Googlebot-Image`와 `Googlebot`처럼 토큰이 겹치면 더 구체적인 토큰을 먼저 판정한다.
- 알려진 토큰이 없지만 `bot`, `crawler`, `spider`, `fetcher`, `slurp`가 있으면 익명 `other` 크롤러로 분류한다.
- 일반 브라우저는 `null`을 반환해 기록하지 않는다.

카탈로그에는 사용자가 지정한 OpenAI, Anthropic, Perplexity, Google, Naver, Microsoft, Apple, DuckDuckGo, Amazon, Meta와 기타 크롤러 전체를 포함한다.

### 4.2 추적 대상 판정

- `lib/ai-visits/request-policy.ts`에서 요청 메서드와 경로를 판정한다.
- GET 요청만 기록한다. HEAD는 중복 가능성이 있어 제외한다.
- 공개 콘텐츠 경로 `/`, `/menu`, `/menu/*`, `/reviews`만 허용 목록으로 관리한다.
- `/admin`, `/api`, `/_next`, 정적 파일, 이미지 최적화, 아이콘, robots, sitemap, 업로드 파일, 확장자가 있는 자산 경로는 제외한다.
- query와 fragment는 저장 path에 포함하지 않는다.
- 허용 목록은 향후 공개 페이지 추가 시 테스트와 함께 갱신한다.

### 4.3 앱 레벨 수집

- 프로젝트 루트의 `proxy.ts`가 공개 요청의 User-Agent를 읽는다.
- 분류된 봇 요청만 이벤트 후보로 만든다.
- `after()` 안에서 저장소의 `recordVisit()`를 호출해 응답 지연을 줄인다.
- 저장 실패는 민감정보가 없는 warning만 기록하고 원래 홈페이지 응답은 계속한다.
- Next.js Proxy matcher에서도 API·관리자·정적 파일을 일차 제외하고, 코드 내부 정책에서 다시 확인한다.

### 4.4 개인정보 최소화

`ai_visits`에는 다음만 저장한다.

- `id`
- `created_at`
- `path`
- 길이를 제한한 `user_agent`
- `bot_id`
- `bot_name`
- `vendor`
- `purpose`
- query와 fragment를 제거한 선택적 `referrer`

AI 방문 테이블에는 raw IP와 `ip_hash`를 저장하지 않는다. 현재 요구된 KPI가 요청 수 기반이고 고유 방문자 집계가 없으므로 IP 파생값도 불필요하다.

관리자 로그인 반복 시도 방어에는 별도의 만료 데이터만 사용한다. 이때도 raw IP는 저장하지 않고 서버 비밀키로 만든 HMAC 축약값만 사용하며 자동 만료시킨다.

저장하지 않는 항목:

- raw IP
- 이름과 전화번호
- Cookie 원문
- Session 원문
- URL query와 fragment
- 인증 비밀번호 원문

### 4.5 데이터베이스

Neon Postgres에 다음 구조를 만든다.

`ai_visits`

- `id`: bigint identity primary key
- `created_at`: timestamptz, 기본값 현재 시각
- `path`: text
- `user_agent`: text
- `bot_id`: text
- `bot_name`: text
- `vendor`: text
- `purpose`: 제한된 네 값
- `referrer`: nullable text

인덱스:

- `created_at`
- `(purpose, created_at)`
- `(bot_id, created_at)`

인증 반복 시도 제한용 테이블은 HMAC 식별값, 시도 횟수, 윈도우 시작, 만료 시각만 가진다. 오래된 방문 데이터의 자동 삭제 기간은 이번 범위에서 강제하지 않는다. 추후 운영자가 보존 기간을 확정하면 별도 결정으로 추가한다.

### 4.6 요약 통계

기본 조회 범위는 최근 30일이다. 비교 기간은 그 직전 30일이다.

상단 KPI:

- 전체 AI/크롤러 방문 수
- 검색 인덱싱 방문 수
- 학습 방문 수
- 실시간 인용 방문 수

봇별 표:

- 봇 이름
- vendor
- 목적 라벨
- 현재 30일 방문 수
- 최근 방문 시간
- 가장 많이 본 페이지
- 직전 30일 대비 방문 수 차이와 증감률

동률인 최다 path는 방문 수 내림차순 후 path 오름차순으로 결정한다. 직전 기간이 0이면 백분율을 무한대로 표시하지 않고 신규 방문으로 표시한다.

### 4.7 관리자 인증

경로:

- `/admin/login`
- `/admin/ai-visits`

방식:

- 단일 운영자 비밀번호를 사용한다.
- 비밀번호 원문은 코드나 DB에 넣지 않는다.
- Vercel 환경변수에는 salt가 포함된 scrypt 해시만 저장한다.
- 로그인 성공 시 서버 비밀키로 서명한 짧은 수명의 세션을 발급한다.
- 쿠키는 `HttpOnly`, `Secure`, `SameSite=Lax`, 제한된 만료시간을 사용한다.
- 세션 payload에는 권한과 만료시각만 포함하고 서명을 검증한다.
- 로그인 성공 시 세션 고정 공격을 피하도록 새 세션을 발급한다.
- 로그인 실패 응답은 계정 존재 여부를 구분하지 않는다.
- 반복 시도를 DB 기반으로 제한한다.
- 관리자 페이지 렌더링과 데이터 조회 함수가 각각 권한을 확인한다. Proxy만 보안 경계로 사용하지 않는다.

`next` 파라미터는 내부 상대경로이면서 허용된 관리자 경로일 때만 사용한다. 스킴 상대 URL, 외부 URL, 인코딩 우회, 백슬래시를 거부한다.

### 4.8 잘못된 URL 보정

다음 경로는 `/admin/ai-visits`로 308 redirect한다.

- `/admin/ai-visits%22`
- `/admin/ai-visits"`
- `/admin/ai-visit`

인증되지 않았으면 정식 경로가 안전한 로그인 흐름으로 연결된다. 다른 임의의 관리자 오타를 광범위하게 추측 보정하지 않는다.

### 4.9 관리자 화면

프로젝트의 `AGENTS.md` 규칙에 따라 관리자 화면을 구현하기 전에 Pencil 파일 `초안`을 갱신하고 검토한다.

화면 구성:

1. 제목: `AI 어시스턴트별 방문`
2. 30일 범위 안내와 User-Agent 한계 고지
3. KPI 카드 4개
4. 봇별 방문 표
5. 검색 인덱싱·학습·실시간 인용 설명 카드
6. 기록이 없을 때 빈 상태 문구
7. 로그아웃 동작

운영자 문구는 사용자가 지정한 `검색 인덱싱`, `학습`, `실시간 인용`, `봇`, `방문`, `변화`를 사용한다.

## 5. 테스트 우선 구현 순서

각 기능은 테스트를 먼저 작성하고 예상 이유로 실패하는 것을 확인한 뒤 최소 구현으로 통과시킨다.

1. User-Agent 전체 분류표와 fallback 테스트
2. 공개 경로 포함·관리자/API/정적 파일 제외 테스트
3. raw IP·쿠키·query 미저장과 referrer 정제 테스트
4. 방문 이벤트 생성·저장 실패 비차단 테스트
5. 최근 30일·직전 30일 통계와 동률·0 기준 테스트
6. 세션 서명·만료·반복 시도 제한·안전한 `next` 테스트
7. 관리자 인증·KPI·표·설명 카드·빈 상태 렌더링 테스트
8. 잘못된 관리자 URL 308 보정 테스트
9. 고객 공개 화면 금지 용어 비노출 테스트

현재 정규식 기반 소스 검사 테스트만으로는 서버 동작을 충분히 검증할 수 없으므로, 순수 모듈 테스트와 실제 HTTP 통합 테스트를 함께 사용한다.

## 6. 실행 검증

로컬 검증:

- 전체 자동 테스트
- ESLint
- Next.js production build
- production 모드 서버 기동
- 공개 홈페이지 200
- 로그인 전 관리자 경로가 로그인으로 연결됨
- 로그인 후 관리자 AI 방문 페이지 200
- 잘못된 관리자 URL이 404 없이 정식 경로로 보정됨
- 지정된 synthetic User-Agent 15종으로 공개 페이지 요청
- DB에 `bot_id`, `purpose`, 정제된 path가 정확히 저장됨
- 브라우저 콘솔 오류 0
- 서버 로그에 EACCES, permission denied, TypeError, ReferenceError 없음

운영 검증:

- 배포 전 현재 production deployment URL을 복구 기준으로 기록
- Neon 연결과 스키마 적용 확인
- 비밀번호 해시·세션 비밀키 환경변수 설정 확인
- 운영 배포 후 서비스와 도메인 응답 확인
- 관리자 로그인과 대시보드 확인
- synthetic 요청 기록을 확인한 뒤 테스트 행 삭제
- 최근 Vercel 로그의 주요 오류 확인

계정 약관, 요금제 선택, 결제 또는 본인 확인이 나타나면 사용자가 직접 승인해야 하며 에이전트가 임의로 동의하지 않는다.

## 7. 오류 처리

- 분류 실패: 일반 요청으로 보고 기록하지 않는다.
- DB 연결 또는 INSERT 실패: warning을 남기고 페이지 응답은 계속한다.
- 통계 조회 실패: 관리자 화면에 민감정보 없는 오류 상태를 보여주며 공개 페이지에는 영향이 없다.
- 인증 환경변수 누락: 관리자 로그인은 fail-closed로 거부한다.
- DB 환경변수 누락: 수집은 warning 후 건너뛰고 관리자 화면은 설정 필요 상태를 표시한다.

## 8. 완료 기준

다음 항목을 모두 실제 출력으로 확인해야 완료로 보고한다.

- User-Agent 분류 테스트 PASS
- 방문 기록·개인정보 보호 테스트 PASS
- 요약 통계 테스트 PASS
- 관리자 인증·대시보드 테스트 PASS
- 고객 화면 금지 용어 테스트 PASS
- URL 보정·open redirect 방지 테스트 PASS
- 전체 테스트 PASS
- 린트 PASS
- 빌드 PASS
- 로컬 HTTP·synthetic 기록 PASS
- 브라우저 콘솔 오류 0
- 운영 배포 및 실제 기록 PASS

운영 배포나 계정 연결이 승인 대기 또는 외부 서비스 문제로 막히면 해당 항목은 PASS로 표시하지 않고 정확한 차단 사유를 보고한다.

## 9. 범위 밖

- 봇 IP 대역의 reverse DNS 또는 공식 IP 목록 대조
- 사람 방문 분석
- 광고 전환 분석
- 고객용 분석 화면
- 자동 데이터 삭제 정책
- 여러 관리자 계정과 역할 관리
- User-Agent만으로 실제 봇 신원을 보증하는 기능

## 10. 참고 근거

- 프로젝트 `AGENTS.md`
- 프로젝트에 포함된 Next.js 16 문서: Proxy, `after()`, cookies, authentication, deployment
- Vercel Storage 및 Marketplace Postgres 문서(2026-07-26 확인)
- 왕징양다리양꼬치 위키 `SCHEMA.md`, `index.md`, 최근 `log.md`

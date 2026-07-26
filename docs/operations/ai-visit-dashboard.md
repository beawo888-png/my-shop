# AI·검색봇 방문 대시보드 운영 안내

## 관리자 주소

- 로그인: `/admin/login`
- 대시보드: `/admin/ai-visits`

운영 배포 전에는 이 주소가 현재 공개 사이트에 존재하지 않는다.

## 저장 방식

### 로컬 검증

`AI_VISIT_STORAGE=file`을 사용한다. `AI_VISIT_FILE_PATH`는 반드시 프로젝트 폴더 밖의 절대경로여야 한다.

예시:

```text
C:\Users\USER\Desktop\왕징홈페이지_관리자데이터\ai-visits.jsonl
```

개발 모드에서만 JSONL 저장이 허용된다. `NODE_ENV=production`에서는 파일 저장을 거부하므로 Vercel 임시 파일시스템에 기록이 남는 것처럼 오인하지 않는다.

### 운영

운영은 Neon PostgreSQL을 사용한다.

1. Vercel Marketplace에서 Neon DB를 생성·연결한다.
2. 운영 환경변수 `AI_VISIT_STORAGE=postgres`와 `DATABASE_URL`을 등록한다.
3. DB 연결 환경에서 `npm run db:migrate`를 한 번 실행한다.
4. migration 성공 문구 `AI visit analytics schema is ready`를 확인한다.

## 관리자 비밀값

다음 명령은 비밀번호를 화면에 표시하지 않고 scrypt 해시와 임의 비밀값을 만든다.

```bash
npm run admin:secrets
```

출력되는 세 값은 Vercel 비밀 환경변수에만 등록하고 소스·문서·채팅·스크린샷에 저장하지 않는다.

- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `ADMIN_IP_HASH_SECRET`

관리자 세션은 12시간 유효하며 HttpOnly, Secure(운영), SameSite=Strict, `/admin` 경로 쿠키로 제한된다.

## 개인정보 처리

방문 이벤트에는 다음만 저장한다.

- 시간
- 공개 페이지 path
- 정제·길이 제한된 User-Agent
- botId, botName, vendor, purpose
- 쿼리와 fragment를 제거한 referrer(있는 경우)

방문 이벤트에는 raw IP와 ipHash를 모두 저장하지 않는다. 현재 통계는 고유 방문자 수가 아니라 분류된 요청 수다. 로그인 시도 제한에만 raw IP를 메모리에서 HMAC 처리한 16자리 hash를 사용하며 raw IP는 저장하지 않는다.

## 로컬 synthetic 검증

프로젝트 밖 JSONL 경로와 테스트용 관리자 비밀값으로 서버를 시작한 뒤 다음을 실행한다.

```bash
AI_VISIT_BASE_URL='http://127.0.0.1:3100' \
AI_VISIT_FILE_PATH='C:/Users/USER/Desktop/왕징홈페이지_관리자데이터/ai-visits.jsonl' \
npm run test:synthetic
```

성공 출력:

```text
SYNTHETIC_AI_VISITS_PASS http=15 records=15
```

검증 대상은 GPTBot, OAI-SearchBot, ChatGPT-User, Claude 계열, Perplexity 계열, DuckAssistBot, Amazon 계열, Meta 계열, Bytespider, cohere-ai다.

## 배포 전 확인

- 현재 프로덕션 배포 URL과 rollback 대상을 확인한다.
- Neon DB와 migration을 확인한다.
- 운영 환경변수 5개를 확인한다.
- `AI_VISIT_STORAGE=file`이 운영에 설정되지 않았는지 확인한다.
- `npm test`, `npm run lint`, `npm run build`를 모두 통과시킨다.
- `.env`와 JSONL이 Git 또는 Vercel 업로드에 포함되지 않았는지 확인한다.

## 배포 후 확인

- 공개 `/`, `/menu`, `/reviews`가 200인지 확인한다.
- 비인증 `/admin/ai-visits`가 로그인으로 이동하는지 확인한다.
- 로그인 후 `/admin/ai-visits`가 200인지 확인한다.
- `/admin/ai-visits%22`, `/admin/ai-visits"`, `/admin/ai-visit`가 정식 경로로 보정되는지 확인한다.
- synthetic User-Agent 요청이 DB에 정확한 botId와 purpose로 기록되는지 확인한다.
- 브라우저 콘솔 오류가 0인지 확인한다.
- 최근 Vercel 로그에 EACCES, permission denied, TypeError, ReferenceError가 없는지 확인한다.

## 장애와 롤백

방문 기록 실패는 공개 홈페이지 응답을 중단하지 않고 경고만 남긴다. DB 장애 시 관리자 화면에는 저장소 점검 안내가 표시된다.

문제가 생기면 직전 Vercel 프로덕션 배포로 rollback한다. DB migration은 기존 테이블을 삭제하지 않는 `CREATE TABLE IF NOT EXISTS`와 `CREATE INDEX IF NOT EXISTS`만 사용하므로 코드 rollback 시 기존 방문 데이터는 보존한다.

@AGENTS.md

# my-shop — 왕징양다리양꼬치 홈페이지 + 네이버 자동화

사장님 PC(Windows) 한 대에서 돌아가는 저장소. 두 가지가 같이 들어 있다.

1. **홈페이지** (Next.js, Vercel 배포) — `app/`, `components/`, `lib/*-content.ts`
2. **네이버/SNS 자동화** (Node 스크립트 + 작업 스케줄러) — `scripts/`, `lib/{smartplace,blog,searchad,notify,threads}`

세션을 시작하면 **`PROGRESS.md`를 먼저 읽고** 이어서 작업한다. 작업을 끝낼 때 `PROGRESS.md`를 갱신한다.

## 지점

| 키 | 지점 | 비고 |
|---|---|---|
| `pangyo` | 판교점 | 네이버 아이디·광고 계정 따로 |
| `moran` | 모란본점 | 네이버 아이디·광고 계정 따로 |

지점 정보: `lib/smartplace/branches.mjs`

## 자동화 한눈에 보기

| 무엇 | 언제 | 명령 | 로그인 방식 | 운영 문서 |
|---|---|---|---|---|
| 예약 엑셀 + 영수증 리뷰 답글 + 소식 + 블로그 | 매일 09:00 (09:40 재시도) | `npm run smartplace:daily` | 브라우저(지점별 프로필) | `docs/operations/smartplace-automation.md` |
| 예약 엑셀(밤) | 매일 22:00 (`WangjingBookingsNightly`) | `npm run smartplace:bookings-night` | 브라우저 | 같은 문서 |
| 블로그 '메뉴추천' 발행 | 09:00 작업 안에서 같이 | `npm run blog:post` | 브라우저 | `docs/operations/naver-blog-automation.md` |
| 검색광고 키워드 분석 / 라이브애드 감시 | 감시 매일 08:20 | `npm run ads:keywords`, `npm run ads:watch` | **공식 API 키** (로그인 없음, 읽기 전용) | `docs/operations/searchad-keywords.md` |
| 카카오톡 알림 | 각 작업 결과 | `npm run kakao:test` | 카카오 토큰 | `docs/operations/kakao-notify.md` |
| 쓰레드 발행 | GitHub Actions `daily-thread.yml` | `npm run threads:post` | Threads API 토큰(60일 갱신) | `docs/operations/threads-automation.md` |

영수증 리뷰 답글 본체는 **이 저장소 밖**의 파이썬 프로그램: `C:\클라우드\네이버플레이스 영수증 자동리뷰\daily_run.py` (경로는 `.smartplace/config.json`의 `reviewProgram`).

## 로그인 관련 규칙 (중요)

- 브라우저 자동화는 `launchPersistentContext`로 **지점별 고정 프로필**(`.smartplace/profile-*`)을 쓴다. 프로필을 지우거나 새로 만들지 않는다.
- 로그인이 오래 가려면 네이버 로그인 시 **'로그인 상태 유지'가 켜져 있어야** 한다. 꺼져 있으면 쿠키가 세션 쿠키라 PC 재부팅·창 닫힘에 풀린다 (`lib/smartplace/login-cookies.mjs`가 판별).
- 로그인 풀림은 PC 알림 + 카카오톡으로 알리고 사장님이 직접 로그인할 때까지 기다린다. **비밀번호 자동 입력·캡차 우회는 만들지 않는다.**
- 검색광고 클라이언트(`lib/searchad/client.mjs`)는 일부러 GET만 한다. 광고 설정을 바꾸는 요청은 사장님 확인 없이 추가하지 않는다.

## 비밀값과 로컬 전용 파일

`.smartplace/` 전체(프로필, `config.json`, `searchad.json`, `kakao.json`, 로그)와 `.env*`는 **깃에 올라가지 않는다**. 값을 출력하거나 커밋하지 않는다.

## 폴더 메모

- `초안` — Pencil 디자인 원본 파일(화면 작업 전 먼저 수정, AGENTS.md 참고). `초안-exports/` — 그 내보낸 이미지. 코드 없음.
- `.worktrees/`, `초안-exports/.claude/worktrees/` — 작업용 복사본(브랜치별). 본 작업은 저장소 루트에서 한다.
- `docs/superpowers/plans/` — 지난 홈페이지 작업 계획서(기록용).

## 자주 쓰는 확인

```powershell
npm test
npm run smartplace:test     # 로그인·화면 점검(등록 안 함)
npm run blog:setup          # 지점별 로그인 + '로그인 상태 유지' 확인
npm run ads:watch-test      # 라이브애드 감시 시험(카톡 안 보냄)
```

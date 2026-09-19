# 쓰레드 매일 자동 발행

외식업 사장님들이 공감할 글 한 편을 **매일 오전 7시(KST)** 에 Threads에 자동으로 올린다.

- 글자 수: 공백·줄바꿈 포함 **185~215자 (목표 200자)**
- 원고집: `content/threads/posts.txt` (60편, 두 달치)
- 스케줄러: `.github/workflows/daily-thread.yml` (cron `50 21 * * *` = 06:50 KST)
- 발행 이력: `data/threads-log.jsonl`

> Pencil(`초안`) 스케치 단계는 해당 없음 — 이 작업은 사이트 화면을 바꾸지 않는 백그라운드 자동화다.

## 매일 일어나는 일

1. 깃허브 액션이 21:50 UTC(= 06:50 KST)에 깨어난다.
2. 원고집을 점검하고 그날의 원고를 고른다.
   - 날짜 기반 회전이라 같은 날에는 늘 같은 글이 나온다.
   - 최근에 올린 글은 건너뛰어 한 바퀴(60일) 안에 중복이 없다.
   - `ANTHROPIC_API_KEY`가 있으면 Claude가 최근 글을 피해 **새 원고**를 쓰고, 실패하면 원고집으로 돌아간다.
3. 글자 수·해시태그·이모지·마크다운을 다시 확인한다.
4. Threads API로 올린다 (컨테이너 생성 → 발행, 2단계).
5. 결과를 `data/threads-log.jsonl`에 기록하고 커밋한다.

같은 날짜가 이미 기록돼 있으면 건너뛰므로, 워크플로를 두 번 돌려도 두 번 올라가지 않는다.

## 처음 한 번만 하는 설정

### 1. Threads API 접근 권한

1. [Meta 개발자 사이트](https://developers.facebook.com/)에서 앱을 만들고 **Threads API** 용도를 추가한다.
2. 권한 `threads_basic`, `threads_content_publish`를 요청한다.
3. 본인 Threads 계정으로 인증해 **장기 액세스 토큰(60일)** 을 발급받는다.
4. 계정 ID를 확인한다.

   ```bash
   curl "https://graph.threads.net/v1.0/me?fields=id,username&access_token=<토큰>"
   ```

### 2. 저장소 Secrets 등록

`Settings → Secrets and variables → Actions`에 등록한다.

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `THREADS_USER_ID` | 예 | 위에서 확인한 계정 ID |
| `THREADS_ACCESS_TOKEN` | 예 | 장기 액세스 토큰 |
| `ANTHROPIC_API_KEY` | 아니오 | 있으면 매일 새 원고를 Claude가 쓴다 |

> 토큰이 없으면 워크플로는 실패하지 않고 **미리보기 모드**로 돈다. 그날 올렸을 글이 실행 요약에 그대로 찍히므로, 설정 전에도 어떤 글이 나갈지 확인할 수 있다.

### 3. 토큰 갱신 (60일마다)

```bash
THREADS_ACCESS_TOKEN=<현재 토큰> node scripts/refresh-threads-token.mjs
```

출력된 새 토큰을 `THREADS_ACCESS_TOKEN` Secret에 다시 넣는다. 만료된 뒤에는 갱신이 안 되고 재발급해야 하니, 50일쯤에 알림을 걸어두면 좋다.

## 평소 운영

```bash
npm run threads:check      # 원고집 글자 수·형식 점검
npm run threads:preview    # 오늘 나갈 글 미리보기 (올리지 않음)
npm run threads:post       # 지금 바로 올리기
```

원고를 손보거나 새로 넣을 때는 `content/threads/posts.txt` 맨 아래에 블록을 붙인다.

```
== id: my-new-post | theme: 주차 문제
첫 줄은 장면이나 숫자로 시작한다.

...

마지막은 담담한 한 줄로 닫는다.
```

- `id`는 영문·숫자·하이픈만 쓰고, **한 번 정하면 바꾸지 않는다** (발행 이력과 중복 방지에 쓰인다).
- 저장한 뒤 `npm run threads:check`로 185~215자 안에 들어오는지 확인한다.
- 원고가 늘어날수록 같은 글이 다시 나오는 주기도 길어진다.

### 손으로 한 번 돌리기

깃허브 `Actions → 쓰레드 매일 자동 발행 → Run workflow`에서 실행한다.

- `dry_run`: 올리지 않고 요약에만 남긴다.
- `source`: `auto`(기본) / `bank`(원고집만) / `ai`(Claude 생성만).

## 문제가 생기면

| 증상 | 확인할 것 |
| --- | --- |
| 실행은 됐는데 안 올라감 | 요약에 "미발행"이 찍혔는지 — Secrets 누락이거나 dry-run |
| `HTTP 401` / `bad token` | 토큰 만료 — 갱신하거나 재발급 |
| `HTTP 4xx`로 즉시 실패 | 권한(`threads_content_publish`) 또는 계정 ID 확인 |
| 7시에서 몇 분 밀림 | 깃허브 크론은 예약 시각보다 늦게 도는 일이 흔하다 (정상). 06:50에 예약해 지연을 흡수한다 |
| 같은 글이 또 나옴 | `data/threads-log.jsonl`이 커밋되고 있는지 확인 |

Threads는 24시간에 250건까지 올릴 수 있으므로 하루 한 편은 여유가 있다.

# 쓰레드 매일 자동 발행

외식업 사장님들이 공감할 글 한 편을 **매일 오전 7시(KST)** 에 Threads에 자동으로 올린다.

- 글자 수: 공백·줄바꿈 포함 **185~215자 (목표 200자)**
- 원고집: `content/threads/posts.txt` (120편, 넉 달치)
- 스케줄러: `.github/workflows/daily-thread.yml` (06:45 / 07:10 / 07:35 KST 3중 예약)
- 발행 이력: `data/threads-log.jsonl`

> Pencil(`초안`) 스케치 단계는 해당 없음 — 이 작업은 사이트 화면을 바꾸지 않는 백그라운드 자동화다.

## 매일 일어나는 일

1. 깃허브 액션이 06:45 KST에 깨어난다. (밀리면 07:10, 07:35에 한 번 더 시도한다)
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
| `THREADS_ACCESS_TOKEN` | 예 | 장기 액세스 토큰 (자동 갱신되며 값이 바뀐다) |
| `GH_SECRETS_TOKEN` | 아니오 | 있으면 토큰을 자동으로 갱신한다 (아래 참고) |
| `ANTHROPIC_API_KEY` | 아니오 | 있으면 매일 새 원고를 Claude가 쓴다 |

> 토큰이 없으면 워크플로는 실패하지 않고 **미리보기 모드**로 돈다. 그날 올렸을 글이 실행 요약에 그대로 찍히므로, 설정 전에도 어떤 글이 나갈지 확인할 수 있다.

### 3. 토큰 자동 갱신

Threads 토큰은 60일짜리다. `GH_SECRETS_TOKEN`만 등록해두면 사람이 손댈 일이 없다.

1. 깃허브 `Settings → Developer settings → Personal access tokens → Fine-grained tokens`에서 토큰을 만든다.
   - Repository access: 이 저장소만
   - Repository permissions → **Secrets: Read and write**
2. 그 값을 저장소 Secret `GH_SECRETS_TOKEN`으로 등록한다.

`.github/workflows/rotate-threads-token.yml`이 **매달 6일·21일 03:17 KST**에 돈다.

1. 현재 토큰으로 갱신을 요청해 새 60일 토큰을 받는다.
2. 새 토큰으로 계정을 한 번 읽어 진짜 되는지 본다. (계정이 `THREADS_USER_ID`와 다르면 멈춘다)
3. 저장소 공개키로 봉해서 `THREADS_ACCESS_TOKEN` Secret을 덮어쓴다.

어느 단계든 실패하면 Secret은 건드리지 않고 워크플로가 빨갛게 끝난다. 토큰 값은 로그에 찍지 않는다.
한 번 걸러도 다음 차례까지 30일이 남으므로 한 번의 실패로 만료되지는 않는다.

```bash
# 깃허브 토큰이 Secrets에 닿는지만 보기 (Threads는 건드리지 않는다)
GH_SECRETS_TOKEN=<깃허브 토큰> GITHUB_REPOSITORY=<owner/repo> node scripts/rotate-threads-token.mjs --check

# 갱신만 해보고 Secret은 그대로 두기
THREADS_ACCESS_TOKEN=<현재 토큰> node scripts/rotate-threads-token.mjs --dry-run

# 토큰이 아직 살아 있는지만 보기 (글은 올리지 않는다)
THREADS_ACCESS_TOKEN=<현재 토큰> npm run threads:token
```

`GH_SECRETS_TOKEN`을 안 쓸 거라면 수동으로도 된다.

```bash
THREADS_ACCESS_TOKEN=<현재 토큰> node scripts/refresh-threads-token.mjs
```

출력된 새 토큰을 `THREADS_ACCESS_TOKEN` Secret에 다시 넣는다.
**이미 만료된 뒤에는 갱신이 안 되고 Meta 콘솔에서 재발급해야 한다.**

## 댓글 답글

새 댓글을 **한 시간에 한 번**(09:23~23:23 KST) 훑는다. `.github/workflows/threads-replies.yml`

- 분명한 칭찬·감사에만 미리 적어둔 짧은 문장으로 답한다 (`lib/threads/replies.mjs`의 `REPLY_TEXTS`)
- 물어보는 글·불만·홍보·긴 글은 **건드리지 않고** 사장님 확인으로 넘긴다
- 한 번에 자동 답글은 최대 10건 (`THREADS_REPLY_MAX`)
- 같은 댓글에 두 번 답하지 않는다 (`data/threads-replies.jsonl`)

손님 글을 되받아 쓰지 않고 미리 적어둔 문장만 쓴다. 분류는 `classifyReply`가 하고,
칭찬 낱말이 **있으면서** 질문·불만·홍보 낱말이 **하나도 없어야** 자동 답글이 나간다.

### 이 저장소는 공개다

그래서 손님이 쓴 글과 아이디는 **저장소에도 실행 로그에도 남기지 않는다.**
남기는 것은 댓글 id, 처리 결과, 우리가 올린 문장뿐이다.
확인이 필요한 댓글은 글 주소만 찍고, 내용은 쓰레드 앱에서 읽는다.

### 필요한 권한

토큰에 **`threads_manage_replies`** 가 있어야 한다. 없으면 댓글을 읽지도 못한다.
권한을 추가한 뒤에는 **토큰을 새로 발급**받아야 한다(기존 토큰에는 새 권한이 안 붙는다).

```bash
# 답글을 달지 않고 몇 건이나 걸리는지만 보기
THREADS_USER_ID=... THREADS_ACCESS_TOKEN=... npm run threads:replies-preview

# 확인이 필요했던 댓글에 손으로 하나 답하기
node scripts/reply-to-threads-comments.mjs --reply-to=<댓글id> --text="..."
```

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
| 7시에서 몇 분 밀림 | 깃허브 크론은 시각을 보장하지 않는다 (실측 1시간 54분 지연). 3중 예약으로 흡수한다 |
| 같은 글이 또 나옴 | `data/threads-log.jsonl`이 커밋되고 있는지 확인 |

Threads는 24시간에 250건까지 올릴 수 있으므로 하루 한 편은 여유가 있다.

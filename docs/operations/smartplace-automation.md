# 네이버 스마트플레이스 소식 매일 자동 발행

판교점·모란본점 스마트플레이스 **소식**에 매일 **오전 9시**에 글 한 편과 사진 한 장을 자동으로 올린다.

> Pencil(`초안`) 스케치 단계는 해당 없음: 사이트 화면을 바꾸지 않는 사장님 PC 자동화다.

- 날짜별 원고: `content/smartplace/plan-YYYY-MM.json` (그날·그 지점 글을 미리 써 둔 것, 있으면 이것이 먼저)
- 원고집: `content/smartplace/posts.txt` (요일별 4편 × 7일 = 28편, 지점 공용, 날짜별 원고가 없는 날에 쓴다)
- 사진: `public/images/wangjing/` 안의 홈페이지 사진을 그대로 쓴다
- 실행: 사장님 PC의 **작업 스케줄러**가 09:00에 실행하고, 09:40에 한 번 더 실행해 놓친 지점을 올린다
- 기록: `.smartplace/` 폴더 (로그인 정보·설정·이력·스크린샷, 깃에 올라가지 않음)

## 왜 PC에서 도나

스마트플레이스 소식은 Threads와 달리 공식 게시 API가 없다. 그래서 사장님 PC의 **전용 크롬 창**(네이버 로그인 유지)을 프로그램이 대신 조작한다.
판교점과 모란본점은 **네이버 아이디가 달라서** 전용 크롬 프로필도 지점마다 따로 둔다(`.smartplace/profile-pangyo`, `.smartplace/profile-moran`).

- 9시에 PC가 켜져 있고 윈도우에 로그인돼 있어야 한다. 절전 상태면 깨워서 실행하고, 꺼져 있었으면 켜진 뒤 바로 실행한다.
- 네이버가 화면을 바꾸면 멈출 수 있다. 멈추면 화면에 알림 창이 뜬다.
- 자동화 도구 사용이 네이버 이용약관에 걸릴 수 있다는 점을 알고 쓴다.

## 매일 일어나는 일

09:00 작업(`npm run smartplace:daily`, `scripts/smartplace/daily.mjs`)은 지점마다 크롬을 한 번 열어 아래 순서로 처리한다.
로그인이 풀려 있으면 알림 창을 띄우고, 사장님이 그 크롬 창에서 로그인할 때까지 20분 기다린 뒤 이어서 한다.

1. **전날 방문 예약 손님 엑셀**: 네이버 예약 파트너센터에서 이용일이 어제인 예약을 모두 읽어
   바탕화면 `판교점 예약고객.xlsx`, `모란점 예약고객.xlsx`의 `예약고객` 시트 한 장에 일자 순으로 이어 적는다(같은 날짜를 다시 받으면 그 날짜 줄만 새로 덮는다).
   열은 일자 · 고객님 이름 · 핸드폰번호 · 비고이고, 취소된 예약은 비고에 `취소`라고 적는다. 엑셀 파일이 열려 있으면 알림을 띄우고 닫힐 때까지 5분 기다린다.
   네이버는 방문일이 약 6개월 지난 예약의 이름·번호를 `***`로 가려서 준다. 매일 저장해 두는 이유다.
   지난 날짜를 다시 만들려면 `npm run smartplace:bookings -- --date=2026-10-17`.
2. **영수증 리뷰 답글**: 별도 파이썬 프로그램(`C:\클라우드\네이버플레이스 영수증 자동리뷰\daily_run.py <플레이스번호>`)을 그 지점만 실행하고 끝날 때까지(최대 60분) 기다린다.
   그 프로그램은 자기 크롬·쿠키로 로그인하고, 자체 10:00·20:00 실행도 그대로 있다(같이 돌면 나중 것이 건너뛴다). 경로는 `.smartplace/config.json`의 `reviewProgram` (`python`, `script`, `timeoutMinutes`)으로 바꿀 수 있다.
3. **소식** (아래)

소식은 이렇게 올린다.

1. 원고를 고른다. 그 달의 날짜별 원고(`plan-YYYY-MM.json`)에 그날·그 지점 항목이 있으면 그것을 쓴다(아래 "날짜별 원고").
   없으면 요일에 맞는 원고집 원고를 쓴다. 같은 요일 원고 4편이 주마다 돌아가고, 두 지점은 같은 날 서로 다른 글이 나간다.
2. 원고집 원고는 `{지점}`, `{주차}`, `{오시는길}` 같은 자리표시를 지점 정보(`lib/smartplace/branches.mjs`)로 바꾼다. 날짜별 원고는 지점마다 따로 써서 그대로 쓴다.
3. 지점별 전용 크롬(그 지점 아이디로 로그인된 창)을 차례로 열고 '소식 작성' 화면에서 사진을 올리고, 글을 넣고, 등록을 누른다.
4. 결과를 `.smartplace/log.jsonl`에 남기고 화면을 `.smartplace/screenshots/`에 저장한다.
5. 그날 이미 등록한 지점은 다시 올리지 않는다. 그래서 09:40 실행이 있어도 두 번 올라가지 않는다.

## 처음 한 번만 하는 설정 (사장님 PC)

PC에 Node.js와 크롬이 설치돼 있어야 한다. 프로젝트 폴더(`C:\vibecoding\my-shop`)에서 진행한다.

```powershell
git pull
npm install
```

### 1. 지점별 네이버 로그인 + 주소 저장

```powershell
npm run smartplace:setup
```

판교점 → 모란본점 순서로 **크롬 창이 하나씩 따로** 뜬다. 지점마다 아래를 반복한다.

1. 뜬 크롬 창에서 **그 지점의 네이버 아이디**로 로그인하고 **'로그인 상태 유지'를 체크**한다.
2. 그 지점 → 소식 → **새 소식 작성** 화면까지 들어간 뒤 터미널에서 엔터. 창이 닫히고 다음 지점 창이 뜬다.

이 크롬 창들은 평소 쓰는 크롬과 따로 쓰는 자동화 전용 창이다. 한 지점만 다시 하려면 `npm run smartplace:setup -- --branch=moran` (또는 `pangyo`).

### 2. 시험 실행 (등록은 누르지 않음)

```powershell
npm run smartplace:test
```

판교점 창부터 사진과 글이 채워지고 **등록 직전에서 멈춘다**. 눈으로 확인하고 크롬 창을 닫으면 모란본점 창이 이어서 뜬다.
잘 안 채워지면 아래 '화면이 바뀌었을 때'를 본다.

### 3. 매일 9시 예약 등록

```powershell
npm run smartplace:schedule
```

지금 바로 한 번 실제로 올려 보려면 `Start-ScheduledTask -TaskName WangjingSmartplaceNews`.
예약을 지우려면 `npm run smartplace:unschedule`.

## 평소 운영

| 하고 싶은 일 | 명령 |
| --- | --- |
| 오늘 나갈 글 미리 보기 | `npm run smartplace:preview` |
| 특정 날짜 글 보기 | `npm run smartplace:preview -- --date=2026-10-20` |
| 원고집·날짜별 원고 점검 | `npm run smartplace:check` |
| 한 지점만 지금 올리기 | `npm run smartplace:post -- --branch=moran` |
| 오늘 다시 올리기 | `npm run smartplace:post -- --force` |
| 실행 기록 보기 | `.smartplace\task.log`, `.smartplace\screenshots\` |

- 원고를 고치거나 늘리려면 `content/smartplace/posts.txt`를 고치고 `npm run smartplace:check`를 돌린다.
- 메뉴 가격이 바뀌면 원고집의 가격도 함께 고친다.
- 할인·이벤트 같은 실제 혜택은 원고집에 없다. 할 때만 직접 올린다.

## 날짜별 원고 (`plan-YYYY-MM.json`)

달마다 `content/smartplace/plan-2026-10.json`처럼 파일 하나를 둔다. 발행 날짜(KST)의 연·월로 파일을 찾는다.

```json
{
  "range": "2026-10-18 ~ 2026-10-31",
  "posts": [
    {
      "date": "2026-10-18",
      "branch": "pangyo",
      "searchKeyword": "판교 양꼬치",
      "topic": "생양꼬치",
      "photo": "menu/fresh-lamb-skewers.jpg",
      "title": "판교 양꼬치, 기본은 생양꼬치부터",
      "body": "본문 (이모티콘 3개, 줄바꿈은 \n)",
      "hashtags": ["판교양꼬치", "판교맛집", "판교역맛집", "생양꼬치", "왕징양다리양꼬치"]
    }
  ]
}
```

- `branch`: `pangyo` 또는 `moran`. 같은 날짜·지점 항목은 하나만.
- `photo`: `public/images/wangjing/` 기준 경로.
- `searchKeyword`·`topic`은 원고를 쓸 때 참고용이고, 올라가지는 않는다.
- 올라가는 모양: 제목칸에 `title`, 본문칸에 `body` + 빈 줄 + 해시태그 5개(`#판교양꼬치 #판교맛집 ...`, `#`은 자동으로 붙는다).
  제목칸이 없는 화면이면 제목을 첫 줄로 해서 본문칸에 모두 넣는다.

**우선순위**: 그날·그 지점 항목이 날짜별 원고에 있으면 그것을 쓴다. 없으면(파일이 없거나 그 날짜·지점이 빠졌으면) 요일별 원고집 `posts.txt`를 쓴다.
한 지점만 날짜별 원고가 있어도 된다. 다른 지점은 원고집에서 나간다.

**점검 규칙** (`npm run smartplace:check`, 발행 전에도 자동 점검):

| 항목 | 날짜별 원고 | 원고집 `posts.txt` |
| --- | --- | --- |
| 제목 | 5~40자, 이모티콘 없음 | 첫 줄 |
| 본문 길이 | 해시태그 포함 10~1000자 (스마트플레이스 본문칸 한도) | 80~400자 |
| 이모티콘 | 본문에 정확히 3개 | 금지 |
| 해시태그 | `hashtags`에 정확히 5개, 빈칸·중복 없음, 본문 안에는 금지 | 금지 |
| 사진 | 파일이 있어야 함 | 파일이 있어야 함 |

날짜별 원고에 문제가 하나라도 있으면 그 달은 발행을 멈추고 알림을 띄운다.

## 이런 알림이 뜨면

| 알림 | 할 일 |
| --- | --- |
| ○○ 네이버 로그인이 풀렸습니다 | 알림에 나온 대로 `npm run smartplace:setup -- --branch=...` 실행 (주소는 `s`로 그대로 둔다). 다른 지점은 그대로 올라간다 |
| 소식 작성 주소가 없습니다 | `npm run smartplace:setup` |
| ○○ 칸/버튼을 찾지 못했습니다 | 아래 '화면이 바뀌었을 때' |
| 등록은 눌렀지만 완료 화면을 확인하지 못했습니다 | 스마트플레이스에서 올라갔는지 확인. 안 올라갔으면 `--branch=... --force`로 다시 |

## 화면이 바뀌었을 때

프로그램은 버튼 글자(`등록`, `새 소식 작성` 등)와 입력칸 종류로 화면을 찾는다. 네이버가 화면을 바꿔 못 찾으면 `.smartplace/config.json`에 `selectors`를 넣어 덮어쓴다.

```json
{
  "branches": { "pangyo": { "newsUrl": "..." }, "moran": { "newsUrl": "..." } },
  "selectors": {
    "text": "textarea",
    "photo": "input[type='file']",
    "submit": "role=button[name='등록']"
  }
}
```

쓸 수 있는 키: `writeButton`, `title`, `text`, `photo`, `photoEditorDone`, `submit`, `confirm`. 기본값은 `lib/smartplace/browser.mjs`의 `DEFAULT_SELECTORS`에 있다.
크롬이 기본 위치에 없으면 환경변수 `SMARTPLACE_CHROME_PATH`에 `chrome.exe` 경로를 넣는다.

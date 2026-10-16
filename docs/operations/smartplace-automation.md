# 네이버 스마트플레이스 소식 매일 자동 발행

판교점·모란본점 스마트플레이스 **소식**에 매일 **오전 9시**에 글 한 편과 사진 한 장을 자동으로 올린다.

> Pencil(`초안`) 스케치 단계는 해당 없음: 사이트 화면을 바꾸지 않는 사장님 PC 자동화다.

- 원고집: `content/smartplace/posts.txt` (요일별 4편 × 7일 = 28편, 지점 공용)
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

1. 요일에 맞는 원고를 고른다. 같은 요일 원고 4편이 주마다 돌아가고, 두 지점은 같은 날 서로 다른 글이 나간다.
2. 원고의 `{지점}`, `{주차}`, `{오시는길}` 같은 자리표시를 지점 정보(`lib/smartplace/branches.mjs`)로 바꾼다.
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
| 원고집 점검 | `npm run smartplace:check` |
| 한 지점만 지금 올리기 | `npm run smartplace:post -- --branch=moran` |
| 오늘 다시 올리기 | `npm run smartplace:post -- --force` |
| 실행 기록 보기 | `.smartplace\task.log`, `.smartplace\screenshots\` |

- 원고를 고치거나 늘리려면 `content/smartplace/posts.txt`를 고치고 `npm run smartplace:check`를 돌린다.
- 메뉴 가격이 바뀌면 원고집의 가격도 함께 고친다.
- 할인·이벤트 같은 실제 혜택은 원고집에 없다. 할 때만 직접 올린다.

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

쓸 수 있는 키: `writeButton`, `title`, `text`, `photo`, `submit`, `confirm`. 기본값은 `lib/smartplace/browser.mjs`의 `DEFAULT_SELECTORS`에 있다.
크롬이 기본 위치에 없으면 환경변수 `SMARTPLACE_CHROME_PATH`에 `chrome.exe` 경로를 넣는다.

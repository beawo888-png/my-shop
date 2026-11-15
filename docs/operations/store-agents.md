# 매장 전담 에이전트 (생성 에이전트 1개 + 매장별 전담 에이전트)

> Pencil(`초안`) 스케치 단계는 해당 없음: 사이트 화면을 바꾸지 않는 사장님 PC 자동화다.

## 구조

- **작업 단위 = 매장.** 지금은 판교점(`pangyo`)과 모란본점(`moran`) 두 곳이다.
- **전담 에이전트 (매장 하나당 1개)**: 자기 매장 일을 처음부터 끝까지 혼자 한다.
  - 스마트플레이스 일일 작업: 예약 엑셀 → 영수증 리뷰 답글 → 소식 → 블로그 (기존 `scripts/smartplace/daily.mjs --branch=<매장>`)
  - 네이버 검색광고 키워드 정리: 검색량 없는 키워드는 삭제하고, 돈만 쓰는 키워드는 일시중지한다.
  - 결과를 카카오톡으로 알린다.
- **생성 에이전트 (1개)**: 새 매장이 생길 때만 `npm run agent:new-store`로 실행한다. 매장 파일과 그 매장 전용 기억 공간을 만들고 빠진다.
- **기본 틀**: 모든 매장이 공유하는 규칙은 `lib/store-agent/base-template.mjs`에 있다. 매장마다 다른 값은 `stores/<매장>/store.json`에 둔다. 매장 파일에 적은 값이 기본 틀보다 우선한다.

| 무엇 | 어디 | 깃 |
|---|---|---|
| 매장 정보·말투·금지 표현·핵심 키워드 | `stores/<매장>/store.json` | 올라감 |
| 새 매장용 기본 틀 | `stores/_template/store.json` | 올라감 |
| 기억(수습/자동 상태, 지킬 키워드, 지운 키워드, 피드백) | `.smartplace/stores/<매장>/memory.json` | 안 올라감 |
| 검색광고 API 열쇠·이 매장 캠페인 번호 | `.smartplace/stores/<매장>/searchad.json` | 안 올라감 |
| 승인 대기 계획 | `.smartplace/stores/<매장>/pending/` | 안 올라감 |
| 한 일 기록 | `.smartplace/stores/<매장>/history.jsonl` | 안 올라감 |

에이전트 코드는 `createSandbox(매장 id)`가 돌려준 객체만 쓰기 때문에 다른 매장 폴더를 열 수 없다. 매장 id도 경로 문자를 막는다.

## 매일 일어나는 일

작업 스케줄러(`WangjingSmartplaceNews`, 09:00·09:40)가 `scripts/smartplace/run-daily.cmd`를 실행하고, 이 파일은 `npm run agent:daily`를 부른다.
매장 하나씩 차례로 그 매장 전담 에이전트를 실행한다.

1. 스마트플레이스·블로그: 원래 하던 일을 그 매장만 처리한다.
2. 검색광고:
   - 이 매장 캠페인의 키워드, 최근 30일 성과(노출·클릭·광고비·전환), 노출 0인 키워드의 한 달 검색량을 가져온다.
   - **삭제**: 30일 노출 0번이면서 한 달 검색량이 10 미만인 키워드.
   - **일시중지**: 클릭 20번 이상, 전환 0, 광고비 3만 원 이상인 키워드. 매장 전체에 전환 기록이 하나도 없으면(전환 추적을 안 하면) 이 판단은 하지 않는다.
   - **건드리지 않는 키워드**: 핵심 키워드, 사장님이 지키라고 한 키워드, 이미 꺼진 키워드, 등록한 지 30일이 안 된 키워드, 검색량을 못 받은 키워드.
   - 하루 예산과 입찰가는 바꾸지 않는다.
3. 결과를 카카오톡으로 보낸다.

같은 날 두 번 돌아도 검색광고는 한 번만 정리한다.

## 수습 기간 → 자동 적용

- 처음에는 **수습**이다. 정리 계획을 바로 적용하지 않고 승인 대기 파일로 남긴 뒤 카카오톡으로 알린다(🙋).
- PC에서 `npm run agent:approve -- --store=pangyo`를 실행하면 계획을 보여주고 묻는다. `y`를 누르면 적용, `n`을 누르면 거절이다.
- **일부만 빼려면**: 화면에 나온 pending 파일을 메모장으로 열고, `actions` 목록에서 그 키워드 항목을 지운 뒤 승인한다. 뺀 키워드는 그 매장 기억에 "지킬 키워드"로 남아 다음부터 후보에 오르지 않는다.
- **수정 없이 5번 연속 승인**되면 그 매장 검색광고는 **자동 적용**으로 바뀐다. 고쳐서 승인하거나 거절하면 횟수는 0으로 돌아간다.
- 자동 적용 중이라도 한 번에 10개 넘게 삭제하거나 10개 넘게 일시중지하는 계획은 승인을 받는다.
- 승인을 3일 넘게 안 하면 그 계획은 버리고, 다음 실행 때 새 성과로 다시 세운다.
- 자동 적용을 끄려면 `npm run agent:status -- --store=pangyo --reset-trust`를 실행한다. 다시 수습 기간이 된다.
- 기준값(5번, 10개, 30일, 검색량 10, 클릭 20, 3만 원)은 `lib/store-agent/base-template.mjs`에 있다. 한 매장만 다르게 하려면 그 매장 `store.json`의 `searchAd.rules`, `searchAd.approval`, `trust`에 같은 이름으로 적는다. 예: `"rules": { "minMonthlySearch": 30 }`

## 처음 한 번만 하는 설정 (사장님 PC)

```powershell
git pull
npm install
npm run agent:ads-setup -- --store=pangyo
npm run agent:ads-setup -- --store=moran
```

`agent:ads-setup`은 검색광고 API 열쇠 3개를 묻는다. 검색광고 관리시스템 → 도구 → **API 사용 관리**에서 CUSTOMER_ID, 엑세스라이선스, 비밀키를 복사해 붙여 넣으면 된다.
그다음 그 계정의 캠페인 목록이 나오면 **그 매장 캠페인 번호만** 고른다. 두 매장이 광고 계정 하나를 같이 쓰면 여기서 매장마다 자기 캠페인만 골라야 서로 섞이지 않는다.

연결한 뒤에는 계획만 미리 볼 수 있다. 아무것도 지우지 않는다.

```powershell
npm run agent:daily -- --store=pangyo --skip-daily --check
```

## 명령 모음

| 명령 | 하는 일 |
|---|---|
| `npm run agent:daily` | 모든 매장 전담 에이전트 실행 (스케줄러가 매일 부름) |
| `npm run agent:daily -- --store=moran` | 한 매장만 |
| `npm run agent:check` | 발행·적용 없이 확인만 |
| `npm run agent:daily -- --skip-daily` | 검색광고만 |
| `npm run agent:approve -- --store=pangyo` | 승인 대기 계획 확인·적용 |
| `npm run agent:status` | 매장별 수습/자동 상태, 연결 상태, 승인 대기 |
| `npm run agent:new-store` | 생성 에이전트: 새 매장 만들기 |
| `npm run agent:ads-setup -- --store=<매장>` | 매장 검색광고 연결 |

## 새 매장이 생기면

```powershell
npm run agent:new-store
npm run agent:ads-setup -- --store=<새 매장 id>
```

질문 6개(id, 이름, 짧은 이름, 말투, 금지 표현, 핵심 키워드)에 답하면 `stores/<id>/store.json`과 기억 공간이 생긴다. 기존 매장 파일은 건드리지 않는다.
검색광고는 바로 쓸 수 있다. 스마트플레이스·블로그 화면 자동화는 아직 지점 정보를 `lib/smartplace/branches.mjs`, `lib/blog/branch-info.mjs`에서 읽는다. 그래서 새 매장은 이 채널을 꺼 둔 채로 만들어진다(`channels.smartplace: false`).

## 아직 없는 것 (나중에 붙일 순서)

1. 승인을 휴대폰에서 하기. 지금은 알림만 휴대폰으로 오고, 승인은 PC에서 한다.
2. 새 키워드 자동 추가: 키워드 도구 추천을 낮은 입찰가로 넣는다.
3. 입찰가 자동 조정: 효율 좋은 키워드의 입찰가를 상한 안에서 올린다.
4. 스마트플레이스·블로그 지점 정보를 `stores/<매장>/store.json`으로 옮기기. 그러면 새 매장도 생성 에이전트만으로 모든 채널이 켜진다.
5. 영수증 리뷰 답글을 매장 말투·기억으로 직접 쓰기. 지금은 별도 파이썬 프로그램이 쓴다.

## 확인이 필요한 점

검색광고 API 호출은 공개 문서의 방식(HMAC 서명, `/ncc/*`, `/stats`, `/keywordstool`)대로 만들었다. 테스트는 가짜 API로만 했고, 실제 계정에서는 아직 돌려 보지 않았다.
처음에는 반드시 `--check`로 계획을 확인한다. 그다음 수습 기간 동안 승인 화면에서 지울 키워드가 맞는지 본다.

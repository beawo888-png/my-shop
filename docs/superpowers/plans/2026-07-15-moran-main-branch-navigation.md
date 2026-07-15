# 모란본점·판교점 지점 안내 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상단 `지점 안내` 메뉴가 두 지점 섹션으로 이동하고, 모란본점을 왼쪽·판교점을 오른쪽에 표시하도록 명칭과 순서를 확정한다.

**Architecture:** `NAV_ITEMS`의 `#location` 앵커와 `LocationSection`의 데이터 기반 렌더링은 유지한다. `LOCATIONS` 배열에서 모란본점을 첫 번째 항목으로 두고 표시명을 고치며, 테스트가 앵커와 데이터 순서를 함께 검증한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, React, CSS, Node.js test runner, Pencil

## Global Constraints

- 모든 화면 수정은 `C:\vibecoding\my-shop\초안`의 Pencil 스케치를 먼저 변경한 뒤 코드에 반영한다.
- 데스크톱은 모란본점 왼쪽, 판교점 오른쪽의 2열 배치를 유지한다.
- 모바일은 모란본점, 판교점 순으로 한 장씩 세로 배치한다.
- 기존 왕징의 크림·적색·먹색·금색 시각 체계를 변경하지 않는다.
- 공개 배포는 사용자가 별도로 요청할 때만 진행한다.

---

### Task 1: Pencil 지점 명칭과 순서 확정

**Files:**
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: 기존 데스크톱·모바일 지점 카드 스케치
- Produces: 모란본점이 먼저 표시되는 승인된 지점 안내 스케치

- [ ] **Step 1: Pencil 편집기 상태와 현재 지점 카드 노드를 확인한다**

Pencil MCP의 `get_editor_state(include_schema: true)`와 `batch_get`을 사용해 `C:\vibecoding\my-shop\초안`의 지점 안내 관련 노드를 찾는다. `.pen` 파일은 셸로 읽거나 직접 수정하지 않는다.

- [ ] **Step 2: 데스크톱 스케치의 명칭과 좌우 순서를 수정한다**

Pencil MCP의 `batch_design`으로 왼쪽 카드와 바로가기 문구를 `모란본점`, 카드 제목을 `왕징양다리양꼬치 모란본점`으로 바꾼다. 오른쪽 판교점 카드는 그대로 유지한다.

- [ ] **Step 3: 모바일 스케치의 명칭과 위아래 순서를 수정한다**

모바일 지점 안내에서 모란본점 카드를 첫 번째, 판교점 카드를 두 번째로 유지하고 `모란점` 문구를 `모란본점`으로 바꾼다.

- [ ] **Step 4: Pencil 레이아웃을 검증한다**

Pencil MCP의 `snapshot_layout(problemsOnly: true)`로 지점 안내 노드에 겹침이나 잘림이 없는지 확인한다. `get_screenshot`으로 모란본점이 왼쪽, 판교점이 오른쪽인 최종 구성을 확인한다.

### Task 2: 지점 명칭·앵커·순서를 테스트로 고정

**Files:**
- Modify: `tests/site-content.test.mjs`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Consumes: `LOCATIONS: Location[]`, `NAV_ITEMS: NavItem[]`
- Produces: 첫 번째 항목이 모란본점인 `LOCATIONS`와 `#location` 내비게이션 계약

- [ ] **Step 1: 실패하는 콘텐츠 테스트를 작성한다**

`tests/site-content.test.mjs`의 두 지점 테스트에서 모란점 표시명을 모란본점으로 바꾸고 다음 검증을 추가한다.

```js
assert.match(source, /\{ label: "지점 안내", href: "#location" \}/);

const moranIndex = source.indexOf('shortName: "모란본점"');
const pangyoIndex = source.indexOf('shortName: "판교점"');
assert.ok(moranIndex >= 0, "모란본점 데이터가 있어야 합니다");
assert.ok(pangyoIndex >= 0, "판교점 데이터가 있어야 합니다");
assert.ok(moranIndex < pangyoIndex, "모란본점이 판교점보다 먼저 와야 합니다");
```

기존 기대값 `왕징양다리양꼬치 모란점`은 다음 값으로 교체한다.

```js
"왕징양다리양꼬치 모란본점"
```

- [ ] **Step 2: 테스트를 실행해 현재 명칭에서 실패하는지 확인한다**

Run: `node --test tests/site-content.test.mjs`

Expected: `모란본점 데이터가 있어야 합니다` 또는 `왕징양다리양꼬치 모란본점` 누락으로 FAIL.

- [ ] **Step 3: 모란본점 표시명을 최소 변경한다**

`lib/site-content.ts`의 첫 번째 `LOCATIONS` 항목을 다음과 같이 변경하고 배열 순서는 유지한다.

```ts
{
  id: "moran",
  areaLabel: "MORAN",
  shortName: "모란본점",
  name: "왕징양다리양꼬치 모란본점",
  image: "/images/wangjing/moran-storefront.png",
  imageAlt: "왕징양다리양꼬치 모란본점 외관과 입구",
  imagePosition: "center 52%",
  address: "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
  transit: "모란역 4번 출구에서 215m",
  phoneDisplay: "0507-1377-5688",
  phoneHref: "tel:050713775688",
  mapUrl: "https://map.naver.com/v5/entry/place/1938356292",
},
```

`NAV_ITEMS`의 다음 항목은 변경하지 않는다.

```ts
{ label: "지점 안내", href: "#location" }
```

- [ ] **Step 4: 콘텐츠와 구조 테스트를 통과시킨다**

Run: `node --test tests/site-content.test.mjs tests/page-structure.test.mjs`

Expected: 모든 테스트 PASS. `LocationSection`은 `LOCATIONS.map`을 사용하므로 데이터 배열의 모란본점→판교점 순서가 그대로 왼쪽→오른쪽 순서가 된다.

- [ ] **Step 5: 구현 변경을 커밋한다**

```bash
git add lib/site-content.ts tests/site-content.test.mjs
git commit -m "fix: label Moran as main branch"
```

### Task 3: 전체 품질 검증

**Files:**
- Verify: `app/globals.css`
- Verify: `components/home/location-section.tsx`
- Verify: `components/home/location-card.tsx`

**Interfaces:**
- Consumes: Task 2의 `LOCATIONS` 순서와 기존 `.location-grid` 반응형 규칙
- Produces: 테스트·린트·빌드가 통과하는 로컬 구현

- [ ] **Step 1: 전체 테스트를 실행한다**

Run: `npm.cmd test`

Expected: 모든 테스트 PASS.

- [ ] **Step 2: ESLint를 실행한다**

Run: `npm.cmd run lint`

Expected: 오류 없이 종료 코드 0.

- [ ] **Step 3: 프로덕션 빌드를 실행한다**

Run: `npm.cmd run build`

Expected: Next.js 정적 `/` 경로가 오류 없이 생성된다.

- [ ] **Step 4: 최종 코드 계약을 확인한다**

다음을 확인한다.

```text
상단 지점 안내 href: #location
지점 섹션 id: location
첫 번째 카드: 왕징양다리양꼬치 모란본점
두 번째 카드: 왕징양다리양꼬치 판교점
데스크톱 그리드: 2열
모바일 그리드: 1열
```

공개 배포 명령은 실행하지 않는다.

# 지점 주차 안내와 길찾기 버튼 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 두 지점 카드의 전화번호 아래에 지점별 주차장 이용방법을 표시하고 네이버·Google 지도 길찾기 버튼을 제공한다.

**Architecture:** `Location` 데이터에 `parking`과 완성된 `googleDirectionsUrl`을 추가하고, `LocationCard`는 전달받은 값만 렌더링한다. 기존 `mapUrl`은 네이버 플레이스 링크로 계속 사용하며, 모든 지도 링크는 안전한 새 탭 앵커로 제공한다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, CSS, Node.js test runner, Pencil

## Global Constraints

- 사용자 화면을 수정하기 전에 `C:\vibecoding\my-shop\초안`의 데스크톱·모바일 지점 카드 스케치를 먼저 완성하고 검증한다.
- 구현 전에 `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`와 `11-css.md`의 관련 내용을 확인한다.
- 주차 레이블은 정확히 `주차장 이용방법`으로 표시한다.
- 모란본점 문구는 정확히 `가게 앞 주차장 4대 무료이용 또는 근처 모란공영주차장`으로 표시한다.
- 판교점 문구는 정확히 `판교 라스트리트(알파리움1타워) 주차장 (3시간 무료주차) 또는 근처 판교 공영주차장`으로 표시한다.
- 네이버 버튼 문구는 `네이버 길찾기`, Google 버튼 문구는 `구글 길찾기`를 사용한다.
- 네이버 링크는 기존 지점별 `mapUrl`을 사용한다.
- Google 링크는 `https://www.google.com/maps/dir/?api=1&destination=...` 형식과 URL 인코딩된 전체 주소를 사용한다.
- 모든 지도 링크는 `target="_blank"`와 `rel="noreferrer"`를 사용한다.
- 사이트에서 Google 로그인이나 사용자 계정 정보를 직접 처리하지 않는다.
- 공개 배포는 사용자가 별도로 요청할 때만 수행한다.
- 기존 작업 트리의 관련 없는 수정·미추적 파일은 변경하거나 커밋하지 않는다.

---

## File Map

- Modify: `초안` — 데스크톱·모바일 지점 카드의 주차 행과 두 버튼 디자인 원본.
- Modify: `lib/site-content.ts` — 지점별 주차 문구와 Google Directions URL의 단일 데이터 원본.
- Modify: `components/home/location-card.tsx` — 주차 행과 두 외부 길찾기 링크 렌더링.
- Modify: `app/globals.css` — 길찾기 버튼 스택과 카드용 보조 버튼 스타일.
- Modify: `tests/site-content.test.mjs` — 지점별 새 데이터와 정확한 URL 검증.
- Modify: `tests/page-structure.test.mjs` — 카드 구조, 링크 보안 속성, 반응형 스타일 계약 검증.

---

### Task 1: Pencil 지점 카드 스케치 갱신

**Files:**
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: 기존 `F9bKD` 데스크톱 상세 스케치, `d8YZpT` 모바일 상세 스케치, 기존 주소·교통·전화 행과 플레이스 버튼의 색상·타이포그래피.
- Produces: 전화번호 다음의 `주차장 이용방법` 행과 `네이버 길찾기`/`구글 길찾기` 버튼을 포함하는 승인된 데스크톱·모바일 레이아웃.

- [ ] **Step 1: Pencil 편집 상태와 웹 디자인 가이드를 읽는다**

Pencil의 `get_editor_state(include_schema: true)`를 호출한 다음 `get_guidelines()`에서 웹 UI 편집 가이드를 확인한다. 활성 파일이 `/C:/vibecoding/my-shop/초안`이고 `F9bKD`, `d8YZpT`가 존재하는지 확인한다.

- [ ] **Step 2: 두 상세 스케치의 현재 카드 노드를 한 번에 읽는다**

`batch_get`을 다음 조건으로 호출한다.

```json
{
  "filePath": "C:\\vibecoding\\my-shop\\초안",
  "nodeIds": ["F9bKD", "d8YZpT"],
  "readDepth": 3,
  "resolveVariables": true
}
```

반환된 실제 노드 ID를 사용하고 이름으로 ID를 추측하지 않는다. 각 카드에서 전화번호 행의 바로 다음 형제 위치와 기존 네이버 플레이스 버튼의 스타일을 기록한다.

- [ ] **Step 3: 데스크톱 상세 스케치에 주차 행과 버튼 스택을 추가한다**

`batch_design`에서 `F9bKD`를 작업하는 동안 `placeholder: true`로 설정한다. 모란본점과 판교점 각각에 다음 구조를 전화번호 다음에 삽입한다.

```text
주차 정보 행 (horizontal, 기존 상세 행과 동일한 너비·패딩·구분선)
├─ 주차장 이용방법 (적색, 기존 라벨과 동일)
└─ 지점별 주차 문구 (고정 너비 자동 줄바꿈)
길찾기 버튼 스택 (vertical, gap 12, 카드 본문 너비 채움)
├─ 네이버 길찾기 (기존 적색 버튼 스타일, 기존 mapUrl href)
└─ 구글 길찾기 (종이색 배경, 먹색 테두리·문구, Google Directions href)
```

기존 `네이버 플레이스` 버튼은 복제하지 않고 `네이버 길찾기`로 이름과 문구를 변경해 첫 번째 버튼으로 사용한다. 두 카드가 완성되면 `F9bKD`의 높이를 콘텐츠에 맞게 늘리고 `placeholder: false`로 되돌린다.

- [ ] **Step 4: 데스크톱 스케치를 즉시 검증한다**

`snapshot_layout(filePath: ..., parentId: "F9bKD", maxDepth: 4, problemsOnly: true)`가 겹침·잘림 문제를 반환하지 않아야 한다. `get_screenshot`으로 `F9bKD`를 한 번 확인해 긴 판교점 문구, 두 버튼의 정렬, 색 대비가 올바른지 검토한다.

- [ ] **Step 5: 모바일 상세 스케치에 같은 정보 구조를 적용한다**

`d8YZpT`를 `placeholder: true`로 설정하고 두 모바일 카드에 같은 순서로 주차 행과 버튼 스택을 추가한다. 값 텍스트는 카드의 사용 가능한 너비를 채우는 고정 너비 자동 줄바꿈으로 설정하고, 두 버튼은 카드 너비 전체와 최소 48px 높이를 사용한다. 프레임 높이를 늘린 뒤 `placeholder: false`로 되돌린다.

- [ ] **Step 6: 모바일 스케치를 검증하고 스케치 변경만 커밋한다**

`snapshot_layout(filePath: ..., parentId: "d8YZpT", maxDepth: 4, problemsOnly: true)`가 문제를 반환하지 않아야 한다. `get_screenshot`으로 `d8YZpT`를 확인한 뒤 다음만 커밋한다.

```powershell
git add -- '초안'
git commit -m "design: add parking and directions actions"
```

---

### Task 2: 지점별 주차·Google 길찾기 데이터 추가

**Files:**
- Modify: `C:\vibecoding\my-shop\lib\site-content.ts`
- Test: `C:\vibecoding\my-shop\tests\site-content.test.mjs`

**Interfaces:**
- Consumes: `Location`, `LOCATIONS`, 각 지점의 기존 전체 주소와 `mapUrl`.
- Produces: `Location.parking: string`, `Location.googleDirectionsUrl: string`.

- [ ] **Step 1: 실패하는 콘텐츠 테스트를 작성한다**

`site content defines both Wangjing locations` 테스트의 값 배열에 두 주차 문구를 추가하고, 테스트 다음에 아래 테스트를 추가한다.

```js
test("location data defines Google directions for both branches", () => {
  const moranGoogle =
    "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EB%91%94%EC%B4%8C%EB%8C%80%EB%A1%9C151%EB%B2%88%EA%B8%B8%2048%20%EC%84%B1%EC%8A%88%ED%8D%BC%EB%B9%8C%20102%EB%8F%99%20101%ED%98%B8";
  const pangyoGoogle =
    "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EB%B6%84%EB%8B%B9%EA%B5%AC%20%EB%8C%80%EC%99%95%ED%8C%90%EA%B5%90%EB%A1%9C606%EB%B2%88%EA%B8%B8%2010%2C%20205%ED%98%B8%C2%B7206%ED%98%B8";

  assert.match(source, /parking: string/);
  assert.match(source, /googleDirectionsUrl: string/);
  assert.ok(source.includes("가게 앞 주차장 4대 무료이용 또는 근처 모란공영주차장"));
  assert.ok(source.includes("판교 라스트리트(알파리움1타워) 주차장 (3시간 무료주차) 또는 근처 판교 공영주차장"));
  assert.ok(source.includes(moranGoogle));
  assert.ok(source.includes(pangyoGoogle));
  assert.ok(source.indexOf(moranGoogle) < source.indexOf(pangyoGoogle));
});
```

- [ ] **Step 2: 콘텐츠 테스트가 실패하는지 확인한다**

Run: `node --test tests/site-content.test.mjs`

Expected: FAIL because `parking: string` and `googleDirectionsUrl: string` do not exist.

- [ ] **Step 3: `Location` 타입과 두 지점 데이터에 필드를 추가한다**

`Location`에 다음 필드를 `phoneHref` 다음에 추가한다.

```ts
parking: string;
googleDirectionsUrl: string;
```

모란본점 객체의 `phoneHref` 다음에 추가한다.

```ts
parking: "가게 앞 주차장 4대 무료이용 또는 근처 모란공영주차장",
googleDirectionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EB%91%94%EC%B4%8C%EB%8C%80%EB%A1%9C151%EB%B2%88%EA%B8%B8%2048%20%EC%84%B1%EC%8A%88%ED%8D%BC%EB%B9%8C%20102%EB%8F%99%20101%ED%98%B8",
```

판교점 객체의 `phoneHref` 다음에 추가한다.

```ts
parking:
  "판교 라스트리트(알파리움1타워) 주차장 (3시간 무료주차) 또는 근처 판교 공영주차장",
googleDirectionsUrl:
  "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EB%B6%84%EB%8B%B9%EA%B5%AC%20%EB%8C%80%EC%99%95%ED%8C%90%EA%B5%90%EB%A1%9C606%EB%B2%88%EA%B8%B8%2010%2C%20205%ED%98%B8%C2%B7206%ED%98%B8",
```

- [ ] **Step 4: 콘텐츠 테스트를 통과시킨다**

Run: `node --test tests/site-content.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: 데이터 변경을 커밋한다**

```powershell
git add -- lib/site-content.ts tests/site-content.test.mjs
git commit -m "feat: add branch parking and Google directions data"
```

---

### Task 3: 카드에 주차 행과 두 길찾기 버튼 렌더링

**Files:**
- Modify: `C:\vibecoding\my-shop\components\home\location-card.tsx`
- Modify: `C:\vibecoding\my-shop\app\globals.css`
- Test: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`

**Interfaces:**
- Consumes: `Location.parking`, `Location.mapUrl`, `Location.googleDirectionsUrl`, `Location.shortName`.
- Produces: `.location-card__actions`, `.location-card__button`, `네이버 길찾기`, `구글 길찾기` 링크.

- [ ] **Step 1: 실패하는 카드 구조·스타일 테스트를 작성한다**

`location section renders two data-driven branch cards` 테스트의 카드 검증을 다음 내용으로 확장하고 기존 `/네이버 플레이스/` 검증은 제거한다.

```js
assert.match(card, /<dt>주차장 이용방법<\/dt>/);
assert.match(card, /location\.parking/);
assert.match(card, /className="location-card__actions"/);
assert.match(card, /href=\{location\.mapUrl\}/);
assert.match(card, /href=\{location\.googleDirectionsUrl\}/);
assert.match(card, /네이버 길찾기/);
assert.match(card, /구글 길찾기/);
assert.match(card, /\$\{location\.shortName\} 네이버 길찾기 열기/);
assert.match(card, /\$\{location\.shortName\} 구글 길찾기 열기/);
assert.equal(card.match(/target="_blank"/g)?.length, 2);
assert.equal(card.match(/rel="noreferrer"/g)?.length, 2);

assert.match(css, /\.location-card__actions\s*\{[\s\S]*?display:\s*grid;[\s\S]*?gap:/);
assert.match(css, /\.location-card__button\s*\{[\s\S]*?width:\s*100%/);
assert.match(css, /\.location-card__button--secondary\s*\{[\s\S]*?border-color:\s*var\(--ink\)/);
```

- [ ] **Step 2: 구조 테스트가 실패하는지 확인한다**

Run: `node --test tests/page-structure.test.mjs`

Expected: FAIL because the parking row, Google link, actions wrapper, and secondary style do not exist.

- [ ] **Step 3: 전화번호 다음에 주차 행을 추가한다**

`location-card.tsx`의 전화번호 상세 행 바로 다음에 추가한다.

```tsx
<div>
  <dt>주차장 이용방법</dt>
  <dd>{location.parking}</dd>
</div>
```

- [ ] **Step 4: 기존 네이버 버튼을 두 버튼 액션 영역으로 교체한다**

기존 단일 `<a>`를 다음 JSX로 교체한다.

```tsx
<div className="location-card__actions">
  <a
    className="button button--primary location-card__button"
    href={location.mapUrl}
    target="_blank"
    rel="noreferrer"
    aria-label={`${location.shortName} 네이버 길찾기 열기`}
  >
    네이버 길찾기
  </a>
  <a
    className="button location-card__button location-card__button--secondary"
    href={location.googleDirectionsUrl}
    target="_blank"
    rel="noreferrer"
    aria-label={`${location.shortName} 구글 길찾기 열기`}
  >
    구글 길찾기
  </a>
</div>
```

- [ ] **Step 5: 버튼 스택과 보조 버튼 스타일을 추가한다**

`app/globals.css`의 기존 `.location-card__button` 규칙 앞뒤를 다음과 같이 구성한다.

```css
.location-card__actions {
  display: grid;
  gap: 0.75rem;
}

.location-card__button {
  width: 100%;
}

.location-card__button--secondary {
  border-color: var(--ink);
  background: transparent;
  color: var(--ink);
}

.location-card__button--secondary:hover {
  border-color: var(--red);
  color: var(--red);
}
```

- [ ] **Step 6: 구조 테스트와 콘텐츠 테스트를 통과시킨다**

Run: `node --test tests/page-structure.test.mjs tests/site-content.test.mjs`

Expected: all tests PASS.

- [ ] **Step 7: 카드 구현을 커밋한다**

```powershell
git add -- components/home/location-card.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: add parking and directions to location cards"
```

---

### Task 4: 전체 검증과 시각 확인

**Files:**
- Verify: `C:\vibecoding\my-shop\초안`
- Verify: `C:\vibecoding\my-shop\lib\site-content.ts`
- Verify: `C:\vibecoding\my-shop\components\home\location-card.tsx`
- Verify: `C:\vibecoding\my-shop\app\globals.css`

**Interfaces:**
- Consumes: 완료된 Pencil 디자인, 지점 데이터, 카드 마크업과 스타일.
- Produces: 테스트·정적 분석·프로덕션 빌드·데스크톱/모바일 시각 검증 증거.

- [ ] **Step 1: 전체 자동 테스트를 실행한다**

Run: `npm.cmd test`

Expected: all tests PASS, exit code 0.

- [ ] **Step 2: ESLint를 실행한다**

Run: `npm.cmd run lint`

Expected: no errors, exit code 0.

- [ ] **Step 3: 프로덕션 빌드를 실행한다**

Run: `npm.cmd run build`

Expected: Next.js build succeeds and `/` is generated without errors.

- [ ] **Step 4: 로컬 페이지에서 데스크톱·모바일을 확인한다**

`npm.cmd run dev`로 개발 서버를 시작하고 홈페이지의 지점 섹션을 데스크톱 폭과 390px 모바일 폭에서 확인한다. 두 카드 모두 전화번호 아래에 주차 안내가 보이고, 긴 판교 문구가 카드 밖으로 넘치지 않으며, 버튼 순서가 네이버→구글이고 각 버튼이 새 탭의 올바른 지점으로 연결되어야 한다.

- [ ] **Step 5: 최종 작업 트리와 커밋 범위를 확인한다**

Run: `git status --short`

Expected: 이 기능에 포함되지 않은 기존 사용자 변경만 남고, 기능 파일에는 미커밋 변경이 없다. 검증 과정에서 수정이 필요했다면 관련 테스트와 함께 별도의 최소 커밋으로 기록한다.

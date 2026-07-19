# 지점 카드 라벨 정렬과 길찾기 버튼 스타일 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지점 카드 라벨을 동일한 규격으로 정렬하고 네이버·Google 길찾기 버튼을 한 줄의 둥근 2열 버튼으로 표시한다.

**Architecture:** 카드 JSX에서는 주차 라벨만 `주차장`으로 단순화하고, 정렬과 버튼 표현은 기존 전용 CSS 클래스에서 관리한다. 지점 데이터와 외부 URL은 변경하지 않으며, Pencil 상세 스케치를 먼저 갱신한 뒤 구조 테스트를 실패시키고 최소 JSX·CSS로 통과시킨다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript, CSS, Node.js test runner, Pencil

## Global Constraints

- 애플리케이션 코드보다 먼저 `C:\vibecoding\my-shop\초안`의 `F9bKD`와 `d8YZpT` 상세 스케치를 수정한다.
- 정보 라벨은 정확히 `주소`, `가까운 역`, `전화번호`, `주차장`을 사용한다.
- 네 라벨은 동일한 글자 크기, 굵기, 자간, 줄 높이와 고정 라벨 열을 사용한다.
- 버튼은 `네이버 길찾기`, `구글 길찾기` 순서의 동일 너비 2열로 한 줄에 표시한다.
- 두 버튼의 모서리 반경은 `10px`을 사용한다.
- 네이버 버튼은 기존 왕징 적색 배경과 종이색 글자를 유지한다.
- Google 버튼은 `var(--ink)` 배경, `var(--paper)` 글자, `var(--ink)` 테두리를 사용한다.
- 기존 지도 URL, `aria-label`, `target="_blank"`, `rel="noreferrer"`는 변경하지 않는다.
- 별도 아이콘과 외부 패키지는 추가하지 않는다.
- 긴 판교 주차 문구는 카드 안에서 줄바꿈하고 모바일 가로 스크롤을 만들지 않는다.
- 공개 배포는 이 구현의 검증 범위에 포함하지 않는다.
- 기존 작업 트리의 관련 없는 수정·미추적 파일은 변경하거나 커밋하지 않는다.

---

## File Map

- Modify: `초안` — 데스크톱·모바일 카드의 라벨 기준선과 2열 버튼 시각 원본.
- Modify: `components/home/location-card.tsx` — `주차장` 라벨 문구.
- Modify: `app/globals.css` — 라벨 열·자간과 버튼 2열·반경·Google 색상.
- Modify: `tests/page-structure.test.mjs` — JSX와 CSS 계약 검증.

---

### Task 1: Pencil 상세 스케치 갱신

**Files:**
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: `F9bKD` 데스크톱 지점 상세, `d8YZpT` 모바일 지점 상세, 기존 네이버·Google 길찾기 버튼.
- Produces: 동일 라벨 기준선과 한 줄 2열 길찾기 버튼을 보여주는 승인된 스케치.

- [ ] **Step 1: Pencil 편집 상태와 랜딩 페이지 가이드를 확인한다**

`get_editor_state(include_schema: true)`와 `get_guidelines(category: "guide", name: "Landing Page")`를 호출한다. 활성 파일이 `C:\vibecoding\my-shop\초안`인지 확인한다.

- [ ] **Step 2: 두 상세 프레임의 현재 노드를 한 번에 읽는다**

```json
{
  "filePath": "C:\\vibecoding\\my-shop\\초안",
  "nodeIds": ["F9bKD", "d8YZpT"],
  "readDepth": 3,
  "resolveVariables": true
}
```

반환된 실제 주차 라벨, 네이버 버튼, Google 버튼과 문구 노드 ID를 사용한다.

- [ ] **Step 3: 데스크톱 상세 프레임을 수정한다**

`F9bKD`를 작업 중 `placeholder: true`로 설정한다. 모란본점과 판교점의 주차 라벨을 `주차장`으로 바꾸고 네 라벨의 x 좌표, 글자 크기, 굵기, 자간과 줄 높이를 동일하게 맞춘다. 두 카드에서 네이버·Google 버튼을 같은 y 좌표에 배치하고 각 버튼은 카드 본문 폭에서 12px 간격을 뺀 절반 너비로 만든다. 네이버 버튼은 `#8F1D1D`/`#FFF8EC`, Google 버튼은 `#211A17`/`#FFF8EC`, 두 버튼의 `cornerRadius`는 `10`으로 설정한 뒤 `placeholder: false`로 되돌린다.

- [ ] **Step 4: 데스크톱 프레임을 검증한다**

`snapshot_layout(parentId: "F9bKD", maxDepth: 4, problemsOnly: true)`가 문제를 반환하지 않아야 한다. `get_screenshot(nodeId: "F9bKD")`에서 두 버튼이 한 줄이고 라벨 값 시작선이 일정한지 확인한다.

- [ ] **Step 5: 모바일 상세 프레임을 수정하고 검증한다**

`d8YZpT`를 `placeholder: true`로 설정하고 같은 라벨 문구·정렬·색상을 적용한다. 302px 버튼 영역을 145px + 12px + 145px로 나누고 버튼 높이는 기존 54px을 유지한다. 두 카드의 후속 콘텐츠 y 좌표와 프레임 높이를 겹치지 않게 줄인 뒤 `placeholder: false`로 되돌린다. `snapshot_layout(parentId: "d8YZpT", maxDepth: 4, problemsOnly: true)`와 `get_screenshot(nodeId: "d8YZpT")`로 잘림과 가로 넘침이 없는지 확인한다.

---

### Task 2: 라벨과 버튼 스타일을 테스트 우선으로 변경

**Files:**
- Modify: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`
- Modify: `C:\vibecoding\my-shop\components\home\location-card.tsx`
- Modify: `C:\vibecoding\my-shop\app\globals.css`

**Interfaces:**
- Consumes: `.location-card__details`, `.location-card__actions`, `.location-card__button`, `.location-card__button--secondary`.
- Produces: `주차장` 라벨과 2열·10px 반경·검정 Google 버튼 스타일.

- [ ] **Step 1: 실패하는 구조 테스트를 작성한다**

`location section renders two data-driven branch cards` 테스트의 주차 라벨과 CSS 검증을 다음 계약으로 변경한다.

```js
assert.match(card, /<dt>주차장<\/dt>/);
assert.doesNotMatch(card, /주차장 이용방법/);

assert.match(
  css,
  /\.location-card__details > div\s*\{[\s\S]*?grid-template-columns:\s*96px minmax\(0, 1fr\)/,
);
assert.match(
  css,
  /\.location-card__details dt\s*\{[\s\S]*?letter-spacing:\s*-0\.01em;[\s\S]*?white-space:\s*nowrap;/,
);
assert.match(
  css,
  /\.location-card__actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
);
assert.match(
  css,
  /\.location-card__button\s*\{[\s\S]*?border-radius:\s*10px;/,
);
assert.match(
  css,
  /\.location-card__button--secondary\s*\{[\s\S]*?border-color:\s*var\(--ink\);[\s\S]*?background:\s*var\(--ink\);[\s\S]*?color:\s*var\(--paper\);/,
);
assert.match(
  css,
  /@media \(max-width: 767px\)[\s\S]*?\.location-card__details > div\s*\{[\s\S]*?grid-template-columns:\s*80px minmax\(0, 1fr\)/,
);
```

- [ ] **Step 2: 테스트가 기존 세로 버튼과 긴 라벨에서 실패하는지 확인한다**

Run: `node --test tests/page-structure.test.mjs`

Expected: FAIL because the card still contains `주차장 이용방법`, actions lack a 2-column grid, buttons lack `10px`, and the Google background is transparent.

- [ ] **Step 3: 카드의 주차 라벨을 줄인다**

`components/home/location-card.tsx`에서 다음 한 줄만 변경한다.

```tsx
<dt>주차장</dt>
```

- [ ] **Step 4: 상세 라벨과 버튼 CSS를 변경한다**

`app/globals.css`의 관련 규칙을 다음과 같이 맞춘다.

```css
.location-card__details > div {
  padding: 1rem 0;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.location-card__details dt {
  color: var(--red);
  font-weight: 900;
  letter-spacing: -0.01em;
  line-height: 1.5;
  white-space: nowrap;
}

.location-card__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.location-card__button {
  width: 100%;
  border-radius: 10px;
}

.location-card__button--secondary {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.location-card__button--secondary:hover {
  border-color: var(--red);
  background: var(--red);
  color: var(--paper);
}
```

기존 모바일 규칙의 `grid-template-columns: 80px minmax(0, 1fr);`는 유지한다.

- [ ] **Step 5: 대상 테스트를 통과시킨다**

Run: `node --test tests/page-structure.test.mjs`

Expected: all tests PASS.

- [ ] **Step 6: 구현과 테스트를 커밋한다**

```powershell
git add -- components/home/location-card.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "style: align location details and actions"
```

---

### Task 3: 전체 검증과 실제 화면 확인

**Files:**
- Verify: `C:\vibecoding\my-shop\components\home\location-card.tsx`
- Verify: `C:\vibecoding\my-shop\app\globals.css`
- Verify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: 최종 JSX, CSS, Pencil 스케치.
- Produces: 자동 테스트·빌드·데스크톱/모바일 시각 검증 증거.

- [ ] **Step 1: 전체 자동 테스트를 실행한다**

Run: `npm.cmd test`

Expected: all tests PASS, exit code 0.

- [ ] **Step 2: ESLint를 실행한다**

Run: `npm.cmd run lint`

Expected: no errors, exit code 0.

- [ ] **Step 3: 프로덕션 빌드를 실행한다**

Run: `npm.cmd run build`

Expected: Next.js production build succeeds, exit code 0.

- [ ] **Step 4: 데스크톱과 모바일 브라우저 화면을 검증한다**

`npm.cmd run dev -- --port 3107`로 로컬 서버를 실행한다. 1440px 데스크톱과 390px 모바일에서 다음을 확인한다.

```text
- 라벨: 주소 / 가까운 역 / 전화번호 / 주차장
- 네 라벨의 값 시작선이 일치함
- 네이버·Google 버튼이 한 줄이며 동일 너비
- 두 버튼의 모서리가 10px
- Google 버튼은 검정 배경과 흰색 글자
- 각 버튼 높이는 최소 48px
- 판교 주차 문구가 카드 안에서 줄바꿈됨
- 모바일 document.body.scrollWidth <= document.documentElement.clientWidth
```

- [ ] **Step 5: 작업 트리와 커밋 범위를 확인한다**

Run: `git status --short`

Expected: 이 기능과 무관한 기존 사용자 변경만 남고, 기능 파일에는 미커밋 변경이 없다.

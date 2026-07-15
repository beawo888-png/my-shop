# 지점 캡슐 네이버 플레이스 연결 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지점 안내의 모란본점·판교점 캡슐을 클릭하면 각 지점의 네이버 플레이스를 새 탭에서 연다.

**Architecture:** `LOCATIONS` 배열에 이미 있는 `mapUrl`을 `LocationSection`의 캡슐 링크에서 직접 사용한다. 별도 클릭 이벤트나 중복 URL은 추가하지 않고 일반 앵커의 `target`과 `rel` 속성으로 안전한 새 탭 이동을 제공한다.

**Tech Stack:** Next.js 16 App Router, TypeScript, React, Node.js test runner, Pencil

## Global Constraints

- 모든 화면 동작 수정은 `C:\vibecoding\my-shop\초안`의 Pencil 스케치에 먼저 반영한다.
- 모란본점은 `https://map.naver.com/v5/entry/place/1938356292`로 연결한다.
- 판교점은 `https://map.naver.com/v5/entry/place/1873196958`로 연결한다.
- 두 링크 모두 `target="_blank"`와 `rel="noreferrer"`를 사용한다.
- 현재 캡슐 디자인, 모란본점→판교점 순서, 왕징 색상을 변경하지 않는다.
- 공개 배포는 사용자가 별도로 요청할 때만 진행한다.

---

### Task 1: Pencil에 네이버 플레이스 링크 동작 표시

**Files:**
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: 데스크톱·모바일 지점 캡슐 텍스트 노드
- Produces: 각 지점 네이버 플레이스 URL이 지정된 Pencil 링크 메타데이터

- [ ] **Step 1: Pencil 편집기 상태와 노드를 확인한다**

Pencil MCP의 `get_editor_state(include_schema: true)`와 `batch_get`으로 다음 노드를 확인한다.

```text
Fo4iE  데스크톱 모란본점 캡슐 글자
b5LIEQ 데스크톱 판교점 캡슐 글자
CiTVx  모바일 모란본점 캡슐 글자
o5Ysx3 모바일 판교점 캡슐 글자
```

- [ ] **Step 2: 데스크톱 캡슐 링크를 설정한다**

Pencil MCP의 `batch_design`으로 `Fo4iE`의 `href`를 모란본점 URL로, `b5LIEQ`의 `href`를 판교점 URL로 설정한다. 노드 이름은 각각 `모란본점 네이버 플레이스 링크`, `판교점 네이버 플레이스 링크`로 변경한다.

- [ ] **Step 3: 모바일 캡슐 링크를 설정한다**

`CiTVx`와 `o5Ysx3`에도 같은 지점별 `href`를 설정하고 노드 이름에 `네이버 플레이스 링크`를 명시한다.

- [ ] **Step 4: Pencil 구조를 검증한다**

`batch_get`으로 네 노드의 `content`와 `href`를 다시 읽고, `snapshot_layout(problemsOnly: true)`로 데스크톱·모바일 지점 스케치에 레이아웃 문제가 없는지 확인한다.

### Task 2: 캡슐 링크를 테스트 우선으로 변경

**Files:**
- Modify: `tests/page-structure.test.mjs`
- Modify: `components/home/location-section.tsx`

**Interfaces:**
- Consumes: `LOCATIONS.map`, `Location.mapUrl`, `Location.shortName`
- Produces: 지점별 네이버 플레이스를 새 탭으로 여는 캡슐 링크

- [ ] **Step 1: 실패하는 구조 테스트를 작성한다**

`tests/page-structure.test.mjs`의 `location section renders two data-driven branch cards` 테스트에서 기존 내부 앵커 검증을 다음 검증으로 교체한다.

```js
assert.match(section, /href=\{location\.mapUrl\}/);
assert.match(section, /target="_blank"/);
assert.match(section, /rel="noreferrer"/);
assert.match(section, /네이버 플레이스 열기/);
assert.doesNotMatch(section, /#location-/);
```

- [ ] **Step 2: 테스트가 현재 내부 앵커에서 실패하는지 확인한다**

Run: `node --test tests/page-structure.test.mjs`

Expected: `href={location.mapUrl}` 누락으로 FAIL.

- [ ] **Step 3: 최소 링크 구현을 작성한다**

`components/home/location-section.tsx`의 캡슐 앵커를 다음과 같이 변경한다.

```tsx
<a
  className="location-jump"
  href={location.mapUrl}
  key={location.id}
  target="_blank"
  rel="noreferrer"
  aria-label={`${location.shortName} 네이버 플레이스 열기`}
>
  <span aria-hidden="true" />
  {location.shortName}
</a>
```

내부 카드 앵커 `id={`location-${location.id}`}`는 카드의 의미 있는 식별자로 남겨 두되 캡슐 링크에서는 더 이상 사용하지 않는다.

- [ ] **Step 4: 구조 테스트를 통과시킨다**

Run: `node --test tests/page-structure.test.mjs`

Expected: 모든 구조 테스트 PASS.

### Task 3: 전체 검증과 일관된 커밋

**Files:**
- Verify: `lib/site-content.ts`
- Verify: `app/globals.css`
- Include: `components/home/location-card.tsx`
- Include: `public/images/wangjing/moran-storefront.png`
- Include: `tests/assets-and-sketch.test.mjs`

**Interfaces:**
- Consumes: 두 지점 데이터와 기존 반응형 카드 스타일
- Produces: 체크아웃해도 두 지점 카드가 완전하게 동작하는 일관된 Git 상태

- [ ] **Step 1: 전체 테스트를 실행한다**

Run: `npm.cmd test`

Expected: 모든 테스트 PASS.

- [ ] **Step 2: ESLint를 실행한다**

Run: `npm.cmd run lint`

Expected: 오류 없이 종료 코드 0.

- [ ] **Step 3: 프로덕션 빌드를 실행한다**

Run: `npm.cmd run build`

Expected: Next.js 정적 `/` 경로가 오류 없이 생성된다.

- [ ] **Step 4: 관련 변경을 하나의 일관된 커밋으로 기록한다**

```bash
git add app/globals.css components/home/location-section.tsx components/home/location-card.tsx public/images/wangjing/moran-storefront.png tests/assets-and-sketch.test.mjs tests/page-structure.test.mjs
git commit -m "feat: link location pills to Naver Place"
```

`.gitignore`, `.env.local`, 로컬 로그, Pencil 내보내기 파일은 이 커밋에 포함하지 않는다.

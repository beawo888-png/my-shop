# 홈페이지 탭 순서 및 FAQ 섹션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 홈페이지 상단 탭을 `브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문` 순서로 바꾸고, 접근 가능한 6개 항목의 FAQ 아코디언을 추가한다.

**Architecture:** `NAV_ITEMS`는 기존처럼 데스크톱·모바일 헤더가 함께 소비하고, FAQ 문답은 새 `lib/faq-content.ts`에서 관리한다. 서버 컴포넌트인 `FaqSection`이 목록을 구성하고 각 항목의 독립적인 클라이언트 컴포넌트 `FaqAccordionItem`이 펼침 상태를 관리해 여러 답변을 동시에 열 수 있게 한다.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, `lucide-react`, 전역 CSS, Node.js test runner, ESLint, Vercel Git 자동 배포

## Global Constraints

- 작업 브랜치는 사용자가 지정한 `main`이다.
- 내비게이션 순서는 정확히 `브랜드 스토리`, `대표 메뉴`, `지점 안내`, `단체 모임`, `자주 묻는 질문`이다.
- `대표 메뉴`는 기존 `/menu`를 새 탭에서 열고, 나머지 내부 항목은 `#story`, `#location`, `#group`, `#faq`를 사용한다.
- 기존 고객 리뷰 섹션과 `/reviews` 페이지는 유지하되 `고객 리뷰`는 상단 내비게이션에서 제외한다.
- FAQ는 초기 상태에서 모두 닫혀 있고, 항목별 독립 상태로 여러 답변을 동시에 열 수 있어야 한다.
- 질문 버튼은 `aria-expanded`, `aria-controls`, 최소 48px 터치 영역을 제공한다.
- 기존 크림·먹색·적색 디자인과 데스크톱·모바일 반응형 동작을 유지한다.
- `AGENTS.md`에 따라 애플리케이션 코드보다 먼저 `C:\vibecoding\my-shop\초안`을 갱신한다.
- 구현 전에 로컬 Next.js 16.3 문서 `05-server-and-client-components.md`와 `04-linking-and-navigating.md`를 읽는다.
- 기존 관련 없는 파일은 수정하거나 커밋하지 않는다.
- 새 Vercel 프로젝트를 만들지 않고 기존 `my-shop-39ab`의 GitHub 자동 배포만 확인한다.

## File Map

- Modify: `C:\vibecoding\my-shop\초안`
  - 데스크톱·모바일 헤더의 새 탭 순서와 접힌 FAQ 섹션 위치를 기록한다.
- Modify: `C:\vibecoding\my-shop\tests\assets-and-sketch.test.mjs`
  - Pencil에 FAQ 프레임과 새 탭 순서가 반영됐는지 검사한다.
- Modify: `C:\vibecoding\my-shop\lib\site-content.ts`
  - `NAV_ITEMS`를 요청 순서와 링크로 교체한다.
- Create: `C:\vibecoding\my-shop\lib\faq-content.ts`
  - 6개 FAQ 질문과 답변 세그먼트 타입·데이터를 관리한다.
- Modify: `C:\vibecoding\my-shop\tests\site-content.test.mjs`
  - 내비게이션 항목과 순서를 검사하고 리뷰 탭이 제외됐는지 확인한다.
- Create: `C:\vibecoding\my-shop\tests\faq-content.test.mjs`
  - FAQ 6개 질문과 핵심 답변 문구를 검사한다.
- Create: `C:\vibecoding\my-shop\components\home\faq-accordion-item.tsx`
  - 질문 하나의 독립 펼침 상태와 접근성 속성을 담당한다.
- Create: `C:\vibecoding\my-shop\components\home\faq-section.tsx`
  - FAQ 제목과 데이터 기반 항목 목록을 렌더링한다.
- Modify: `C:\vibecoding\my-shop\app\page.tsx`
  - 기존 고객 리뷰와 지점 안내를 유지하고 FAQ를 예약 배너 앞에 추가한다.
- Modify: `C:\vibecoding\my-shop\app\globals.css`
  - 브랜드 토큰을 사용하는 FAQ 데스크톱·모바일 스타일을 추가한다.
- Modify: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`
  - 홈페이지 FAQ 렌더링, 앵커, 아코디언 접근성 계약과 반응형 스타일을 검사한다.

---

### Task 1: Pencil 원본에 새 탭 순서와 FAQ 섹션 반영

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\assets-and-sketch.test.mjs`
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**

- Consumes: 기존 `wangjing-desktop`, `wangjing-mobile` 화면 프레임
- Produces: 데스크톱·모바일 FAQ 섹션 프레임과 정확한 탭 순서를 기록한 헤더 프레임 이름

- [ ] **Step 1: 실패하는 Pencil 계약 테스트를 작성한다**

`tests/assets-and-sketch.test.mjs`의 Pencil 테스트를 다음 계약으로 갱신한다.

```js
test("Pencil source contains approved desktop and mobile frames", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const names = pencil.children.map((child) => child.name);
  const approvedNames = [
    "판교왕징 홈페이지 데스크톱",
    "판교왕징 홈페이지 모바일",
  ];
  for (const name of approvedNames) {
    assert.ok(names.includes(name), `${name} 프레임이 있어야 합니다`);
  }

  const approvedFrames = approvedNames.map((name) =>
    pencil.children.find((child) => child.name === name),
  );
  const navOrder =
    "브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문";

  for (const frame of approvedFrames) {
    assert.equal(frame.children.length, 11);
    const childNames = frame.children.map((child) => child.name);
    assert.ok(childNames[0].startsWith("상단 내비게이션"));
    assert.ok(childNames[0].includes(navOrder));
    assert.ok(childNames[1].startsWith("대표 영역"));
    for (const section of [
      "신뢰 정보",
      "대표 메뉴",
      "왕징 이야기",
      "단체 모임",
      "고객 리뷰",
      "자주 묻는 질문 · 6개 아코디언 초기 닫힘",
      "예약 안내",
      "푸터 · 왕징양다리양꼬치 로고 적용",
    ]) {
      assert.ok(childNames.includes(section), `${section} 섹션이 있어야 합니다`);
    }
    assert.ok(
      childNames.some((name) => name.includes("지점 안내")),
      "지점 안내 섹션이 있어야 합니다",
    );
  }
});
```

- [ ] **Step 2: 테스트가 현재 Pencil 구조에서 실패하는지 확인한다**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: 각 화면이 아직 10개 자식이고 FAQ 프레임이 없으므로 FAIL.

- [ ] **Step 3: `초안`의 데스크톱 화면을 먼저 갱신한다**

`wangjing-desktop`에서 다음 값을 적용한다.

```text
desktop-header.name = 상단 내비게이션 · 브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문 · 네이버 예약 지점 선택 드롭다운
desktop-faq = { type: frame, id: desktop-faq, name: 자주 묻는 질문 · 6개 아코디언 초기 닫힘, x: 0, y: 5026, width: 1440, height: 760, fill: #F6F0E5, layout: none }
desktop-reserve.y = 5786
desktop-footer.y = 6346
```

`desktop-faq`는 `desktop-location` 다음, `desktop-reserve` 전에 삽입한다. 기존 루트 높이 `6820` 안에서 푸터가 `6706`에 끝나므로 루트 높이는 변경하지 않는다.

- [ ] **Step 4: `초안`의 모바일 화면을 갱신한다**

`wangjing-mobile`에서 다음 값을 적용한다.

```text
mobile-header.name = 상단 내비게이션 · 브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문 · 모바일 메뉴에 두 지점 예약 링크
mobile-faq = { type: frame, id: mobile-faq, name: 자주 묻는 질문 · 6개 아코디언 초기 닫힘, x: 0, y: 6790, width: 390, height: 720, fill: #F6F0E5, layout: none }
mobile-reserve.y = 7510
mobile-footer.y = 7930
wangjing-mobile.height = 8290
```

`mobile-faq`는 `mobile-location` 다음, `mobile-reserve` 전에 삽입한다.

- [ ] **Step 5: Pencil 테스트를 통과시킨다**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: 모든 자산·Pencil 테스트 PASS.

- [ ] **Step 6: Pencil 변경을 커밋한다**

```powershell
git add -- 초안 tests/assets-and-sketch.test.mjs
git commit -m "design: add homepage FAQ section"
```

Expected: Pencil 원본과 해당 계약 테스트만 커밋된다.

---

### Task 2: 내비게이션 순서와 FAQ 콘텐츠 데이터 추가

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\site-content.test.mjs`
- Create: `C:\vibecoding\my-shop\tests\faq-content.test.mjs`
- Modify: `C:\vibecoding\my-shop\lib\site-content.ts`
- Create: `C:\vibecoding\my-shop\lib\faq-content.ts`

**Interfaces:**

- Consumes: 기존 `NavItem` 타입과 `NAV_ITEMS` 소비 방식
- Produces: `FAQ_ITEMS: readonly FaqEntry[]`, `FaqEntry`, `FaqSegment`, 변경된 `NAV_ITEMS`

- [ ] **Step 1: 내비게이션 순서 실패 테스트를 작성한다**

`tests/site-content.test.mjs`에 다음 테스트를 추가하고, 기존 `site content defines branch review links and review navigation` 테스트 이름을 `site content defines branch review links without a review navigation tab`으로 바꿔 마지막 내비게이션 검증을 `assert.doesNotMatch`로 교체한다.

```js
test("site navigation uses the approved order and FAQ anchor", () => {
  const navStart = source.indexOf("export const NAV_ITEMS");
  const navEnd = source.indexOf("export const TRUST_ITEMS", navStart);
  const navSource = source.slice(navStart, navEnd);
  const expectedItems = [
    '{ label: "브랜드 스토리", href: "#story" }',
    '{ label: "대표 메뉴", href: "/menu", newTab: true }',
    '{ label: "지점 안내", href: "#location" }',
    '{ label: "단체 모임", href: "#group" }',
    '{ label: "자주 묻는 질문", href: "#faq" }',
  ];

  let previousIndex = -1;
  for (const item of expectedItems) {
    const itemIndex = navSource.indexOf(item);
    assert.ok(itemIndex > previousIndex, `${item} 순서가 올바라야 합니다`);
    previousIndex = itemIndex;
  }
  assert.doesNotMatch(navSource, /고객 리뷰|\/reviews/);
});
```

기존 리뷰 링크 테스트의 내비게이션 검증은 다음으로 바꾼다.

```js
  const navStart = source.indexOf("export const NAV_ITEMS");
  const navEnd = source.indexOf("export const TRUST_ITEMS", navStart);
  assert.doesNotMatch(source.slice(navStart, navEnd), /고객 리뷰|\/reviews/);
```

- [ ] **Step 2: FAQ 콘텐츠 실패 테스트를 새 파일에 작성한다**

`tests/faq-content.test.mjs`를 생성한다.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(
  new URL("../lib/faq-content.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("FAQ content defines the six approved questions in order", () => {
  const questions = [
    "양고기 특유의 잡내가 걱정돼요.",
    "통양다리구이는 어떻게 주문하나요?",
    "단체 회식이나 청첩장 모임도 가능한가요?",
    "주차는 어떻게 하나요?",
    "예약은 꼭 해야 하나요?",
    "양고기 말고 다른 메뉴도 있나요?",
  ];

  let previousIndex = -1;
  for (const question of questions) {
    const questionIndex = source.indexOf(question);
    assert.ok(questionIndex > previousIndex, `${question} 순서가 올바라야 합니다`);
    previousIndex = questionIndex;
  }
  assert.equal(source.match(/question:/g)?.length, 6);
});

test("FAQ content contains the approved business facts", () => {
  for (const phrase of [
    "15가지 향신 재료를 24시간 우려낸 비법",
    "48시간 저온 숙성",
    "대 1,700g(3~4인, 90,000원)",
    "중 1,500g(2~3인, 80,000원)",
    "400℃ 숯불에서 60분",
    "모란본점 최대 46명",
    "판교점 최대 70명",
    "가게 앞 무료주차 4대",
    "라스트리트 주차장 3시간 무료",
    "네이버 예약",
    "연태구냥·공부가주",
    "맥주도 다양하게 준비",
  ]) {
    assert.ok(source.includes(phrase), `FAQ should include ${phrase}`);
  }
});
```

- [ ] **Step 3: 두 테스트가 기능 누락으로 실패하는지 확인한다**

Run:

```powershell
node --test tests/site-content.test.mjs tests/faq-content.test.mjs
```

Expected: 현재 내비게이션 순서와 고객 리뷰 탭 때문에 첫 테스트가 FAIL하고 `faq-content.ts`가 없어 FAQ 테스트가 FAIL.

- [ ] **Step 4: `NAV_ITEMS`를 정확한 순서로 교체한다**

`lib/site-content.ts`의 `NAV_ITEMS`만 다음으로 교체한다.

```ts
export const NAV_ITEMS: NavItem[] = [
  { label: "브랜드 스토리", href: "#story" },
  { label: "대표 메뉴", href: "/menu", newTab: true },
  { label: "지점 안내", href: "#location" },
  { label: "단체 모임", href: "#group" },
  { label: "자주 묻는 질문", href: "#faq" },
];
```

- [ ] **Step 5: FAQ 데이터 타입과 6개 문답을 구현한다**

`lib/faq-content.ts`를 생성한다.

```ts
export type FaqSegment = {
  text: string;
  strong?: boolean;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: readonly FaqSegment[];
};

export const FAQ_ITEMS = [
  {
    id: "lamb-aroma",
    question: "양고기 특유의 잡내가 걱정돼요.",
    answer: [
      {
        text: "왕징의 양고기는 15가지 향신 재료를 24시간 우려낸 비법으로 48시간 저온 숙성합니다. 잡내는 줄이고 풍미와 육즙은 살려, 양고기를 처음 드시는 분도 편하게 즐기실 수 있습니다. 처음이시라면 달콤 짭조름한 양념양꼬치부터 시작해 보세요.",
      },
    ],
  },
  {
    id: "whole-lamb-order",
    question: "통양다리구이는 어떻게 주문하나요?",
    answer: [
      { text: "통양다리구이는 " },
      { text: "대 1,700g(3~4인, 90,000원)", strong: true },
      { text: "과 " },
      { text: "중 1,500g(2~3인, 80,000원)", strong: true },
      {
        text: " 두 가지 크기로 준비됩니다. 400℃ 숯불에서 60분 동안 굽는 메뉴라서 방문 전에 네이버 예약이나 전화로 미리 말씀해 주시면 더 여유롭게 즐기실 수 있습니다.",
      },
    ],
  },
  {
    id: "group-dining",
    question: "단체 회식이나 청첩장 모임도 가능한가요?",
    answer: [
      { text: "네, 가능합니다. 단체석은 " },
      { text: "모란본점 최대 46명", strong: true },
      { text: ", " },
      { text: "판교점 최대 70명", strong: true },
      {
        text: "까지 이용하실 수 있습니다. 모란본점은 회식·가족외식·청첩장 모임에, 판교점은 회식·비즈니스 미팅에 특히 많이 찾아주십니다. 인원과 좌석 배치는 지점으로 전화 주시면 맞춰 준비해 드립니다.",
      },
    ],
  },
  {
    id: "parking",
    question: "주차는 어떻게 하나요?",
    answer: [
      {
        text: "모란본점은 가게 앞 무료주차 4대와 모란공영주차장을 이용하실 수 있습니다. 판교점은 라스트리트 주차장 3시간 무료이며, 인근 공영주차장도 이용 가능합니다.",
      },
    ],
  },
  {
    id: "reservation",
    question: "예약은 꼭 해야 하나요?",
    answer: [
      {
        text: "워크인 방문도 가능하지만, 저녁 시간과 주말에는 대기가 생길 수 있습니다. 네이버 예약으로 원하는 시간과 인원을 미리 알려주시면 편하게 모시겠습니다.",
      },
    ],
  },
  {
    id: "other-menu",
    question: "양고기 말고 다른 메뉴도 있나요?",
    answer: [
      {
        text: "꿔바로우, 마라샹궈, 소룽샤, 향라대하 등 정통 중국요리와 볶음밥·면·만두, 그리고 연태구냥·공부가주 같은 중국 백주와 맥주도 다양하게 준비되어 있습니다. 양고기와 곁들이기 좋은 메뉴를 취향에 맞게 선택하실 수 있습니다.",
      },
    ],
  },
] as const satisfies readonly FaqEntry[];
```

- [ ] **Step 6: 내비게이션과 FAQ 콘텐츠 테스트를 통과시킨다**

Run:

```powershell
node --test tests/site-content.test.mjs tests/faq-content.test.mjs
```

Expected: 두 파일의 모든 테스트 PASS.

- [ ] **Step 7: 데이터 변경을 커밋한다**

```powershell
git add -- lib/site-content.ts lib/faq-content.ts tests/site-content.test.mjs tests/faq-content.test.mjs
git commit -m "feat: add FAQ content and navigation"
```

Expected: 내비게이션과 FAQ 데이터·테스트만 커밋된다.

---

### Task 3: 접근 가능한 FAQ 아코디언과 홈페이지 섹션 구현

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`
- Create: `C:\vibecoding\my-shop\components\home\faq-accordion-item.tsx`
- Create: `C:\vibecoding\my-shop\components\home\faq-section.tsx`
- Modify: `C:\vibecoding\my-shop\app\page.tsx`
- Modify: `C:\vibecoding\my-shop\app\globals.css`

**Interfaces:**

- Consumes: `FaqEntry`, `FAQ_ITEMS`
- Produces: `FaqAccordionItem({ item }: { item: FaqEntry })`, `FaqSection()` 및 홈페이지 `#faq`

- [ ] **Step 1: 로컬 Next.js 문서를 읽는다**

Run:

```powershell
Get-Content -LiteralPath node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md -Raw
Get-Content -LiteralPath node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md -Raw
```

Expected: 상태가 필요한 최소 항목만 Client Component로 두고, 서버에서 클라이언트로 전달하는 FAQ 데이터가 직렬화 가능한 일반 객체여야 함을 확인한다.

- [ ] **Step 2: FAQ 구조와 스타일을 요구하는 실패 테스트를 작성한다**

`tests/page-structure.test.mjs`의 홈페이지 구성 목록에서 `ReservationBanner` 앞에 `FaqSection`을 추가하고, 앵커 검사 목록에 `faq-section.tsx`와 `faq`를 추가한다. 이어 다음 테스트를 추가한다.

```js
test("FAQ section renders accessible independently controlled items", async () => {
  const [page, section, item, css] = await Promise.all([
    read("app/page.tsx"),
    read("components/home/faq-section.tsx"),
    read("components/home/faq-accordion-item.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /import \{ FaqSection \}/);
  assert.match(page, /<FaqSection \/>/);
  assert.match(section, /FAQ_ITEMS\.map/);
  assert.match(section, /<FaqAccordionItem/);
  assert.match(section, /id="faq"/);
  assert.match(section, /자주 묻는 질문/);
  assert.match(item, /^"use client";/m);
  assert.match(item, /useState\(false\)/);
  assert.match(item, /type="button"/);
  assert.match(item, /aria-expanded=\{open\}/);
  assert.match(item, /aria-controls=\{panelId\}/);
  assert.match(item, /hidden=\{!open\}/);
  assert.match(item, /item\.answer\.map/);
  assert.match(css, /\.faq-item__trigger\s*\{[\s\S]*?min-height:\s*72px;/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.faq-item__trigger\s*\{[\s\S]*?min-height:\s*64px;/,
  );
});
```

- [ ] **Step 3: 구조 테스트가 새 컴포넌트 누락으로 실패하는지 확인한다**

Run:

```powershell
node --test tests/page-structure.test.mjs
```

Expected: `FaqSection`과 FAQ 파일이 없어 FAIL.

- [ ] **Step 4: 독립 상태의 FAQ 항목 클라이언트 컴포넌트를 만든다**

`components/home/faq-accordion-item.tsx`를 생성한다.

```tsx
"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import type { FaqEntry } from "@/lib/faq-content";

type FaqAccordionItemProps = {
  item: FaqEntry;
};

export function FaqAccordionItem({ item }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);
  const buttonId = `faq-question-${item.id}`;
  const panelId = `faq-answer-${item.id}`;

  return (
    <article className={open ? "faq-item faq-item--open" : "faq-item"}>
      <h3>
        <button
          className="faq-item__trigger"
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{item.question}</span>
          <Plus className="faq-item__icon" aria-hidden="true" />
        </button>
      </h3>
      <div
        className="faq-item__answer"
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
      >
        <p>
          {item.answer.map((segment, index) =>
            segment.strong ? (
              <strong key={`${item.id}-${index}`}>{segment.text}</strong>
            ) : (
              <span key={`${item.id}-${index}`}>{segment.text}</span>
            ),
          )}
        </p>
      </div>
    </article>
  );
}
```

각 항목이 자체 `useState`를 가지므로 다른 항목을 닫지 않고 여러 답변을 동시에 열 수 있다.

- [ ] **Step 5: FAQ 서버 섹션을 만든다**

`components/home/faq-section.tsx`를 생성한다.

```tsx
import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import { FAQ_ITEMS } from "@/lib/faq-content";

export function FaqSection() {
  return (
    <section
      className="section section--light faq"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="faq__inner">
        <header className="faq__header">
          <p className="eyebrow eyebrow--red">FAQ</p>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </header>
        <div className="faq__list">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 홈페이지에 FAQ를 예약 배너 앞에 추가한다**

`app/page.tsx` 상단에 다음 import를 추가한다.

```tsx
import { FaqSection } from "@/components/home/faq-section";
```

`LocationSection`과 `ReservationBanner` 사이에 다음을 추가한다.

```tsx
        <LocationSection />
        <FaqSection />
        <ReservationBanner />
```

기존 `ReviewsSection`과 그 위치는 변경하지 않는다.

- [ ] **Step 7: 브랜드 토큰 기반 FAQ 스타일을 추가한다**

`app/globals.css`의 위치 섹션 스타일 뒤, 예약 섹션 스타일 앞에 다음을 추가한다.

```css
.faq {
  scroll-margin-top: 92px;
  background:
    radial-gradient(circle at 100% 0, rgba(197, 161, 90, 0.1), transparent 34%),
    var(--cream);
}

.faq__inner {
  width: min(980px, 100%);
  margin: 0 auto;
}

.faq__header {
  margin-bottom: 2.5rem;
}

.faq__header h2 {
  margin: 0.75rem 0 0;
  font-family: var(--font-serif);
  font-size: clamp(2.1rem, 4vw, 3.2rem);
  line-height: 1.25;
  letter-spacing: -0.04em;
}

.faq__list {
  border-top: 1px solid var(--line);
}

.faq-item {
  border-bottom: 1px solid var(--line);
}

.faq-item h3 {
  margin: 0;
}

.faq-item__trigger {
  width: 100%;
  min-height: 72px;
  padding: 1.35rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border: 0;
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.faq-item__trigger > span {
  font-family: var(--font-serif);
  font-size: clamp(1.08rem, 2vw, 1.35rem);
  font-weight: 800;
  line-height: 1.45;
}

.faq-item__icon {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  color: var(--red);
  transition: transform 180ms ease;
}

.faq-item--open .faq-item__icon {
  transform: rotate(45deg);
}

.faq-item__answer {
  padding: 0 3.5rem 1.75rem 0;
}

.faq-item__answer p {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.9;
}

.faq-item__answer strong {
  color: var(--text);
}
```

기존 `@media (max-width: 767px)` 블록 안에 다음을 추가한다.

```css
  .faq {
    scroll-margin-top: 72px;
  }

  .faq__header {
    margin-bottom: 1.75rem;
  }

  .faq-item__trigger {
    min-height: 64px;
    padding: 1.1rem 0;
    gap: 1rem;
  }

  .faq-item__answer {
    padding: 0 0 1.5rem;
  }

  .faq-item__answer p {
    font-size: 0.94rem;
    line-height: 1.8;
  }
```

- [ ] **Step 8: 구조 테스트와 전체 자동 검증을 통과시킨다**

Run:

```powershell
node --test tests/page-structure.test.mjs
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: 모든 테스트 PASS, ESLint exit code 0, Next.js production build exit code 0.

- [ ] **Step 9: FAQ UI 변경을 커밋한다**

```powershell
git add -- components/home/faq-accordion-item.tsx components/home/faq-section.tsx app/page.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: add accessible homepage FAQ"
```

Expected: FAQ 컴포넌트, 홈페이지 연결, 스타일, 구조 테스트만 커밋된다.

---

### Task 4: 데스크톱·모바일 QA, GitHub 푸시, 기존 Vercel 배포 확인

**Files:**

- Verify only: `C:\vibecoding\my-shop`

**Interfaces:**

- Consumes: 완성된 `main`의 탭 순서와 FAQ 섹션
- Produces: GitHub `origin/main`과 기존 Vercel 프로젝트 `my-shop-39ab`의 검증된 프로덕션 배포

- [ ] **Step 1: 완료 주장 전 검증 지침을 읽는다**

Run:

```powershell
Get-Content -LiteralPath C:\Users\USER\.codex\skills\verification-before-completion\SKILL.md -Raw
```

Expected: 새 검증 결과를 근거로만 완료를 보고해야 함을 확인한다.

- [ ] **Step 2: 최종 자동 검증을 새로 실행한다**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
git diff --check HEAD~3..HEAD
git status --short --branch
```

Expected: 테스트·린트·빌드 모두 exit code 0, whitespace 오류 없음, 관련 없는 변경 없음.

- [ ] **Step 3: 로컬 프로덕션 서버를 실행한다**

Run:

```powershell
npm.cmd start
```

Expected: `http://localhost:3000`에서 빌드 결과가 제공된다. 이미 포트 3000이 사용 중이면 해당 프로젝트의 기존 서버인지 확인한 뒤 다른 포트를 사용한다.

- [ ] **Step 4: 데스크톱 화면을 검증한다**

Computer Use 또는 사용 가능한 브라우저 자동화로 `http://localhost:3000/#faq`를 1440×900에서 확인한다.

확인 항목:

- 헤더 순서가 `브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문`이다.
- FAQ 제목과 질문 6개가 보이고 초기에는 모든 답변이 닫혀 있다.
- 서로 다른 질문 두 개를 열었을 때 두 답변이 함께 열린 상태로 유지된다.
- `+` 아이콘은 열린 항목에서 회전하고 질문·답변·구분선이 기존 브랜드 색상과 어울린다.
- 긴 가격, 인원, 주차 문구가 잘리거나 겹치지 않는다.
- 기존 고객 리뷰 섹션과 `/reviews` 페이지가 그대로 남아 있다.

- [ ] **Step 5: 모바일 화면과 키보드 조작을 검증한다**

390×844에서 다음을 확인한다.

- 모바일 메뉴의 탭 순서가 데스크톱과 같다.
- `자주 묻는 질문`을 누르면 고정 헤더 아래 FAQ 제목이 보인다.
- 질문 행이 최소 64px이고 가로 스크롤이 없다.
- Tab으로 질문에 이동하고 Enter와 Space로 열고 닫을 수 있다.
- 한 질문을 열어도 다른 열린 질문은 닫히지 않는다.

- [ ] **Step 6: 시각 문제를 발견하면 테스트부터 보강해 최소 수정한다**

문제를 발견하면 해당 동작을 재현하는 실패 테스트를 먼저 추가하고 수정 후 다음을 다시 실행한다.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
git add -- components/home/faq-accordion-item.tsx components/home/faq-section.tsx app/page.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "fix: refine homepage FAQ layout"
```

Expected: 수정 뒤 모든 검증이 다시 PASS.

- [ ] **Step 7: GitHub `main`에 푸시한다**

Run:

```powershell
git push origin main
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch
```

Expected: 로컬 `HEAD`와 `origin/main` SHA가 같고 ahead/behind가 0이다.

- [ ] **Step 8: 기존 Vercel 자동 배포가 Ready가 될 때까지 확인한다**

새 프로젝트 생성이나 수동 `vercel deploy`는 실행하지 않는다.

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
vercel.cmd inspect https://my-shop-39ab.vercel.app
```

Expected:

```text
name    my-shop-39ab
target  production
status  Ready
```

Building 상태이면 같은 `inspect`를 적절한 간격으로 다시 확인하고, 최신 배포가 푸시한 commit을 포함하는지 확인한다.

- [ ] **Step 9: 세 프로덕션 주소의 FAQ를 확인한다**

다음 주소에서 동일한 탭 순서와 FAQ가 제공되는지 확인한다.

```text
https://my-shop-39ab.vercel.app/#faq
https://왕징양다리양꼬치.com/#faq
https://www.왕징양다리양꼬치.com/#faq
```

Expected: 세 주소 모두 HTTPS 200, 최신 FAQ 6개 표시, 아코디언 동작 정상, 인증서 오류 없음.

- [ ] **Step 10: 완료 결과를 보고한다**

보고에는 다음을 포함한다.

- 변경된 탭 순서와 FAQ 추가 요약
- 전체 테스트·ESLint·프로덕션 빌드 결과
- 데스크톱·모바일 및 키보드 QA 결과
- 최종 commit SHA
- 기존 Vercel 배포 ID와 `Ready` 상태
- 세 주소 확인 결과와 새 Vercel 프로젝트를 만들지 않았다는 사실

---

## Plan Self-Review Checklist

- [ ] 명세의 내비게이션 순서, 링크, 고객 리뷰 유지 요구가 Task 2와 Task 3에 모두 반영됐다.
- [ ] FAQ 6개 질문과 사용자가 승인한 마지막 답변 문장이 Task 2에 정확히 포함됐다.
- [ ] 여러 답변 동시 열기, 초기 닫힘, 키보드와 ARIA 요구가 Task 3·Task 4에 반영됐다.
- [ ] Pencil 변경이 애플리케이션 코드보다 먼저 수행된다.
- [ ] 각 기능 변경은 실패 테스트를 확인한 뒤 최소 구현을 작성한다.
- [ ] 타입 이름 `FaqSegment`, `FaqEntry`, 데이터 이름 `FAQ_ITEMS`가 모든 Task에서 일치한다.
- [ ] 기존 고객 리뷰 섹션과 `/reviews` 페이지를 삭제하거나 변경하지 않는다.
- [ ] 새 Vercel 프로젝트를 만들지 않고 기존 프로젝트의 자동 배포만 확인한다.

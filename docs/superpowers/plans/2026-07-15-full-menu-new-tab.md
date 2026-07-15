# Pangyo Full Menu New-Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 홈페이지의 대표 메뉴 진입점에서 새 탭으로 열리는 판교점 52개 전체 메뉴 페이지를 만든다.

**Architecture:** 판교점 메뉴 원본은 lib/menu-content.ts의 정적 타입 데이터로 분리하고, app/menu/page.tsx가 메타데이터와 반응형 화면을 렌더링한다. 기존 NAV_ITEMS에 새 탭 여부를 데이터로 추가해 데스크톱·모바일 헤더가 같은 동작을 공유하며, 홈페이지 대표 메뉴 섹션에도 명시적인 전체 메뉴 버튼을 둔다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, 기존 전역 CSS, Node.js 내장 test runner

## Global Constraints

- 구현 기준은 docs/superpowers/specs/2026-07-15-full-menu-new-tab-design.md와 Pencil의 판교점 전체 메뉴 데스크톱·모바일 프레임이다.
- 경로는 /menu이고 홈페이지의 세 진입점은 target="_blank"와 rel="noreferrer"를 사용한다.
- 메뉴는 52개이며 분류별 개수는 7+16+6+5+18이다.
- 동일한 양다리 90,000원과 80,000원 항목은 임의의 크기명을 붙이지 않고 별도 항목으로 유지한다.
- 본문·보조 문구는 16px 미만으로 내려가지 않는다.
- 판교점 예약 URL은 https://booking.naver.com/booking/6/bizes/970819 이다.
- 판교점 네이버 플레이스 URL은 https://map.naver.com/v5/entry/place/1873196958 이다.
- canonical은 https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu 이다.
- 메뉴와 가격은 2026년 7월 15일 확인 기준이며 변경 가능 안내를 노출한다.
- 기존 .gitignore 수정과 추적되지 않은 사용자 파일은 건드리거나 커밋하지 않는다.

---

### Task 1: 판교점 52개 메뉴 데이터

**Files:**
- Create: tests/full-menu.test.mjs
- Create: lib/menu-content.ts

**Interfaces:**
- Produces: FullMenuItem, FullMenuGroup, PANGYO_MENU_GROUPS, PANGYO_MENU_COUNT, PANGYO_MENU_CHECKED_AT, PANGYO_MENU_SOURCE_URL
- Consumes: 없음

- [ ] **Step 1: 메뉴 개수·분류·중복 양다리·출처를 고정하는 실패 테스트 작성**

tests/full-menu.test.mjs을 다음 내용으로 만든다.

~~~js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("Pangyo menu data contains 52 items in five approved groups", async () => {
  const source = await read("lib/menu-content.ts");
  assert.equal(source.match(/\bprice:/g)?.length, 52);
  for (const value of [
    'id: "lamb-skewers"',
    'title: "양고기·꼬치"',
    'id: "chinese-dishes"',
    'title: "중국요리·탕"',
    'id: "meals"',
    'title: "식사·면·디저트"',
    'id: "lunch"',
    'title: "점심특선"',
    'id: "drinks"',
    'title: "주류·하이볼"',
  ]) {
    assert.ok(source.includes(value), "missing menu group value: " + value);
  }
  assert.match(source, /PANGYO_MENU_COUNT = 52/);
});

test("Pangyo menu data preserves both lamb-leg prices without invented sizes", async () => {
  const source = await read("lib/menu-content.ts");
  assert.equal(source.match(/name: "비쥬얼 쇼크! 육즙 팡팡 양다리"/g)?.length, 2);
  assert.match(source, /price: "90,000원"/);
  assert.match(source, /price: "80,000원"/);
  assert.doesNotMatch(source, /대형|소형|큰 사이즈|작은 사이즈/);
});

test("Pangyo menu data records its source and checked date", async () => {
  const source = await read("lib/menu-content.ts");
  assert.match(
    source,
    /https:\/\/m\.place\.naver\.com\/restaurant\/1873196958\/menu\/list/,
  );
  assert.match(source, /2026년 7월 15일/);
});
~~~

- [ ] **Step 2: 테스트가 데이터 파일 부재로 실패하는지 확인**

Run: node --test --test-name-pattern="Pangyo menu data" tests/full-menu.test.mjs

Expected: 3 tests FAIL because lib/menu-content.ts is empty or missing.

- [ ] **Step 3: 타입과 52개 정적 메뉴 데이터 구현**

lib/menu-content.ts을 다음 내용으로 만든다.

~~~ts
export type FullMenuItem = {
  name: string;
  price: string;
  description?: string;
};

export type FullMenuGroup = {
  id: "lamb-skewers" | "chinese-dishes" | "meals" | "lunch" | "drinks";
  title: string;
  description: string;
  items: FullMenuItem[];
};

export const PANGYO_MENU_SOURCE_URL =
  "https://m.place.naver.com/restaurant/1873196958/menu/list";
export const PANGYO_MENU_CHECKED_AT = "2026년 7월 15일";
export const PANGYO_MENU_COUNT = 52;

export const PANGYO_MENU_GROUPS: FullMenuGroup[] = [
  {
    id: "lamb-skewers",
    title: "양고기·꼬치",
    description: "불향과 육즙을 즐기는 왕징의 대표 메뉴",
    items: [
      { name: "비쥬얼 쇼크! 육즙 팡팡 양다리", price: "90,000원" },
      { name: "비쥬얼 쇼크! 육즙 팡팡 양다리", price: "80,000원" },
      { name: "고급양갈비", price: "30,000원" },
      { name: "생양꼬치", price: "17,000원" },
      { name: "양념양꼬치", price: "18,000원" },
      { name: "양갈비살꼬치", price: "18,000원" },
      { name: "새우꼬치", price: "18,000원" },
    ],
  },
  {
    id: "chinese-dishes",
    title: "중국요리·탕",
    description: "함께 나누기 좋은 정통 중국요리",
    items: [
      { name: "꿔바로우", price: "20,000원" },
      { name: "가지튀김", price: "18,000원" },
      { name: "토마토계란볶음", price: "16,000원" },
      { name: "마파두부", price: "15,000원" },
      { name: "향라대하", price: "22,000원" },
      { name: "어향육사", price: "19,000원" },
      { name: "경장육사", price: "19,000원" },
      { name: "마라탕", price: "18,000원" },
      { name: "소룽샤", price: "38,000원" },
      { name: "지삼선", price: "18,000원" },
      { name: "건두부볶음", price: "16,000원" },
      { name: "오이무침", price: "12,000원" },
      { name: "즈란양고기", price: "28,000원" },
      { name: "마라샹궈", price: "32,000원" },
      { name: "건두부무침", price: "16,000원" },
      { name: "양탕", price: "15,000원" },
    ],
  },
  {
    id: "meals",
    title: "식사·면·디저트",
    description: "요리와 곁들이거나 든든하게 마무리하는 메뉴",
    items: [
      { name: "계란볶음밥", price: "8,000원" },
      { name: "가지볶음밥", price: "8,000원" },
      { name: "옥수수온면", price: "8,000원" },
      { name: "냉면", price: "8,000원" },
      { name: "물만두", price: "8,000원" },
      { name: "꽃빵튀김", price: "8,000원" },
    ],
  },
  {
    id: "lunch",
    title: "점심특선",
    description: "점심에만 만나는 든든한 한 그릇",
    items: [
      { name: "홍소로우+야채덮밥", price: "12,900원" },
      { name: "즈란양고기+야채덮밥", price: "12,900원" },
      { name: "목: 콜라닭 마파두부 덮밥", price: "12,900원" },
      { name: "금: 고추돼지고기 녹두나물덮밥", price: "12,900원" },
      { name: "토: 홍소돼지등뼈 브로콜리덮밥", price: "12,900원" },
    ],
  },
  {
    id: "drinks",
    title: "주류·하이볼",
    description: "양고기와 어울리는 고량주와 시원한 한 잔",
    items: [
      { name: "커티삭하이볼", price: "6,000원" },
      { name: "연태구냥 500ml 34도", price: "40,000원" },
      { name: "연태구냥 250ml 34도", price: "20,000원" },
      { name: "연태구냥 125ml 34도", price: "12,000원" },
      { name: "설원 450ml 30도", price: "25,000원" },
      { name: "설원 250ml 30도", price: "15,000원" },
      { name: "공부가주 500ml 33도", price: "50,000원" },
      { name: "노주탄 500ml 33도", price: "30,000원" },
      { name: "이과두주 125ml 56도", price: "5,000원" },
      { name: "컵술 고량주 100ml 38도", price: "5,000원" },
      { name: "칭다오 맥주 640ml 4.7도", price: "7,000원" },
      { name: "하얼빈 맥주 500ml 4.3도", price: "7,000원" },
      { name: "타이거 맥주 640ml 5도", price: "7,000원" },
      { name: "산토리하이볼", price: "8,000원" },
      { name: "봄베이하이볼", price: "8,000원" },
      { name: "짐빔하이볼", price: "7,000원" },
      { name: "제임슨하이볼", price: "8,000원" },
      { name: "연태하이볼", price: "7,000원" },
    ],
  },
];
~~~

- [ ] **Step 4: 데이터 테스트 통과 확인**

Run: node --test --test-name-pattern="Pangyo menu data" tests/full-menu.test.mjs

Expected: 3 tests PASS.

- [ ] **Step 5: 메뉴 데이터 커밋**

~~~powershell
git add -- tests/full-menu.test.mjs lib/menu-content.ts
git commit -m "feat: add Pangyo full menu data"
~~~

---

### Task 2: /menu 반응형 페이지와 검색 메타데이터

**Files:**
- Modify: tests/full-menu.test.mjs
- Create: app/menu/page.tsx
- Modify: app/globals.css

**Interfaces:**
- Consumes: PANGYO_MENU_GROUPS, PANGYO_MENU_COUNT, PANGYO_MENU_CHECKED_AT
- Produces: Next.js /menu route, page-level Metadata, semantic category and item markup

- [ ] **Step 1: 페이지 구조·메타데이터·CTA·16px 기준 실패 테스트 추가**

tests/full-menu.test.mjs 끝에 다음 테스트를 추가한다.

~~~js
test("full menu page renders metadata, five groups, and conversion links", async () => {
  const [page, css] = await Promise.all([
    read("app/menu/page.tsx"),
    read("app/globals.css"),
  ]);

  for (const value of [
    "판교점 전체 메뉴 | 왕징양다리양꼬치",
    "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu",
    "PANGYO_MENU_GROUPS.map",
    "PANGYO_MENU_COUNT",
    "PANGYO_MENU_CHECKED_AT",
    "메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다",
    "https://booking.naver.com/booking/6/bizes/970819",
    "https://map.naver.com/v5/entry/place/1873196958",
  ]) {
    assert.ok(page.includes(value), "menu page should include " + value);
  }

  assert.match(page, /<h1[^>]*>판교점 전체 메뉴<\/h1>/);
  assert.match(page, /<h2/);
  assert.match(page, /target="_blank"/g);
  assert.match(page, /rel="noreferrer"/g);
  assert.match(css, /\.full-menu-page/);
  assert.match(css, /\.full-menu-section__items/);
  assert.match(css, /grid-template-columns:\s*repeat\(2/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.full-menu-section__items[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.doesNotMatch(css, /\.full-menu-[^{]*\{[^}]*font-size:\s*(?:0\.[0-9]+rem|1[0-5]px)/);
});
~~~

- [ ] **Step 2: 새 페이지와 스타일 부재로 테스트가 실패하는지 확인**

Run: node --test --test-name-pattern="full menu page" tests/full-menu.test.mjs

Expected: FAIL because app/menu/page.tsx and full-menu CSS selectors do not exist.

- [ ] **Step 3: 메타데이터와 시맨틱 전체 메뉴 페이지 구현**

app/menu/page.tsx을 다음 내용으로 만든다.

~~~tsx
import type { Metadata } from "next";
import { BrandLogo } from "@/components/home/brand-logo";
import {
  PANGYO_MENU_CHECKED_AT,
  PANGYO_MENU_COUNT,
  PANGYO_MENU_GROUPS,
} from "@/lib/menu-content";

const canonical = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu";
const bookingUrl = "https://booking.naver.com/booking/6/bizes/970819";
const placeUrl = "https://map.naver.com/v5/entry/place/1873196958";

export const metadata: Metadata = {
  title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
  description:
    "왕징양다리양꼬치 판교점의 양다리, 양꼬치, 중국요리, 식사, 점심특선과 주류 52개 메뉴 및 가격을 확인하세요.",
  alternates: { canonical },
  openGraph: {
    title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
    description: "판교점의 양고기와 중국요리 52개 메뉴 및 가격 안내",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};

export default function MenuPage() {
  return (
    <div className="full-menu-page">
      <header className="full-menu-header">
        <div className="full-menu-header__inner">
          <a href="/" aria-label="왕징양다리양꼬치 홈페이지로 이동">
            <BrandLogo
              className="brand-logo--menu"
              sizes="(max-width: 767px) 112px, 176px"
            />
          </a>
          <a className="full-menu-home-link" href="/">
            홈으로 돌아가기
          </a>
        </div>
      </header>

      <main>
        <section className="full-menu-hero" aria-labelledby="full-menu-title">
          <div className="full-menu-shell">
            <p className="full-menu-eyebrow">PANGYO · FULL MENU</p>
            <h1 id="full-menu-title">판교점 전체 메뉴</h1>
            <p className="full-menu-hero__description">
              양다리와 꼬치부터 중국요리, 식사, 점심특선, 주류까지
              한눈에 확인하세요.
            </p>
            <p className="full-menu-checked">
              네이버 플레이스 등록 메뉴 {PANGYO_MENU_COUNT}개 ·{" "}
              {PANGYO_MENU_CHECKED_AT} 확인
            </p>
          </div>
        </section>

        <nav className="full-menu-categories" aria-label="메뉴 분류 바로가기">
          <ul className="full-menu-shell">
            {PANGYO_MENU_GROUPS.map((group) => (
              <li key={group.id}>
                <a href={"#menu-" + group.id}>
                  {group.title} {group.items.length}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="full-menu-content full-menu-shell">
          {PANGYO_MENU_GROUPS.map((group) => (
            <section
              className="full-menu-section"
              id={"menu-" + group.id}
              key={group.id}
              aria-labelledby={"menu-title-" + group.id}
            >
              <div className="full-menu-section__heading">
                <h2 id={"menu-title-" + group.id}>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <ul className="full-menu-section__items">
                {group.items.map((item, index) => (
                  <li
                    className="full-menu-item"
                    key={group.id + "-" + item.name + "-" + item.price + "-" + index}
                  >
                    <div>
                      <h3>{item.name}</h3>
                      {item.description ? <p>{item.description}</p> : null}
                    </div>
                    <strong>{item.price}</strong>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <footer className="full-menu-footer">
        <div className="full-menu-shell">
          <h2>방문 전 확인해 주세요</h2>
          <p>
            메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다. 최신
            정보는 네이버 플레이스에서 확인해 주세요.
          </p>
          <p className="full-menu-checked">
            판교점 네이버 플레이스 기준 · {PANGYO_MENU_CHECKED_AT} 확인
          </p>
          <div className="full-menu-footer__actions">
            <a href={bookingUrl} target="_blank" rel="noreferrer">
              판교점 예약
            </a>
            <a href={placeUrl} target="_blank" rel="noreferrer">
              네이버 플레이스
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
~~~

- [ ] **Step 4: Pencil 승인본에 맞는 데스크톱·모바일 스타일 구현**

app/globals.css 끝의 반응형 규칙 앞이나 파일 끝에 다음 스타일을 추가한다.

~~~css
.full-menu-page {
  min-height: 100vh;
  background: var(--cream);
  color: var(--ink);
}

.full-menu-shell {
  width: min(100% - 48px, 1248px);
  margin-inline: auto;
}

.full-menu-header {
  background: var(--ink);
}

.full-menu-header__inner {
  width: min(100% - 48px, 1248px);
  min-height: 92px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand-logo--menu {
  width: 176px;
  height: auto;
  mix-blend-mode: screen;
}

.full-menu-home-link,
.full-menu-categories a {
  font-size: 1rem;
  font-weight: 700;
}

.full-menu-home-link {
  color: var(--gold);
}

.full-menu-hero {
  padding-block: 88px;
  background: #241a17;
  color: #fff8ec;
}

.full-menu-eyebrow,
.full-menu-checked {
  color: var(--gold);
  font-size: 1rem;
  font-weight: 700;
}

.full-menu-eyebrow {
  letter-spacing: 0.18em;
}

.full-menu-hero h1 {
  margin-top: 16px;
  font-size: clamp(2.625rem, 5vw, 3.5rem);
  line-height: 1.2;
}

.full-menu-hero__description {
  max-width: 760px;
  margin-top: 18px;
  color: rgba(255, 248, 236, 0.82);
  font-size: 1.125rem;
  line-height: 1.7;
}

.full-menu-hero .full-menu-checked {
  margin-top: 18px;
}

.full-menu-categories {
  border-bottom: 1px solid #ded2c5;
  background: #fff8ec;
}

.full-menu-categories ul {
  min-height: 88px;
  display: flex;
  align-items: center;
  gap: 28px;
  overflow-x: auto;
  list-style: none;
}

.full-menu-categories a {
  color: var(--red);
  white-space: nowrap;
}

.full-menu-content {
  padding-block: 72px 96px;
  display: grid;
  gap: 72px;
}

.full-menu-section {
  scroll-margin-top: 24px;
}

.full-menu-section__heading {
  margin-bottom: 24px;
}

.full-menu-section__heading h2,
.full-menu-footer h2 {
  font-size: 2rem;
  line-height: 1.3;
}

.full-menu-section__heading p {
  margin-top: 8px;
  color: #796b61;
  font-size: 1rem;
  line-height: 1.6;
}

.full-menu-section__items {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 40px;
  list-style: none;
}

.full-menu-item {
  min-height: 72px;
  padding-block: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #ded2c5;
}

.full-menu-item h3 {
  font-size: 1rem;
  line-height: 1.45;
}

.full-menu-item p {
  margin-top: 5px;
  color: #796b61;
  font-size: 1rem;
  line-height: 1.5;
}

.full-menu-item strong {
  color: var(--red);
  font-size: 1.125rem;
  white-space: nowrap;
}

.full-menu-footer {
  padding-block: 64px;
  background: var(--ink);
  color: #fff8ec;
}

.full-menu-footer p {
  max-width: 780px;
  margin-top: 14px;
  color: rgba(255, 248, 236, 0.82);
  font-size: 1rem;
  line-height: 1.65;
}

.full-menu-footer .full-menu-checked {
  color: var(--gold);
}

.full-menu-footer__actions {
  margin-top: 28px;
  display: flex;
  gap: 16px;
}

.full-menu-footer__actions a {
  min-width: 190px;
  min-height: 58px;
  padding: 14px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #a51e22;
  color: white;
  font-size: 1.0625rem;
  font-weight: 700;
}

.full-menu-footer__actions a:last-child {
  background: var(--cream);
  color: var(--ink);
}

.full-menu-page a:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: 4px;
}

@media (max-width: 767px) {
  .full-menu-shell,
  .full-menu-header__inner {
    width: min(100% - 48px, 1248px);
  }

  .full-menu-header__inner {
    min-height: 72px;
  }

  .brand-logo--menu {
    width: 112px;
  }

  .full-menu-hero {
    padding-block: 52px;
  }

  .full-menu-hero h1 {
    font-size: 2.625rem;
  }

  .full-menu-categories ul {
    min-height: 72px;
    gap: 22px;
  }

  .full-menu-content {
    padding-block: 52px 72px;
    gap: 56px;
  }

  .full-menu-section__items {
    grid-template-columns: 1fr;
  }

  .full-menu-footer {
    padding-block: 52px;
  }

  .full-menu-footer__actions {
    flex-direction: column;
  }

  .full-menu-footer__actions a {
    width: 100%;
  }
}
~~~

- [ ] **Step 5: 페이지 테스트와 프로덕션 빌드 확인**

Run: node --test --test-name-pattern="full menu page" tests/full-menu.test.mjs

Expected: PASS.

Run: npm run build

Expected: Next.js build succeeds and route table includes /menu as a static route.

- [ ] **Step 6: 전체 메뉴 페이지 커밋**

~~~powershell
git add -- tests/full-menu.test.mjs app/menu/page.tsx app/globals.css
git commit -m "feat: add responsive full menu page"
~~~

---

### Task 3: 홈페이지 세 진입점의 새 탭 연결

**Files:**
- Modify: tests/full-menu.test.mjs
- Modify: lib/site-content.ts
- Modify: components/home/site-header.tsx
- Modify: components/home/signature-menu-section.tsx
- Modify: app/globals.css

**Interfaces:**
- Consumes: NAV_ITEMS
- Produces: NavItem.newTab, 데스크톱 헤더·모바일 메뉴·대표 메뉴 섹션의 /menu 새 탭 링크

- [ ] **Step 1: 세 진입점의 새 탭 계약 실패 테스트 추가**

tests/full-menu.test.mjs 끝에 다음 테스트를 추가한다.

~~~js
test("all three full-menu entry points open /menu in a safe new tab", async () => {
  const [content, header, signature] = await Promise.all([
    read("lib/site-content.ts"),
    read("components/home/site-header.tsx"),
    read("components/home/signature-menu-section.tsx"),
  ]);

  assert.match(
    content,
    /\{ label: "대표 메뉴", href: "\/menu", newTab: true \}/,
  );
  assert.equal(header.match(/target=\{item\.newTab \? "_blank" : undefined\}/g)?.length, 2);
  assert.equal(header.match(/rel=\{item\.newTab \? "noreferrer" : undefined\}/g)?.length, 2);
  assert.match(signature, /href="\/menu"/);
  assert.match(signature, /target="_blank"/);
  assert.match(signature, /rel="noreferrer"/);
  assert.match(signature, />전체 메뉴 보기</);
});
~~~

- [ ] **Step 2: 기존 #menu 링크 때문에 테스트가 실패하는지 확인**

Run: node --test --test-name-pattern="all three full-menu entry points" tests/full-menu.test.mjs

Expected: FAIL because NAV_ITEMS still points to #menu and the header anchors have no conditional target.

- [ ] **Step 3: NAV_ITEMS에 명시적인 새 탭 속성 추가**

lib/site-content.ts의 NavItem 타입과 NAV_ITEMS 첫 항목을 다음처럼 바꾼다.

~~~ts
export type NavItem = {
  label: string;
  href: string;
  newTab?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "대표 메뉴", href: "/menu", newTab: true },
  { label: "왕징 이야기", href: "#story" },
  { label: "단체 모임", href: "#group" },
  { label: "고객 리뷰", href: "#reviews" },
  { label: "지점 안내", href: "#location" },
];
~~~

- [ ] **Step 4: 데스크톱·모바일 헤더 링크가 같은 데이터로 새 탭을 열게 수정**

components/home/site-header.tsx의 두 NAV_ITEMS.map 내부 앵커를 각각 다음 속성을 포함하도록 바꾼다.

~~~tsx
<a
  href={item.href}
  key={item.href}
  target={item.newTab ? "_blank" : undefined}
  rel={item.newTab ? "noreferrer" : undefined}
>
  {item.label}
</a>
~~~

~~~tsx
<a
  href={item.href}
  key={item.href}
  target={item.newTab ? "_blank" : undefined}
  rel={item.newTab ? "noreferrer" : undefined}
  onClick={() => setOpen(false)}
>
  {item.label}
</a>
~~~

- [ ] **Step 5: 대표 메뉴 섹션에 명시적인 전체 메뉴 버튼 추가**

components/home/signature-menu-section.tsx의 section__heading을 다음 구조로 바꾼다.

~~~tsx
<div className="section__heading section__heading--actions">
  <div>
    <p className="eyebrow eyebrow--red">SIGNATURE MENU</p>
    <h2 id="menu-title">왕징에서 먼저 맛봐야 할 요리</h2>
    <p>불향 가득한 양고기와 정통 중국 요리를 함께 즐겨보세요.</p>
  </div>
  <a
    className="button button--outline-dark signature-menu__all"
    href="/menu"
    target="_blank"
    rel="noreferrer"
  >
    전체 메뉴 보기
  </a>
</div>
~~~

app/globals.css에 다음 스타일을 추가한다.

~~~css
.section__heading--actions {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
}

.signature-menu__all {
  flex: 0 0 auto;
  font-size: 1rem;
}

@media (max-width: 767px) {
  .section__heading--actions {
    align-items: start;
    flex-direction: column;
  }
}
~~~

- [ ] **Step 6: 진입점 테스트와 기존 헤더 테스트 통과 확인**

Run: node --test --test-name-pattern="all three full-menu entry points" tests/full-menu.test.mjs

Run: node --test --test-name-pattern="mobile menu exposes|header offers accessible" tests/page-structure.test.mjs

Expected: PASS.

- [ ] **Step 7: 새 탭 진입점 커밋**

~~~powershell
git add -- tests/full-menu.test.mjs lib/site-content.ts components/home/site-header.tsx components/home/signature-menu-section.tsx app/globals.css
git commit -m "feat: open full menu from homepage"
~~~

---

### Task 4: Pencil 기준 갱신과 전체 검증

**Files:**
- Modify: tests/assets-and-sketch.test.mjs

**Interfaces:**
- Consumes: Pencil 최상위 프레임 이름
- Produces: 기존 홈페이지 시안과 새 전체 메뉴 시안이 함께 존재한다는 회귀 테스트

- [ ] **Step 1: 현재 Pencil 회귀 테스트가 새 프레임 때문에 실패하는지 확인**

Run: node --test --test-name-pattern="Pencil source" tests/assets-and-sketch.test.mjs

Expected: FAIL because the test requires exactly two top-level frames.

- [ ] **Step 2: 기존 프레임을 보존하면서 새 메뉴 프레임을 검증하도록 테스트 수정**

tests/assets-and-sketch.test.mjs의 Pencil source 테스트를 다음 내용으로 교체한다.

~~~js
test("Pencil source contains approved home and full-menu frames", async () => {
  const pencil = JSON.parse(
    await readFile(new URL("../초안", import.meta.url), "utf8"),
  );
  const names = pencil.children.map((child) => child.name);

  for (const name of [
    "판교왕징 홈페이지 데스크톱",
    "판교왕징 홈페이지 모바일",
    "판교점 전체 메뉴 데스크톱",
    "판교점 전체 메뉴 모바일",
  ]) {
    assert.ok(names.includes(name), "Pencil should include " + name);
  }

  const menuFrames = pencil.children.filter((child) =>
    child.name.startsWith("판교점 전체 메뉴"),
  );
  assert.equal(menuFrames.length, 2);
  for (const frame of menuFrames) {
    assert.equal(frame.metadata.route, "/menu");
    assert.equal(frame.metadata.menuCount, 52);
    assert.equal(frame.metadata.openInNewTab, true);
  }
});
~~~

- [ ] **Step 3: 전체 자동 검증 실행**

Run: npm test

Expected: all Node tests PASS.

Run: npm run lint

Expected: ESLint exits with code 0.

Run: npm run build

Expected: production build succeeds and /menu is listed.

- [ ] **Step 4: 로컬 브라우저 검증**

Run: npm.cmd run dev

Expected: http://localhost:3000 and http://localhost:3000/menu respond successfully.

브라우저에서 다음을 확인한다.

1. 데스크톱 상단 대표 메뉴가 /menu를 새 탭으로 연다.
2. 모바일 메뉴의 대표 메뉴가 /menu를 새 탭으로 연다.
3. 홈페이지 대표 메뉴 섹션의 전체 메뉴 보기가 /menu를 새 탭으로 연다.
4. /menu에 5개 분류와 52개 가격이 표시된다.
5. 390px 너비에서 가로 넘침이 없고 모든 본문이 16px 이상이다.
6. 판교점 예약과 네이버 플레이스가 정확한 외부 주소로 열린다.

- [ ] **Step 5: 검증 테스트 커밋**

~~~powershell
git add -- tests/assets-and-sketch.test.mjs
git commit -m "test: cover full menu Pencil frames"
~~~

- [ ] **Step 6: 프로덕션 배포와 공개 주소 검증**

Run: $env:NODE_OPTIONS='--use-system-ca'; vercel --prod --yes

Expected: deployment completes and prints an HTTPS production URL.

공식 도메인 https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu 를 열어 200 응답, 새 메뉴 화면, 52개 메뉴, 두 외부 CTA를 다시 확인한다.

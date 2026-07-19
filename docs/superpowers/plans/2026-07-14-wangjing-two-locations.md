# 왕징 두 지점 안내 섹션 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 판교점 단일 위치 섹션을 모란점·판교점 바로가기와 상세 카드 두 장으로 교체하고, 기존 왕징 색상 체계와 반응형 동작을 유지한다.

**Architecture:** `lib/site-content.ts`가 두 지점의 단일 데이터 원천이 되고, 새 `LocationCard` 서버 컴포넌트가 지점 한 곳을 렌더링한다. `LocationSection`은 섹션 제목, 내부 앵커 내비게이션, 카드 목록만 조합한다. Pencil 파일을 먼저 갱신한 뒤 정적 계약 테스트, 데이터 테스트, 컴포넌트 테스트 순서로 구현한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `next/image`, 전역 CSS, Node.js 내장 test runner, ESLint, Vercel Git 자동 배포

## Global Constraints

- 작업 브랜치는 사용자가 지정한 `main`이다. 별도 브랜치나 새 Vercel 프로젝트를 만들지 않는다.
- `C:\vibecoding\my-shop\AGENTS.md`에 따라 사용자 화면 변경 전에 `초안` Pencil 파일을 먼저 갱신하고 검토한다.
- 코드 작성 전 `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`와 `05-server-and-client-components.md`를 읽는다.
- 사용자 제공 모란점 사진 원본은 그대로 복사하며 AI 편집이나 재생성은 하지 않는다.
- 기존 미추적 파일 `.superpowers/`, `GEO SEO SEO.pdf`, `components.json`, `dev-server.log`는 수정하거나 커밋하지 않는다.
- 모든 파일 편집은 `apply_patch`로 수행한다. 바이너리 이미지 복사만 `Copy-Item`을 사용한다.
- 각 기능 단계는 RED → GREEN → 관련 테스트 재실행 → 커밋 순서로 진행한다.
- Vercel CLI에서는 `deploy`, `link`, `project add`를 실행하지 않는다. GitHub 푸시로 기존 `my-shop-39ab` 자동 배포만 유도한다.

## File Map

- Modify: `C:\vibecoding\my-shop\초안`
  - 데스크톱·모바일 지점 프레임 이름, 높이, 이후 프레임 위치를 두 카드 레이아웃에 맞춘다.
- Add: `C:\vibecoding\my-shop\public\images\wangjing\moran-storefront.png`
  - 사용자 제공 1536×1024 모란점 대표 사진.
- Modify: `C:\vibecoding\my-shop\tests\assets-and-sketch.test.mjs`
  - 새 이미지 존재와 Pencil 두 지점 프레임 계약을 검사한다.
- Modify: `C:\vibecoding\my-shop\lib\site-content.ts`
  - `Location` 타입과 `LOCATIONS` 배열을 추가한다.
- Modify: `C:\vibecoding\my-shop\tests\site-content.test.mjs`
  - 두 지점 데이터의 표시명, 주소, 교통, 전화, 플레이스 ID를 검사한다.
- Add: `C:\vibecoding\my-shop\components\home\location-card.tsx`
  - 대표 이미지와 지점 상세 정보를 렌더링한다.
- Modify: `C:\vibecoding\my-shop\components\home\location-section.tsx`
  - 상단 제목·지점 바로가기·카드 목록을 렌더링한다.
- Modify: `C:\vibecoding\my-shop\app\globals.css`
  - 기존 단일 지점 분할 레이아웃을 새 카드 그리드 스타일로 교체한다.
- Modify: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`
  - 새 컴포넌트 구성, 링크 안전 속성, 반응형 CSS 계약을 검사한다.

---

### Task 1: Pencil 원본과 모란점 이미지 계약 고정

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\assets-and-sketch.test.mjs`
- Modify: `C:\vibecoding\my-shop\초안`
- Add: `C:\vibecoding\my-shop\public\images\wangjing\moran-storefront.png`

- [ ] **Step 1: Next.js 관련 로컬 문서를 읽는다**

Run:

```powershell
Get-Content -LiteralPath node_modules/next/dist/docs/01-app/01-getting-started/12-images.md -Raw
Get-Content -LiteralPath node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md -Raw
```

Expected: `Image`의 `fill` 사용 시 부모 컨테이너의 위치 지정과 `sizes` 제공이 필요하며, 상태나 브라우저 API가 없는 컴포넌트는 기본 서버 컴포넌트로 둘 수 있음을 확인한다.

- [ ] **Step 2: 새 이미지와 Pencil 구조를 요구하는 실패 테스트를 작성한다**

`assetNames` 끝에 다음 항목을 추가한다.

```js
  "moran-storefront.png",
```

Pencil 테스트의 공통 지점 프레임 이름 `"지점 안내"`를 아래로 바꾸고, 테스트 끝에 프레임 치수 계약을 추가한다.

```js
        "두 지점 안내 · 모란점·판교점 카드",
```

```js
  const [desktop, mobile] = pencil.children;
  const desktopLocation = desktop.children.find(
    (child) => child.id === "desktop-location",
  );
  const desktopReserve = desktop.children.find(
    (child) => child.id === "desktop-reserve",
  );
  const desktopFooter = desktop.children.find(
    (child) => child.id === "desktop-footer",
  );
  assert.deepEqual(
    {
      locationHeight: desktopLocation.height,
      reserveY: desktopReserve.y,
      footerY: desktopFooter.y,
    },
    { locationHeight: 1040, reserveY: 5026, footerY: 5586 },
  );

  const mobileLocation = mobile.children.find(
    (child) => child.id === "mobile-location",
  );
  const mobileReserve = mobile.children.find(
    (child) => child.id === "mobile-reserve",
  );
  const mobileFooter = mobile.children.find(
    (child) => child.id === "mobile-footer",
  );
  assert.deepEqual(
    {
      frameHeight: mobile.height,
      locationHeight: mobileLocation.height,
      reserveY: mobileReserve.y,
      footerY: mobileFooter.y,
    },
    {
      frameHeight: 7570,
      locationHeight: 1560,
      reserveY: 6790,
      footerY: 7210,
    },
  );
```

- [ ] **Step 3: 자산·Pencil 테스트가 예상대로 실패하는지 확인한다**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: `moran-storefront.png`의 `ENOENT` 또는 기존 Pencil 지점 이름/치수 불일치로 FAIL.

- [ ] **Step 4: 사용자 이미지를 프로젝트 자산으로 복사한다**

Run:

```powershell
Copy-Item -LiteralPath 'C:\Users\USER\Downloads\ChatGPT Image 2026년 7월 14일 오후 07_42_24.png' -Destination 'C:\vibecoding\my-shop\public\images\wangjing\moran-storefront.png'
```

Expected: 대상 파일이 생성되고 크기가 500바이트보다 크다.

- [ ] **Step 5: Pencil 파일을 두 지점 카드 구조로 먼저 갱신한다**

`초안`에 다음 값을 적용한다.

```text
desktop-location.name   = 두 지점 안내 · 모란점·판교점 카드
desktop-location.height = 1040
desktop-reserve.y       = 5026
desktop-footer.y        = 5586

mobile root height      = 7570
mobile-location.name    = 두 지점 안내 · 모란점·판교점 카드
mobile-location.height  = 1560
mobile-reserve.y        = 6790
mobile-footer.y         = 7210
```

`초안`을 다시 읽어 데스크톱 2열, 모바일 1열 카드 영역을 위한 높이와 이후 프레임의 연속성이 반영됐는지 확인한다.

- [ ] **Step 6: 자산·Pencil 테스트를 통과시킨다**

Run:

```powershell
node --test tests/assets-and-sketch.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 7: 변경 범위를 커밋한다**

```powershell
git add -- tests/assets-and-sketch.test.mjs 초안 public/images/wangjing/moran-storefront.png
git commit -m "test: lock two-location assets and sketch"
```

Expected: 새 이미지, Pencil, 해당 테스트만 커밋된다.

---

### Task 2: 두 지점 데이터 모델 추가

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\site-content.test.mjs`
- Modify: `C:\vibecoding\my-shop\lib\site-content.ts`

- [ ] **Step 1: 두 지점 데이터 실패 테스트를 작성한다**

`tests/site-content.test.mjs`에 다음 테스트를 추가한다.

```js
test("site content defines both Wangjing locations", () => {
  assert.match(source, /export const LOCATIONS/);

  for (const value of [
    "왕징양다리양꼬치 모란점",
    "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    "모란역 4번 출구에서 215m",
    "0507-1377-5688",
    "tel:050713775688",
    "https://map.naver.com/v5/entry/place/1938356292",
    "왕징양다리양꼬치 판교점",
    "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    "판교역 4번 출구에서 266m",
    "0507-1313-5688",
    "tel:050713135688",
    "https://map.naver.com/v5/entry/place/1873196958",
  ]) {
    assert.ok(source.includes(value), `missing location content: ${value}`);
  }
});
```

- [ ] **Step 2: 데이터 테스트가 예상대로 실패하는지 확인한다**

Run:

```powershell
node --test tests/site-content.test.mjs
```

Expected: `export const LOCATIONS` 누락으로 새 테스트 FAIL.

- [ ] **Step 3: `Location` 타입과 두 지점 배열을 구현한다**

`Review` 타입 다음에 타입을 추가한다.

```ts
export type Location = {
  id: "moran" | "pangyo";
  shortName: string;
  name: string;
  areaLabel: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  address: string;
  transit: string;
  phoneDisplay: string;
  phoneHref: `tel:${string}`;
  mapUrl: `https://map.naver.com/${string}`;
};
```

`SITE` 상수 다음에 배열을 추가한다.

```ts
export const LOCATIONS: Location[] = [
  {
    id: "moran",
    shortName: "모란점",
    name: "왕징양다리양꼬치 모란점",
    areaLabel: "MORAN",
    image: "/images/wangjing/moran-storefront.png",
    imageAlt: "왕징양다리양꼬치 모란점 외관과 붉은 등불",
    imagePosition: "center 52%",
    address: "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    transit: "모란역 4번 출구에서 215m",
    phoneDisplay: "0507-1377-5688",
    phoneHref: "tel:050713775688",
    mapUrl: "https://map.naver.com/v5/entry/place/1938356292",
  },
  {
    id: "pangyo",
    shortName: "판교점",
    name: "왕징양다리양꼬치 판교점",
    areaLabel: "PANGYO",
    image: "/images/wangjing/storefront.jpg",
    imageAlt: "왕징양다리양꼬치 판교점 외관과 간판",
    imagePosition: "center",
    address: "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    transit: "판교역 4번 출구에서 266m",
    phoneDisplay: "0507-1313-5688",
    phoneHref: "tel:050713135688",
    mapUrl: "https://map.naver.com/v5/entry/place/1873196958",
  },
];
```

기존 `SITE`는 예약 배너, 푸터 등 판교점 기반 기존 동선이 사용하므로 삭제하지 않는다.

- [ ] **Step 4: 데이터 테스트와 타입 검사 역할의 빌드를 통과시킨다**

Run:

```powershell
node --test tests/site-content.test.mjs
npm.cmd run build
```

Expected: 콘텐츠 tests PASS, Next.js build PASS.

- [ ] **Step 5: 데이터 변경을 커밋한다**

```powershell
git add -- lib/site-content.ts tests/site-content.test.mjs
git commit -m "feat: add Wangjing branch data"
```

Expected: 데이터와 데이터 테스트만 커밋된다.

---

### Task 3: 카드 컴포넌트와 반응형 섹션 구현

**Files:**

- Modify: `C:\vibecoding\my-shop\tests\page-structure.test.mjs`
- Add: `C:\vibecoding\my-shop\components\home\location-card.tsx`
- Modify: `C:\vibecoding\my-shop\components\home\location-section.tsx`
- Modify: `C:\vibecoding\my-shop\app\globals.css`

- [ ] **Step 1: 새 구조와 스타일을 요구하는 실패 테스트를 작성한다**

외부 링크 테스트의 읽기 목록에 `location-card.tsx`를 추가하고, 아래 테스트를 추가한다.

```js
test("location section renders two data-driven branch cards", async () => {
  const [section, card, css] = await Promise.all([
    read("components/home/location-section.tsx"),
    read("components/home/location-card.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(section, /import \{ LOCATIONS \}/);
  assert.match(section, /import \{ LocationCard \}/);
  assert.match(section, /LOCATIONS/);
  assert.match(section, /LOCATIONS\.map/);
  assert.match(section, /두 곳에서 만나요/);
  assert.match(section, /#location-/);
  assert.match(card, /from "next\/image"/);
  assert.match(card, /id=\{`location-\$\{location\.id\}`\}/);
  assert.match(card, /location\.phoneHref/);
  assert.match(card, /location\.mapUrl/);
  assert.match(card, /target="_blank"/);
  assert.match(card, /rel="noreferrer"/);
  assert.match(card, /네이버 플레이스/);
  assert.match(css, /\.location-grid\s*\{[\s\S]*?grid-template-columns: repeat\(2/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.location-grid\s*\{[\s\S]*?grid-template-columns: 1fr/,
  );
  assert.match(css, /\.location-jump\s*\{[\s\S]*?min-height: 48px/);
});
```

- [ ] **Step 2: 구조 테스트가 예상대로 실패하는지 확인한다**

Run:

```powershell
node --test tests/page-structure.test.mjs
```

Expected: `location-card.tsx`가 없어 새 테스트 FAIL.

- [ ] **Step 3: 지점 카드 서버 컴포넌트를 만든다**

`components/home/location-card.tsx`를 다음 내용으로 생성한다.

```tsx
import Image from "next/image";
import type { Location } from "@/lib/site-content";

type LocationCardProps = {
  location: Location;
};

export function LocationCard({ location }: LocationCardProps) {
  return (
    <article className="location-card" id={`location-${location.id}`}>
      <div className="location-card__image">
        <Image
          src={location.image}
          alt={location.imageAlt}
          fill
          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1310px) 50vw, 600px"
          style={{ objectPosition: location.imagePosition }}
        />
      </div>
      <div className="location-card__body">
        <p className="location-card__area">{location.areaLabel}</p>
        <h3>{location.name}</h3>
        <dl className="location-card__details">
          <div>
            <dt>주소</dt>
            <dd>{location.address}</dd>
          </div>
          <div>
            <dt>교통</dt>
            <dd>{location.transit}</dd>
          </div>
          <div>
            <dt>전화</dt>
            <dd>
              <a href={location.phoneHref}>{location.phoneDisplay}</a>
            </dd>
          </div>
        </dl>
        <div className="location-card__actions">
          <a
            className="button button--primary"
            href={location.mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 플레이스
          </a>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: 위치 섹션을 제목·바로가기·카드 목록으로 교체한다**

`components/home/location-section.tsx` 전체를 다음으로 교체한다.

```tsx
import { LocationCard } from "@/components/home/location-card";
import { LOCATIONS } from "@/lib/site-content";

export function LocationSection() {
  return (
    <section
      className="section section--light locations"
      id="location"
      aria-labelledby="location-title"
    >
      <div className="locations__inner">
        <header className="locations__header">
          <p className="eyebrow eyebrow--red">LOCATIONS</p>
          <h2 id="location-title">두 곳에서 만나요</h2>
          <nav className="location-jumps" aria-label="지점 바로가기">
            {LOCATIONS.map((location) => (
              <a
                className="location-jump"
                href={`#location-${location.id}`}
                key={location.id}
              >
                <span aria-hidden="true" />
                {location.shortName}
              </a>
            ))}
          </nav>
        </header>
        <ul className="location-grid">
          {LOCATIONS.map((location) => (
            <li key={location.id}>
              <LocationCard location={location} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 기존 단일 위치 CSS를 새 카드 스타일로 교체한다**

공통 분할 레이아웃 선택자에서 `.location`, `.location__copy`를 제거한다.

```css
.story,
.group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  padding: 0;
}

.story__copy,
.group__copy {
  padding: clamp(4rem, 7vw, 7rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

기존 `.location__copy`, `.location-list` 블록 전체를 삭제하고 다음으로 교체한다.

```css
.locations__inner {
  width: min(1248px, 100%);
  margin: 0 auto;
}

.locations__header {
  margin-bottom: 2.5rem;
}

.location-jumps {
  margin-top: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.location-jump {
  min-height: 48px;
  padding: 0.65rem 1.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  color: var(--text);
  font-weight: 700;
  transition:
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.location-jump:hover {
  border-color: var(--red);
  color: var(--red);
  transform: translateY(-2px);
}

.location-jump span {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--red);
}

.location-grid {
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
  list-style: none;
}

.location-grid > li {
  min-width: 0;
  display: flex;
}

.location-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  scroll-margin-top: 110px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--paper);
  box-shadow: 0 20px 50px rgba(37, 25, 20, 0.08);
}

.location-card__image {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--ink-soft);
}

.location-card__body {
  padding: clamp(1.5rem, 3vw, 2.25rem);
  display: flex;
  flex: 1;
  flex-direction: column;
}

.location-card__area {
  margin: 0;
  color: var(--red);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.2em;
}

.location-card h3 {
  margin: 0.6rem 0 0;
  font-family: var(--font-serif);
  font-size: clamp(1.45rem, 2.4vw, 2rem);
  line-height: 1.35;
  letter-spacing: -0.035em;
}

.location-card__details {
  margin: 1.25rem 0 0;
}

.location-card__details > div {
  padding: 0.9rem 0;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.location-card__details dt {
  color: var(--red);
  font-weight: 800;
}

.location-card__details dd {
  margin: 0;
  color: var(--muted);
}

.location-card__details a {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.location-card__actions {
  margin-top: auto;
  padding-top: 1.75rem;
}
```

`@media (max-width: 767px)`의 기존 `.location` 관련 선택자를 제거한다. `.story`, `.group`은 기존 동작을 유지하고 아래 새 모바일 규칙을 추가한다.

```css
  .location-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .locations__header {
    margin-bottom: 2rem;
  }

  .location-jump {
    flex: 1 1 140px;
    justify-content: center;
  }

  .location-card__image {
    aspect-ratio: 4 / 3;
  }

  .location-card__body {
    padding: 1.5rem;
  }

  .location-card__details > div {
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 0.5rem;
  }

  .location-card__actions .button {
    width: 100%;
    min-height: 54px;
  }
```

- [ ] **Step 6: 구조 테스트, 전체 테스트, 린트, 빌드를 통과시킨다**

Run:

```powershell
node --test tests/page-structure.test.mjs
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: 모든 명령 exit code 0. 정적 테스트가 두 지점 데이터 렌더링, 앵커, 외부 링크 속성, 2열/1열 계약을 확인한다.

- [ ] **Step 7: 컴포넌트와 스타일을 커밋한다**

```powershell
git add -- components/home/location-card.tsx components/home/location-section.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: add two-location branch cards"
```

Expected: 지점 카드 UI 관련 네 파일만 커밋된다.

---

### Task 4: 시각 QA, 회귀 검증, GitHub 푸시, 기존 Vercel 자동 배포 확인

**Files:**

- Verify only: `C:\vibecoding\my-shop`

- [ ] **Step 1: 작업 트리와 최종 diff를 검토한다**

Run:

```powershell
git status --short --branch
git diff --check HEAD~3..HEAD
git log -4 --oneline
```

Expected: 관련 3개 구현 커밋과 앞선 설계 문서 커밋이 보인다. 기존 미추적 파일 외 변경이 없고 whitespace 오류가 없다.

- [ ] **Step 2: 최종 자동 검증을 새로 실행한다**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: 모든 tests PASS, ESLint exit code 0, production build exit code 0.

- [ ] **Step 3: 로컬 사이트를 데스크톱·모바일에서 시각 검증한다**

로컬 서버를 숨김 창으로 시작한다.

```powershell
$server = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WorkingDirectory "C:\vibecoding\my-shop" -WindowStyle Hidden -PassThru
```

인앱 브라우저로 `http://localhost:3000/#location`을 열고 다음 뷰포트를 각각 확인한다.

```text
Desktop: 1440 × 900
Mobile:  390 × 844
```

확인 항목:

- 기존 크림 배경·먹색 본문·적색 포인트가 유지된다.
- 데스크톱에서 모란점과 판교점 카드가 같은 폭의 2열이다.
- 모바일에서 카드가 모란점, 판교점 순으로 1열 배치된다.
- 모란점 사진의 간판과 출입구, 판교점 사진의 외관이 과도하게 잘리지 않는다.
- `모란점`, `판교점` 캡슐 링크가 각 카드로 이동한다.
- 전화 링크와 네이버 플레이스 버튼이 보이고 48px 이상의 터치 영역을 가진다.
- 가로 스크롤, 텍스트 겹침, 잘린 카드가 없다.

검증 후 서버를 종료한다.

```powershell
Stop-Process -Id $server.Id
```

- [ ] **Step 4: 필요하면 시각 문제만 최소 수정하고 검증을 반복한다**

시각 수정이 생기면 관련 테스트를 먼저 보강하거나 현재 계약을 유지하는지 확인하고 다음을 다시 실행한다.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
git add -- components/home/location-card.tsx components/home/location-section.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "fix: refine two-location layout"
```

Expected: 사용자 제공 요구와 승인된 디자인 명세를 모두 만족한다.

- [ ] **Step 5: `main`을 GitHub에 푸시한다**

Run:

```powershell
git push origin main
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Expected: push 성공, 로컬 `HEAD`와 `origin/main` SHA가 동일하며 ahead/behind가 0이다.

- [ ] **Step 6: 기존 Vercel 프로젝트 자동 배포가 READY가 될 때까지 확인한다**

`deploy`, `link`, `project add`는 실행하지 않는다. 기존 프로젝트만 조회한다.

```powershell
$env:NODE_OPTIONS = "--use-system-ca"
vercel.cmd inspect https://my-shop-39ab.vercel.app
```

배포가 아직 Building이면 30초 간격으로 같은 `inspect`를 재실행하되, 사용자에게 60초 이내 진행 상황을 알린다.

Expected:

```text
Project: my-shop-39ab
Status: Ready
```

또한 표시된 Git commit SHA가 푸시한 `main` SHA와 같은지 확인한다.

- [ ] **Step 7: 세 주소의 실제 배포 화면을 확인한다**

인앱 브라우저로 아래 주소의 `#location`을 각각 열어 `두 곳에서 만나요`, 모란점, 판교점 카드가 보이는지 확인한다.

```text
https://my-shop-39ab.vercel.app/#location
https://왕징양다리양꼬치.com/#location
https://www.왕징양다리양꼬치.com/#location
```

Expected: 세 주소가 동일한 최신 두 지점 섹션을 제공하고 인증서·리디렉션·404 오류가 없다.

- [ ] **Step 8: 완료 보고를 작성한다**

보고에는 다음만 간결하게 포함한다.

- 두 지점 섹션 변경 요약
- 추가된 모란점 대표 사진
- `npm.cmd test`, lint, build 결과
- 푸시된 최종 commit SHA
- 기존 Vercel 프로젝트 배포 ID/상태와 세 도메인 확인 결과
- 새 Vercel 프로젝트를 만들지 않았다는 사실

---

## Plan Self-Review Checklist

- [ ] 승인된 설계의 콘텐츠·데이터·색상·반응형·접근성·링크 요구가 각 Task에 매핑됐다.
- [ ] Pencil 변경이 애플리케이션 코드보다 먼저 수행된다.
- [ ] 각 구현 Task가 실패 테스트에서 시작하고 최소 구현 후 통과 확인으로 끝난다.
- [ ] 새 파일 경로, 이미지 원본 경로, 네이버 플레이스 ID, 전화번호가 정확하다.
- [ ] 기존 예약 동선과 `SITE` 데이터는 보존된다.
- [ ] 사용자 소유 미추적 파일은 커밋 대상에 포함되지 않는다.
- [ ] 배포는 GitHub 자동 배포만 사용하며 새 Vercel 프로젝트를 만들지 않는다.

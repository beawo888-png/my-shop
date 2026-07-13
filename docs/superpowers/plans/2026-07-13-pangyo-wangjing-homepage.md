# 판교왕징 반응형 홈페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 기본 화면을 실제 사진과 운영 정보가 담긴 네이버 예약 중심의 판교왕징 반응형 원페이지로 교체한다.

**Architecture:** 정적 운영 정보는 타입이 있는 `lib/site-content.ts`에 모으고, 페이지는 기본적으로 Server Component인 섹션 컴포넌트들로 조립한다. 모바일 메뉴만 작은 Client Component로 격리하며, 모든 이미지는 `public/images/wangjing/`에서 `next/image`로 제공한다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4 기반 전역 CSS, `next/image`, 시스템 한글 글꼴 스택, Node 기본 테스트 러너, Vercel

## Global Constraints

- 최우선 전환 행동은 `https://booking.naver.com/booking/6/bizes/970819`로 이동하는 네이버 예약이다.
- 전화번호는 화면에 `0507-1313-5688`, 링크에 `tel:050713135688`을 사용한다.
- 주소는 `경기 성남시 분당구 대왕판교로606번길 10, 205호·206호`를 사용한다.
- 한국어 단일 페이지이며 작동하지 않는 `KO | EN` UI를 노출하지 않는다.
- 외부 Unsplash 이미지를 사용하지 않고 사용자가 제공한 13개 이미지만 프로젝트 내부에서 제공한다.
- 데스크톱·태블릿·모바일을 지원하고 모든 클릭 영역을 최소 48×48px로 만든다.
- 모바일 화면 하단에 네이버 예약 고정 바를 제공하고 본문을 가리지 않게 한다.
- Pencil 원본 `초안`을 애플리케이션 코드보다 먼저 갱신한다.
- 로컬 폴더는 현재 Git 저장소가 아니다. 로컬 커밋은 만들되 정확한 GitHub 원격 주소를 확인하기 전에는 푸시하지 않는다.
- Next.js 16 관련 구현은 `node_modules/next/dist/docs/01-app/01-getting-started/`의 Server/Client Components, Images, Fonts, Metadata 가이드를 따른다.

---

## File Map

- Modify: `초안` — 승인된 데스크톱·모바일 섹션 구조를 담는 Pencil 원본
- Modify: `package.json` — Node 기본 테스트 명령 추가
- Modify: `app/layout.tsx` — 한국어 문서, 글꼴, 판교왕징 메타데이터
- Modify: `app/page.tsx` — 원페이지 섹션 조립
- Modify: `app/globals.css` — 색상 토큰, 레이아웃, 반응형, 접근성 스타일
- Create: `lib/site-content.ts` — 운영 정보, 링크, 메뉴, 리뷰, 편의 정보
- Create: `components/home/site-header.tsx` — 데스크톱·모바일 내비게이션
- Create: `components/home/hero-section.tsx` — 대표 영역과 신뢰 정보
- Create: `components/home/signature-menu-section.tsx` — 대표 메뉴 3종
- Create: `components/home/story-section.tsx` — 왕징 이야기
- Create: `components/home/group-dining-section.tsx` — 단체 모임과 전화 문의
- Create: `components/home/reviews-section.tsx` — 리뷰 카드 3개
- Create: `components/home/location-section.tsx` — 주소, 외관, 예약·지도·전화 링크
- Create: `components/home/reservation-banner.tsx` — 마지막 예약 CTA
- Create: `components/home/mobile-booking-bar.tsx` — 모바일 고정 예약 CTA
- Create: `components/home/site-footer.tsx` — 매장 정보와 저작권
- Create: `public/images/wangjing/*` — 의미 있는 이름으로 복사한 13개 이미지
- Create: `tests/assets-and-sketch.test.mjs` — 이미지와 Pencil 구조 검증
- Create: `tests/site-content.test.mjs` — 운영 정보와 링크 검증
- Create: `tests/page-structure.test.mjs` — 섹션, 접근성, 메타데이터, CSS 계약 검증

---

### Task 1: 로컬 이력, Pencil 원본, 이미지 자산

**Files:**
- Modify: `초안`
- Modify: `package.json`
- Create: `tests/assets-and-sketch.test.mjs`
- Create: `public/images/wangjing/hero-skewers.png`
- Create: `public/images/wangjing/roast-lamb.png`
- Create: `public/images/wangjing/spicy-skewers.png`
- Create: `public/images/wangjing/jingjiang-wraps.png`
- Create: `public/images/wangjing/mala-platter.png`
- Create: `public/images/wangjing/guobaorou.png`
- Create: `public/images/wangjing/mapo-tofu.png`
- Create: `public/images/wangjing/lamb-chops.png`
- Create: `public/images/wangjing/dining-room.jpg`
- Create: `public/images/wangjing/group-table.jpg`
- Create: `public/images/wangjing/lantern-interior.jpg`
- Create: `public/images/wangjing/storefront.jpg`
- Create: `public/images/wangjing/feast.jpg`

**Interfaces:**
- Consumes: 사용자가 제공한 13개 원본 이미지와 `초안-exports/home-desktop.html`
- Produces: 후속 섹션에서 사용하는 `/images/wangjing/*` 정적 경로와 데스크톱·모바일 Pencil 프레임

- [ ] **Step 1: 변경 전 로컬 Git 기준점 만들기**

Run:

```powershell
git init -b main
git add .gitignore AGENTS.md CLAUDE.md DESIGN.md README.md app components lib public package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs docs "초안" "초안-exports"
git commit -m "chore: establish local website baseline"
```

Expected: `main` 브랜치에 baseline 커밋 1개가 생기고 `node_modules`, `.next`, `.vercel`은 커밋되지 않는다. Git 사용자 이름이나 이메일이 없으면 이 단계에서만 사용자에게 값을 요청하고 임의 값을 만들지 않는다.

- [ ] **Step 2: 자산과 Pencil 구조에 대한 실패 테스트 작성**

Create `tests/assets-and-sketch.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const assetNames = [
  "hero-skewers.png",
  "roast-lamb.png",
  "spicy-skewers.png",
  "jingjiang-wraps.png",
  "mala-platter.png",
  "guobaorou.png",
  "mapo-tofu.png",
  "lamb-chops.png",
  "dining-room.jpg",
  "group-table.jpg",
  "lantern-interior.jpg",
  "storefront.jpg",
  "feast.jpg",
];

test("all approved Wangjing images exist", async () => {
  for (const name of assetNames) {
    const image = await readFile(new URL(`../public/images/wangjing/${name}`, import.meta.url));
    assert.ok(image.byteLength > 500, `${name} should not be empty`);
  }
});

test("Pencil source contains approved desktop and mobile frames", async () => {
  const pencil = JSON.parse(await readFile(new URL("../초안", import.meta.url), "utf8"));
  const names = pencil.children.map((child) => child.name);
  assert.deepEqual(names, ["판교왕징 홈페이지 데스크톱", "판교왕징 홈페이지 모바일"]);
  for (const frame of pencil.children) {
    assert.equal(frame.children.length, 10);
    assert.deepEqual(
      frame.children.map((child) => child.name),
      ["상단 내비게이션", "대표 영역", "신뢰 정보", "대표 메뉴", "왕징 이야기", "단체 모임", "고객 리뷰", "지점 안내", "예약 안내", "푸터"],
    );
  }
});
```

Add this script to `package.json`:

```json
"test": "node --test tests/*.test.mjs"
```

- [ ] **Step 3: 실패 확인**

Run: `npm test`

Expected: FAIL because `public/images/wangjing/` does not exist and `초안` contains only the old blank frame.

- [ ] **Step 4: 이미지 13개를 의미 있는 이름으로 복사**

Run:

```powershell
New-Item -ItemType Directory -Force 'public\images\wangjing'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081457194_05.png' -Destination 'public\images\wangjing\hero-skewers.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081457194_06.png' -Destination 'public\images\wangjing\roast-lamb.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081437954_09.png' -Destination 'public\images\wangjing\spicy-skewers.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081457194.png' -Destination 'public\images\wangjing\jingjiang-wraps.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081457194_03.png' -Destination 'public\images\wangjing\mala-platter.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081531177_05.png' -Destination 'public\images\wangjing\guobaorou.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081531177_06.png' -Destination 'public\images\wangjing\mapo-tofu.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\지피티제작 이미지\KakaoTalk_20260713_081531177_11.png' -Destination 'public\images\wangjing\lamb-chops.png'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\블로그사용이미지\4.jpg' -Destination 'public\images\wangjing\dining-room.jpg'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\블로그사용이미지\5.jpg' -Destination 'public\images\wangjing\group-table.jpg'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\블로그사용이미지\6.jpg' -Destination 'public\images\wangjing\lantern-interior.jpg'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\블로그사용이미지\2.jpg' -Destination 'public\images\wangjing\storefront.jpg'
Copy-Item -LiteralPath 'D:\웹&모바일 업로드용\블로그사용이미지\블로그사용이미지\19.jpg' -Destination 'public\images\wangjing\feast.jpg'
```

- [ ] **Step 5: Pencil 원본을 승인된 두 프레임으로 갱신**

Replace `초안` with valid Pencil 2.14 JSON. Use `layout: "none"`; create a 1440px desktop frame and a 390px mobile frame. Both frames must contain exactly the ten named child frames below, with the approved colors and vertical order:

```json
{
  "version": "2.14",
  "children": [
    {
      "type": "frame",
      "id": "wangjing-desktop",
      "x": 0,
      "y": 0,
      "name": "판교왕징 홈페이지 데스크톱",
      "clip": true,
      "width": 1440,
      "height": 6820,
      "fill": "#F6F0E5",
      "layout": "none",
      "children": [
        { "type": "frame", "id": "desktop-header", "x": 0, "y": 0, "name": "상단 내비게이션", "width": 1440, "height": 92, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "desktop-hero", "x": 0, "y": 92, "name": "대표 영역", "width": 1440, "height": 774, "fill": "#241A17", "layout": "none" },
        { "type": "frame", "id": "desktop-trust", "x": 96, "y": 740, "name": "신뢰 정보", "width": 1248, "height": 126, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "desktop-menu", "x": 0, "y": 866, "name": "대표 메뉴", "width": 1440, "height": 900, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "desktop-story", "x": 0, "y": 1766, "name": "왕징 이야기", "width": 1440, "height": 760, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "desktop-group", "x": 0, "y": 2526, "name": "단체 모임", "width": 1440, "height": 760, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "desktop-reviews", "x": 0, "y": 3286, "name": "고객 리뷰", "width": 1440, "height": 700, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "desktop-location", "x": 0, "y": 3986, "name": "지점 안내", "width": 1440, "height": 780, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "desktop-reserve", "x": 0, "y": 4766, "name": "예약 안내", "width": 1440, "height": 560, "fill": "#241A17", "layout": "none" },
        { "type": "frame", "id": "desktop-footer", "x": 0, "y": 5326, "name": "푸터", "width": 1440, "height": 360, "fill": "#100B0A", "layout": "none" }
      ]
    },
    {
      "type": "frame",
      "id": "wangjing-mobile",
      "x": 1520,
      "y": 0,
      "name": "판교왕징 홈페이지 모바일",
      "clip": true,
      "width": 390,
      "height": 6830,
      "fill": "#F6F0E5",
      "layout": "none",
      "children": [
        { "type": "frame", "id": "mobile-header", "x": 0, "y": 0, "name": "상단 내비게이션", "width": 390, "height": 72, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "mobile-hero", "x": 0, "y": 72, "name": "대표 영역", "width": 390, "height": 720, "fill": "#241A17", "layout": "none" },
        { "type": "frame", "id": "mobile-trust", "x": 20, "y": 700, "name": "신뢰 정보", "width": 350, "height": 280, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "mobile-menu", "x": 0, "y": 980, "name": "대표 메뉴", "width": 390, "height": 1450, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "mobile-story", "x": 0, "y": 2430, "name": "왕징 이야기", "width": 390, "height": 820, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "mobile-group", "x": 0, "y": 3250, "name": "단체 모임", "width": 390, "height": 900, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "mobile-reviews", "x": 0, "y": 4150, "name": "고객 리뷰", "width": 390, "height": 1080, "fill": "#17110F", "layout": "none" },
        { "type": "frame", "id": "mobile-location", "x": 0, "y": 5230, "name": "지점 안내", "width": 390, "height": 820, "fill": "#F6F0E5", "layout": "none" },
        { "type": "frame", "id": "mobile-reserve", "x": 0, "y": 6050, "name": "예약 안내", "width": 390, "height": 420, "fill": "#241A17", "layout": "none" },
        { "type": "frame", "id": "mobile-footer", "x": 0, "y": 6470, "name": "푸터", "width": 390, "height": 360, "fill": "#100B0A", "layout": "none" }
      ]
    }
  ],
  "fileToken": "4786e8a5-4364-43b4-bd9b-87ed94eaa636"
}
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`

Expected: 2 tests PASS.

- [ ] **Step 7: 커밋**

```powershell
git add package.json package-lock.json tests/assets-and-sketch.test.mjs public/images/wangjing "초안"
git commit -m "chore: add approved Wangjing design assets"
```

---

### Task 2: 운영 정보와 링크를 단일 데이터 모듈로 구축

**Files:**
- Create: `tests/site-content.test.mjs`
- Create: `lib/site-content.ts`

**Interfaces:**
- Produces: `SITE`, `NAV_ITEMS`, `TRUST_ITEMS`, `MENU_ITEMS`, `GROUP_FEATURES`, `REVIEWS`
- Consumed by: 모든 홈 섹션 컴포넌트

- [ ] **Step 1: 실패 테스트 작성**

Create `tests/site-content.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("../lib/site-content.ts", import.meta.url), "utf8").catch(() => "");

test("site content contains verified business details", () => {
  assert.match(source, /https:\/\/booking\.naver\.com\/booking\/6\/bizes\/970819/);
  assert.match(source, /0507-1313-5688/);
  assert.match(source, /tel:050713135688/);
  assert.match(source, /대왕판교로606번길 10/);
});

test("site content defines the three approved signature menus", () => {
  for (const menu of ["양꼬치", "양갈비살꼬치", "꿔바로우"]) assert.match(source, new RegExp(menu));
  for (const price of ["15,000원", "18,000원", "22,000원"]) assert.match(source, new RegExp(price));
});

test("site content does not contain Unsplash or fake language links", () => {
  assert.doesNotMatch(source, /images\.unsplash\.com/);
  assert.doesNotMatch(source, /KO \| EN|English/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="site content"`

Expected: FAIL because `lib/site-content.ts` does not exist.

- [ ] **Step 3: 타입과 실제 콘텐츠 구현**

Create `lib/site-content.ts` with these exact exports and values:

```ts
export type NavItem = { label: string; href: `#${string}` };
export type TrustItem = { value: string; label: string };
export type MenuItem = { name: string; price: string; description: string; image: string; alt: string };
export type Review = { quote: string; category: string; date: string };

export const SITE = {
  name: "판교왕징",
  hanja: "王京",
  phoneDisplay: "0507-1313-5688",
  phoneHref: "tel:050713135688",
  address: "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
  transit: "판교역 4번 출구에서 약 266m",
  bookingUrl: "https://booking.naver.com/booking/6/bizes/970819",
  mapUrl: "https://map.naver.com/p/search/경기 성남시 분당구 대왕판교로606번길 10",
} as const;

export const NAV_ITEMS: NavItem[] = [
  { label: "대표 메뉴", href: "#menu" },
  { label: "왕징 이야기", href: "#story" },
  { label: "단체 모임", href: "#group" },
  { label: "고객 리뷰", href: "#reviews" },
  { label: "지점 안내", href: "#location" },
];

export const TRUST_ITEMS: TrustItem[] = [
  { value: "3,700+", label: "방문자 리뷰" },
  { value: "판교역 4번 출구", label: "도보 약 4분" },
  { value: "주차 · 단체석", label: "예약 가능" },
];

export const MENU_ITEMS: MenuItem[] = [
  { name: "양꼬치", price: "15,000원", description: "숯불에 구워 육즙과 불향을 살린 왕징의 대표 메뉴", image: "/images/wangjing/spicy-skewers.png", alt: "숯불 위에서 굽고 있는 판교왕징 양꼬치" },
  { name: "양갈비살꼬치", price: "18,000원", description: "부드러운 식감과 진한 풍미를 즐기는 프리미엄 꼬치", image: "/images/wangjing/lamb-chops.png", alt: "불판 위에서 익어가는 양갈비" },
  { name: "꿔바로우", price: "22,000원", description: "바삭한 튀김옷과 새콤달콤한 소스의 인기 요리", image: "/images/wangjing/guobaorou.png", alt: "소스를 곁들인 바삭한 꿔바로우" },
];

export const GROUP_FEATURES = ["넓은 단체석과 회식 좌석", "건물 내 주차 가능", "유아 의자 · 남녀 화장실 구분"] as const;

export const REVIEWS: Review[] = [
  { quote: "양꼬치가 부드럽고 잡내 없이 맛있어요. 넓어서 회식 장소로도 좋았습니다.", category: "음식 · 단체 모임", date: "2026. 07" },
  { quote: "판교역에서 가깝고 주차도 편해 가족들과 방문하기 좋았어요.", category: "위치 · 주차", date: "2026. 06" },
  { quote: "메뉴가 다양하고 직원분들이 친절하게 설명해 주셔서 즐겁게 먹었습니다.", category: "서비스 · 메뉴", date: "2026. 06" },
];
```

- [ ] **Step 4: 테스트 통과 확인 및 커밋**

Run: `npm test`

Expected: all tests PASS.

```powershell
git add lib/site-content.ts tests/site-content.test.mjs
git commit -m "feat: define verified Wangjing site content"
```

---

### Task 3: 페이지 구조와 정적 섹션 컴포넌트

**Files:**
- Create: `tests/page-structure.test.mjs`
- Modify: `app/page.tsx`
- Create: `components/home/site-header.tsx`
- Create: `components/home/hero-section.tsx`
- Create: `components/home/signature-menu-section.tsx`
- Create: `components/home/story-section.tsx`
- Create: `components/home/group-dining-section.tsx`
- Create: `components/home/reviews-section.tsx`
- Create: `components/home/location-section.tsx`
- Create: `components/home/reservation-banner.tsx`
- Create: `components/home/mobile-booking-bar.tsx`
- Create: `components/home/site-footer.tsx`

**Interfaces:**
- Consumes: `SITE`, `TRUST_ITEMS`, `MENU_ITEMS`, `GROUP_FEATURES`, `REVIEWS`
- Produces: semantic section IDs `menu`, `story`, `group`, `reviews`, `location`

- [ ] **Step 1: 페이지 계약 실패 테스트 작성**

Create `tests/page-structure.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("home page renders every approved section", async () => {
  const page = await read("app/page.tsx");
  for (const component of ["SiteHeader", "HeroSection", "SignatureMenuSection", "StorySection", "GroupDiningSection", "ReviewsSection", "LocationSection", "ReservationBanner", "MobileBookingBar", "SiteFooter"]) {
    assert.match(page, new RegExp(`<${component}`));
  }
});

test("section components expose the approved anchor IDs", async () => {
  const files = await Promise.all(["signature-menu-section.tsx", "story-section.tsx", "group-dining-section.tsx", "reviews-section.tsx", "location-section.tsx"].map((name) => read(`components/home/${name}`)));
  for (const [index, id] of ["menu", "story", "group", "reviews", "location"].entries()) assert.match(files[index], new RegExp(`id=["']${id}["']`));
});

test("external actions use safe links and accessible labels", async () => {
  const files = await Promise.all(["hero-section.tsx", "location-section.tsx", "reservation-banner.tsx", "mobile-booking-bar.tsx"].map((name) => read(`components/home/${name}`)));
  const source = files.join("\n");
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(source, /네이버 예약/);
  assert.match(source, /전화/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="home page|section components|external actions"`

Expected: FAIL because section files do not exist and `app/page.tsx` is still the Next.js starter.

- [ ] **Step 3: 섹션 컴포넌트 구현**

Use Server Components by default. Every image must use `next/image` with explicit `fill` or imported dimensions, `sizes`, and the alt text from `lib/site-content.ts`. Use this complete component shape for every section; substitute only the section-specific data and copy defined below:

Create the initial non-interactive `components/home/site-header.tsx`; Task 4 will add the isolated mobile state without changing its public export:

```tsx
import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="판교왕징 처음으로"><span>{SITE.hanja}</span>{SITE.name}</a>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
      </nav>
      <a className="button button--primary header-booking" href={SITE.bookingUrl} target="_blank" rel="noreferrer">네이버 예약</a>
    </header>
  );
}
```

```tsx
// components/home/signature-menu-section.tsx
import Image from "next/image";
import { MENU_ITEMS } from "@/lib/site-content";

export function SignatureMenuSection() {
  return (
    <section className="section section--light" id="menu" aria-labelledby="menu-title">
      <div className="section__heading">
        <div>
          <p className="eyebrow eyebrow--red">SIGNATURE MENU</p>
          <h2 id="menu-title">왕징에서 먼저 맛봐야 할 요리</h2>
          <p>불향 가득한 양고기와 정통 중국 요리를 함께 즐겨보세요.</p>
        </div>
      </div>
      <div className="menu-grid">
        {MENU_ITEMS.map((item) => (
          <article className="menu-card" key={item.name}>
            <div className="menu-card__image"><Image src={item.image} alt={item.alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" /></div>
            <div className="menu-card__body">
              <div className="menu-card__title"><h3>{item.name}</h3><strong>{item.price}</strong></div>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

Implement the remaining sections with these fixed contracts:

- `HeroSection`: `<section className="hero" aria-labelledby="hero-title">`; hero image `/images/wangjing/hero-skewers.png`; H1 `불향으로 완성한 양고기, 중요한 자리를 위한 왕징`; booking anchor to `SITE.bookingUrl`; group anchor to `#group`; render all `TRUST_ITEMS`.
- `StorySection`: `id="story"`; image `/images/wangjing/roast-lamb.png`; title `한 점의 양고기에 불과 시간의 품격을`; exact story paragraph from the design spec.
- `GroupDiningSection`: `id="group"`; image `/images/wangjing/group-table.jpg`; render `GROUP_FEATURES`; telephone anchor to `SITE.phoneHref`; booking anchor to `SITE.bookingUrl`.
- `ReviewsSection`: `id="reviews"`; render five star characters, quote, category, and date for every `REVIEWS` item.
- `LocationSection`: `id="location"`; image `/images/wangjing/storefront.jpg`; show `SITE.address`, `SITE.transit`, `SITE.phoneDisplay`; anchors to booking, map, and telephone.
- `ReservationBanner`: background image `/images/wangjing/feast.jpg`; title `오늘의 좋은 자리를 왕징에서`; booking and telephone actions.
- `MobileBookingBar`: `<aside className="mobile-booking" aria-label="빠른 예약">` with one booking anchor.
- `SiteFooter`: brand, verified address, phone, booking, map, and `© 2026 판교왕징. All rights reserved.`; no English switch.

- [ ] **Step 4: 페이지 조립**

Replace `app/page.tsx`:

```tsx
import { GroupDiningSection } from "@/components/home/group-dining-section";
import { HeroSection } from "@/components/home/hero-section";
import { LocationSection } from "@/components/home/location-section";
import { MobileBookingBar } from "@/components/home/mobile-booking-bar";
import { ReservationBanner } from "@/components/home/reservation-banner";
import { ReviewsSection } from "@/components/home/reviews-section";
import { SignatureMenuSection } from "@/components/home/signature-menu-section";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteHeader } from "@/components/home/site-header";
import { StorySection } from "@/components/home/story-section";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <SignatureMenuSection />
        <StorySection />
        <GroupDiningSection />
        <ReviewsSection />
        <LocationSection />
        <ReservationBanner />
      </main>
      <SiteFooter />
      <MobileBookingBar />
    </>
  );
}
```

- [ ] **Step 5: 테스트와 타입 확인**

Run: `npm test`

Expected: all tests PASS.

Run: `npx tsc --noEmit`

Expected: exit 0 with no diagnostics.

- [ ] **Step 6: 커밋**

```powershell
git add app/page.tsx components/home tests/page-structure.test.mjs
git commit -m "feat: build Wangjing homepage sections"
```

---

### Task 4: 반응형 헤더와 예약 중심 상호작용

**Files:**
- Modify: `components/home/site-header.tsx`
- Modify: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: `SITE`, `NAV_ITEMS`
- Produces: 키보드 사용 가능한 모바일 메뉴와 데스크톱 예약 CTA

- [ ] **Step 1: 모바일 메뉴 실패 테스트 추가**

Append to `tests/page-structure.test.mjs`:

```js
test("mobile menu exposes its state and target", async () => {
  const header = await read("components/home/site-header.tsx");
  assert.match(header, /^"use client";/m);
  assert.match(header, /aria-expanded=\{open\}/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(header, /id="mobile-navigation"/);
  assert.match(header, /setOpen\(false\)/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="mobile menu"`

Expected: FAIL before the header is implemented.

- [ ] **Step 3: 기존 헤더를 최소 Client Component로 교체**

Replace `components/home/site-header.tsx`:

```tsx
"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="판교왕징 처음으로"><span>{SITE.hanja}</span>{SITE.name}</a>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
      </nav>
      <a className="button button--primary header-booking" href={SITE.bookingUrl} target="_blank" rel="noreferrer">네이버 예약</a>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav className="mobile-nav" id="mobile-navigation" aria-label="모바일 메뉴" hidden={!open}>
        {NAV_ITEMS.map((item) => <a href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
        <a href={SITE.bookingUrl} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>네이버 예약</a>
      </nav>
    </header>
  );
}
```

Add `id="top"` to the outermost hero section.

- [ ] **Step 4: 테스트 통과와 커밋**

Run: `npm test && npm run lint`

Expected: all tests PASS and ESLint exit 0.

```powershell
git add components/home/site-header.tsx components/home/hero-section.tsx tests/page-structure.test.mjs
git commit -m "feat: add accessible responsive navigation"
```

---

### Task 5: 시각 시스템, 메타데이터, 반응형 CSS

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tests/page-structure.test.mjs`

**Interfaces:**
- Consumes: 모든 컴포넌트 className 계약
- Produces: 390px, 768px, 1440px에서 검증 가능한 완성 화면과 한국어 메타데이터

- [ ] **Step 1: CSS와 메타데이터 실패 테스트 추가**

Append to `tests/page-structure.test.mjs`:

```js
test("global styles contain brand tokens and responsive contracts", async () => {
  const css = await read("app/globals.css");
  for (const token of ["--ink: #17110f", "--cream: #f6f0e5", "--gold: #c5a15a", "--red: #8f1d1d"]) assert.match(css.toLowerCase(), new RegExp(token));
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.mobile-booking/);
  assert.match(css, /position: fixed/);
});

test("layout declares Korean language and Wangjing metadata", async () => {
  const layout = await read("app/layout.tsx");
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /판교왕징 \| 판교 양꼬치·중국 양고기 다이닝/);
  assert.match(layout, /대왕판교로606번길/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="global styles|layout declares"`

Expected: FAIL because starter metadata and starter CSS are still present.

- [ ] **Step 3: 한국어 레이아웃과 정적 메타데이터 구현**

Replace starter font and metadata in `app/layout.tsx` with a network-independent system font setup:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "판교왕징 | 판교 양꼬치·중국 양고기 다이닝",
  description: "판교역 가까이에서 양꼬치와 중국 양고기 요리, 단체석과 주차 편의를 제공하는 판교왕징입니다.",
  keywords: ["판교왕징", "판교 양꼬치", "판교 회식", "판교 단체모임", "판교 중국요리"],
  openGraph: {
    title: "판교왕징 | 판교 양꼬치·중국 양고기 다이닝",
    description: "불향으로 완성한 양고기, 중요한 자리를 위한 판교왕징",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
```

- [ ] **Step 4: 전역 CSS 구현**

Replace starter CSS with these mandatory foundations, then add selectors for every class used by the section components without changing the token values:

```css
@import "tailwindcss";

:root {
  --ink: #17110f;
  --ink-soft: #241a17;
  --cream: #f6f0e5;
  --paper: #fff8ec;
  --gold: #c5a15a;
  --red: #8f1d1d;
  --red-pressed: #741616;
  --text: #211a17;
  --muted: #766c63;
  --line: #ded2c5;
  --font-sans: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --font-serif: "Noto Serif KR", "Nanum Myeongjo", Georgia, serif;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 92px; }
body { margin: 0; background: var(--cream); color: var(--text); font-family: var(--font-sans), sans-serif; }
a { color: inherit; text-decoration: none; }
button, a { -webkit-tap-highlight-color: transparent; }
a:focus-visible, button:focus-visible { outline: 3px solid var(--gold); outline-offset: 4px; }
img { object-fit: cover; }

.site-header { position: sticky; top: 0; z-index: 50; min-height: 92px; padding: 0 5vw; display: flex; align-items: center; justify-content: space-between; background: rgba(23,17,15,.96); color: var(--paper); }
.wordmark { min-height: 48px; display: inline-flex; align-items: center; gap: 14px; font-family: var(--font-serif), serif; font-size: 1.35rem; font-weight: 700; }
.wordmark span, .eyebrow { color: var(--gold); }
.desktop-nav { display: flex; align-items: center; gap: 2rem; }
.desktop-nav a, .mobile-nav a { min-height: 48px; display: inline-flex; align-items: center; }
.menu-toggle, .mobile-nav { display: none; }

.button { min-height: 54px; padding: 0 1.5rem; display: inline-flex; align-items: center; justify-content: center; border: 1px solid transparent; font-weight: 700; }
.button--primary { background: var(--red); color: var(--paper); }
.button--primary:hover { background: var(--red-pressed); }
.button--outline { border-color: var(--gold); color: var(--paper); background: rgba(23,17,15,.65); }

.hero { min-height: 810px; position: relative; display: grid; align-items: end; color: var(--paper); overflow: hidden; }
.hero__media, .reservation-banner__media { position: absolute; inset: 0; }
.hero__media::after, .reservation-banner__media::after { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(23,17,15,.94), rgba(23,17,15,.55)); }
.hero__content { position: relative; z-index: 1; width: min(1248px, 90vw); margin: 0 auto; padding: 5rem 0 3rem; }
.hero h1 { max-width: 800px; margin: 1.25rem 0; font-family: var(--font-serif), serif; font-size: clamp(2.65rem, 6vw, 4.5rem); line-height: 1.18; }
.hero__actions, .location-actions, .reservation-actions { display: flex; flex-wrap: wrap; gap: .875rem; }
.trust-grid { margin-top: 4rem; display: grid; grid-template-columns: repeat(3, 1fr); background: rgba(23,17,15,.9); border: 1px solid rgba(197,161,90,.45); }
.trust-item { min-height: 126px; padding: 1.5rem; display: grid; align-content: center; gap: .5rem; border-right: 1px solid rgba(197,161,90,.45); }

.section { padding: 6rem max(5vw, 20px); }
.section--dark { background: var(--ink); color: var(--paper); }
.section__heading { width: min(1248px, 100%); margin: 0 auto 2.75rem; }
.section h2 { margin: .75rem 0 1rem; font-family: var(--font-serif), serif; font-size: clamp(2.1rem, 4vw, 3rem); line-height: 1.25; }
.menu-grid, .reviews-grid { width: min(1248px, 100%); margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5rem; }
.menu-card__image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; }
.menu-card__body { padding: 1.25rem 0; }
.menu-card__title { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; }
.menu-card__title h3 { font-family: var(--font-serif), serif; font-size: 1.5rem; }
.menu-card__title strong { color: var(--red); white-space: nowrap; }
.split-section { display: grid; grid-template-columns: 1fr 1fr; min-height: 720px; }
.split-section__media { position: relative; min-height: 520px; }
.split-section__content { padding: clamp(3rem, 7vw, 6rem); display: grid; align-content: center; }
.review-card { min-height: 320px; padding: 2rem; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid #5e4c36; background: var(--ink-soft); }
.location-grid { width: min(1248px, 100%); margin: 0 auto; display: grid; grid-template-columns: minmax(300px, .85fr) 1.4fr; }
.location-copy { padding: 3rem; background: var(--ink); color: var(--paper); }
.location-media { position: relative; min-height: 500px; }
.reservation-banner { min-height: 560px; position: relative; display: grid; place-items: center; color: var(--paper); text-align: center; overflow: hidden; }
.reservation-banner__content { position: relative; z-index: 1; width: min(900px, 90vw); }
.mobile-booking { display: none; }
.site-footer { padding: 4rem max(5vw, 20px) 5rem; background: #100b0a; color: var(--paper); }

@media (max-width: 1023px) {
  .desktop-nav { display: none; }
  .menu-toggle { min-width: 48px; min-height: 48px; display: inline-grid; place-items: center; border: 0; background: transparent; color: var(--paper); }
  .mobile-nav { position: absolute; inset: 100% 0 auto; padding: 1rem 5vw 1.5rem; background: var(--ink); }
  .mobile-nav:not([hidden]) { display: grid; }
  .menu-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .menu-card:last-child { grid-column: 1 / -1; }
}

@media (max-width: 767px) {
  html { scroll-padding-top: 72px; }
  body { padding-bottom: 76px; }
  .site-header { min-height: 72px; }
  .header-booking { display: none; }
  .hero { min-height: 760px; }
  .hero__content { padding-top: 4rem; }
  .hero h1 { font-size: clamp(2.4rem, 12vw, 3.6rem); }
  .trust-grid { grid-template-columns: 1fr; }
  .trust-item { min-height: 92px; border-right: 0; border-bottom: 1px solid rgba(197,161,90,.45); }
  .section { padding-block: 4.5rem; }
  .menu-grid, .reviews-grid, .split-section, .location-grid { grid-template-columns: 1fr; }
  .menu-card:last-child { grid-column: auto; }
  .split-section__media { min-height: 430px; }
  .location-media { min-height: 360px; }
  .mobile-booking { position: fixed; z-index: 60; left: 0; right: 0; bottom: 0; display: block; padding: .75rem 1rem; background: rgba(16,11,10,.96); }
  .mobile-booking .button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
```

Add focused component-specific selectors only when the rendered QA proves they are necessary; do not change the approved colors, content order, or breakpoints.

- [ ] **Step 5: 자동 검증과 커밋**

Run: `npm test && npm run lint && npm run build`

Expected: all tests PASS, ESLint exit 0, Next.js production build completes and `/` is generated without errors.

```powershell
git add app/layout.tsx app/globals.css tests/page-structure.test.mjs
git commit -m "feat: apply responsive Wangjing visual system"
```

---

### Task 6: 시각 QA, 링크 검증, 배포

**Files:**
- Modify as needed after QA: `app/globals.css`, `components/home/*.tsx`
- Verify: `https://my-shop-omega-sable.vercel.app/`

**Interfaces:**
- Consumes: production build from Tasks 1–5
- Produces: 검증된 Vercel 공개 페이지

- [ ] **Step 1: 최종 자동 검증**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: every command exits 0. Do not proceed to deployment on any failure.

- [ ] **Step 2: 로컬 운영 서버 실행**

Run: `npm run start`

Expected: Next.js reports a local production server on port 3000.

- [ ] **Step 3: 세 뷰포트 시각 검증**

Use the browser skill to inspect the complete page at 390×844, 768×1024, and 1440×1000. For each viewport verify:

- no horizontal overflow;
- H1, menu prices, review cards, and buttons do not overlap;
- hero, menu, interior, storefront, and final banner images retain useful crops;
- desktop header and mobile menu expose every section;
- mobile booking bar stays visible without hiding the footer;
- browser console contains no errors.

If a defect is found, add a failing static contract where practical, patch only the responsible selector/component, rerun `npm test && npm run lint && npm run build`, then repeat the affected viewport.

- [ ] **Step 4: 링크 검증**

From the rendered DOM verify exact `href` values:

```text
네이버 예약: https://booking.naver.com/booking/6/bizes/970819
전화: tel:050713135688
길찾기: https://map.naver.com/p/search/경기 성남시 분당구 대왕판교로606번길 10
내부 이동: #menu, #story, #group, #reviews, #location
```

Do not click through and submit any external booking form.

- [ ] **Step 5: QA 수정 커밋**

```powershell
git add app components tests
git commit -m "fix: polish responsive Wangjing homepage"
```

If no QA changes were required, skip this empty commit.

- [ ] **Step 6: Vercel 운영 배포**

The local `.vercel/project.json` already identifies project `my-shop`. Run:

```powershell
npx vercel --prod
```

Expected: deployment succeeds and returns a production URL associated with `my-shop`.

If the command fails only because sandboxed network access is blocked, rerun it with the required network approval. Do not start a paid plan or enter payment details.

- [ ] **Step 7: 공개 주소 재검증**

Open `https://my-shop-omega-sable.vercel.app/` and verify the title is `판교왕징 | 판교 양꼬치·중국 양고기 다이닝`, the hero text is visible, all local images return successfully, and the browser console has no errors.

- [ ] **Step 8: GitHub 연결 준비**

Run `git status --short` and `git log --oneline -6`; expected result is a clean worktree and the local task commits. Copy the exact HTTPS repository URL from the GitHub repository's Quick Setup area before adding `origin`. Because the earlier screenshot showed a rename in progress and the repository may be private, do not guess the remote and do not force-push. Once the exact URL is user-confirmed, add it and first run `git ls-remote origin` to determine whether the remote is empty; pushing is a separate external action requiring confirmation.

---

## Completion Checklist

- [ ] Pencil 원본 contains approved desktop and mobile frames.
- [ ] All 13 provided images are copied locally and no Unsplash URL remains.
- [ ] `npm test`, `npm run lint`, and `npm run build` pass.
- [ ] 390px, 768px, and 1440px visual QA passes.
- [ ] Booking, phone, map, and internal navigation links match the verified values.
- [ ] Vercel production URL shows the 판교왕징 page with no console errors.
- [ ] Local Git history is clean; remote push is not attempted until the exact repository URL is confirmed.

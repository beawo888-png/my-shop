# 판교점 전체 메뉴 사진형 3열 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 판교점 전체 메뉴를 점심특선 없이 47개로 정리하고, 매장 소유 사진을 사용하는 접근 가능한 3열·2열·1열 사진 카드와 동일 범위의 메뉴 구조화 데이터를 제공한다.

**Architecture:** `lib/menu-content.ts`를 메뉴명·가격·설명·로컬 이미지·대체 텍스트·맞춤 방식의 단일 데이터 원본으로 유지한다. 서버 컴포넌트인 메뉴 페이지와 카드가 이 데이터를 렌더링하고, 이미지 로드 실패 처리만 작은 클라이언트 컴포넌트가 담당한다. 모든 이미지는 `public/images/wangjing/menu/`에 저장하며 음식은 `cover`, 주류는 `contain`으로 표시한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `next/image`, Tailwind CSS 4 기반 전역 CSS, Node.js 내장 테스트 러너, Schema.org JSON-LD

## Global Constraints

- 승인된 Pencil 기준은 `C:\vibecoding\my-shop\초안`의 데스크톱 프레임 `vdI2k`와 모바일 프레임 `zeVSC`이다.
- 메뉴는 양고기·꼬치 7개, 중국요리·탕 16개, 식사·면·디저트 6개, 주류·하이볼 18개로 총 47개다.
- 점심특선 그룹과 5개 메뉴는 화면, 데이터, 메타데이터, 구조화 데이터에서 모두 제거한다.
- 음식 사진은 사용자 제공 `D:\웹&모바일 업로드용\왕징메뉴사진.zip`을 우선하고, ZIP에 없는 새우꼬치만 판교점 네이버 플레이스의 업체 등록 메뉴 사진을 사용한다.
- 주류는 판교점 네이버 플레이스의 업체 등록 사진 6장만 사용하고 방문자·리뷰·블로그·AI 사진은 사용하지 않는다.
- 외부 이미지를 직접 연결하지 않고 `public/images/wangjing/menu/` 아래 영문 파일명으로 저장한다.
- 데스크톱 1200px 이상 3열, 태블릿 768~1199px 2열, 모바일 767px 이하 1열이다.
- 음식은 `cover`, 주류는 `contain`으로 표시하고, 실패 시 같은 분류의 업체 등록 대표 사진으로 바꾼다.
- 메뉴명은 데스크톱 22px 이상·모바일 18px 이상, 가격 18px 이상, 설명과 분류 글씨는 16px 이상이다.
- 관리자 편집, 예약, 가격 변경, 점심특선 사진, ZIP의 영상 3개는 변경 범위에 포함하지 않는다.
- Next.js 16 규칙에 따라 `next/image`의 `fill` 부모는 `position: relative`를 사용하고 반응형 `sizes`를 제공하며 `priority` 대신 기본 지연 로딩을 유지한다.

---

## File Map

- Modify `lib/menu-content.ts`: 47개 메뉴의 단일 데이터 원본과 이미지·대체 이미지 계약.
- Create `tests/menu-photo-grid.test.mjs`: 데이터, 사진 파일, 카드, JSON-LD, 반응형 CSS를 검증하는 회귀 테스트.
- Create `components/menu/full-menu-image.tsx`: `next/image`와 분류 대표 사진 대체 처리를 담당하는 클라이언트 경계.
- Create `components/menu/full-menu-card.tsx`: 한 메뉴 카드의 의미 구조와 표시 순서.
- Create `lib/menu-structured-data.ts`: 메뉴 데이터에서 Schema.org `Menu` JSON-LD를 생성하는 순수 함수.
- Modify `app/menu/page.tsx`: 47개 문구, 네 분류, 사진 카드와 JSON-LD 렌더링.
- Modify `app/globals.css`: 사진 카드와 3열·2열·1열 반응형 레이아웃.
- Add `public/images/wangjing/menu/*`: 승인된 음식 28장과 주류 대표 6장, 총 34개 로컬 파일.

### Task 1: 47개 메뉴 데이터 계약

**Files:**
- Modify: `tests/full-menu.test.mjs`
- Modify: `lib/menu-content.ts`

**Interfaces:**
- Produces: `MenuImageFit = "cover" | "contain"`, `FullMenuItem.imageSrc`, `FullMenuItem.imageAlt`, `FullMenuItem.imageFit`, `FullMenuGroup.fallbackImageSrc`, `PANGYO_MENU_GROUPS`, `PANGYO_MENU_COUNT`.
- Consumes: 현재 판교점 메뉴명과 가격, 승인된 47개 범위.

- [ ] **Step 1: 47개·네 분류·사진 필드를 요구하는 실패 테스트로 교체**

`tests/full-menu.test.mjs`의 첫 번째 테스트를 아래 코드로 교체하고 사진 계약 테스트를 바로 뒤에 추가한다.

```js
test("Pangyo menu data contains 47 items in four approved groups", async () => {
  const source = await read("lib/menu-content.ts");
  const itemCalls = source.match(/^\s+menuItem\(/gm) ?? [];
  assert.equal(itemCalls.length, 47);
  const groupCounts = Object.fromEntries(
    [...source.matchAll(/id: "([^"]+)"[\s\S]*?items: \[([\s\S]*?)\n    \],/g)].map(
      ([, id, items]) => [id, items.match(/menuItem\(/g)?.length ?? 0],
    ),
  );
  assert.deepEqual(groupCounts, {
    "lamb-skewers": 7,
    "chinese-dishes": 16,
    meals: 6,
    drinks: 18,
  });
  for (const value of [
    'id: "lamb-skewers"',
    'title: "양고기·꼬치"',
    'id: "chinese-dishes"',
    'title: "중국요리·탕"',
    'id: "meals"',
    'title: "식사·면·디저트"',
    'id: "drinks"',
    'title: "주류·하이볼"',
  ]) {
    assert.ok(source.includes(value), "missing menu group value: " + value);
  }
  assert.doesNotMatch(source, /id: "lunch"|점심특선|홍소로우\+야채덮밥/);
  assert.match(source, /PANGYO_MENU_COUNT = 47/);
});

test("all menu rows define local accessible images and group fallbacks", async () => {
  const source = await read("lib/menu-content.ts");
  assert.match(source, /imageSrc: `\/images\/wangjing\/menu\/\$\{imageFile\}`/);
  assert.match(source, /imageAlt: `\$\{name\} 메뉴 사진`/);
  assert.match(source, /imageFit,/);
  assert.equal(source.match(/fallbackImageSrc:/g)?.length, 4);
  assert.doesNotMatch(source, /imageSrc:\s*"https?:\/\//);
});
```

기존 테스트 이름 `full menu page renders metadata, five groups, and conversion links`는 `full menu page renders metadata, four groups, and conversion links`로 바꾼다. 기존 52개·5분류·점심특선 기대값은 모두 삭제한다.

기존 양다리 가격 테스트의 이름 개수 단정은 새 함수 호출 형식에 맞게 다음 코드로 교체한다. 가격과 금지된 임의 크기 문구 단정은 그대로 유지한다.

```js
assert.equal(
  source.match(/menuItem\("비쥬얼 쇼크! 육즙 팡팡 양다리"/g)?.length,
  2,
);
```

- [ ] **Step 2: 테스트가 기존 52개 데이터에서 실패하는지 확인**

Run: `node --test --test-name-pattern="47 items|accessible images" tests/*.test.mjs`

Expected: FAIL. 현재 `menuItem(...)` 호출이 없고 `PANGYO_MENU_COUNT = 52`이며 `lunch`가 남아 있다는 메시지가 나온다.

- [ ] **Step 3: 메뉴 데이터 전체를 사진 계약을 포함한 47개로 교체**

`lib/menu-content.ts` 전체를 다음 코드로 교체한다.

```ts
export type MenuImageFit = "cover" | "contain";

export type FullMenuItem = {
  name: string;
  price: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFit: MenuImageFit;
};

export type FullMenuGroup = {
  id: "lamb-skewers" | "chinese-dishes" | "meals" | "drinks";
  title: string;
  description: string;
  fallbackImageSrc: string;
  items: FullMenuItem[];
};

const menuItem = (
  name: string,
  price: string,
  description: string,
  imageFile: string,
  imageFit: MenuImageFit = "cover",
): FullMenuItem => ({
  name,
  price,
  description,
  imageSrc: `/images/wangjing/menu/${imageFile}`,
  imageAlt: `${name} 메뉴 사진`,
  imageFit,
});

export const PANGYO_MENU_SOURCE_URL =
  "https://m.place.naver.com/restaurant/1873196958/menu/list";
export const PANGYO_MENU_CHECKED_AT = "2026년 7월 15일";
export const PANGYO_MENU_COUNT = 47;

export const PANGYO_MENU_GROUPS: FullMenuGroup[] = [
  {
    id: "lamb-skewers",
    title: "양고기·꼬치",
    description: "불향과 육즙을 즐기는 왕징의 대표 메뉴",
    fallbackImageSrc: "/images/wangjing/menu/lamb-leg.jpg",
    items: [
      menuItem("비쥬얼 쇼크! 육즙 팡팡 양다리", "90,000원", "통양다리를 천천히 구워 즐기는 왕징 대표 메뉴", "lamb-leg.jpg"),
      menuItem("비쥬얼 쇼크! 육즙 팡팡 양다리", "80,000원", "육즙과 불향을 풍성하게 즐기는 통양다리", "lamb-leg.jpg"),
      menuItem("고급양갈비", "30,000원", "부드러운 육질과 진한 풍미의 양갈비", "premium-lamb-chops.jpg"),
      menuItem("생양꼬치", "17,000원", "담백한 양고기 본연의 맛을 살린 꼬치", "fresh-lamb-skewers.jpg"),
      menuItem("양념양꼬치", "18,000원", "왕징 특제 양념으로 풍미를 더한 양꼬치", "marinated-lamb-skewers.jpg"),
      menuItem("양갈비살꼬치", "18,000원", "쫄깃하고 고소한 양갈비살 꼬치", "lamb-rib-skewers.jpg"),
      menuItem("새우꼬치", "18,000원", "탱글한 새우를 노릇하게 구운 꼬치", "shrimp-skewers.png"),
    ],
  },
  {
    id: "chinese-dishes",
    title: "중국요리·탕",
    description: "함께 나누기 좋은 정통 중국요리",
    fallbackImageSrc: "/images/wangjing/menu/guobaorou.jpg",
    items: [
      menuItem("꿔바로우", "20,000원", "바삭한 튀김옷과 새콤달콤한 소스의 조화", "guobaorou.jpg"),
      menuItem("가지튀김", "18,000원", "겉은 바삭하고 속은 촉촉한 가지 요리", "fried-eggplant.jpg"),
      menuItem("토마토계란볶음", "16,000원", "부드러운 계란과 산뜻한 토마토 볶음", "tomato-egg.jpg"),
      menuItem("마파두부", "15,000원", "매콤하고 구수한 소스에 볶은 두부", "mapo-tofu.jpg"),
      menuItem("향라대하", "22,000원", "향신료의 풍미를 입힌 매콤한 새우 요리", "spicy-prawn.jpg"),
      menuItem("어향육사", "19,000원", "채소와 돼지고기를 어향 소스로 볶은 요리", "yu-xiang-pork.jpg"),
      menuItem("경장육사", "19,000원", "춘장 풍미의 돼지고기와 채소를 함께 즐기는 요리", "jingjiang-pork.jpg"),
      menuItem("마라탕", "18,000원", "얼얼하고 깊은 향의 국물 요리", "malatang.jpg"),
      menuItem("소룽샤", "38,000원", "진한 양념에 볶아낸 중국식 민물가재", "xiaolongxia.jpg"),
      menuItem("지삼선", "18,000원", "가지·감자·피망을 감칠맛 나게 볶은 요리", "di-san-xian.jpg"),
      menuItem("건두부볶음", "16,000원", "쫄깃한 건두부와 채소를 볶은 요리", "stir-fried-tofu-skin.jpg"),
      menuItem("오이무침", "12,000원", "아삭한 오이를 산뜻하게 무친 곁들임", "cucumber-salad.jpg"),
      menuItem("즈란양고기", "28,000원", "쯔란 향을 입혀 볶아낸 양고기", "cumin-lamb.jpg"),
      menuItem("마라샹궈", "32,000원", "다채로운 재료를 마라 양념에 볶은 요리", "mala-xiang-guo.jpg"),
      menuItem("건두부무침", "16,000원", "건두부와 채소를 새콤하게 무친 냉채", "tofu-skin-salad.jpg"),
      menuItem("양탕", "15,000원", "양고기의 깊고 따뜻한 맛을 담은 국물", "lamb-soup.jpg"),
    ],
  },
  {
    id: "meals",
    title: "식사·면·디저트",
    description: "요리와 곁들이거나 든든하게 마무리하는 메뉴",
    fallbackImageSrc: "/images/wangjing/menu/egg-fried-rice.jpg",
    items: [
      menuItem("계란볶음밥", "8,000원", "고슬고슬한 밥과 부드러운 계란 볶음", "egg-fried-rice.jpg"),
      menuItem("가지볶음밥", "8,000원", "가지의 감칠맛을 더한 든든한 볶음밥", "eggplant-fried-rice.jpg"),
      menuItem("옥수수온면", "8,000원", "따뜻한 국물에 담은 부드러운 옥수수면", "corn-noodle-soup.jpg"),
      menuItem("냉면", "8,000원", "시원한 육수로 깔끔하게 마무리하는 면", "cold-noodles.jpg"),
      menuItem("물만두", "8,000원", "촉촉하고 부드럽게 익힌 한입 만두", "boiled-dumplings.jpg"),
      menuItem("꽃빵튀김", "8,000원", "겉은 바삭하고 속은 폭신한 달콤한 꽃빵", "fried-flower-buns.jpg"),
    ],
  },
  {
    id: "drinks",
    title: "주류·하이볼",
    description: "양고기와 어울리는 고량주와 시원한 한 잔",
    fallbackImageSrc: "/images/wangjing/menu/chinese-liquor-toast.jpg",
    items: [
      menuItem("커티삭하이볼", "6,000원", "커티삭 위스키로 만든 시원한 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("연태구냥 500ml 34도", "40,000원", "은은한 과실 향이 특징인 중국 백주", "chinese-liquor-toast.jpg", "contain"),
      menuItem("연태구냥 250ml 34도", "20,000원", "부드러운 향을 가볍게 즐기는 연태구냥", "chinese-liquor-pour-dark.jpg", "contain"),
      menuItem("연태구냥 125ml 34도", "12,000원", "한 상에 곁들이기 좋은 작은 용량의 연태구냥", "chinese-liquor-pour-clear.jpg", "contain"),
      menuItem("설원 450ml 30도", "25,000원", "깔끔한 목넘김의 중국 백주", "chinese-liquor-toast.jpg", "contain"),
      menuItem("설원 250ml 30도", "15,000원", "부담 없이 나누기 좋은 설원 백주", "chinese-liquor-pour-dark.jpg", "contain"),
      menuItem("공부가주 500ml 33도", "50,000원", "깊고 부드러운 향을 지닌 중국 명주", "chinese-liquor-pour-clear.jpg", "contain"),
      menuItem("노주탄 500ml 33도", "30,000원", "진한 향과 긴 여운의 중국 백주", "chinese-liquor-toast.jpg", "contain"),
      menuItem("이과두주 125ml 56도", "5,000원", "힘 있는 풍미를 작은 잔으로 즐기는 고도주", "chinese-liquor-pour-dark.jpg", "contain"),
      menuItem("컵술 고량주 100ml 38도", "5,000원", "양꼬치와 가볍게 곁들이는 컵 고량주", "chinese-liquor-pour-clear.jpg", "contain"),
      menuItem("칭다오 맥주 640ml 4.7도", "7,000원", "양꼬치와 잘 어울리는 청량한 맥주", "beer-cheers-table.jpg", "contain"),
      menuItem("하얼빈 맥주 500ml 4.3도", "7,000원", "깔끔하고 시원한 중국 맥주", "beer-cheers-close.jpg", "contain"),
      menuItem("타이거 맥주 640ml 5도", "7,000원", "산뜻한 탄산감의 라거 맥주", "beer-cheers-table.jpg", "contain"),
      menuItem("산토리하이볼", "8,000원", "산뜻하고 깔끔하게 즐기는 위스키 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("봄베이하이볼", "8,000원", "진의 향긋함을 살린 청량한 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("짐빔하이볼", "7,000원", "버번의 고소한 풍미를 담은 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("제임슨하이볼", "8,000원", "부드러운 아이리시 위스키 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("연태하이볼", "7,000원", "연태구냥의 향을 산뜻하게 즐기는 하이볼", "cutty-sark-highball.jpg", "contain"),
    ],
  },
];
```

- [ ] **Step 4: 데이터 테스트 통과 확인**

Run: `node --test --test-name-pattern="47 items|accessible images|lamb-leg|source and checked" tests/*.test.mjs`

Expected: 관련 테스트 4개 PASS, 점심특선 문자열 없음, 양다리 두 가격 유지.

- [ ] **Step 5: 데이터 계약 커밋**

```powershell
git add tests/full-menu.test.mjs lib/menu-content.ts
git commit -m "feat: define 47-item photo menu catalog"
```

### Task 2: 승인된 매장 사진을 로컬 자산으로 반입

**Files:**
- Create: `public/images/wangjing/menu/` 아래 34개 이미지 파일
- Create: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: Task 1의 47개 `imageSrc`와 네 `fallbackImageSrc`, 사용자 ZIP, 판교점 네이버 플레이스 업체 사진.
- Produces: 모든 데이터 경로가 가리키는 로컬 이미지 파일.

- [ ] **Step 1: 로컬 파일 존재와 출처 규칙을 요구하는 실패 테스트 작성**

`tests/menu-photo-grid.test.mjs`를 다음 코드로 만든다.

```js
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL("../" + path, import.meta.url), "utf8").catch(() => "");

test("every declared menu image is a non-empty local asset", async () => {
  const source = await read("lib/menu-content.ts");
  const files = [
    ...source.matchAll(/menuItem\([^\n]+, "([a-z0-9-]+\.(?:jpg|png))"(?:, "(?:cover|contain)")?\)/g),
  ].map((match) => match[1]);
  assert.equal(files.length, 47);
  for (const file of new Set(files)) {
    const url = new URL(`../public/images/wangjing/menu/${file}`, import.meta.url);
    await access(url);
    assert.ok((await stat(url)).size > 500, `${file} should not be empty`);
  }
});

test("menu catalog uses 28 food assets and six approved drink representatives", async () => {
  const source = await read("lib/menu-content.ts");
  const drinkFiles = [
    "chinese-liquor-toast.jpg",
    "chinese-liquor-pour-dark.jpg",
    "chinese-liquor-pour-clear.jpg",
    "beer-cheers-table.jpg",
    "beer-cheers-close.jpg",
    "cutty-sark-highball.jpg",
  ];
  for (const file of drinkFiles) assert.ok(source.includes(file));
  assert.doesNotMatch(source, /새우튀김|양꼬치 꿔바로우|점심특선|\.mp4/);
});
```

- [ ] **Step 2: 자산이 아직 없어 테스트가 실패하는지 확인**

Run: `node --test --test-name-pattern="non-empty local asset|six approved drink" tests/*.test.mjs`

Expected: 첫 테스트가 `ENOENT`로 FAIL하고 출처 규칙 테스트는 PASS.

- [ ] **Step 3: ZIP의 승인된 음식 사진 27장을 정확한 영문 이름으로 복사**

다음 PowerShell을 프로젝트 루트에서 실행한다. 임시 압축 해제 폴더는 저장소 밖이 아니라 프로젝트의 `.tmp-menu-import`로 한정하고, 완료 후 `Remove-Item` 전에 절대 경로가 `C:\vibecoding\my-shop\.tmp-menu-import`인지 확인한다.

```powershell
$project = (Resolve-Path '.').Path
$zip = 'D:\웹&모바일 업로드용\왕징메뉴사진.zip'
$temp = Join-Path $project '.tmp-menu-import'
$target = Join-Path $project 'public\images\wangjing\menu'
if ($temp -ne 'C:\vibecoding\my-shop\.tmp-menu-import') { throw 'Unexpected temp path' }
New-Item -ItemType Directory -Force -Path $temp, $target | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $temp -Force
$map = [ordered]@{
  '양다리.jpg'='lamb-leg.jpg'; '양갈비.jpg'='premium-lamb-chops.jpg';
  '생양꼬치.jpg'='fresh-lamb-skewers.jpg'; '양념양꼬치.jpg'='marinated-lamb-skewers.jpg';
  '양갈비살.jpg'='lamb-rib-skewers.jpg'; '꿔바로우.jpg'='guobaorou.jpg';
  '가지튀김.jpg'='fried-eggplant.jpg'; '토마토계란볶음.jpg'='tomato-egg.jpg';
  '마파두부.jpg'='mapo-tofu.jpg'; '향라대하.jpg'='spicy-prawn.jpg';
  '어향육사.jpg'='yu-xiang-pork.jpg'; '경장육사.jpg'='jingjiang-pork.jpg';
  '마라탕.jpg'='malatang.jpg'; '쇼룽샤.jpg'='xiaolongxia.jpg';
  '지삼선.jpg'='di-san-xian.jpg'; '건두부볶음.jpg'='stir-fried-tofu-skin.jpg';
  '오이무침.jpg'='cucumber-salad.jpg'; '즈란양고기.jpg'='cumin-lamb.jpg';
  '마라샹궈.jpg'='mala-xiang-guo.jpg'; '건두부무침.jpg'='tofu-skin-salad.jpg';
  '양탕.jpg'='lamb-soup.jpg'; '계란볶음.jpg'='egg-fried-rice.jpg';
  '가지볶음밥.jpg'='eggplant-fried-rice.jpg'; '옥수수온면.jpg'='corn-noodle-soup.jpg';
  '냉면.jpg'='cold-noodles.jpg'; '물만두.jpg'='boiled-dumplings.jpg';
  '꽃빵튀김.jpg'='fried-flower-buns.jpg'
}
foreach ($entry in $map.GetEnumerator()) {
  $source = Get-ChildItem -LiteralPath $temp -Recurse -File | Where-Object Name -eq $entry.Key | Select-Object -First 1
  if (-not $source) { throw "Missing ZIP image: $($entry.Key)" }
  Copy-Item -LiteralPath $source.FullName -Destination (Join-Path $target $entry.Value)
}
Remove-Item -LiteralPath $temp -Recurse -Force
```

Expected: `public/images/wangjing/menu/`에 음식 JPG 27개가 생기며 조합 사진, 점심특선, `새우튀김.jpg`, MP4는 복사되지 않는다.

- [ ] **Step 4: 네이버 플레이스 업체 등록 사진 7개를 원본 그대로 저장**

인앱 브라우저의 로그인된 세션으로 `https://m.place.naver.com/restaurant/1873196958/photo`를 열고 사진 필터를 `업체`로 설정한다. 방문자·리뷰·블로그 탭은 사용하지 않는다. 업체 사진 중 중국술 건배 1장, 중국술 따르는 사진 2장, 맥주 건배 2장을 원본 보기로 열어 각각 아래 이름으로 저장한다.

```text
public/images/wangjing/menu/chinese-liquor-toast.jpg
public/images/wangjing/menu/chinese-liquor-pour-dark.jpg
public/images/wangjing/menu/chinese-liquor-pour-clear.jpg
public/images/wangjing/menu/beer-cheers-table.jpg
public/images/wangjing/menu/beer-cheers-close.jpg
```

이어서 `https://m.place.naver.com/restaurant/1873196958/menu/list`의 업체 등록 메뉴에서 `커티삭하이볼`과 `새우꼬치`를 열어 원본 이미지를 다음 이름으로 저장한다.

```text
public/images/wangjing/menu/cutty-sark-highball.jpg
public/images/wangjing/menu/shrimp-skewers.png
```

저장 직후 각 파일을 로컬 이미지 뷰어로 열어 중국술 3장·맥주 2장·하이볼 1장·새우꼬치 1장이 올바른지 확인한다. 라벨 보정, 생성형 확장, 배경 합성, 크롭 저장은 하지 않는다.

- [ ] **Step 5: 전체 자산 테스트 통과 확인**

Run: `node --test --test-name-pattern="non-empty local asset|six approved drink" tests/*.test.mjs`

Expected: 2 tests PASS, 47개 데이터가 참조하는 34개 고유 파일이 모두 500바이트보다 큼.

- [ ] **Step 6: 메뉴 사진 자산 커밋**

```powershell
git add tests/menu-photo-grid.test.mjs public/images/wangjing/menu
git commit -m "assets: add approved Pangyo menu photos"
```

### Task 3: 재사용 메뉴 카드와 이미지 오류 대체

**Files:**
- Create: `components/menu/full-menu-image.tsx`
- Create: `components/menu/full-menu-card.tsx`
- Modify: `tests/menu-photo-grid.test.mjs`

**Interfaces:**
- Consumes: `FullMenuItem`, `fallbackImageSrc`.
- Produces: `FullMenuImage({ src, fallbackSrc, alt, fit })`, `FullMenuCard({ item, fallbackImageSrc })`.

- [ ] **Step 1: 카드 의미 구조와 오류 대체를 요구하는 실패 테스트 추가**

`tests/menu-photo-grid.test.mjs` 끝에 다음 테스트를 추가한다.

```js
test("menu card renders image, description, price, and fallback behavior", async () => {
  const [card, image] = await Promise.all([
    read("components/menu/full-menu-card.tsx"),
    read("components/menu/full-menu-image.tsx"),
  ]);
  assert.match(card, /<FullMenuImage/);
  assert.match(card, /<h3>\{item\.name\}<\/h3>/);
  assert.match(card, /<p>\{item\.description\}<\/p>/);
  assert.match(card, /<strong>\{item\.price\}<\/strong>/);
  assert.match(image, /^"use client";/);
  assert.match(image, /import Image from "next\/image"/);
  assert.match(image, /fill/);
  assert.match(image, /sizes=/);
  assert.match(image, /onError=/);
  assert.match(image, /setCurrentSrc\(fallbackSrc\)/);
});
```

- [ ] **Step 2: 컴포넌트가 없어 실패하는지 확인**

Run: `node --test --test-name-pattern="fallback behavior" tests/*.test.mjs`

Expected: FAIL because both component files are empty/missing.

- [ ] **Step 3: 작은 클라이언트 이미지 경계 구현**

`components/menu/full-menu-image.tsx`를 생성한다.

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuImageFit } from "@/lib/menu-content";

type FullMenuImageProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  fit: MenuImageFit;
};

export function FullMenuImage({
  src,
  fallbackSrc,
  alt,
  fit,
}: FullMenuImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      className={`full-menu-card__image full-menu-card__image--${fit}`}
      src={currentSrc}
      alt={alt}
      fill
      sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) calc(50vw - 36px), 384px"
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}
```

- [ ] **Step 4: 서버 메뉴 카드 구현**

`components/menu/full-menu-card.tsx`를 생성한다.

```tsx
import { FullMenuImage } from "@/components/menu/full-menu-image";
import type { FullMenuItem } from "@/lib/menu-content";

type FullMenuCardProps = {
  item: FullMenuItem;
  fallbackImageSrc: string;
};

export function FullMenuCard({
  item,
  fallbackImageSrc,
}: FullMenuCardProps) {
  return (
    <li className="full-menu-card">
      <div className="full-menu-card__media">
        <FullMenuImage
          src={item.imageSrc}
          fallbackSrc={fallbackImageSrc}
          alt={item.imageAlt}
          fit={item.imageFit}
        />
      </div>
      <div className="full-menu-card__body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>{item.price}</strong>
      </div>
    </li>
  );
}
```

- [ ] **Step 5: 카드 테스트와 정적 검사 통과 확인**

Run: `node --test --test-name-pattern="fallback behavior" tests/*.test.mjs`

Expected: 1 test PASS.

Run: `npm.cmd run lint -- components/menu/full-menu-image.tsx components/menu/full-menu-card.tsx`

Expected: ESLint exits 0 with no warnings or errors.

- [ ] **Step 6: 카드 컴포넌트 커밋**

```powershell
git add components/menu/full-menu-image.tsx components/menu/full-menu-card.tsx tests/menu-photo-grid.test.mjs
git commit -m "feat: add resilient photo menu cards"
```

### Task 4: 메뉴 페이지와 47개 JSON-LD 연결

**Files:**
- Create: `lib/menu-structured-data.ts`
- Modify: `app/menu/page.tsx`
- Modify: `tests/menu-photo-grid.test.mjs`
- Modify: `tests/full-menu.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `PANGYO_MENU_GROUPS`, Task 3의 `FullMenuCard`.
- Produces: `buildPangyoMenuStructuredData()`와 47개 사진 카드·네 분류가 있는 `/menu`.

- [ ] **Step 1: 페이지 연결과 JSON-LD 범위를 요구하는 실패 테스트 추가**

`tests/menu-photo-grid.test.mjs` 끝에 다음 테스트를 추가한다.

```js
test("menu page renders photo cards and JSON-LD from the same 47-item source", async () => {
  const [page, structured] = await Promise.all([
    read("app/menu/page.tsx"),
    read("lib/menu-structured-data.ts"),
  ]);
  assert.match(page, /import \{ FullMenuCard \}/);
  assert.match(page, /<FullMenuCard/);
  assert.match(page, /fallbackImageSrc=\{group\.fallbackImageSrc\}/);
  assert.match(page, /buildPangyoMenuStructuredData/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(structured, /"@type": "Menu"/);
  assert.match(structured, /"@type": "MenuSection"/);
  assert.match(structured, /"@type": "MenuItem"/);
  assert.match(structured, /PANGYO_MENU_GROUPS\.map/);
  assert.match(structured, /item\.imageSrc/);
  assert.match(structured, /item\.price\.replace\("원", ""\)\.replaceAll\(",", ""\)/);
});
```

`tests/full-menu.test.mjs`의 페이지 테스트에는 아래 기대값을 추가하고, 기존 기본 2열·모바일 1열 CSS 단정은 Task 5에서 새 레이아웃 테스트로 교체할 때까지 이 테스트에서 제거한다.

```js
assert.match(page, /47개 메뉴/);
assert.doesNotMatch(page, /점심특선|52개 메뉴/);
```

- [ ] **Step 2: 사진 카드와 JSON-LD가 없어 실패하는지 확인**

Run: `node --test --test-name-pattern="photo cards and JSON-LD|four groups" tests/*.test.mjs`

Expected: FAIL because `FullMenuCard`와 `buildPangyoMenuStructuredData`가 페이지에서 아직 사용되지 않고 문구가 52개다.

- [ ] **Step 3: 데이터 기반 Schema.org Menu 생성 함수 작성**

`lib/menu-structured-data.ts`를 생성한다.

```ts
import { PANGYO_MENU_GROUPS } from "@/lib/menu-content";

const siteUrl = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export function buildPangyoMenuStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "왕징양다리양꼬치 판교점 전체 메뉴",
    url: `${siteUrl}/menu`,
    hasMenuSection: PANGYO_MENU_GROUPS.map((group) => ({
      "@type": "MenuSection",
      name: group.title,
      description: group.description,
      hasMenuItem: group.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        image: new URL(item.imageSrc, siteUrl).toString(),
        offers: {
          "@type": "Offer",
          priceCurrency: "KRW",
          price: item.price.replace("원", "").replaceAll(",", ""),
        },
      })),
    })),
  };
}
```

- [ ] **Step 4: 메뉴 페이지를 카드와 JSON-LD에 연결**

`app/menu/page.tsx`의 import에 다음을 추가한다.

```tsx
import { FullMenuCard } from "@/components/menu/full-menu-card";
import { buildPangyoMenuStructuredData } from "@/lib/menu-structured-data";
```

메타데이터 블록 전체를 다음 코드로 교체한다.

```tsx
export const metadata: Metadata = {
  title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
  description:
    "왕징양다리양꼬치 판교점의 양다리, 양꼬치, 중국요리, 식사와 주류 47개 메뉴 및 가격을 사진과 함께 확인하세요.",
  alternates: { canonical },
  openGraph: {
    title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
    description: "판교점의 양고기와 중국요리 47개 메뉴 및 가격 안내",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};
```

`MenuPage` 함수 첫 줄과 `<main>` 바로 앞에 JSON-LD를 추가한다.

```tsx
export default function MenuPage() {
  const menuStructuredData = buildPangyoMenuStructuredData();

  return (
    <div className="full-menu-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuStructuredData).replace(/</g, "\\u003c"),
        }}
      />
```

히어로 설명을 다음 문구로 교체한다.

```tsx
<p className="full-menu-hero__description">
  양다리와 꼬치부터 중국요리, 식사, 주류까지 47개 메뉴를 사진과 함께
  확인하세요.
</p>
```

기존 `.full-menu-item` `<li>` 블록 전체를 다음 카드 호출로 교체한다.

```tsx
{group.items.map((item, index) => (
  <FullMenuCard
    item={item}
    fallbackImageSrc={group.fallbackImageSrc}
    key={`${group.id}-${item.name}-${item.price}-${index}`}
  />
))}
```

- [ ] **Step 5: 페이지와 JSON-LD 테스트 통과 확인**

Run: `node --test --test-name-pattern="photo cards and JSON-LD|four groups|same-tab home" tests/*.test.mjs`

Expected: 관련 테스트 PASS, 페이지에 점심특선·52개 문구 없음, 홈 링크 두 개는 여전히 Next `Link` 사용.

- [ ] **Step 6: 페이지와 구조화 데이터 커밋**

```powershell
git add app/menu/page.tsx lib/menu-structured-data.ts tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
git commit -m "feat: render 47-item photo menu and JSON-LD"
```

### Task 5: 3열·2열·1열 스타일과 최종 검증

**Files:**
- Modify: `app/globals.css:1148-1181`
- Modify: `tests/menu-photo-grid.test.mjs`
- Modify: `tests/full-menu.test.mjs`

**Interfaces:**
- Consumes: `.full-menu-section__items`, `.full-menu-card*`, `imageFit` 클래스.
- Produces: 데스크톱 3열, 태블릿 2열, 모바일 1열과 16px 이상 타이포그래피.

- [ ] **Step 1: 반응형·사진 맞춤·최소 글자 크기 실패 테스트 추가**

`tests/menu-photo-grid.test.mjs` 끝에 다음 테스트를 추가한다.

```js
test("photo menu uses approved 3-2-1 grid, fit modes, and readable type", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.full-menu-section__items\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 1199px\)[\s\S]*?\.full-menu-section__items[\s\S]*?repeat\(2/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\.full-menu-section__items[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(css, /\.full-menu-card__media\s*\{[\s\S]*?position:\s*relative/);
  assert.match(css, /\.full-menu-card__image--cover\s*\{[^}]*object-fit:\s*cover/);
  assert.match(css, /\.full-menu-card__image--contain\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.full-menu-card h3\s*\{[^}]*font-size:\s*1\.375rem/);
  assert.match(css, /\.full-menu-card strong\s*\{[^}]*font-size:\s*1\.125rem/);
  assert.doesNotMatch(
    css,
    /\.full-menu-[^{]*\{[^}]*font-size:\s*(?:0\.[0-9]+rem|1[0-5]px)/,
  );
});
```

`tests/full-menu.test.mjs`의 CSS 기대값도 기본 3열, 1199px 2열, 767px 1열로 갱신한다.

- [ ] **Step 2: 현재 텍스트형 2열 CSS에서 실패하는지 확인**

Run: `node --test --test-name-pattern="approved 3-2-1 grid|full menu page renders" tests/*.test.mjs`

Expected: FAIL because 기본 그리드가 2열이고 카드 사진 클래스가 없다.

- [ ] **Step 3: 기존 텍스트 행 CSS를 사진 카드 CSS로 교체**

`app/globals.css`의 `.full-menu-section__items`부터 `.full-menu-item strong`까지를 다음 코드로 교체한다.

```css
.full-menu-section__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px 24px;
  list-style: none;
}

.full-menu-card {
  min-width: 0;
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(36, 26, 23, 0.08);
}

.full-menu-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #eee4d7;
  border-bottom: 1px solid var(--line);
}

.full-menu-card__image {
  width: 100%;
  height: 100%;
}

.full-menu-card__image--cover {
  object-fit: cover;
}

.full-menu-card__image--contain {
  object-fit: contain;
  padding: 12px;
  background: #f1e7d9;
}

.full-menu-card__body {
  min-height: 184px;
  padding: 22px;
  display: flex;
  flex-direction: column;
}

.full-menu-card h3 {
  font-size: 1.375rem;
  line-height: 1.35;
}

.full-menu-card p {
  margin-top: 10px;
  color: #796b61;
  font-size: 1rem;
  line-height: 1.6;
}

.full-menu-card strong {
  margin-top: auto;
  padding-top: 20px;
  color: var(--red);
  font-size: 1.125rem;
  line-height: 1.35;
}
```

기존 모바일 미디어 쿼리 바로 앞에 태블릿 규칙을 추가한다.

```css
@media (max-width: 1199px) {
  .full-menu-section__items {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

기존 `@media (max-width: 767px)` 안의 `.full-menu-section__items` 1열 규칙은 유지하고 다음 모바일 타이포그래피를 그 뒤에 추가한다.

```css
  .full-menu-card h3 {
    font-size: 1.125rem;
  }

  .full-menu-card__body {
    min-height: 170px;
    padding: 20px;
  }
```

- [ ] **Step 4: 자동 테스트·린트·프로덕션 빌드 실행**

Run: `npm.cmd test`

Expected: 모든 Node tests PASS.

Run: `npm.cmd run lint`

Expected: ESLint exits 0 with no warnings or errors.

Run: `npm.cmd run build`

Expected: Next.js production build exits 0 and `/menu` is listed without type or image errors.

- [ ] **Step 5: 로컬 화면을 1440px·1024px·390px에서 시각 검증**

Run: `npm.cmd run dev`

인앱 브라우저로 `http://localhost:3000/menu`를 열고 다음을 확인한다.

```text
1440px: 카드 3열, 메뉴명 22px, 음식 사진 자연스러운 채움, 카드 겹침 없음
1024px: 카드 2열, 분류 바로가기 4개, 가로 스크롤 없음
390px: 카드 1열, 메뉴명 18px, 설명 16px, 가격 18px, 버튼·텍스트 잘림 없음
주류: 병과 잔 전체가 보이고 contain 여백이 일관됨
오류 대체: 개발자 도구에서 한 이미지 경로를 임시로 잘못 지정했을 때 같은 분류 대표 사진 표시
범위: 화면 검색과 페이지 소스 모두 점심특선 없음, 카드와 JSON-LD 메뉴 합계 47
```

검증 후 임시로 바꾼 이미지 경로가 있다면 즉시 원래 값으로 복구하고 `npm.cmd test`를 한 번 더 실행한다.

- [ ] **Step 6: 최종 구현 커밋**

```powershell
git add app/globals.css tests/full-menu.test.mjs tests/menu-photo-grid.test.mjs
git commit -m "style: finish responsive three-column menu grid"
```

- [ ] **Step 7: 변경 범위와 작업 트리 확인**

Run: `git status --short`

Expected: 이 계획이 만든 변경은 모두 커밋되어 있고, 작업 전부터 있던 사용자 소유 변경만 남는다. `.gitignore`, `.superpowers/`, `GEO SEO SEO.pdf`, `components.json`, `dev-server.log`, 기존 계획·스케치 내보내기 파일은 수정하거나 삭제하지 않는다.

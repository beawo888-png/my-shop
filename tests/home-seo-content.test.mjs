import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("home renders the approved brand story and four Wangjing promises", async () => {
  const [story, koreanCopy] = await Promise.all([
    read("components/home/story-section.tsx"),
    read("lib/home-i18n/ko.ts"),
  ]);

  for (const phrase of [
    "한 번의 감동을,",
    "베이징 왕징(望京)",
    "한국에서도 많은 사람들이 같은 감동을 느낄 수 있는 양고기",
    "600일의 집념",
    "비법 숙성",
    "정교한 온도",
    "60분의 정성",
    "15가지 향신 재료",
    "초벌 180°C",
    "중간 400°C",
    "최종 180°C",
    "48시간 숙성",
    "60분 동안",
    "한 점의 양고기에도 시간을 담아",
  ]) {
    assert.ok(koreanCopy.includes(phrase), `Korean story should include ${phrase}`);
  }

  assert.match(story, /copy\.promises\.map/);
  assert.match(story, /copy\.paragraphs\.map/);
  assert.match(story, /<strong>\{copy\.closingStrong\}<\/strong>/);
  assert.doesNotMatch(story, /dangerouslySetInnerHTML/);
  assert.match(story, /className="story__promise-card"/);
  assert.match(koreanCopy, /label: "브랜드 스토리", href: "#story"/);
});

test("home describes Pangyo and Moran dining intent with branch actions", async () => {
  const [group, koreanCopy] = await Promise.all([
    read("components/home/group-dining-section.tsx"),
    read("lib/home-i18n/ko.ts"),
  ]);

  for (const phrase of [
    "판교 회식부터 모란 가족모임까지",
    "단체회식",
    "가족외식",
    "청첩장모임",
    "비즈니스 미팅",
    "데이트 · 기념일",
  ]) {
    assert.ok(koreanCopy.includes(phrase), `Korean group copy should include ${phrase}`);
  }

  assert.match(group, /LOCATIONS\.map/);
  assert.match(group, /branches\[location\.id\]/);
  assert.match(group, /copy\.occasions\.map/);
  assert.match(group, /copy\.features\.map/);
  assert.match(group, /guide\.transit/);
  assert.match(group, /guide\.parking/);
  assert.match(group, /booking\.url/);
  assert.match(group, /location\.mapUrl/);
  assert.match(group, /import Image from "next\/image"/);
  for (const asset of ["moran-group-dining.jpg", "pangyo-group-dining.jpg"]) {
    assert.ok(group.includes(asset), `group section should include ${asset}`);
  }
  assert.match(group, /className="group-seo__branch-image"/);
  assert.match(group, /alt=\{guide\.groupImageAlt\}/);
  for (const hook of [
    "group-seo__branch-top",
    "group-seo__principle-band",
    "group-seo__recommendation-grid",
    "group-seo__recommendation-card",
    "group-seo__feature-band",
  ]) {
    assert.ok(group.includes(hook), `group section should include ${hook}`);
  }
  for (const phrase of [
    "48시간 숙성",
    "400℃ 숯불",
    "60분 정성 구이",
    "모든 모임을 위한 공간",
  ]) {
    assert.ok(koreanCopy.includes(phrase), `Korean group copy should include ${phrase}`);
  }
});

test("home exposes two Restaurant entities and responsive SEO sections", async () => {
  const [page, structuredData, layout, css] = await Promise.all([
    read("components/home/localized-homepage.tsx"),
    read("lib/site-structured-data.ts"),
    read("app/layout.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /buildSiteRestaurantStructuredData/);
  assert.match(page, /type="application\/ld\+json"/);
  assert.match(structuredData, /"@type": "Restaurant"/);
  assert.match(structuredData, /LOCATIONS\.map/);
  assert.match(structuredData, /"@type": "PostalAddress"/);
  assert.match(structuredData, /servesCuisine/);
  assert.match(structuredData, /hasMenu/);
  assert.match(structuredData, /acceptsReservations/);
  assert.match(layout, /왕징양다리양꼬치 \| 판교·모란 통양다리구이·양꼬치/);
  assert.match(layout, /판교 회식/);
  assert.match(layout, /모란 가족모임/);
  assert.match(css, /\.story__standards\s*\{/);
  assert.match(css, /\.story__promise-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,/);
  assert.match(css, /\.group-seo__branch-grid\s*\{/);
  assert.match(
    css,
    /\.group-seo__branch-image\s*\{[^}]*aspect-ratio:\s*2\.35\s*\/\s*1;/,
  );
  assert.match(
    css,
    /\.group-seo__branch-image img\s*\{[^}]*object-fit:\s*cover;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.story__promise-grid[\s\S]*?grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.story__promise-grid[\s\S]*?grid-template-columns:\s*1fr;/,
  );
  const tabletStart = css.indexOf("@media (max-width: 1023px)");
  const mobileStart = css.indexOf("@media (max-width: 767px)", tabletStart);
  const tabletCss = css.slice(tabletStart, mobileStart);
  assert.doesNotMatch(
    tabletCss,
    /\.story__promise-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/,
    "PC and tablet widths should keep all four promise cards on one row",
  );
  assert.doesNotMatch(
    tabletCss,
    /\.group-seo__branch-grid\s*\{[^}]*grid-template-columns:\s*1fr;/,
    "PC and tablet widths should keep Moran and Pangyo branch cards on one row",
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.group-seo__branch-grid[\s\S]*?grid-template-columns:\s*1fr;/,
  );
});

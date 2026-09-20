import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8").catch(() => "");

test("shared homepage passes typed locale copy to every visible section", async () => {
  const page = await read("components/home/localized-homepage.tsx");
  assert.match(page, /type LocalizedHomepageProps = \{[\s\S]*?locale: Locale/);
  assert.match(page, /const copy = getHomeCopy\(locale\)/);
  for (const component of [
    "SiteHeader",
    "HeroSection",
    "SignatureMenuSection",
    "StorySection",
    "GroupDiningSection",
    "ReviewsSection",
    "LocationSection",
    "FaqSection",
    "ReservationBanner",
    "MobileBookingBar",
    "SiteFooter",
  ]) {
    assert.match(page, new RegExp(`<${component}\\b[^>]*\\bcopy=\\{copy\\.`));
  }
  assert.match(page, /lang=\{LOCALE_CONFIG\[locale\]\.htmlLang\}/);
});

test("root homepage renders the shared Korean implementation", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /<LocalizedHomepage locale="ko" \/>/);
});

test("homepage leaves require exact copy subsections", async () => {
  const sections = {
    "hero-section": "hero", "signature-menu-section": "signature",
    "story-section": "story", "group-dining-section": "group",
    "reviews-section": "reviews", "location-section": "locations",
    "faq-section": "faq", "reservation-banner": "reservation",
    "mobile-booking-bar": "mobileBooking", "site-footer": "footer",
  };
  for (const [file, subsection] of Object.entries(sections)) {
    const source = await read(`components/home/${file}.tsx`);
    assert.match(source, new RegExp(`copy: HomeCopy\\["${subsection}"\\]`));
    assert.doesNotMatch(source, /[가-힣]/, `${file} must not own Korean copy`);
  }
});

test("section components expose the approved anchor IDs", async () => {
  const files = await Promise.all(
    [
      "signature-menu-section.tsx",
      "story-section.tsx",
      "group-dining-section.tsx",
      "reviews-section.tsx",
      "location-section.tsx",
      "faq-section.tsx",
      "reservation-banner.tsx",
    ].map((name) => read(`components/home/${name}`)),
  );
  for (const [index, id] of [
    "menu",
    "story",
    "group",
    "reviews",
    "location",
    "faq",
    "reservation",
  ].entries()) {
    assert.match(files[index], new RegExp(`id=["']${id}["']`));
  }
});

test("group branch details keep labels on one line and round only their actions", async () => {
  const [groupDining, css] = await Promise.all([
    read("components/home/group-dining-section.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(groupDining, /copy\.detailLabels\[index\]/);
  assert.match(
    css,
    /\.group-seo__branch-card dt\s*\{[^}]*white-space:\s*nowrap;/s,
  );
  assert.match(
    css,
    /\.group-seo__actions \.button\s*\{[^}]*border-radius:\s*8px;/s,
  );
});

test("homepage signature section renders four native autoplay videos", async () => {
  const section = await read("components/home/signature-menu-section.tsx");

  for (const videoName of [
    "signature-01.mp4",
    "signature-02.mp4",
    "signature-03.mp4",
    "signature-04.mp4",
  ]) {
    assert.match(section, new RegExp(`/videos/signature/${videoName}`));
  }

  assert.match(section, /className="signature-video-grid"/);
  assert.match(section, /SIGNATURE_VIDEOS\.map/);
  assert.match(section, /<video/);
  assert.match(section, /src=\{video\.src\}/);
  assert.match(section, /aria-label=\{copy\.videoLabels\[index\]\}/);
  assert.match(section, /autoPlay/);
  assert.match(section, /muted/);
  assert.match(section, /loop/);
  assert.match(section, /playsInline/);
  assert.match(section, /preload="metadata"/);
  assert.doesNotMatch(section, /<iframe|instagram\.com\/p\/|MENU_ITEMS\.map|menu-card__image/);
});

test("homepage Instagram videos use a responsive four-two-one column layout", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.signature-video-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 1023px\)[\s\S]*?\.signature-video-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.signature-video-grid\s*\{[^}]*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /\.signature-video-card__frame\s*\{[^}]*aspect-ratio:/,
  );
  assert.match(
    css,
    /\.signature-video-card__frame video\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*object-fit:\s*cover;/,
  );
});

test("homepage reviews section links to the branch selector", async () => {
  const section = await read("components/home/reviews-section.tsx");
  assert.match(section, /import Link from "next\/link"/);
  assert.match(section, /href="\/reviews"/);
  assert.match(section, /\{copy\.action\}/);
  assert.doesNotMatch(section, /REVIEWS\.map|review-card|blockquote/);
  assert.match(section, /id="reviews"/);
});

test("reviews page renders two safe Naver review choices", async () => {
  const [page, card] = await Promise.all([
    read("app/reviews/page.tsx"),
    read("components/reviews/review-location-card.tsx"),
  ]);

  assert.match(page, /export const metadata: Metadata/);
  assert.match(
    page,
    /https:\/\/xn--vr0bn4e2wh79mca68ih9mf4j\.com\/reviews/,
  );
  assert.match(page, /LOCATIONS\.map/);
  assert.match(page, /<ReviewLocationCard/);
  assert.match(page, /import \{ SiteHeader \} from "@\/components\/home\/site-header"/);
  assert.match(page, /<SiteHeader homePath="\/" \/>/);
  assert.doesNotMatch(page, /reviews-page__header|brand-logo--menu/);
  assert.match(page, /지점별 고객 리뷰/);
  assert.match(page, /className="reviews-page__lead"/);
  assert.match(card, /href=\{location\.reviewUrl\}/);
  assert.match(card, /href=\{location\.kakaoReviewUrl\}/);
  assert.match(card, /href=\{location\.googleReviewUrl\}/);
  assert.match(card, /target="_blank"/);
  assert.match(card, /rel="noreferrer"/);
  assert.match(card, /className="review-location-card__actions"/);
  assert.match(card, /\$\{location\.shortName\} 네이버 플레이스 리뷰 열기/);
  assert.match(
    card,
    /<span>네이버 플레이스<\/span>[\s\S]*?<span>리뷰 보기<\/span>/,
  );
  assert.match(
    card,
    /<span>카카오맵<\/span>[\s\S]*?<span>리뷰 보기<\/span>/,
  );
  assert.match(card, /<span>구글<\/span>[\s\S]*?<span>리뷰 보기<\/span>/);
  assert.doesNotMatch(card, /↗/);
});

test("review buttons use the approved platform colors", async () => {
  const [card, css] = await Promise.all([
    read("components/reviews/review-location-card.tsx"),
    read("app/globals.css"),
  ]);

  for (const platform of ["naver", "kakao", "google"]) {
    assert.match(card, new RegExp(`review-location-card__button--${platform}`));
  }
  assert.match(
    css,
    /\.review-location-card__button--naver\s*\{[^}]*background:\s*#03c75a;[^}]*border-color:\s*#02ad4f;[^}]*color:\s*#fff;/s,
  );
  assert.match(
    css,
    /\.review-location-card__button--kakao\s*\{[^}]*background:\s*#fee500;[^}]*border-color:\s*#e4ce00;[^}]*color:\s*#191919;/s,
  );
  assert.match(
    css,
    /\.review-location-card__button--google\s*\{[^}]*background:\s*#4285f4;[^}]*border-color:\s*#2f6fd8;[^}]*color:\s*#fff;/s,
  );
});

test("reviews page uses a responsive two-to-one column layout", async () => {
  const css = await read("app/globals.css");
  assert.match(
    css,
    /\.reviews-page__grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.reviews-page__grid[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(css, /\.reviews__action/);
  assert.match(css, /\.review-location-card/);
  assert.match(
    css,
    /\.site-header\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?z-index:\s*50;/,
  );
  assert.match(
    css,
    /\.reviews-page\s*\{[\s\S]*?background:\s*var\(--cream\);/,
  );
  assert.match(
    css,
    /\.reviews-page__hero\s*\{[\s\S]*?background:[\s\S]*?var\(--ink-soft\);/,
  );
  assert.match(
    css,
    /\.review-location-card\s*\{[\s\S]*?min-height:\s*260px;/,
  );
  assert.match(
    css,
    /\.review-location-card__actions\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/,
  );
  assert.match(
    css,
    /\.review-location-card__button\s*\{[\s\S]*?border-radius:\s*10px;/,
  );
  assert.match(
    css,
    /\.reviews-page__lead\s*\{[\s\S]*?white-space:\s*nowrap;/,
  );
  assert.match(
    css,
    /\.review-location-card__button\s*\{[\s\S]*?flex-direction:\s*column;[\s\S]*?align-items:\s*center;[\s\S]*?background:\s*#e7e1da;[\s\S]*?border-color:\s*#cfc5ba;[\s\S]*?color:\s*var\(--ink-soft\);/,
  );
  assert.match(
    css,
    /\.review-location-card__button span\s*\{[\s\S]*?white-space:\s*nowrap;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.review-location-card__actions\s*\{[\s\S]*?grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.reviews-page__lead\s*\{[\s\S]*?white-space:\s*normal;/,
  );
});

test("home header uses a larger logo without changing other pages", async () => {
  const [page, header, reviews, css] = await Promise.all([
    read("components/home/localized-homepage.tsx"),
    read("components/home/site-header.tsx"),
    read("app/reviews/page.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /<SiteHeader\b[^>]* home \/>/);
  assert.match(header, /home\?: boolean/);
  assert.match(header, /site-header--home/);
  assert.match(header, /\(max-width: 767px\) 170px, 250px/);
  assert.doesNotMatch(reviews, /<SiteHeader\s+home(?:\s|\/>)/);
  assert.match(
    css,
    /\.site-header--home \.brand-logo--header\s*\{[^}]*width:\s*clamp\(200px,\s*19vw,\s*250px\);/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.site-header--home \.brand-logo--header\s*\{[^}]*width:\s*170px;/,
  );
});

test("external actions use safe links and accessible labels", async () => {
  const files = await Promise.all(
    [
      "hero-section.tsx",
      "location-section.tsx",
      "location-card.tsx",
      "reservation-banner.tsx",
      "mobile-booking-bar.tsx",
    ].map((name) => read(`components/home/${name}`)),
  );
  const source = files.join("\n");
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer"/);
  assert.match(source, /\{copy\.naver\}/);
  assert.match(source, /\{copy\.phone\}/);
});

test("mobile menu exposes its state and target", async () => {
  const [header, css] = await Promise.all([
    read("components/home/site-header.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(header, /^"use client";/m);
  assert.match(header, /aria-expanded=\{open\}/);
  assert.match(header, /aria-controls="mobile-navigation"/);
  assert.match(header, /id="mobile-navigation"/);
  assert.match(header, /setOpen\(false\)/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.desktop-nav\s*\{[\s\S]*?display:\s*none;/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.menu-toggle\s*\{[\s\S]*?display:\s*inline-grid;/,
  );
});

test("translated content wraps naturally and stacks narrow detail rows", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /div:is\(\[lang="en"\], \[lang="zh-CN"\], \[lang="ja"\]\)\s*\{[^}]*word-break:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s);
  assert.match(css, /div:is\(\[lang="en"\], \[lang="zh-CN"\], \[lang="ja"\]\) \.group-seo__branch-heading\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(css, /div:is\(\[lang="en"\], \[lang="zh-CN"\], \[lang="ja"\]\) \.group-seo__branch-card dl > div,[\s\S]*?\.location-card__details > div\s*\{[^}]*grid-template-columns:\s*1fr;/);
  assert.match(css, /@media \(max-width: 767px\)\s*\{\s*\.group-seo__occasions\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
});

test("tablet branch headers stack for every locale while the branch grid stays two columns", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /@media \(max-width: 1100px\)\s*\{\s*\.group-seo__branch-top\s*\{[^}]*grid-template-columns:\s*1fr;/s);
  assert.match(css, /\.group-seo__branch-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s);
  assert.doesNotMatch(css, /@media \(max-width: 1100px\)\s*\{(?:(?!@media)[\s\S])*\.group-seo__branch-grid/);
});

test("tablet header keeps all primary navigation buttons visible in two rows", async () => {
  const [css, pencilSource] = await Promise.all([
    read("app/globals.css"),
    read("초안"),
  ]);
  const pencil = JSON.parse(pencilSource);
  const tabletHeader = pencil.children.find(
    (child) => child.id === "wangjing-tablet-header",
  );

  assert.equal(tabletHeader?.width, 910);
  assert.equal(tabletHeader?.height, 132);
  assert.match(
    tabletHeader?.children?.[1]?.name ?? "",
    /브랜드 스토리 → 대표 메뉴 → 지점 안내 → 단체 모임 → 자주 묻는 질문 · 항상 표시/,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.site-header\s*\{[\s\S]*?grid-template-rows:\s*76px 56px;/,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.desktop-nav\s*\{[\s\S]*?display:\s*flex;/,
  );
  assert.match(
    css,
    /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.menu-toggle\s*\{[\s\S]*?display:\s*none;/,
  );
});

test("header exposes an accessible language selector and keeps mobile branch booking", async () => {
  const [header, selector, css] = await Promise.all([
    read("components/home/site-header.tsx"),
    read("components/home/language-selector.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(header, /<LanguageSelector locale=\{locale\}/);
  assert.match(header, /mobile-nav__languages/);
  assert.match(header, /HOME_LOCALES\.map/);
  assert.match(header, /mobile-nav__booking/);
  assert.match(header, /BOOKING_LOCATIONS\.map/);
  assert.doesNotMatch(header, /header-booking__trigger/);
  assert.match(selector, /aria-haspopup="true"/);
  assert.match(selector, /aria-expanded=\{open\}/);
  assert.match(selector, /aria-current=\{targetLocale === currentLocale \? "page" : undefined\}/);
  assert.match(selector, /document\.addEventListener\("pointerdown"/);
  assert.match(selector, /event\.key === "Escape"/);
  assert.match(selector, /triggerRef\.current\?\.focus\(\)/);
  assert.match(selector, /window\.location\.hash/);
  assert.match(selector, /event\.metaKey/);
  assert.match(selector, /event\.ctrlKey/);
  assert.match(selector, /event\.shiftKey/);
  assert.match(selector, /event\.altKey/);
  assert.match(selector, /event\.button !== 0/);
  assert.match(selector, /onAuxClick/);
  assert.match(selector, /buildLocaleHref/);
  assert.match(selector, /onSelect\?\.\(targetLocale === currentLocale\)/);
  assert.match(selector, /onSelect=\{\(sameLocale\) =>/);
  assert.match(selector, /if \(sameLocale\) \{/);
  assert.match(header, /const menuToggleRef = useRef<HTMLButtonElement>\(null\)/);
  assert.match(header, /ref=\{menuToggleRef\}/);
  assert.match(header, /menuToggleRef\.current\?\.focus\(\)/);

  for (const className of [
    "language-selector",
    "language-selector__trigger",
    "language-selector__menu",
    "mobile-nav__languages",
  ]) {
    assert.match(css, new RegExp(`\\.${className}`));
  }
  assert.match(css, /\.language-selector__trigger\s*\{[^}]*min-height:\s*48px;/s);
  assert.match(
    css,
    /\.language-selector__trigger:hover,\s*\.language-selector__trigger:focus-visible\s*\{[^}]*color:\s*var\(--gold\);[^}]*border-color:\s*var\(--gold\);/s,
  );
  assert.match(
    css,
    /\.language-selector__menu a\[aria-current="page"\]\s*\{[^}]*color:\s*var\(--gold\);/s,
  );
  assert.match(
    css,
    /\.mobile-nav__languages a\[aria-current="page"\]\s*\{[^}]*color:\s*var\(--gold\);/s,
  );
});

test("expanded mobile navigation remains scrollable above the fixed booking bar", async () => {
  const [header, css] = await Promise.all([
    read("components/home/site-header.tsx"),
    read("app/globals.css"),
  ]);

  assert.equal(header.match(/BOOKING_LOCATIONS\.map/g)?.length, 1);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.mobile-nav\s*\{[^}]*max-height:\s*calc\(100dvh - 72px - 76px\);[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/s,
  );
});

test("global styles contain brand tokens and responsive contracts", async () => {
  const css = await read("app/globals.css");
  for (const token of [
    "--ink: #17110f",
    "--cream: #f6f0e5",
    "--gold: #c5a15a",
    "--red: #8f1d1d",
  ]) {
    assert.match(css.toLowerCase(), new RegExp(token));
  }
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.mobile-booking/);
  assert.match(css, /position: fixed/);
});

test("layout declares Korean language and homepage owns Wangjing metadata", async () => {
  const [layout, koreanCopy, page] = await Promise.all([
    read("app/layout.tsx"), read("lib/home-i18n/ko.ts"), read("app/page.tsx"),
  ]);
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /판교왕징 \| 판교 양꼬치·중국 양고기 다이닝/);
  assert.match(koreanCopy, /대왕판교로606번길/);
  assert.match(page, /export const metadata = buildHomeMetadata\("ko"\)/);
});

test("location section renders two data-driven branch cards", async () => {
  const [section, card, css] = await Promise.all([
    read("components/home/location-section.tsx"),
    read("components/home/location-card.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(section, /import \{ LOCATIONS \}/);
  assert.match(section, /import \{ LocationCard \}/);
  assert.match(section, /LOCATIONS\.map/);
  assert.match(section, /\{copy\.title\}/);
  assert.match(section, /\{copy\.description\}/);
  assert.match(section, /href=\{location\.mapUrl\}/);
  assert.match(section, /target="_blank"/);
  assert.match(section, /rel="noreferrer"/);
  assert.match(section, /copy\.placeAria/);
  assert.match(section, /copy=\{branches\[location\.id\]\}/);
  assert.match(section, /labels=\{copy\}/);
  assert.doesNotMatch(section, /#location-/);

  assert.match(card, /from "next\/image"/);
  assert.match(card, /id=\{`location-\$\{location\.id\}`\}/);
  assert.match(card, /location\.phoneHref/);
  assert.match(card, /<dt>\{labels\.labels\.parking\}<\/dt>/);
  assert.doesNotMatch(card, /주차장 이용방법/);
  assert.match(card, /copy\.parking/);
  assert.match(card, /className="location-card__actions"/);
  assert.match(card, /location\.mapUrl/);
  assert.match(card, /location\.googleDirectionsUrl/);
  assert.match(card, /labels\.naverDirections/);
  assert.match(card, /labels\.googleDirections/);
  assert.match(card, /\$\{copy\.shortName\} \$\{labels\.naverDirectionsAria\}/);
  assert.match(card, /\$\{copy\.shortName\} \$\{labels\.googleDirectionsAria\}/);
  assert.match(card, /copy: BranchCopy/);
  assert.match(card, /labels: HomeCopy\["locations"\]/);
  assert.match(card, /location\.address/);
  assert.match(card, /location\.phoneDisplay/);
  assert.doesNotMatch(card, /[가-힣]/);
  assert.equal(card.match(/target="_blank"/g)?.length, 2);
  assert.equal(card.match(/rel="noreferrer"/g)?.length, 2);

  assert.match(
    css,
    /\.location-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/,
  );
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.location-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(css, /\.location-jump\s*\{[\s\S]*?min-height:\s*48px/);
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
});

test("header uses the approved logo and footer uses the Wangjing brand name", async () => {
  const [brandLogo, header, footer, css] = await Promise.all([
    read("components/home/brand-logo.tsx"),
    read("components/home/site-header.tsx"),
    read("components/home/site-footer.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(brandLogo, /from "next\/image"/);
  assert.match(brandLogo, /src="\/images\/wangjing\/wangjing-logo\.jpg"/);
  assert.match(brandLogo, /width=\{1339\}/);
  assert.match(brandLogo, /height=\{451\}/);
  assert.match(brandLogo, /alt=""/);
  assert.match(header, /BrandLogo/);
  assert.match(header, /brand-logo--header/);
  assert.match(header, /aria-label=\{copy\.homeAria\}/);
  assert.doesNotMatch(header, /SITE\.(?:hanja|name)/);
  assert.match(footer, /<h2 id="footer-brand">\{copy\.brandName\}<\/h2>/);
  assert.match(footer, /\{copy\.legal\}/);
  assert.match(css, /\.brand-logo\s*\{[\s\S]*?mix-blend-mode: screen;/);

  const headerRule = css.match(/\.site-header\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(headerRule, /isolation: isolate;/);
  assert.match(headerRule, /background: var\(--ink\);/);
});

test("reference footer renders the approved four-column information layout", async () => {
  const [footer, css] = await Promise.all([
    read("components/home/site-footer.tsx"),
    read("app/globals.css"),
  ]);

  const brandIndex = footer.indexOf('className="site-footer__brand"');
  const moranIndex = footer.indexOf("MORAN");
  const pangyoIndex = footer.indexOf("PANGYO");
  const navIndex = footer.indexOf('className="site-footer__nav"');

  assert.match(footer, /<footer id="footer" className="site-footer">/);
  assert.ok(brandIndex >= 0);
  assert.ok(brandIndex < moranIndex);
  assert.ok(moranIndex < pangyoIndex);
  assert.ok(pangyoIndex < navIndex);
  assert.match(footer, /PREMIUM CHINESE LAMB DINING/);
  assert.match(footer, /https:\/\/www\.instagram\.com\/wangjingyangdali_official\//);
  assert.match(footer, /https:\/\/www\.youtube\.com\/@wangjing_lamb/);
  assert.match(footer, /https:\/\/place\.map\.kakao\.com\/1387600612/);
  assert.match(footer, /https:\/\/www\.tiktok\.com\/@wangjing_lamb/);
  assert.match(footer, /href=\{moran\.phoneHref\}/);
  assert.match(footer, /href=\{pangyo\.phoneHref\}/);
  assert.match(footer, /href="\/menu"/);
  assert.match(footer, /href=\{`\$\{homePath\}#group`\}/);
  assert.match(footer, /href=\{`\$\{homePath\}#reservation`\}/);
  assert.match(footer, /\{copy\.legal\}/);
  assert.match(footer, /@wangjingyangdali_official/);
  assert.match(
    css,
    /\.site-footer__main\s*\{[\s\S]*?grid-template-columns:\s*1\.15fr 1fr 1fr 0\.8fr;/,
  );
});

test("FAQ section renders accessible independently controlled items", async () => {
  const [page, section, item, css] = await Promise.all([
    read("components/home/localized-homepage.tsx"),
    read("components/home/faq-section.tsx"),
    read("components/home/faq-accordion-item.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(page, /import \{ FaqSection \}/);
  assert.match(page, /<FaqSection copy=\{copy\.faq\} \/>/);
  assert.match(section, /copy\.items\.map/);
  assert.match(section, /<FaqAccordionItem/);
  assert.match(section, /id="faq"/);
  assert.match(section, /\{copy\.title\}/);
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

test("desktop language selector uses the approved compact size", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.language-selector__trigger\s*\{[\s\S]*?min-height:\s*48px;[\s\S]*?padding:\s*0 1\.25rem;[\s\S]*?font-size:\s*0\.95rem;/,
  );
  assert.match(
    css,
    /\.language-selector__trigger svg\s*\{[\s\S]*?width:\s*16px;[\s\S]*?height:\s*16px;/,
  );
});

test("footer social links render recognizable platform brand icons", async () => {
  const [footer, css] = await Promise.all([
    read("components/home/site-footer.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(footer, /function SocialIcon/);
  for (const platform of ["instagram", "youtube", "kakao", "tiktok"]) {
    assert.match(footer, new RegExp(`icon: "${platform}"`));
    assert.match(footer, new RegExp(`case "${platform}"`));
  }
  assert.match(footer, /<SocialIcon platform=\{social\.icon\} \/>/);
  assert.match(footer, /aria-hidden="true"/);
  assert.match(css, /\.site-footer__social-icon\s*\{[\s\S]*?width:\s*18px;[\s\S]*?height:\s*18px;/);
  assert.match(css, /\.site-footer__socials a\s*\{[\s\S]*?white-space:\s*nowrap;/);
});

test("hero renders the approved autoplaying promotional video", async () => {
  const hero = await read("components/home/hero-section.tsx");

  assert.match(hero, /className="hero__poster"/);
  assert.match(hero, /<video[\s\S]*className="hero__video"/);
  assert.match(hero, /autoPlay/);
  assert.match(hero, /muted/);
  assert.match(hero, /loop/);
  assert.match(hero, /playsInline/);
  assert.match(hero, /preload="metadata"/);
  assert.match(hero, /poster="\/images\/wangjing\/hero-skewers\.png"/);
  assert.match(hero, /aria-hidden="true"/);
  assert.match(hero, /tabIndex=\{-1\}/);
  assert.match(
    hero,
    /<source\s+src="\/videos\/wangjing\/lamb-leg-promo\.mp4"\s+type="video\/mp4"/,
  );
  assert.doesNotMatch(hero, /<video[\s\S]*?controls/);
});

test("hero video fills the background and respects reduced motion", async () => {
  const css = await read("app/globals.css");

  assert.match(
    css,
    /\.hero__poster,\s*\.hero__video\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?object-fit:\s*cover;[\s\S]*?pointer-events:\s*none;/,
  );
  assert.match(css, /\.hero__video\s*\{[\s\S]*?z-index:\s*-2;/);
  assert.match(css, /\.hero__poster\s*\{[\s\S]*?z-index:\s*-3;/);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.hero__poster,\s*\.hero__video\s*\{[\s\S]*?object-position:\s*58% center;/,
  );
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hero__video\s*\{[\s\S]*?display:\s*none;/,
  );
});

test("hero uses the two-location copy without overlay actions or summary cards", async () => {
  const [hero, css] = await Promise.all([
    read("components/home/hero-section.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(hero, /\{copy\.eyebrow\}/);
  assert.match(hero, /\{copy\.titleLine1\}/);
  assert.match(hero, /\{copy\.titleLine2\}/);
  assert.match(
    hero,
    /\{copy\.leadLine1\}[\s\S]*\{copy\.leadLine2\}/,
  );
  assert.doesNotMatch(hero, /PANGYO · CHINESE LAMB DINING/);
  assert.doesNotMatch(hero, /hero__actions/);
  assert.doesNotMatch(hero, /trust-bar/);
  assert.doesNotMatch(hero, /TRUST_ITEMS/);
  assert.match(css, /\.hero\s*\{[^}]*min-height:\s*730px;/s);
  assert.match(
    css,
    /@media \(max-width: 767px\)[\s\S]*?\.hero\s*\{[^}]*min-height:\s*740px;/,
  );
});

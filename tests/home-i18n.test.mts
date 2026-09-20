import assert from "node:assert/strict";
import { test } from "node:test";
import { HOME_COPY, HOME_LOCALES, HOME_HASHES, LOCALIZED_LOCALES, LOCALE_CONFIG, buildLocaleHref, getHomeCopy, getHomePath, isLocale, isLocalizedLocale } from "../lib/home-i18n/index";
import { FAQ_ITEMS } from "../lib/faq-content";
import { BOOKING_LOCATIONS, LOCATIONS } from "../lib/site-content";
import { buildSiteRestaurantStructuredData } from "../lib/site-structured-data";

test("home locale registry exposes the four approved languages and paths", () => {
  assert.deepEqual(HOME_LOCALES, ["ko", "en", "zh", "ja"]);
  assert.deepEqual(LOCALIZED_LOCALES, ["en", "zh", "ja"]);
  assert.deepEqual(HOME_LOCALES.map(getHomePath), ["/", "/en", "/zh", "/ja"]);
  assert.deepEqual(HOME_LOCALES.map((locale) => LOCALE_CONFIG[locale].label), ["한국어", "English", "简体中文", "日本語"]);
});

test("every locale has the same navigation, six FAQs, two branches, and four promises", () => {
  for (const locale of HOME_LOCALES) {
    const copy = HOME_COPY[locale];
    assert.equal(copy.header.nav.length, 5);
    assert.deepEqual(copy.header.nav.map((item) => item.href), ["#story", "/menu", "#location", "#group", "#faq"]);
    assert.deepEqual(copy.header.nav.map((item) => "newTab" in item ? item.newTab : undefined), [undefined, true, undefined, undefined, undefined]);
    assert.equal(copy.story.promises.length, 4);
    assert.equal(copy.faq.items.length, 6);
    assert.deepEqual(copy.faq.items.map((item) => item.id), ["lamb-aroma", "whole-lamb-order", "group-dining", "parking", "reservation", "other-menu"]);
    assert.deepEqual(Object.keys(copy.branches), ["moran", "pangyo"]);
    assert.equal(getHomeCopy(locale), copy);
  }
  assert.equal(FAQ_ITEMS, HOME_COPY.ko.faq.items);
});

test("foreign display-copy modules contain no accidental Hangul", () => {
  for (const locale of LOCALIZED_LOCALES) assert.doesNotMatch(JSON.stringify(HOME_COPY[locale]), /[가-힣]/);
});

test("foreign copy uses natural pre-wedding gathering terms", () => {
  for (const [locale, preferred, literal] of [
    ["en", "pre-wedding gatherings", /wedding-invitation gatherings/i],
    ["zh", "婚前聚会", /婚礼请柬聚会/],
    ["ja", "結婚報告の食事会", /結婚式招待状のお渡し会|結婚式の招待状を渡す集まり/],
  ] as const) {
    const source = JSON.stringify(HOME_COPY[locale]);
    assert.ok(source.toLowerCase().includes(preferred), `${locale} should use ${preferred}`);
    assert.doesNotMatch(source, literal);
  }
});

for (const locale of LOCALIZED_LOCALES) {
  test(`${locale} display copy does not duplicate official road-name facts`, () => {
    assert.doesNotMatch(
      JSON.stringify(HOME_COPY[locale]),
      /Daewangpangyo-ro|606beon-gil|大王板桥路|606番街|大王板橋路|606番キル/,
    );
  });
}

test("Simplified Chinese uses approved simplified forms", () => {
  const source = JSON.stringify(HOME_COPY.zh);
  for (const word of ["简体中文", "常见问题", "预约", "停车", "菜单"]) assert.ok(source.includes(word), `Chinese copy should include ${word}`);
  assert.doesNotMatch(source, /簡體中文|常見問題|預約|停車|菜單/);
});

test("critical numeric business facts remain present in every locale", () => {
  const required = ["15", "24", "48", "400", "60", "1,700", "1,500", "90,000", "80,000", "46", "70", "215", "266", "4", "3"];
  for (const locale of HOME_LOCALES) {
    const source = JSON.stringify(HOME_COPY[locale]);
    for (const fact of required) assert.ok(source.includes(fact), `${locale} should preserve ${fact}`);
  }
});

test("locale URL helper preserves only approved homepage hashes", () => {
  assert.equal(buildLocaleHref("ko", "#faq"), "/#faq");
  assert.equal(buildLocaleHref("en", "#group"), "/en#group");
  assert.equal(buildLocaleHref("zh", "#reservation"), "/zh#reservation");
  assert.equal(buildLocaleHref("ja", "#not-approved"), "/ja");
  assert.equal(buildLocaleHref("en", ""), "/en");
  assert.equal(buildLocaleHref("en"), "/en");
  for (const hash of HOME_HASHES) assert.equal(buildLocaleHref("ja", hash), `/ja${hash}`);
  for (const value of ["fr", "EN", "", "en/../", "#faq"]) assert.equal(isLocale(value), false);
  for (const locale of HOME_LOCALES) assert.equal(isLocale(locale), true);
  assert.equal(isLocalizedLocale("en"), true);
  assert.equal(isLocalizedLocale("ko"), false);
  assert.equal(isLocalizedLocale("fr"), false);
});

test("FAQ segment boundaries and complete emphasized facts are preserved", () => {
  for (const locale of HOME_LOCALES) {
    const items = getHomeCopy(locale).faq.items;
    assert.deepEqual(items.map((item) => item.answer.map((segment) => segment.strong === true)), [[false], [false, true, false, true, false], [false, true, false, true, false], [false], [false], [false]]);
    for (const [index, facts] of [[1, ["1,700", "3~4", "90,000"]], [3, ["1,500", "2~3", "80,000"]]] as const) {
      for (const fact of facts) assert.ok(items[1].answer[index].text.includes(fact), `${locale}: emphasized ${fact}`);
    }
    assert.ok(items[2].answer[1].text.includes("46"));
    assert.ok(items[2].answer[3].text.includes("70"));
  }
});

test("each homepage has localized metadata and the exact reciprocal language map", async () => {
  const { buildHomeMetadata } = await import("../lib/home-metadata");
  const languages = { "ko-KR": "/", en: "/en", "zh-CN": "/zh", ja: "/ja", "x-default": "/" };
  for (const locale of HOME_LOCALES) {
    const copy = getHomeCopy(locale);
    const metadata = buildHomeMetadata(locale);
    assert.deepEqual(metadata.alternates, { canonical: getHomePath(locale), languages });
    assert.equal(metadata.title, copy.metadata.title);
    assert.equal(metadata.description, copy.metadata.description);
    assert.deepEqual(metadata.openGraph, {
      title: copy.metadata.title,
      description: copy.metadata.ogDescription,
      locale: LOCALE_CONFIG[locale].openGraphLocale,
      type: "website",
      url: getHomePath(locale),
    });
  }
});

test("localized Restaurant JSON-LD translates descriptions and preserves official facts", () => {
  const siteUrl = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";
  for (const locale of HOME_LOCALES) {
    const copy = getHomeCopy(locale).structuredData;
    const homeUrl = `${siteUrl}${locale === "ko" ? "" : getHomePath(locale)}`;
    const data = buildSiteRestaurantStructuredData(locale, copy);
    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@graph"].length, 2);
    for (const [index, location] of LOCATIONS.entries()) {
      assert.deepEqual(data["@graph"][index], {
        "@type": "Restaurant",
        "@id": `${homeUrl}#restaurant-${location.id}`,
        name: location.name,
        description: copy.description[location.id],
        url: `${homeUrl}#location-${location.id}`,
        image: `${siteUrl}${location.image}`,
        telephone: location.phoneDisplay,
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: copy.addressLocality,
          addressRegion: copy.addressRegion,
          addressCountry: "KR",
        },
        servesCuisine: copy.cuisines,
        hasMenu: `${siteUrl}/menu`,
        acceptsReservations: BOOKING_LOCATIONS.find((booking) => booking.id === location.id)?.url,
        sameAs: [location.mapUrl, location.reviewUrl],
      });
    }
  }
});

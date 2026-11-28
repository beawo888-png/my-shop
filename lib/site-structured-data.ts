import { BOOKING_LOCATIONS, BRAND_CHANNELS, LOCATIONS } from "@/lib/site-content";
import { getHomePath, type HomeCopy, type Locale } from "@/lib/home-i18n";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

/** 카카오맵 장소 주소에서 '#review' 같은 화면 위치 표시를 뗀다. */
function stripHash(url: string) {
  return url.split("#")[0];
}

export function buildSiteRestaurantStructuredData(
  locale: Locale,
  copy: HomeCopy["structuredData"],
) {
  const pagePath = getHomePath(locale);
  const homeUrl = `${SITE_URL}${pagePath === "/" ? "" : pagePath}`;

  return {
    "@context": "https://schema.org",
    "@graph": LOCATIONS.map((location) => {
      const booking = BOOKING_LOCATIONS.find((item) => item.id === location.id);

      return {
        "@type": "Restaurant",
        "@id": `${homeUrl}#restaurant-${location.id}`,
        name: location.name,
        description: copy.description[location.id],
        url: `${homeUrl}#location-${location.id}`,
        image: `${SITE_URL}${location.image}`,
        telephone: location.phoneDisplay,
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: copy.addressLocality,
          addressRegion: copy.addressRegion,
          addressCountry: "KR",
        },
        servesCuisine: copy.cuisines,
        hasMenu: `${SITE_URL}/menu`,
        acceptsReservations: booking?.url,
        openingHoursSpecification: location.openingHours.map((hours) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: hours.days,
          opens: hours.opens,
          closes: hours.closes,
        })),
        sameAs: [
          location.mapUrl,
          location.reviewUrl,
          stripHash(location.kakaoReviewUrl),
          ...BRAND_CHANNELS,
        ],
      };
    }),
  };
}

/** 홈 화면 FAQ를 그대로 FAQPage 구조화 데이터로 만든다. 화면 문구와 똑같아야 한다. */
export function buildSiteFaqStructuredData(
  locale: Locale,
  faq: HomeCopy["faq"],
) {
  const pagePath = getHomePath(locale);
  const homeUrl = `${SITE_URL}${pagePath === "/" ? "" : pagePath}`;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${homeUrl}#faq`,
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.map((segment) => segment.text).join(""),
      },
    })),
  };
}

import { BOOKING_LOCATIONS, LOCATIONS } from "@/lib/site-content";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export function buildSiteRestaurantStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": LOCATIONS.map((location) => {
      const booking = BOOKING_LOCATIONS.find((item) => item.id === location.id);

      return {
        "@type": "Restaurant",
        "@id": `${SITE_URL}/#restaurant-${location.id}`,
        name: location.name,
        description: `${location.shortName}에서 48시간 숙성과 고온 숯불로 완성한 통양다리구이, 양꼬치와 중국요리를 제공합니다.`,
        url: `${SITE_URL}/#location-${location.id}`,
        image: `${SITE_URL}${location.image}`,
        telephone: location.phoneDisplay,
        address: {
          "@type": "PostalAddress",
          streetAddress: location.address,
          addressLocality: "성남시",
          addressRegion: "경기도",
          addressCountry: "KR",
        },
        servesCuisine: ["중국 요리", "양고기 요리", "양꼬치", "통양다리구이"],
        hasMenu: `${SITE_URL}/menu`,
        acceptsReservations: booking?.url,
        sameAs: [location.mapUrl, location.reviewUrl],
      };
    }),
  };
}

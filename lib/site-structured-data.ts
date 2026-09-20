import { BOOKING_LOCATIONS, LOCATIONS } from "@/lib/site-content";
import { getHomePath, type HomeCopy, type Locale } from "@/lib/home-i18n";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

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
        sameAs: [location.mapUrl, location.reviewUrl],
      };
    }),
  };
}

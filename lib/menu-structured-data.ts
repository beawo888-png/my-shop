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

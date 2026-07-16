import { PANGYO_MENU_GROUPS } from "@/lib/menu-content";

const siteUrl = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export function buildPangyoMenuStructuredData(
  groups = PANGYO_MENU_GROUPS,
  path = "/menu",
) {
  const menuName =
    groups.length === 1 ? `${groups[0].title} 메뉴` : "왕징양다리양꼬치 판교점 전체 메뉴";

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: menuName,
    url: new URL(path, siteUrl).toString(),
    hasMenuSection: groups.map((group) => ({
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

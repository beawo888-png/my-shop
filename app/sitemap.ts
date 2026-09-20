import type { MetadataRoute } from "next";
import { PANGYO_MENU_GROUP_IDS } from "@/lib/menu-content";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

const STATIC_PAGES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/en", changeFrequency: "weekly", priority: 0.9 },
  { path: "/zh", changeFrequency: "weekly", priority: 0.9 },
  { path: "/ja", changeFrequency: "weekly", priority: 0.9 },
  { path: "/menu", changeFrequency: "monthly", priority: 0.9 },
  { path: "/reviews", changeFrequency: "monthly", priority: 0.8 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${SITE_URL}${page.path === "/" ? "" : page.path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const categoryPages: MetadataRoute.Sitemap = PANGYO_MENU_GROUP_IDS.map(
    (category) => ({
      url: `${SITE_URL}/menu/${category}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return [...staticPages, ...categoryPages];
}

import type { MetadataRoute } from "next";

const SITEMAP_URL =
  "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/sitemap.xml";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: SITEMAP_URL,
  };
}

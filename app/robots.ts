import type { MetadataRoute } from "next";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

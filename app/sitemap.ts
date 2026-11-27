import type { MetadataRoute } from "next";
import { PANGYO_MENU_GROUP_IDS } from "@/lib/menu-content";
import { SITE_VIDEOS, getVideoPagePath } from "@/lib/video-content";

const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

const STATIC_PAGES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/en", changeFrequency: "weekly", priority: 0.9 },
  { path: "/zh", changeFrequency: "weekly", priority: 0.9 },
  { path: "/ja", changeFrequency: "weekly", priority: 0.9 },
  { path: "/menu", changeFrequency: "monthly", priority: 0.9 },
  { path: "/reviews", changeFrequency: "monthly", priority: 0.8 },
  { path: "/videos", changeFrequency: "monthly", priority: 0.7 },
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

  // 영상 사이트맵: 영상마다 시청 페이지 하나 (구글 동영상 색인용)
  const videoPages: MetadataRoute.Sitemap = SITE_VIDEOS.map((video) => ({
    url: `${SITE_URL}${getVideoPagePath(video)}`,
    changeFrequency: "monthly",
    priority: 0.7,
    videos: [
      {
        title: video.title,
        thumbnail_loc: `${SITE_URL}${video.thumbnail}`,
        description: video.description,
        content_loc: `${SITE_URL}${video.src}`,
        duration: video.durationSeconds,
        publication_date: `${video.uploadDate}T09:00:00+09:00`,
        family_friendly: "yes",
      },
    ],
  }));

  return [...staticPages, ...categoryPages, ...videoPages];
}

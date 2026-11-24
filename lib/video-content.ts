// 영상 전용 페이지(/videos, /videos/[slug])와 영상 사이트맵이 함께 쓰는 데이터.
// 구글은 영상이 페이지의 주인공일 때만 동영상으로 색인하므로,
// 홈페이지 자동재생 영상과 별개로 영상마다 시청 페이지를 둔다.

export const SITE_URL = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com";

export type SiteVideo = {
  slug: string;
  src: string;
  thumbnail: string;
  title: string;
  description: string;
  /** 초 단위 길이 (ffprobe로 잰 값을 반올림) */
  durationSeconds: number;
  /** 사이트에 처음 올린 날짜 */
  uploadDate: string;
  width: number;
  height: number;
  menuPath: string;
};

export const SITE_VIDEOS: readonly SiteVideo[] = [
  {
    slug: "lamb-leg-promo",
    src: "/videos/wangjing/lamb-leg-promo.mp4",
    thumbnail: "/images/videos/lamb-leg-promo.jpg",
    title: "숯불에 노릇하게 익어가는 왕징 통양다리",
    description:
      "왕징양다리양꼬치 대표 메뉴인 통양다리가 숯불 위에서 겉은 바삭하고 속은 촉촉하게 익어가는 모습을 담은 영상입니다. 모란본점과 판교점에서 맛볼 수 있습니다.",
    durationSeconds: 12,
    uploadDate: "2026-07-15",
    width: 720,
    height: 1280,
    menuPath: "/menu/signature-lamb-leg",
  },
  {
    slug: "signature-01",
    src: "/videos/signature/signature-01.mp4",
    thumbnail: "/images/videos/signature-01.jpg",
    title: "비주얼 대박 왕징 통양다리 소개",
    description:
      "독일에 슈바인학센이 있다면 왕징에는 통양다리가 있습니다. 테이블에 통째로 나오는 왕징양다리양꼬치의 시그니처 양다리를 소개하는 영상입니다.",
    durationSeconds: 17,
    uploadDate: "2026-07-19",
    width: 360,
    height: 640,
    menuPath: "/menu/signature-lamb-leg",
  },
  {
    slug: "signature-02",
    src: "/videos/signature/signature-02.mp4",
    thumbnail: "/images/videos/signature-02.jpg",
    title: "양고기 싫어하는 사람도 먹는 왕징 양꼬치",
    description:
      "매콤한 양념을 듬뿍 묻힌 왕징 양꼬치와 곁들임 오이무침을 담은 영상입니다. 양고기 특유의 냄새 없이 즐길 수 있는 양꼬치를 확인해 보세요.",
    durationSeconds: 13,
    uploadDate: "2026-07-19",
    width: 720,
    height: 1280,
    menuPath: "/menu/lamb-skewers",
  },
  {
    slug: "signature-03",
    src: "/videos/signature/signature-03.mp4",
    thumbnail: "/images/videos/signature-03.jpg",
    title: "400도 그릴 위에서 굽는 왕징 통양다리",
    description:
      "400도 그릴 위에서 통양다리를 돌려 가며 굽는 과정을 담은 영상입니다. 마라 가재 요리와 함께 차려진 왕징양다리양꼬치의 한 상을 볼 수 있습니다.",
    durationSeconds: 14,
    uploadDate: "2026-07-19",
    width: 720,
    height: 1280,
    menuPath: "/menu/signature-lamb-leg",
  },
  {
    slug: "signature-04",
    src: "/videos/signature/signature-04.mp4",
    thumbnail: "/images/videos/signature-04.jpg",
    title: "테이블에서 직접 썰어 주는 왕징 통양다리",
    description:
      "잘 구운 통양다리를 테이블 그릴 위에서 직원이 직접 먹기 좋게 썰어 주는 모습을 담은 영상입니다. 왕징양다리양꼬치에서만 볼 수 있는 양다리 서비스를 확인해 보세요.",
    durationSeconds: 22,
    uploadDate: "2026-07-19",
    width: 720,
    height: 1280,
    menuPath: "/menu/signature-lamb-leg",
  },
];

export function getSiteVideo(slug: string): SiteVideo | undefined {
  return SITE_VIDEOS.find((video) => video.slug === slug);
}

export function getVideoPagePath(video: SiteVideo): string {
  return `/videos/${video.slug}`;
}

/** 12 → "PT12S", 75 → "PT1M15S" */
export function toIsoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `PT${minutes ? `${minutes}M` : ""}${rest ? `${rest}S` : ""}` || "PT0S";
}

export function buildVideoObject(video: SiteVideo) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [`${SITE_URL}${video.thumbnail}`],
    uploadDate: `${video.uploadDate}T09:00:00+09:00`,
    duration: toIsoDuration(video.durationSeconds),
    contentUrl: `${SITE_URL}${video.src}`,
    url: `${SITE_URL}${getVideoPagePath(video)}`,
    width: video.width,
    height: video.height,
    inLanguage: "ko",
    publisher: {
      "@type": "Organization",
      name: "왕징양다리양꼬치",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/wangjing/wangjing-logo.jpg`,
      },
    },
  };
}

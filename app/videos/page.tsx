import type { Metadata } from "next";
import { SiteHeader } from "@/components/home/site-header";
import { SITE_URL, SITE_VIDEOS, getVideoPagePath } from "@/lib/video-content";

const canonical = `${SITE_URL}/videos`;

export const metadata: Metadata = {
  title: "왕징 영상 모음 | 왕징양다리양꼬치",
  description:
    "왕징양다리양꼬치의 통양다리, 양꼬치 영상을 모았습니다. 숯불에 굽는 양다리부터 테이블에서 썰어 주는 모습까지 확인해 보세요.",
  alternates: { canonical },
  openGraph: {
    title: "왕징 영상 모음 | 왕징양다리양꼬치",
    description: "통양다리와 양꼬치를 굽는 모습을 영상으로 확인하세요.",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};

export default function VideosPage() {
  return (
    <main className="video-page">
      <SiteHeader homePath="/" />

      <section className="video-page__hero" aria-labelledby="videos-title">
        <div className="video-page__shell">
          <p className="video-page__eyebrow">WANGJING VIDEOS</p>
          <h1 id="videos-title">왕징 영상 모음</h1>
          <p>통양다리와 양꼬치를 굽는 모습을 영상으로 먼저 만나보세요.</p>
        </div>
      </section>

      <section className="video-page__shell video-more" aria-label="영상 목록">
        <ul className="video-list">
          {SITE_VIDEOS.map((video) => (
            <li key={video.slug}>
              <a className="video-list__card" href={getVideoPagePath(video)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt="" loading="lazy" width={720} height={1280} />
                <span>{video.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

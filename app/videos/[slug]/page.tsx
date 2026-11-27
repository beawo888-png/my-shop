import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/home/site-header";
import { BOOKING_LOCATIONS } from "@/lib/site-content";
import {
  SITE_URL,
  SITE_VIDEOS,
  buildVideoObject,
  getSiteVideo,
  getVideoPagePath,
} from "@/lib/video-content";

type VideoPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return SITE_VIDEOS.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = getSiteVideo(slug);
  if (!video) return {};

  const canonical = `${SITE_URL}${getVideoPagePath(video)}`;
  const title = `${video.title} | 왕징양다리양꼬치 영상`;

  return {
    title,
    description: video.description,
    alternates: { canonical },
    openGraph: {
      title,
      description: video.description,
      url: canonical,
      locale: "ko_KR",
      type: "video.other",
      images: [{ url: `${SITE_URL}${video.thumbnail}`, width: 720, height: 1280 }],
      videos: [
        {
          url: `${SITE_URL}${video.src}`,
          type: "video/mp4",
          width: video.width,
          height: video.height,
        },
      ],
    },
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { slug } = await params;
  const video = getSiteVideo(slug);
  if (!video) notFound();

  const others = SITE_VIDEOS.filter((item) => item.slug !== video.slug);

  return (
    <main className="video-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildVideoObject(video)).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader homePath="/" />

      <article className="video-page__shell video-watch" aria-labelledby="video-title">
        <div className="video-watch__player">
          <video
            src={video.src}
            poster={video.thumbnail}
            width={video.width}
            height={video.height}
            controls
            playsInline
            preload="metadata"
          />
        </div>
        <div className="video-watch__body">
          <p className="video-page__eyebrow">WANGJING VIDEO</p>
          <h1 id="video-title">{video.title}</h1>
          <p className="video-watch__description">{video.description}</p>
          <p className="video-watch__meta">
            영상 길이 {video.durationSeconds}초 · {video.uploadDate.replaceAll("-", ".")} 등록
          </p>
          <div className="video-watch__actions">
            <Link className="button button--outline-dark" href={video.menuPath}>
              이 메뉴 보러 가기
            </Link>
            {BOOKING_LOCATIONS.map((booking) => (
              <a
                className="button button--outline-dark"
                href={booking.url}
                target="_blank"
                rel="noreferrer"
                key={booking.id}
              >
                {booking.label}
              </a>
            ))}
          </div>
        </div>
      </article>

      <section className="video-page__shell video-more" aria-labelledby="video-more-title">
        <h2 id="video-more-title">다른 영상 보기</h2>
        <ul className="video-list">
          {others.map((item) => (
            <li key={item.slug}>
              <Link className="video-list__card" href={getVideoPagePath(item)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt="" loading="lazy" width={720} height={1280} />
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p>
          <Link className="video-more__all" href="/videos">
            영상 전체 보기
          </Link>
        </p>
      </section>
    </main>
  );
}

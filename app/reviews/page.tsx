import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/home/brand-logo";
import { ReviewLocationCard } from "@/components/reviews/review-location-card";
import { LOCATIONS } from "@/lib/site-content";

const canonical =
  "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/reviews";

export const metadata: Metadata = {
  title: "지점별 고객 리뷰 | 왕징양다리양꼬치",
  description:
    "왕징양다리양꼬치 모란본점과 판교점의 네이버 플레이스 방문자 리뷰를 확인하세요.",
  alternates: { canonical },
  openGraph: {
    title: "지점별 고객 리뷰 | 왕징양다리양꼬치",
    description: "모란본점과 판교점의 실제 네이버 방문자 리뷰 안내",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};

export default function ReviewsPage() {
  return (
    <main className="reviews-page">
      <header className="reviews-page__header">
        <div className="reviews-page__shell reviews-page__header-inner">
          <Link href="/" aria-label="왕징양다리양꼬치 처음으로">
            <BrandLogo
              className="brand-logo--menu"
              sizes="(max-width: 767px) 112px, 176px"
              preload
            />
          </Link>
          <Link className="reviews-page__home-link" href="/">
            홈으로
          </Link>
        </div>
      </header>

      <section className="reviews-page__hero" aria-labelledby="reviews-page-title">
        <div className="reviews-page__shell">
          <p className="reviews-page__eyebrow">GUEST REVIEWS</p>
          <h1 id="reviews-page-title">지점별 고객 리뷰</h1>
          <p>
            방문하실 지점을 선택하면 해당 지점의 네이버 플레이스 방문자
            리뷰를 새 창에서 확인할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="reviews-page__content" aria-label="리뷰를 확인할 지점 선택">
        <div className="reviews-page__shell reviews-page__grid">
          {LOCATIONS.map((location) => (
            <ReviewLocationCard key={location.id} location={location} />
          ))}
        </div>
      </section>
    </main>
  );
}

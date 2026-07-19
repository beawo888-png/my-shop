import type { Location } from "@/lib/site-content";

type ReviewLocationCardProps = {
  location: Location;
};

export function ReviewLocationCard({ location }: ReviewLocationCardProps) {
  return (
    <article className="review-location-card">
      <p className="review-location-card__eyebrow">{location.areaLabel}</p>
      <h2>{location.shortName}</h2>
      <address>{location.address}</address>
      <div className="review-location-card__actions">
        <a
          className="button review-location-card__button review-location-card__button--naver"
          href={location.reviewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${location.shortName} 네이버 플레이스 리뷰 열기`}
        >
          <span>네이버 플레이스</span>
          <span>리뷰 보기</span>
        </a>
        <a
          className="button review-location-card__button review-location-card__button--kakao"
          href={location.kakaoReviewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${location.shortName} 카카오맵 리뷰 열기`}
        >
          <span>카카오맵</span>
          <span>리뷰 보기</span>
        </a>
        <a
          className="button review-location-card__button review-location-card__button--google"
          href={location.googleReviewUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${location.shortName} 구글 리뷰 열기`}
        >
          <span>구글</span>
          <span>리뷰 보기</span>
        </a>
      </div>
    </article>
  );
}

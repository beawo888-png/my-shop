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
      <a
        className="button button--primary"
        href={location.reviewUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${location.shortName} 네이버 플레이스 리뷰 열기`}
      >
        네이버 플레이스 리뷰 보기 ↗
      </a>
    </article>
  );
}

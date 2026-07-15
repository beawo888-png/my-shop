import Image from "next/image";
import type { Location } from "@/lib/site-content";

type LocationCardProps = {
  location: Location;
};

export function LocationCard({ location }: LocationCardProps) {
  return (
    <article className="location-card" id={`location-${location.id}`}>
      <div className="location-card__image">
        <Image
          src={location.image}
          alt={location.imageAlt}
          fill
          sizes="(max-width: 767px) calc(100vw - 40px), 50vw"
          style={{ objectPosition: location.imagePosition }}
        />
      </div>

      <div className="location-card__body">
        <p className="eyebrow eyebrow--red">{location.areaLabel} LOCATION</p>
        <h3>{location.name}</h3>

        <dl className="location-card__details">
          <div>
            <dt>주소</dt>
            <dd>{location.address}</dd>
          </div>
          <div>
            <dt>가까운 역</dt>
            <dd>{location.transit}</dd>
          </div>
          <div>
            <dt>전화번호</dt>
            <dd>
              <a href={location.phoneHref}>{location.phoneDisplay}</a>
            </dd>
          </div>
        </dl>

        <a
          className="button button--primary location-card__button"
          href={location.mapUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`${location.shortName} 네이버 플레이스 열기`}
        >
          네이버 플레이스
        </a>
      </div>
    </article>
  );
}

import Image from "next/image";
import type { Location } from "@/lib/site-content";
import type { BranchCopy, HomeCopy } from "@/lib/home-i18n/types";

type LocationCardProps = {
  location: Location;
  copy: BranchCopy;
  labels: HomeCopy["locations"];
};

export function LocationCard({ location, copy, labels }: LocationCardProps) {
  return (
    <article className="location-card" id={`location-${location.id}`}>
      <div className="location-card__image">
        <Image
          src={location.image}
          alt={copy.imageAlt}
          fill
          sizes="(max-width: 767px) calc(100vw - 40px), 50vw"
          style={{ objectPosition: location.imagePosition }}
        />
      </div>

      <div className="location-card__body">
        <p className="eyebrow eyebrow--red">{location.areaLabel} LOCATION</p>
        <h3>{copy.name}</h3>

        <dl className="location-card__details">
          <div>
            <dt>{labels.labels.address}</dt>
            <dd>{location.address}</dd>
          </div>
          <div>
            <dt>{labels.labels.transit}</dt>
            <dd>{copy.transit}</dd>
          </div>
          <div>
            <dt>{labels.labels.phone}</dt>
            <dd>
              <a href={location.phoneHref}>{location.phoneDisplay}</a>
            </dd>
          </div>
          <div>
            <dt>{labels.labels.parking}</dt>
            <dd>{copy.parking}</dd>
          </div>
        </dl>

        <div className="location-card__actions">
          <a
            className="button button--primary location-card__button"
            href={location.mapUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${copy.shortName} ${labels.naverDirectionsAria}`}
          >
            {labels.naverDirections}
          </a>
          <a
            className="button location-card__button location-card__button--secondary"
            href={location.googleDirectionsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${copy.shortName} ${labels.googleDirectionsAria}`}
          >
            {labels.googleDirections}
          </a>
        </div>
      </div>
    </article>
  );
}

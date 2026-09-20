import Image from "next/image";

import type { HomeCopy } from "@/lib/home-i18n";
import { BOOKING_LOCATIONS, LOCATIONS } from "@/lib/site-content";

const BRANCH_IMAGES = {
  moran: "/images/wangjing/moran-group-dining.jpg",
  pangyo: "/images/wangjing/pangyo-group-dining.jpg",
} as const;

const BRANCH_DETAIL_ICONS = ["●", "♧", "♢", "▰"] as const;

export function GroupDiningSection({ copy, branches }: {
  copy: HomeCopy["group"];
  branches: HomeCopy["branches"];
}) {
  return (
    <section
      className="section section--light group group--seo"
      id="group"
      aria-labelledby="group-title"
    >
      <div className="group-seo__inner">
        <header className="group-seo__header">
          <p className="eyebrow eyebrow--red">{copy.eyebrow}</p>
          <h2 id="group-title">
            {copy.titleLine1}
            <span>{copy.titleLine2}</span>
          </h2>
          <p>{copy.description}</p>
        </header>

        <ul className="group-seo__occasions" aria-label={copy.occasionsAria}>
          {copy.occasions.map((occasion) => (
            <li key={occasion.label}>
              <span className="group-seo__occasion-icon" aria-hidden="true">
                {occasion.icon}
              </span>
              {occasion.label}
            </li>
          ))}
        </ul>

        <div className="group-seo__branch-grid">
          {LOCATIONS.map((location) => {
            const guide = branches[location.id];
            const booking = BOOKING_LOCATIONS.find(
              (item) => item.id === location.id,
            );

            return (
              <article className="group-seo__branch-card" key={location.id}>
                <div className="group-seo__branch-top">
                  <div>
                    <div className="group-seo__branch-heading">
                      <span>{location.areaLabel}</span>
                      <h3>{guide.shortName}</h3>
                    </div>
                    <h4>{guide.groupTitle}</h4>
                  </div>
                  <div className="group-seo__branch-image">
                    <Image
                      src={BRANCH_IMAGES[location.id]}
                      alt={guide.groupImageAlt}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 72px), 280px"
                    />
                  </div>
                </div>
                <dl>
                  {[guide.transit, guide.groupOccasions, guide.groupMenu, guide.parking].map(
                    (detail, index) => (
                      <div key={copy.detailLabels[index]}>
                        <dt>
                          <span aria-hidden="true">
                            {BRANCH_DETAIL_ICONS[index]}
                          </span>
                          {copy.detailLabels[index]}
                        </dt>
                        <dd>{detail}</dd>
                      </div>
                    ),
                  )}
                </dl>
                <div className="group-seo__actions">
                  {booking ? (
                    <a
                      className="button button--primary"
                      href={booking.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {guide.shortName} {copy.reserveLabel}
                    </a>
                  ) : null}
                  <a
                    className="button button--outline-dark"
                    href={location.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {guide.shortName} {copy.directionsLabel}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <p className="group-seo__principle-band">
          {copy.principle}
        </p>

        <div className="group-seo__recommendation-grid">
          {LOCATIONS.map((location) => {
            const guide = branches[location.id];

            return (
              <article
                className="group-seo__recommendation-card"
                key={`${location.id}-recommendation`}
              >
                <div className="group-seo__recommendation-image">
                  <Image
                    src={BRANCH_IMAGES[location.id]}
                    alt={guide.groupImageAlt}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 72px), 230px"
                  />
                </div>
                <div>
                  <h3>{guide.recommendationTitle}</h3>
                  <p>{guide.recommendation}</p>
                </div>
              </article>
            );
          })}
        </div>

        <ul className="group-seo__feature-band" aria-label={copy.featureAria}>
          {copy.features.map((feature) => (
            <li key={feature.value}>
              <span aria-hidden="true">{feature.icon}</span>
              <div>
                <strong>{feature.value}</strong>
                <small>{feature.detail}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import Image from "next/image";
import type { HomeCopy } from "@/lib/home-i18n";
import { BOOKING_LOCATIONS, LOCATIONS } from "@/lib/site-content";

export function ReservationBanner({
  copy,
  branches,
}: {
  copy: HomeCopy["reservation"];
  branches: HomeCopy["branches"];
}) {
  return (
    <section className="reservation" id="reservation" aria-labelledby="reservation-title">
      <Image
        src="/images/wangjing/feast.jpg"
        alt={copy.imageAlt}
        fill
        sizes="100vw"
      />
      <div className="reservation__overlay" />
      <div className="reservation__content">
        <p className="eyebrow eyebrow--gold">{copy.eyebrow}</p>
        <h2 id="reservation-title">{copy.title}</h2>
        <p>{copy.description}</p>
        <div className="reservation__branches">
          {LOCATIONS.map((location) => {
            const booking = BOOKING_LOCATIONS.find((entry) => entry.id === location.id);
            const name = branches[location.id].shortName;

            return (
              <div key={location.id}>
                <h3>{name}</h3>
                <div className="reservation__actions">
                  {booking && (
                    <a
                      className="button button--primary"
                      href={booking.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${name} · ${copy.naver}`}
                    >
                      {copy.naver}
                    </a>
                  )}
                  <a
                    className="button button--outline"
                    href={location.phoneHref}
                    aria-label={`${name} · ${copy.phone}`}
                  >
                    {copy.phone}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import type { HomeCopy } from "@/lib/home-i18n";
import { SITE } from "@/lib/site-content";

export function ReservationBanner({ copy }: { copy: HomeCopy["reservation"] }) {
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
        <div className="button-row button-row--center">
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            {copy.naver}
          </a>
          <a className="button button--outline" href={SITE.phoneHref}>
            {copy.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import type { HomeCopy } from "@/lib/home-i18n";

export function ReviewsSection({ copy }: { copy: HomeCopy["reviews"] }) {
  return (
    <section
      className="section section--dark reviews"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="section__heading section__heading--center">
        <p className="eyebrow eyebrow--gold">{copy.eyebrow}</p>
        <h2 id="reviews-title">{copy.title}</h2>
        <p>{copy.description}</p>
      </div>
      <div className="reviews__action">
        <Link className="button button--primary" href="/reviews">
          {copy.action}
        </Link>
      </div>
    </section>
  );
}

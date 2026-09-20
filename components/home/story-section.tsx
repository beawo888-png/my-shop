import Image from "next/image";
import type { HomeCopy } from "@/lib/home-i18n";

export function StorySection({ copy }: { copy: HomeCopy["story"] }) {
  return (
    <section
      className="section section--dark story story--seo story--brand"
      id="story"
      aria-labelledby="story-title"
    >
      <div className="story__visual">
        <Image
          src="/images/wangjing/roast-lamb.png"
          alt={copy.imageAlt}
          fill
          sizes="(max-width: 1023px) 100vw, 42vw"
        />
        <div className="story__visual-overlay" aria-hidden="true" />
        <div className="story__intro">
          <p className="eyebrow eyebrow--gold">{copy.eyebrow}</p>
          <h2 id="story-title">
            {copy.titleLine1}
            <span>{copy.titleLine2}</span>
          </h2>

          <div className="story__brand-copy">
            {copy.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <p className="story__closing">
            {copy.closingLead}<strong>{copy.closingStrong}</strong>{copy.closingTail}
          </p>
        </div>
      </div>

      <div className="story__standards">
        <div className="story__promise-heading">
          <p className="eyebrow eyebrow--gold">{copy.promiseEyebrow}</p>
          <h2>{copy.promiseTitle}</h2>
          <p>{copy.promiseDescription}</p>
        </div>

        <div className="story__promise-grid">
          {copy.promises.map((promise) => (
            <article className="story__promise-card" key={promise.number}>
              <span className="story__promise-number" aria-hidden="true">
                {promise.number}
              </span>
              <h3>{promise.title}</h3>
              <p>{promise.description}</p>
              <ul>
                {promise.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="story__promise-line">
          {copy.promiseLine}
        </p>
      </div>
    </section>
  );
}

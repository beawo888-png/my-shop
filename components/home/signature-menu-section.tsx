import type { HomeCopy } from "@/lib/home-i18n";

const SIGNATURE_VIDEOS = [
  {
    src: "/videos/signature/signature-01.mp4",
    poster: "/images/videos/signature-01.jpg",
    page: "/videos/signature-01",
  },
  {
    src: "/videos/signature/signature-02.mp4",
    poster: "/images/videos/signature-02.jpg",
    page: "/videos/signature-02",
  },
  {
    src: "/videos/signature/signature-03.mp4",
    poster: "/images/videos/signature-03.jpg",
    page: "/videos/signature-03",
  },
  {
    src: "/videos/signature/signature-04.mp4",
    poster: "/images/videos/signature-04.jpg",
    page: "/videos/signature-04",
  },
] as const;

export function SignatureMenuSection({ copy }: { copy: HomeCopy["signature"] }) {
  return (
    <section
      className="section section--light"
      id="menu"
      aria-labelledby="menu-title"
    >
      <div className="section__heading section__heading--actions">
        <div>
          <p className="eyebrow eyebrow--red">{copy.eyebrow}</p>
          <h2 id="menu-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <a
          className="button button--outline-dark signature-menu__all"
          href="/menu"
          target="_blank"
          rel="noreferrer"
        >
          {copy.allMenu}
        </a>
      </div>
      <div className="signature-video-grid">
        {SIGNATURE_VIDEOS.map((video, index) => (
          <article className="signature-video-card" key={video.src}>
            <div className="signature-video-card__frame">
              <video
                src={video.src}
                aria-label={copy.videoLabels[index]}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={video.poster}
              />
            </div>
            <a className="signature-video-card__link" href={video.page}>
              {copy.watchVideo}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

const SIGNATURE_VIDEOS = [
  {
    src: "/videos/signature/signature-01.mp4",
    title: "왕징 시그니처 요리 영상 1",
  },
  {
    src: "/videos/signature/signature-02.mp4",
    title: "왕징 시그니처 요리 영상 2",
  },
  {
    src: "/videos/signature/signature-03.mp4",
    title: "왕징 시그니처 요리 영상 3",
  },
  {
    src: "/videos/signature/signature-04.mp4",
    title: "왕징 시그니처 요리 영상 4",
  },
] as const;

export function SignatureMenuSection() {
  return (
    <section
      className="section section--light"
      id="menu"
      aria-labelledby="menu-title"
    >
      <div className="section__heading section__heading--actions">
        <div>
          <p className="eyebrow eyebrow--red">SIGNATURE MENU</p>
          <h2 id="menu-title">왕징에서 먼저 맛봐야 할 요리</h2>
          <p>불향 가득한 양고기와 정통 중국 요리를 함께 즐겨보세요.</p>
        </div>
        <a
          className="button button--outline-dark signature-menu__all"
          href="/menu"
          target="_blank"
          rel="noreferrer"
        >
          전체 메뉴 보기
        </a>
      </div>
      <div className="signature-video-grid">
        {SIGNATURE_VIDEOS.map((video) => (
          <article className="signature-video-card" key={video.src}>
            <div className="signature-video-card__frame">
              <video
                src={video.src}
                aria-label={video.title}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import Image from "next/image";

export function HeroSection() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <Image
        className="hero__poster"
        src="/images/wangjing/hero-skewers.png"
        alt="숯불 위에서 구워지는 왕징양다리양꼬치 대표 메뉴"
        fill
        priority
        sizes="100vw"
      />
      <video
        className="hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/wangjing/hero-skewers.png"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source
          src="/videos/wangjing/lamb-leg-promo.mp4"
          type="video/mp4"
        />
      </video>
      <div className="hero__overlay" />
      <div className="hero__content">
        <p className="eyebrow">WANGJING · PREMIUM CHINESE LAMB DINING</p>
        <h1 id="hero-title">
          불향으로 완성한 양고기,
          <br /> 중요한 자리를 위한 왕징
        </h1>
        <p className="hero__lead">
          성남 판교·모란에서 만나는 품격있는 양고기전문점.
          <br /> 회식부터 가족모임까지 편안하게 준비 해 드립니다.
        </p>
      </div>
    </section>
  );
}

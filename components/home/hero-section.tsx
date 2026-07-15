import Image from "next/image";
import { SITE, TRUST_ITEMS } from "@/lib/site-content";

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
        <p className="eyebrow">PANGYO · CHINESE LAMB DINING</p>
        <h1 id="hero-title">
          불향으로 완성한 양고기,
          <br /> 중요한 자리를 위한 왕징
        </h1>
        <p className="hero__lead">
          판교역 가까이에서 만나는 품격 있는 중국 양고기 요리.
          <br /> 회식부터 가족 모임까지 편안하게 준비해 드립니다.
        </p>
        <div className="hero__actions">
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
          <a className="button button--outline" href="#group">
            단체 모임 안내
          </a>
        </div>
      </div>
      <div className="trust-bar" aria-label="매장 주요 정보">
        {TRUST_ITEMS.map((item) => (
          <div className="trust-item" key={item.value}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

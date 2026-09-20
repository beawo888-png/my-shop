import Image from "next/image";
import type { HomeCopy } from "@/lib/home-i18n";

export function HeroSection({ copy }: { copy: HomeCopy["hero"] }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <Image
        className="hero__poster"
        src="/images/wangjing/hero-skewers.png"
        alt={copy.imageAlt}
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
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 id="hero-title">
          {copy.titleLine1}
          <br /> {copy.titleLine2}
        </h1>
        <p className="hero__lead">
          {copy.leadLine1}
          <br /> {copy.leadLine2}
        </p>
      </div>
    </section>
  );
}

"use client";

import { useState, type MouseEvent, type PointerEvent } from "react";
import { FullMenuImage } from "@/components/menu/full-menu-image";
import type { MenuImageFit } from "@/lib/menu-content";

type MenuCardMediaProps = {
  name: string;
  imageSrc: string;
  fallbackImageSrc: string;
  imageAlt: string;
  imageFit: MenuImageFit;
  videoSrc?: string;
};

export function MenuCardMedia({
  name,
  imageSrc,
  fallbackImageSrc,
  imageAlt,
  imageFit,
  videoSrc,
}: MenuCardMediaProps) {
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);

  const stop = () => {
    setActive(false);
    setReady(false);
    setMuted(true);
  };

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    if (!videoSrc || failed || event.pointerType === "touch") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive(true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") stop();
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const keyboardClick = event.detail === 0;
    const touchLikeDevice = window.matchMedia("(hover: none)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!keyboardClick && !touchLikeDevice && !reducedMotion) return;
    setActive((current) => {
      if (current) {
        setReady(false);
        setMuted(true);
      }
      return !current;
    });
  };

  if (!videoSrc) {
    return (
      <div className="full-menu-card__media">
        <FullMenuImage
          src={imageSrc}
          fallbackSrc={fallbackImageSrc}
          alt={imageAlt}
          fit={imageFit}
        />
      </div>
    );
  }

  return (
    <div
      className="full-menu-card__media full-menu-card__media--video"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <FullMenuImage
        src={imageSrc}
        fallbackSrc={fallbackImageSrc}
        alt={imageAlt}
        fit={imageFit}
      />
      <button
        className="full-menu-card__video-trigger"
        type="button"
        aria-label={`${name} 영상 ${active ? "정지" : "재생"}`}
        aria-pressed={active}
        onClick={handleClick}
      >
        {active && !failed ? (
          <video
            className={`full-menu-card__video${ready ? " full-menu-card__video--ready" : ""}`}
            src={videoSrc}
            aria-label={`${name} 조리 영상`}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="none"
            onCanPlay={() => setReady(true)}
            onError={() => {
              setFailed(true);
              stop();
            }}
          >
            이 브라우저에서는 메뉴 영상을 재생할 수 없습니다.
          </video>
        ) : null}
        {!active && !failed ? (
          <span className="full-menu-card__video-badge">영상 보기 ▶</span>
        ) : null}
      </button>
      {active && ready ? (
        <button
          className="full-menu-card__sound-toggle"
          type="button"
          aria-label={muted ? `${name} 영상 소리 켜기` : `${name} 영상 소리 끄기`}
          onClick={() => setMuted((current) => !current)}
        >
          {muted ? "🔇 소리 켜기" : "🔊 소리 끄기"}
        </button>
      ) : null}
    </div>
  );
}

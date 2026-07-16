"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuImageFit } from "@/lib/menu-content";

type FullMenuImageProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  fit: MenuImageFit;
};

export function FullMenuImage({
  src,
  fallbackSrc,
  alt,
  fit,
}: FullMenuImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      className={`full-menu-card__image full-menu-card__image--${fit}`}
      src={currentSrc}
      alt={alt}
      fill
      sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1199px) calc(50vw - 36px), 384px"
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

import { MenuCardMedia } from "@/components/menu/menu-card-media";
import type { FullMenuItem } from "@/lib/menu-content";

type FullMenuCardProps = {
  item: FullMenuItem;
  fallbackImageSrc: string;
};

export function FullMenuCard({
  item,
  fallbackImageSrc,
}: FullMenuCardProps) {
  return (
    <li className="full-menu-card">
      <MenuCardMedia
        name={item.name}
        imageSrc={item.imageSrc}
        fallbackImageSrc={fallbackImageSrc}
        imageAlt={item.imageAlt}
        imageFit={item.imageFit}
        videoSrc={item.videoSrc}
      />
      <div className="full-menu-card__body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>{item.price}</strong>
      </div>
    </li>
  );
}

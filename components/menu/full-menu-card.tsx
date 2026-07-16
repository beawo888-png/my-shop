import { FullMenuImage } from "@/components/menu/full-menu-image";
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
      <div className="full-menu-card__media" style={{ position: "relative" }}>
        <FullMenuImage
          src={item.imageSrc}
          fallbackSrc={fallbackImageSrc}
          alt={item.imageAlt}
          fit={item.imageFit}
        />
      </div>
      <div className="full-menu-card__body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <strong>{item.price}</strong>
      </div>
    </li>
  );
}

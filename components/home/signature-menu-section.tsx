import Image from "next/image";
import { MENU_ITEMS } from "@/lib/site-content";

export function SignatureMenuSection() {
  return (
    <section
      className="section section--light"
      id="menu"
      aria-labelledby="menu-title"
    >
      <div className="section__heading">
        <div>
          <p className="eyebrow eyebrow--red">SIGNATURE MENU</p>
          <h2 id="menu-title">왕징에서 먼저 맛봐야 할 요리</h2>
          <p>불향 가득한 양고기와 정통 중국 요리를 함께 즐겨보세요.</p>
        </div>
      </div>
      <div className="menu-grid">
        {MENU_ITEMS.map((item) => (
          <article className="menu-card" key={item.name}>
            <div className="menu-card__image">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
              />
            </div>
            <div className="menu-card__body">
              <div className="menu-card__title">
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
              </div>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

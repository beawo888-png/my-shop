import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import type { HomeCopy } from "@/lib/home-i18n";

export function FaqSection({ copy }: { copy: HomeCopy["faq"] }) {
  return (
    <section
      className="section section--light faq"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="faq__inner">
        <header className="faq__header">
          <p className="eyebrow eyebrow--red">{copy.eyebrow}</p>
          <h2 id="faq-title">{copy.title}</h2>
        </header>
        <div className="faq__list">
          {copy.items.map((item) => (
            <FaqAccordionItem item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

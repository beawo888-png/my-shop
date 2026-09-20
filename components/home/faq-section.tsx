import { FaqAccordionItem } from "@/components/home/faq-accordion-item";
import { FAQ_ITEMS } from "@/lib/faq-content";

export function FaqSection() {
  return (
    <section
      className="section section--light faq"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="faq__inner">
        <header className="faq__header">
          <p className="eyebrow eyebrow--red">FAQ</p>
          <h2 id="faq-title">자주 묻는 질문</h2>
        </header>
        <div className="faq__list">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import type { FaqEntry } from "@/lib/faq-content";

type FaqAccordionItemProps = {
  item: FaqEntry;
};

export function FaqAccordionItem({ item }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);
  const buttonId = `faq-question-${item.id}`;
  const panelId = `faq-answer-${item.id}`;

  return (
    <article className={open ? "faq-item faq-item--open" : "faq-item"}>
      <h3>
        <button
          className="faq-item__trigger"
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{item.question}</span>
          <Plus className="faq-item__icon" aria-hidden="true" />
        </button>
      </h3>
      <div
        className="faq-item__answer"
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
      >
        <p>
          {item.answer.map((segment, index) =>
            segment.strong ? (
              <strong key={`${item.id}-${index}`}>{segment.text}</strong>
            ) : (
              <span key={`${item.id}-${index}`}>{segment.text}</span>
            ),
          )}
        </p>
      </div>
    </article>
  );
}

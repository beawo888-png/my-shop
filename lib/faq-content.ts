import { koHomeCopy } from "./home-i18n/ko";

export type FaqSegment = {
  text: string;
  strong?: boolean;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: readonly FaqSegment[];
};

export const FAQ_ITEMS = koHomeCopy.faq.items;

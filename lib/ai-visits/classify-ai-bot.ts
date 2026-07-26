import { BOT_CATALOG } from "./bot-catalog";
import type { ClassifiedBot } from "./types";

const ORDERED_CATALOG = [...BOT_CATALOG].sort(
  (left, right) => right.token.length - left.token.length,
);
const GENERIC_CRAWLER_SIGNAL = /(?:bot|crawler|spider|fetcher|slurp)/i;

export function classifyAiBot(userAgent: string | null): ClassifiedBot | null {
  if (!userAgent?.trim()) return null;

  const normalized = userAgent.toLowerCase();
  const match = ORDERED_CATALOG.find((entry) =>
    normalized.includes(entry.token.toLowerCase()),
  );

  if (match) {
    const { token: _token, ...classified } = match;
    return classified;
  }

  if (GENERIC_CRAWLER_SIGNAL.test(userAgent)) {
    return {
      botId: "other-crawler",
      botName: "기타 크롤러",
      vendor: "Unknown",
      purpose: "other",
    };
  }

  return null;
}

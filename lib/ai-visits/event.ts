import type { AiVisitInsert, ClassifiedBot } from "./types";

const MAX_PATH_LENGTH = 2048;
const MAX_USER_AGENT_LENGTH = 512;
const MAX_REFERRER_LENGTH = 2048;

function normalizedPath(value: string): string {
  try {
    return new URL(value, "https://local.invalid").pathname.slice(0, MAX_PATH_LENGTH);
  } catch {
    return "/";
  }
}

function sanitizedReferrer(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return `${url.origin}${url.pathname}`.slice(0, MAX_REFERRER_LENGTH);
  } catch {
    return null;
  }
}

export function createVisitEvent(input: {
  pathname: string;
  userAgent: string;
  referrer: string | null;
  bot: ClassifiedBot;
  now?: Date;
}): AiVisitInsert {
  return {
    createdAt: input.now ?? new Date(),
    path: normalizedPath(input.pathname),
    userAgent: input.userAgent.slice(0, MAX_USER_AGENT_LENGTH),
    referrer: sanitizedReferrer(input.referrer),
    botId: input.bot.botId,
    botName: input.bot.botName,
    vendor: input.bot.vendor,
    purpose: input.bot.purpose,
  };
}

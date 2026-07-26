import { classifyAiBot } from "./classify-ai-bot";
import { createVisitEvent } from "./event";
import { recordVisit } from "./record";
import { isTrackablePublicRequest } from "./request-policy";
import type { AiVisitInsert } from "./types";

type RequestSnapshot = {
  method: string;
  pathname: string;
  userAgent: string | null;
  referrer: string | null;
};

type Dependencies = {
  schedule(task: () => Promise<void>): void;
  record(event: AiVisitInsert): Promise<unknown>;
  now(): Date;
  logger: Pick<Console, "warn">;
};

export function handleAiVisitRequest(
  request: RequestSnapshot,
  dependencies: Partial<Dependencies> & Pick<Dependencies, "schedule">,
): boolean {
  if (!isTrackablePublicRequest(request)) return false;
  const bot = classifyAiBot(request.userAgent);
  if (!bot || !request.userAgent) return false;

  const event = createVisitEvent({
    pathname: request.pathname,
    userAgent: request.userAgent,
    referrer: request.referrer,
    bot,
    now: dependencies.now?.() ?? new Date(),
  });
  const persist = dependencies.record ?? recordVisit;
  const logger = dependencies.logger ?? console;
  dependencies.schedule(async () => {
    try {
      await persist(event);
    } catch {
      logger.warn("AI visit scheduled record failed");
    }
  });
  return true;
}

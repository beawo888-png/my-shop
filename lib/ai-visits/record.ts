import { visitRepository } from "./repository";
import type { AiVisitInsert } from "./types";

type VisitRepository = {
  insert(event: AiVisitInsert): Promise<void>;
};

type SafeLogger = {
  warn(...values: unknown[]): void;
};

export async function recordVisit(
  event: AiVisitInsert,
  dependencies: {
    repository?: VisitRepository;
    logger?: SafeLogger;
  } = {},
): Promise<boolean> {
  const repository = dependencies.repository ?? visitRepository;
  const logger = dependencies.logger ?? console;
  try {
    await repository.insert(event);
    return true;
  } catch {
    logger.warn("AI visit record failed");
    return false;
  }
}

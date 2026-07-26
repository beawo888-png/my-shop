import type {
  AiVisitRow,
  BotVisitSummary,
  ClassifiedBot,
  Purpose,
  VisitSummary,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function emptyPurposeCounts(): Record<Purpose, number> {
  return {
    search_indexing: 0,
    training: 0,
    realtime_citation: 0,
    other: 0,
  };
}

function countPaths(rows: AiVisitRow[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  return [...counts.entries()].sort(
    ([leftPath, leftCount], [rightPath, rightCount]) =>
      rightCount - leftCount || leftPath.localeCompare(rightPath),
  )[0]?.[0] ?? null;
}

export function summarizeVisits(rows: AiVisitRow[], now = new Date()): VisitSummary {
  const currentStart = new Date(now.getTime() - 30 * DAY_MS);
  const previousStart = new Date(now.getTime() - 60 * DAY_MS);
  const current = rows.filter(
    (row) => row.createdAt >= currentStart && row.createdAt <= now,
  );
  const previous = rows.filter(
    (row) => row.createdAt >= previousStart && row.createdAt < currentStart,
  );

  const byPurpose = emptyPurposeCounts();
  for (const row of current) byPurpose[row.purpose] += 1;

  const identities = new Map<string, ClassifiedBot>();
  for (const row of [...current, ...previous]) {
    identities.set(row.botId, {
      botId: row.botId,
      botName: row.botName,
      vendor: row.vendor,
      purpose: row.purpose,
    });
  }

  const bots: BotVisitSummary[] = [...identities.values()].map((identity) => {
    const currentRows = current.filter((row) => row.botId === identity.botId);
    const previousCount = previous.filter(
      (row) => row.botId === identity.botId,
    ).length;
    const currentCount = currentRows.length;
    const delta = currentCount - previousCount;
    const lastVisitedAt = currentRows.reduce<Date | null>(
      (latest, row) => (!latest || row.createdAt > latest ? row.createdAt : latest),
      null,
    );

    return {
      ...identity,
      currentCount,
      previousCount,
      delta,
      percentChange:
        previousCount === 0 ? null : Math.round((delta / previousCount) * 1000) / 10,
      isNew: previousCount === 0 && currentCount > 0,
      lastVisitedAt,
      topPath: countPaths(currentRows),
    };
  });

  bots.sort(
    (left, right) =>
      right.currentCount - left.currentCount ||
      left.botName.localeCompare(right.botName, "ko"),
  );

  return { total: current.length, byPurpose, bots };
}

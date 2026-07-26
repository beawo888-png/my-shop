export type Purpose =
  | "search_indexing"
  | "training"
  | "realtime_citation"
  | "other";

export type BotCatalogEntry = {
  token: string;
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};

export type ClassifiedBot = Omit<BotCatalogEntry, "token">;

export type AiVisitInsert = ClassifiedBot & {
  createdAt: Date;
  path: string;
  userAgent: string;
  referrer: string | null;
};

export type AiVisitRow = AiVisitInsert & {
  id?: number | string;
};

export type BotVisitSummary = ClassifiedBot & {
  currentCount: number;
  previousCount: number;
  delta: number;
  percentChange: number | null;
  isNew: boolean;
  lastVisitedAt: Date | null;
  topPath: string | null;
};

export type VisitSummary = {
  total: number;
  byPurpose: Record<Purpose, number>;
  bots: BotVisitSummary[];
};

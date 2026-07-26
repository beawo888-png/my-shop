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

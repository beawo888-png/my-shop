import { neon } from "@neondatabase/serverless";
import type { AiVisitInsert, AiVisitRow, Purpose } from "./types";

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

export const visitRepository = {
  async insert(event: AiVisitInsert): Promise<void> {
    const sql = neon(databaseUrl());
    await sql`
      INSERT INTO ai_visits (
        created_at, path, user_agent, bot_id, bot_name, vendor, purpose, referrer
      ) VALUES (
        ${event.createdAt.toISOString()}, ${event.path}, ${event.userAgent},
        ${event.botId}, ${event.botName}, ${event.vendor}, ${event.purpose},
        ${event.referrer}
      )
    `;
  },

  async listSince(since: Date): Promise<AiVisitRow[]> {
    const sql = neon(databaseUrl());
    const rows = await sql`
      SELECT id, created_at, path, user_agent, bot_id, bot_name, vendor, purpose, referrer
      FROM ai_visits
      WHERE created_at >= ${since.toISOString()}
      ORDER BY created_at DESC
    `;
    return rows.map((row) => ({
      id: row.id as string,
      createdAt: new Date(row.created_at as string),
      path: String(row.path),
      userAgent: String(row.user_agent),
      botId: String(row.bot_id),
      botName: String(row.bot_name),
      vendor: String(row.vendor),
      purpose: String(row.purpose) as Purpose,
      referrer: row.referrer === null ? null : String(row.referrer),
    }));
  },
};

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(databaseUrl);

try {
  await sql`
    CREATE TABLE IF NOT EXISTS ai_visits (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      path TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      bot_id TEXT NOT NULL,
      bot_name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      purpose TEXT NOT NULL CHECK (
        purpose IN ('search_indexing', 'training', 'realtime_citation', 'other')
      ),
      referrer TEXT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ai_visits_created_at_idx ON ai_visits (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_visits_purpose_created_idx ON ai_visits (purpose, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS ai_visits_bot_created_idx ON ai_visits (bot_id, created_at DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_login_limits (
      source_hash TEXT PRIMARY KEY,
      failure_count INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS admin_login_limits_expires_idx ON admin_login_limits (expires_at)`;
  console.log("AI visit analytics schema is ready");
} catch (error) {
  console.error("AI visit analytics migration failed");
  process.exitCode = 1;
}

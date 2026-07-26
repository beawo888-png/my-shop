import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const FAILURE_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

type LoginLimitReader = {
  getActiveFailureCount(sourceHash: string, now: Date): Promise<number>;
};

export type LoginLimitRepository = LoginLimitReader & {
  recordFailure(sourceHash: string, now: Date): Promise<void>;
  clear(sourceHash: string): Promise<void>;
};

type LoginLimitEnv = {
  NODE_ENV?: string;
  AI_VISIT_STORAGE?: string;
  DATABASE_URL?: string;
};

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is not configured");
  return value;
}

export function hashLoginSource(rawIp: string, secret: string): string {
  if (Buffer.byteLength(secret) < 32) {
    throw new Error("Admin IP hash secret is not configured");
  }
  return createHmac("sha256", secret).update(rawIp).digest("hex").slice(0, 16);
}

const databaseLoginLimitRepository: LoginLimitRepository = {
  async getActiveFailureCount(sourceHash, now) {
    const sql = neon(databaseUrl());
    const rows = await sql`
      SELECT failure_count
      FROM admin_login_limits
      WHERE source_hash = ${sourceHash} AND expires_at > ${now.toISOString()}
    `;
    return rows[0] ? Number(rows[0].failure_count) : 0;
  },

  async recordFailure(sourceHash, now) {
    const sql = neon(databaseUrl());
    const expiresAt = new Date(now.getTime() + WINDOW_MS);
    await sql`
      INSERT INTO admin_login_limits (
        source_hash, failure_count, window_started_at, expires_at
      ) VALUES (${sourceHash}, 1, ${now.toISOString()}, ${expiresAt.toISOString()})
      ON CONFLICT (source_hash) DO UPDATE SET
        failure_count = CASE
          WHEN admin_login_limits.expires_at <= ${now.toISOString()} THEN 1
          ELSE admin_login_limits.failure_count + 1
        END,
        window_started_at = CASE
          WHEN admin_login_limits.expires_at <= ${now.toISOString()}
            THEN ${now.toISOString()}::timestamptz
          ELSE admin_login_limits.window_started_at
        END,
        expires_at = CASE
          WHEN admin_login_limits.expires_at <= ${now.toISOString()}
            THEN ${expiresAt.toISOString()}::timestamptz
          ELSE admin_login_limits.expires_at
        END
    `;
  },

  async clear(sourceHash) {
    const sql = neon(databaseUrl());
    await sql`DELETE FROM admin_login_limits WHERE source_hash = ${sourceHash}`;
  },
};

function inMemoryLoginLimitRepository(): LoginLimitRepository {
  const failures = new Map<string, { count: number; expiresAt: number }>();
  return {
    async getActiveFailureCount(sourceHash, now) {
      const value = failures.get(sourceHash);
      if (!value || value.expiresAt <= now.getTime()) {
        failures.delete(sourceHash);
        return 0;
      }
      return value.count;
    },
    async recordFailure(sourceHash, now) {
      const current = failures.get(sourceHash);
      if (!current || current.expiresAt <= now.getTime()) {
        failures.set(sourceHash, { count: 1, expiresAt: now.getTime() + WINDOW_MS });
        return;
      }
      current.count += 1;
    },
    async clear(sourceHash) {
      failures.delete(sourceHash);
    },
  };
}

export function createLoginLimitRepository(
  env: LoginLimitEnv = process.env,
): LoginLimitRepository {
  if (env.NODE_ENV !== "production" && env.AI_VISIT_STORAGE === "file") {
    return inMemoryLoginLimitRepository();
  }
  return databaseLoginLimitRepository;
}

export const loginLimitRepository = createLoginLimitRepository();

export async function isLoginAllowed(
  sourceHash: string,
  now = new Date(),
  repository: LoginLimitReader = loginLimitRepository,
): Promise<boolean> {
  return (await repository.getActiveFailureCount(sourceHash, now)) < FAILURE_LIMIT;
}

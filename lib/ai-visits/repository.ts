import { neon } from "@neondatabase/serverless";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import type { AiVisitInsert, AiVisitRow, Purpose } from "./types";

export type VisitRepository = {
  insert(event: AiVisitInsert): Promise<void>;
  listSince(since: Date): Promise<AiVisitRow[]>;
};

type VisitStorageEnv = {
  NODE_ENV?: string;
  AI_VISIT_STORAGE?: string;
  AI_VISIT_FILE_PATH?: string;
  DATABASE_URL?: string;
};

const PURPOSES = new Set<Purpose>([
  "search_indexing",
  "training",
  "realtime_citation",
  "other",
]);

function disabledRepository(): VisitRepository {
  const unavailable = async () => {
    throw new Error("AI visit storage is not configured");
  };
  return { insert: unavailable, listSince: unavailable };
}

function postgresRepository(databaseUrl: string): VisitRepository {
  return {
    async insert(event) {
      const sql = neon(databaseUrl);
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

    async listSince(since) {
      const sql = neon(databaseUrl);
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
}

function safeExternalFilePath(filePath: string | undefined, cwd: string): string {
  if (!filePath || !isAbsolute(filePath)) {
    throw new Error("AI_VISIT_FILE_PATH must be an absolute path");
  }
  const resolvedPath = resolve(filePath);
  const projectPath = resolve(cwd);
  const relation = relative(projectPath, resolvedPath);
  if (relation === "" || (!relation.startsWith("..") && !isAbsolute(relation))) {
    throw new Error("AI visit JSONL must be outside the project directory");
  }
  return resolvedPath;
}

function parseFileRow(value: unknown): AiVisitRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const createdAt = new Date(String(row.createdAt ?? ""));
  if (
    Number.isNaN(createdAt.getTime()) ||
    typeof row.path !== "string" ||
    typeof row.userAgent !== "string" ||
    typeof row.botId !== "string" ||
    typeof row.botName !== "string" ||
    typeof row.vendor !== "string" ||
    typeof row.purpose !== "string" ||
    !PURPOSES.has(row.purpose as Purpose) ||
    (row.referrer !== null && typeof row.referrer !== "string")
  ) {
    return null;
  }
  return {
    createdAt,
    path: row.path,
    userAgent: row.userAgent,
    botId: row.botId,
    botName: row.botName,
    vendor: row.vendor,
    purpose: row.purpose as Purpose,
    referrer: row.referrer as string | null,
  };
}

function fileRepository(filePath: string): VisitRepository {
  return {
    async insert(event) {
      await mkdir(dirname(filePath), { recursive: true });
      const serialized = JSON.stringify({
        ...event,
        createdAt: event.createdAt.toISOString(),
      });
      await appendFile(filePath, `${serialized}\n`, { encoding: "utf8" });
    },

    async listSince(since) {
      let content: string;
      try {
        content = await readFile(filePath, "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw error;
      }
      return content
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          try {
            return parseFileRow(JSON.parse(line));
          } catch {
            return null;
          }
        })
        .filter((row): row is AiVisitRow => Boolean(row && row.createdAt >= since))
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    },
  };
}

export function createVisitRepository(
  env: VisitStorageEnv = process.env,
  cwd = process.cwd(),
): VisitRepository {
  const mode = env.AI_VISIT_STORAGE ?? (env.DATABASE_URL ? "postgres" : "disabled");
  if (mode === "disabled") return disabledRepository();
  if (mode === "postgres") {
    if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
    return postgresRepository(env.DATABASE_URL);
  }
  if (mode === "file") {
    if (env.NODE_ENV === "production") {
      throw new Error("File storage is disabled in production");
    }
    return fileRepository(safeExternalFilePath(env.AI_VISIT_FILE_PATH, cwd));
  }
  throw new Error("Unsupported AI_VISIT_STORAGE mode");
}

export const visitRepository: VisitRepository = {
  insert(event) {
    return createVisitRepository().insert(event);
  },
  listSince(since) {
    return createVisitRepository().listSince(since);
  },
};

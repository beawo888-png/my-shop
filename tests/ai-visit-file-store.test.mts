import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createVisitRepository } from "../lib/ai-visits/repository";
import type { AiVisitInsert } from "../lib/ai-visits/types";

const event: AiVisitInsert = {
  createdAt: new Date("2026-07-26T10:00:00.000Z"),
  path: "/menu",
  userAgent: "GPTBot/1.0",
  botId: "gptbot",
  botName: "GPTBot",
  vendor: "OpenAI",
  purpose: "training",
  referrer: null,
};

test("local file repository appends JSONL and reads typed visits", async () => {
  const directory = await mkdtemp(join(tmpdir(), "wangjing-ai-visits-"));
  const filePath = join(directory, "ai-visits.jsonl");
  try {
    const repository = createVisitRepository(
      {
        NODE_ENV: "development",
        AI_VISIT_STORAGE: "file",
        AI_VISIT_FILE_PATH: filePath,
      },
      process.cwd(),
    );
    await repository.insert(event);
    const rows = await repository.listSince(new Date("2026-07-26T00:00:00.000Z"));
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], event);
    const stored = JSON.parse((await readFile(filePath, "utf8")).trim());
    assert.equal(stored.botId, "gptbot");
    assert.equal(stored.purpose, "training");
    assert.equal(Object.hasOwn(stored, "ip"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("file storage is rejected in production", () => {
  assert.throws(() =>
    createVisitRepository({
      NODE_ENV: "production",
      AI_VISIT_STORAGE: "file",
      AI_VISIT_FILE_PATH: join(tmpdir(), "ai-visits.jsonl"),
    }),
  );
});

test("file storage path must be absolute and outside the project", () => {
  assert.throws(() =>
    createVisitRepository({
      NODE_ENV: "development",
      AI_VISIT_STORAGE: "file",
      AI_VISIT_FILE_PATH: "storage/ai-visits.jsonl",
    }),
  );
  assert.throws(() =>
    createVisitRepository(
      {
        NODE_ENV: "development",
        AI_VISIT_STORAGE: "file",
        AI_VISIT_FILE_PATH: join(process.cwd(), "storage", "ai-visits.jsonl"),
      },
      process.cwd(),
    ),
  );
});
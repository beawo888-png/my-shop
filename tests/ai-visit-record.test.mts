import assert from "node:assert/strict";
import { test } from "node:test";
import { recordVisit } from "../lib/ai-visits/record";
import type { AiVisitInsert } from "../lib/ai-visits/types";

const event: AiVisitInsert = {
  createdAt: new Date("2026-07-26T12:00:00.000Z"),
  path: "/",
  userAgent: "GPTBot/1.0",
  referrer: null,
  botId: "gptbot",
  botName: "GPTBot",
  vendor: "OpenAI",
  purpose: "training",
};

test("returns true after repository insert succeeds", async () => {
  let inserted: AiVisitInsert | null = null;
  const result = await recordVisit(event, {
    repository: { insert: async (value) => { inserted = value; } },
    logger: { warn: () => assert.fail("warn should not be called") },
  });
  assert.equal(result, true);
  assert.deepEqual(inserted, event);
});

test("storage failure warns without throwing or leaking event data", async () => {
  const warnings: unknown[][] = [];
  const result = await recordVisit(event, {
    repository: { insert: async () => { throw new Error("database unavailable"); } },
    logger: { warn: (...values) => warnings.push(values) },
  });

  assert.equal(result, false);
  assert.equal(warnings.length, 1);
  const output = JSON.stringify(warnings);
  assert.doesNotMatch(output, /GPTBot|database unavailable|OpenAI|\"path\"/);
  assert.match(output, /AI visit record failed/);
});

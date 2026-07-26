import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAiVisitRequest } from "../lib/ai-visits/proxy-handler";

const base = {
  method: "GET",
  pathname: "/",
  userAgent: "GPTBot/1.0",
  referrer: "https://example.com/search?q=private",
};

test("classified public GET schedules one privacy-safe record", async () => {
  const scheduled: Array<() => Promise<void>> = [];
  const recorded: unknown[] = [];
  const handled = handleAiVisitRequest(base, {
    now: () => new Date("2026-07-26T12:00:00.000Z"),
    schedule: (task) => scheduled.push(task),
    record: async (event) => { recorded.push(event); },
  });

  assert.equal(handled, true);
  assert.equal(scheduled.length, 1);
  await scheduled[0]?.();
  assert.equal(recorded.length, 1);
  assert.deepEqual(recorded[0], {
    createdAt: new Date("2026-07-26T12:00:00.000Z"),
    path: "/",
    userAgent: "GPTBot/1.0",
    referrer: "https://example.com/search",
    botId: "gptbot",
    botName: "GPTBot",
    vendor: "OpenAI",
    purpose: "training",
  });
});

test("human, excluded, and non-page requests never schedule storage", () => {
  for (const input of [
    { ...base, userAgent: "Mozilla/5.0 Chrome/140" },
    { ...base, pathname: "/admin/ai-visits" },
    { ...base, pathname: "/api/data" },
    { ...base, pathname: "/image.jpg" },
    { ...base, method: "POST" },
  ]) {
    let scheduled = false;
    const handled = handleAiVisitRequest(input, {
      schedule: () => { scheduled = true; },
      record: async () => undefined,
      now: () => new Date(),
    });
    assert.equal(handled, false);
    assert.equal(scheduled, false);
  }
});

test("classified public HEAD schedules storage", () => {
  let scheduled = false;
  const handled = handleAiVisitRequest(
    { ...base, method: "HEAD" },
    {
      schedule: () => { scheduled = true; },
      record: async () => undefined,
      now: () => new Date(),
    },
  );
  assert.equal(handled, true);
  assert.equal(scheduled, true);
});

test("scheduled recorder rejection is contained", async () => {
  const scheduled: Array<() => Promise<void>> = [];
  const warnings: string[] = [];
  handleAiVisitRequest(base, {
    schedule: (task) => scheduled.push(task),
    record: async () => { throw new Error("boom"); },
    now: () => new Date(),
    logger: { warn: (message) => warnings.push(String(message)) },
  });
  await assert.doesNotReject(scheduled[0]?.());
  assert.deepEqual(warnings, ["AI visit scheduled record failed"]);
});

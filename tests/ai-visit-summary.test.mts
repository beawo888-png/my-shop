import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeVisits } from "../lib/ai-visits/summarize";
import type { AiVisitRow, Purpose } from "../lib/ai-visits/types";

const NOW = new Date("2026-07-26T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function row(input: {
  daysAgo: number;
  botId?: string;
  botName?: string;
  vendor?: string;
  purpose?: Purpose;
  path?: string;
}): AiVisitRow {
  return {
    createdAt: new Date(NOW.getTime() - input.daysAgo * DAY),
    path: input.path ?? "/",
    userAgent: `${input.botName ?? "GPTBot"}/1.0`,
    referrer: null,
    botId: input.botId ?? "gptbot",
    botName: input.botName ?? "GPTBot",
    vendor: input.vendor ?? "OpenAI",
    purpose: input.purpose ?? "training",
  };
}

test("summarizes current 30 days and compares the previous 30 days", () => {
  const summary = summarizeVisits(
    [
      row({ daysAgo: 1, path: "/menu" }),
      row({ daysAgo: 2, path: "/menu" }),
      row({ daysAgo: 3, path: "/reviews" }),
      row({ daysAgo: 35 }),
      row({ daysAgo: 40 }),
      row({
        daysAgo: 4,
        botId: "oai-searchbot",
        botName: "OAI-SearchBot",
        purpose: "search_indexing",
        path: "/reviews",
      }),
      row({
        daysAgo: 5,
        botId: "chatgpt-user",
        botName: "ChatGPT-User",
        purpose: "realtime_citation",
      }),
      row({
        daysAgo: 6,
        botId: "other-crawler",
        botName: "기타 크롤러",
        vendor: "Unknown",
        purpose: "other",
      }),
      row({ daysAgo: 61 }),
      row({ daysAgo: -1 }),
    ],
    NOW,
  );

  assert.equal(summary.total, 6);
  assert.deepEqual(summary.byPurpose, {
    search_indexing: 1,
    training: 3,
    realtime_citation: 1,
    other: 1,
  });

  const gpt = summary.bots.find((bot) => bot.botId === "gptbot");
  assert.ok(gpt);
  assert.equal(gpt.currentCount, 3);
  assert.equal(gpt.previousCount, 2);
  assert.equal(gpt.delta, 1);
  assert.equal(gpt.percentChange, 50);
  assert.equal(gpt.isNew, false);
  assert.equal(gpt.topPath, "/menu");
  assert.equal(gpt.lastVisitedAt?.toISOString(), "2026-07-25T12:00:00.000Z");
});

test("marks a bot as new when its previous count is zero", () => {
  const summary = summarizeVisits(
    [row({ daysAgo: 1, botId: "newbot", botName: "NewBot", purpose: "other" })],
    NOW,
  );
  assert.equal(summary.bots[0]?.isNew, true);
  assert.equal(summary.bots[0]?.percentChange, null);
});

test("uses deterministic path and bot ordering for ties", () => {
  const summary = summarizeVisits(
    [
      row({ daysAgo: 1, botId: "z", botName: "지봇", path: "/reviews" }),
      row({ daysAgo: 2, botId: "z", botName: "지봇", path: "/menu" }),
      row({ daysAgo: 1, botId: "a", botName: "가봇", path: "/" }),
      row({ daysAgo: 2, botId: "a", botName: "가봇", path: "/" }),
    ],
    NOW,
  );
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["a", "z"]);
  assert.equal(summary.bots.find((bot) => bot.botId === "z")?.topPath, "/menu");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { createVisitEvent } from "../lib/ai-visits/event";

const bot = {
  botId: "gptbot",
  botName: "GPTBot",
  vendor: "OpenAI",
  purpose: "training" as const,
};

test("creates an allow-listed privacy-safe event", () => {
  const now = new Date("2026-07-26T10:00:00.000Z");
  const event = createVisitEvent({
    pathname: "/menu?secret=1#section",
    userAgent: "GPTBot/1.0",
    referrer: "https://example.com/search?q=phone#result",
    bot,
    now,
  });

  assert.deepEqual(event, {
    createdAt: now,
    path: "/menu",
    userAgent: "GPTBot/1.0",
    referrer: "https://example.com/search",
    ...bot,
  });
  for (const forbidden of ["ip", "ipHash", "cookie", "session"]) {
    assert.equal(Object.hasOwn(event, forbidden), false);
  }
});

test("invalid referrer is discarded", () => {
  const event = createVisitEvent({
    pathname: "/",
    userAgent: "GPTBot/1.0",
    referrer: "not a url",
    bot,
    now: new Date(),
  });
  assert.equal(event.referrer, null);
});

test("sensitive query and fragment never enter the path", () => {
  const event = createVisitEvent({
    pathname: "/reviews?phone=01012345678#private",
    userAgent: "GPTBot/1.0",
    referrer: null,
    bot,
    now: new Date(),
  });
  assert.equal(event.path, "/reviews");
});

test("stored strings are length-limited", () => {
  const event = createVisitEvent({
    pathname: `/${"p".repeat(3000)}`,
    userAgent: "u".repeat(1000),
    referrer: `https://example.com/${"r".repeat(3000)}?secret=yes`,
    bot,
    now: new Date(),
  });
  assert.equal(event.path.length, 2048);
  assert.equal(event.userAgent.length, 512);
  assert.equal(event.referrer?.length, 2048);
});

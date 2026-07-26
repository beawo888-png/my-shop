import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyAiBot } from "../lib/ai-visits/classify-ai-bot";

const cases = [
  ["GPTBot/1.0", "gptbot", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "realtime_citation"],
  ["OAI-AdsBot/1.0", "oai-adsbot", "other"],
  ["ClaudeBot/1.0", "claudebot", "training"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "search_indexing"],
  ["Claude-User/1.0", "claude-user", "realtime_citation"],
  ["Claude-Web/1.0", "claude-web", "realtime_citation"],
  ["anthropic-ai", "anthropic-ai", "training"],
  ["PerplexityBot/1.0", "perplexitybot", "search_indexing"],
  ["Perplexity-User/1.0", "perplexity-user", "realtime_citation"],
  ["Googlebot/1.0", "googlebot", "search_indexing"],
  ["Googlebot-Image/1.0", "googlebot-image", "search_indexing"],
  ["Googlebot-Video/1.0", "googlebot-video", "search_indexing"],
  ["GoogleOther/1.0", "googleother", "search_indexing"],
  ["GoogleOther-Image/1.0", "googleother-image", "search_indexing"],
  ["GoogleOther-Video/1.0", "googleother-video", "search_indexing"],
  ["Google-Extended", "google-extended", "training"],
  ["Yeti/1.1", "yeti", "search_indexing"],
  ["NaverBot/1.0", "naverbot", "search_indexing"],
  ["bingbot/2.0", "bingbot", "search_indexing"],
  ["msnbot/2.0", "msnbot", "search_indexing"],
  ["BingPreview/1.0", "bingpreview", "search_indexing"],
  ["MicrosoftPreview/1.0", "microsoftpreview", "search_indexing"],
  ["Applebot/1.0", "applebot", "search_indexing"],
  ["Applebot-Extended/1.0", "applebot-extended", "training"],
  ["DuckAssistBot/1.2", "duckassistbot", "realtime_citation"],
  ["DuckDuckBot/1.0", "duckduckbot", "search_indexing"],
  ["Amazonbot/0.1", "amazonbot", "training"],
  ["Amzn-SearchBot/0.1", "amzn-searchbot", "search_indexing"],
  ["Amzn-User/0.1", "amzn-user", "realtime_citation"],
  ["Meta-WebIndexer/1.1", "meta-webindexer", "search_indexing"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "realtime_citation"],
  ["Meta-ExternalAgent/1.1", "meta-externalagent", "training"],
  ["Meta-ExternalAds/1.1", "meta-externalads", "other"],
  ["FacebookExternalHit/1.1", "facebookexternalhit", "other"],
  ["CCBot/2.0", "ccbot", "training"],
  ["Bytespider/1.0", "bytespider", "training"],
  ["YouBot/1.0", "youbot", "search_indexing"],
  ["cohere-ai", "cohere-ai", "training"],
  ["MistralAI-User/1.0", "mistralai-user", "realtime_citation"],
] as const;

for (const [userAgent, botId, purpose] of cases) {
  test(`${userAgent} => ${purpose}`, () => {
    const result = classifyAiBot(userAgent);
    assert.ok(result);
    assert.equal(result.botId, botId);
    assert.equal(result.purpose, purpose);
  });
}

test("specific tokens win over shorter overlapping tokens", () => {
  assert.equal(classifyAiBot("Googlebot-Image/1.0")?.botId, "googlebot-image");
  assert.equal(classifyAiBot("Applebot-Extended/1.0")?.botId, "applebot-extended");
});

test("classification is case-insensitive", () => {
  assert.equal(classifyAiBot("gptbot/1.0")?.botId, "gptbot");
});

test("generic crawler signals are classified as other", () => {
  for (const signal of ["bot", "crawler", "spider", "fetcher", "slurp"]) {
    assert.equal(classifyAiBot(`Example-${signal}/1.0`)?.purpose, "other");
  }
});

test("normal browser and empty UA are ignored", () => {
  assert.equal(classifyAiBot("Mozilla/5.0 Chrome/140"), null);
  assert.equal(classifyAiBot(""), null);
  assert.equal(classifyAiBot(null), null);
});

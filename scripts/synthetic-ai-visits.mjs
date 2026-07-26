const baseUrl = process.env.AI_VISIT_BASE_URL ?? "http://127.0.0.1:3100";
const filePath = process.env.AI_VISIT_FILE_PATH;

if (!filePath) {
  console.error("AI_VISIT_FILE_PATH is required for synthetic verification");
  process.exit(1);
}

const cases = [
  ["GPTBot/1.0", "gptbot", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "realtime_citation"],
  ["ClaudeBot/1.0", "claudebot", "training"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "search_indexing"],
  ["Claude-User/1.0", "claude-user", "realtime_citation"],
  ["PerplexityBot/1.0", "perplexitybot", "search_indexing"],
  ["Perplexity-User/1.0", "perplexity-user", "realtime_citation"],
  ["DuckAssistBot/1.2", "duckassistbot", "realtime_citation"],
  ["Amazonbot/0.1", "amazonbot", "training"],
  ["Amzn-SearchBot/0.1", "amzn-searchbot", "search_indexing"],
  ["Meta-WebIndexer/1.1", "meta-webindexer", "search_indexing"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "realtime_citation"],
  ["Bytespider/1.0", "bytespider", "training"],
  ["cohere-ai", "cohere-ai", "training"],
];

const startedAt = Date.now();
for (const [userAgent] of cases) {
  const response = await fetch(new URL("/menu", baseUrl), {
    headers: { "user-agent": userAgent },
    redirect: "manual",
  });
  if (response.status !== 200) {
    console.error(`${userAgent}: expected HTTP 200, received ${response.status}`);
    process.exit(1);
  }
}

const { readFile } = await import("node:fs/promises");
let rows = [];
for (let attempt = 0; attempt < 20; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 150));
  try {
    const content = await readFile(filePath, "utf8");
    rows = content
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((row) => Date.parse(row.createdAt) >= startedAt - 1_000);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (rows.length >= cases.length) break;
}

for (const [userAgent, botId, purpose] of cases) {
  const match = rows.find(
    (row) =>
      row.userAgent === userAgent &&
      row.botId === botId &&
      row.purpose === purpose &&
      row.path === "/menu",
  );
  if (!match) {
    console.error(`missing record: ${userAgent} => ${botId}/${purpose}`);
    process.exit(1);
  }
  for (const forbidden of ["ip", "cookie", "session", "name", "phone"]) {
    if (Object.hasOwn(match, forbidden)) {
      console.error(`forbidden field stored for ${userAgent}: ${forbidden}`);
      process.exit(1);
    }
  }
}

console.log(`SYNTHETIC_AI_VISITS_PASS http=15 records=${cases.length}`);

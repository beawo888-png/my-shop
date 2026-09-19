#!/usr/bin/env node
/**
 * 매일 오전 7시(KST)에 외식업 사장님 공감 글 한 편을 Threads에 올린다.
 *
 * 사용법
 *   node scripts/post-daily-thread.mjs            # 발행
 *   node scripts/post-daily-thread.mjs --dry-run  # 올리지 않고 미리보기만
 *   node scripts/post-daily-thread.mjs --date=2026-01-01 --dry-run
 *
 * 환경변수
 *   THREADS_USER_ID        Threads 계정 ID (필수)
 *   THREADS_ACCESS_TOKEN   장기 액세스 토큰 (필수)
 *   THREADS_SOURCE         auto(기본) | bank | ai
 *   ANTHROPIC_API_KEY      있으면 Claude로 새 원고를 뽑는다 (없으면 원고집 사용)
 *   THREADS_MODEL          기본 claude-opus-5
 *   THREADS_PUBLISH_DELAY_MS  컨테이너 생성 후 발행까지 대기 (기본 5000)
 */

import { appendFile, readFile } from "node:fs/promises";

import { checkPostContent, countCharacters, loadPostBank, validateBank } from "../lib/threads/post-bank.mjs";
import { kstDateKey, selectPost } from "../lib/threads/schedule.mjs";
import { publishTextPost } from "../lib/threads/threads-client.mjs";

const LOG_URL = new URL("../data/threads-log.jsonl", import.meta.url);
const RECENT_WINDOW = 12;

function parseArgs(argv) {
  const args = { dryRun: false, force: false, date: undefined, source: undefined };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice("--date=".length);
    else if (arg.startsWith("--source=")) args.source = arg.slice("--source=".length);
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  return args;
}

async function readLog() {
  try {
    const raw = await readFile(LOG_URL, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function pickFromBank({ date, log }) {
  const bank = await loadPostBank();
  const problems = validateBank(bank);
  if (problems.length) {
    throw new Error(`원고집에 문제가 있습니다:\n- ${problems.join("\n- ")}`);
  }
  const recentIds = log.map((entry) => entry.postKey).filter(Boolean);
  const post = selectPost({ posts: bank.posts, date, recentIds });
  return { text: post.text, source: "bank", postKey: post.id, theme: post.theme };
}

async function pickFromClaude({ log, themeHint }) {
  const { generatePost, DEFAULT_MODEL } = await import("../lib/threads/generate-post.mjs");
  const recentTexts = log.slice(-RECENT_WINDOW).map((entry) => entry.text).filter(Boolean);
  const result = await generatePost({
    recentTexts,
    themeHint,
    model: process.env.THREADS_MODEL || DEFAULT_MODEL,
  });
  return { text: result.text, source: "claude", postKey: `claude-${result.model}`, theme: themeHint };
}

async function writeSummary(lines) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  await appendFile(path, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = args.date ? new Date(`${args.date}T00:00:00+09:00`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);

  const today = kstDateKey(now);
  const log = await readLog();

  if (!args.force && log.some((entry) => entry.date === today && entry.published)) {
    console.log(`${today}: 이미 오늘 글이 올라갔습니다. 건너뜁니다. (--force로 다시 올릴 수 있습니다)`);
    await writeSummary([`### 쓰레드 자동 발행 — ${today}`, "", "이미 발행된 날짜라 건너뛰었습니다."]);
    return;
  }

  // 원고집은 항상 먼저 골라둔다. Claude 경로가 실패해도 그대로 쓸 수 있다.
  const fallback = await pickFromBank({ date: now, log });

  const source = args.source || process.env.THREADS_SOURCE || "auto";
  let chosen = fallback;

  if (source === "ai" || (source === "auto" && process.env.ANTHROPIC_API_KEY)) {
    try {
      const generated = await pickFromClaude({ log, themeHint: fallback.theme });
      const problems = checkPostContent(generated.text);
      if (problems.length) throw new Error(problems.join(", "));
      chosen = generated;
    } catch (error) {
      if (source === "ai") throw error;
      console.warn(`⚠️  Claude 생성 실패 — 원고집으로 대체합니다: ${error.message}`);
    }
  } else if (source !== "auto" && source !== "bank") {
    throw new Error(`THREADS_SOURCE 값이 잘못됐습니다: ${source} (auto | bank | ai)`);
  }

  const problems = checkPostContent(chosen.text);
  if (problems.length) throw new Error(`본문 점검 실패: ${problems.join(", ")}`);

  const length = countCharacters(chosen.text);
  console.log(`\n── ${today} · ${chosen.source} · ${chosen.theme ?? "-"} · ${length}자 ──\n`);
  console.log(chosen.text);
  console.log("\n────────────────────────────\n");

  const userId = process.env.THREADS_USER_ID;
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const missingCredentials = !userId || !accessToken;

  if (args.dryRun || missingCredentials) {
    const reason = args.dryRun
      ? "미리보기 모드(--dry-run)라 올리지 않았습니다."
      : "THREADS_USER_ID / THREADS_ACCESS_TOKEN이 없어 올리지 않았습니다. 저장소 Secrets에 등록해 주세요.";
    console.log(`⚠️  ${reason}`);
    await writeSummary([
      `### 쓰레드 자동 발행 — ${today} (미발행)`,
      "",
      `- 사유: ${reason}`,
      `- 원고: ${chosen.source} / ${chosen.theme ?? "-"} / ${length}자`,
      "",
      "```",
      chosen.text,
      "```",
    ]);
    return;
  }

  const { postId } = await publishTextPost({
    userId,
    accessToken,
    text: chosen.text,
    publishDelayMs: Number(process.env.THREADS_PUBLISH_DELAY_MS ?? 5000),
  });

  await appendFile(
    LOG_URL,
    `${JSON.stringify({
      date: today,
      publishedAt: new Date().toISOString(),
      published: true,
      source: chosen.source,
      postKey: chosen.postKey,
      theme: chosen.theme ?? null,
      length,
      threadsPostId: postId,
      text: chosen.text,
    })}\n`,
    "utf8",
  );

  console.log(`✅ 발행 완료 — Threads post id: ${postId}`);
  await writeSummary([
    `### 쓰레드 자동 발행 — ${today}`,
    "",
    `- Threads post id: \`${postId}\``,
    `- 원고: ${chosen.source} / ${chosen.theme ?? "-"} / ${length}자`,
    "",
    "```",
    chosen.text,
    "```",
  ]);
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exitCode = 1;
});

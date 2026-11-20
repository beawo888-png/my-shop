#!/usr/bin/env node
/**
 * 쓰레드 댓글에 답글을 단다.
 *
 * 분명한 칭찬·감사에만 자동으로 짧게 답하고,
 * 물어보는 글·불만·홍보는 건드리지 않고 사장님께 넘긴다.
 *
 * 사용법
 *   node scripts/reply-to-threads-comments.mjs             # 훑고 자동 답글
 *   node scripts/reply-to-threads-comments.mjs --dry-run   # 달지 않고 세어만 보기
 *   node scripts/reply-to-threads-comments.mjs --reply-to=<댓글id> --text="..."   # 손으로 하나만
 *   node scripts/reply-to-threads-comments.mjs --mark-handled  # 지금까지 쌓인 댓글을 답글 없이 닫기
 *
 * 환경변수
 *   THREADS_USER_ID        Threads 계정 ID (필수)
 *   THREADS_ACCESS_TOKEN   threads_manage_replies 권한이 있는 토큰 (필수)
 *   THREADS_REPLY_MAX      한 번에 달 자동 답글 수 (기본 10)
 *
 * 이 저장소는 공개다. 그래서 손님이 쓴 글과 아이디는
 * 저장소에도 실행 로그에도 남기지 않는다. 남기는 것은 댓글 id와 처리 결과뿐이다.
 */

import { appendFile, readFile } from "node:fs/promises";

import {
  classifyReply,
  fetchRecentPosts,
  fetchReplies,
  pickReplyText,
  publishReply,
} from "../lib/threads/replies.mjs";

const LOG_URL = new URL("../data/threads-replies.jsonl", import.meta.url);

function parseArgs(argv) {
  const args = { dryRun: false, markHandled: false, replyTo: undefined, text: undefined };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--mark-handled") args.markHandled = true;
    else if (arg.startsWith("--reply-to=")) args.replyTo = arg.slice("--reply-to=".length);
    else if (arg.startsWith("--text=")) args.text = arg.slice("--text=".length);
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  if (args.replyTo && !args.text) throw new Error("--reply-to 에는 --text 가 함께 필요합니다.");
  if (args.text && !args.replyTo) throw new Error("--text 에는 --reply-to 가 함께 필요합니다.");
  if (args.markHandled && args.replyTo) throw new Error("--mark-handled 와 --reply-to 는 같이 쓸 수 없습니다.");
  return args;
}

async function readLog() {
  try {
    const raw = await readFile(LOG_URL, "utf8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function appendLog(entry) {
  await appendFile(LOG_URL, `${JSON.stringify(entry)}\n`, "utf8");
}

const userId = process.env.THREADS_USER_ID;
const accessToken = process.env.THREADS_ACCESS_TOKEN;
const maxAutoReplies = Number(process.env.THREADS_REPLY_MAX ?? 10);

let args;
try {
  args = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (!userId || !accessToken) {
  console.error("THREADS_USER_ID와 THREADS_ACCESS_TOKEN이 필요합니다.");
  process.exit(1);
}

// 손으로 하나만 답할 때. 사장님이 불러준 문장을 그대로 올린다.
if (args.replyTo) {
  const published = await publishReply({
    userId,
    accessToken,
    text: args.text,
    replyToId: args.replyTo,
  });
  await appendLog({
    replyId: args.replyTo,
    status: "manual",
    publishedReplyId: published.replyId,
    decidedAt: new Date().toISOString(),
  });
  console.log(`답글 1건 발행 (수동) · 대상 ${args.replyTo}`);
  process.exit(0);
}

const log = await readLog();
const handled = new Set(log.map((entry) => entry.replyId).filter(Boolean));

const posts = await fetchRecentPosts({ userId, accessToken });
console.log(`최근 글 ${posts.length}편을 훑습니다.`);

let auto = 0;
let pending = 0;
let skipped = 0;
let backlog = 0;
let limitNoticed = false;
const pendingPermalinks = new Set();

for (const post of posts) {
  let replies;
  try {
    replies = await fetchReplies({ postId: post.id, accessToken });
  } catch (error) {
    console.error(`글 ${post.id}의 답글을 읽지 못했습니다: ${error.message}`);
    continue;
  }

  for (const reply of replies) {
    if (!reply?.id) continue;
    if (reply.is_reply_owned_by_me) continue; // 내가 단 답글
    if (handled.has(reply.id)) {
      skipped += 1;
      continue;
    }

    // 쌓여 있던 댓글을 답글 없이 닫는다.
    // 두 달 전 글에 오늘 날짜로 답글이 줄줄이 달리는 것을 막는다.
    if (args.markHandled) {
      backlog += 1;
      if (!args.dryRun) {
        await appendLog({
          replyId: reply.id,
          postId: post.id,
          status: "backlog",
          decidedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    const verdict = classifyReply(reply.text);

    if (verdict === "needs-owner") {
      pending += 1;
      if (post.permalink) pendingPermalinks.add(post.permalink);
      if (!args.dryRun) {
        await appendLog({
          replyId: reply.id,
          postId: post.id,
          status: "pending",
          decidedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    if (auto >= maxAutoReplies) {
      if (!limitNoticed) {
        console.log(`자동 답글 한도(${maxAutoReplies}건)에 걸려 나머지는 다음 차례로 넘깁니다.`);
        limitNoticed = true;
      }
      continue;
    }

    const text = pickReplyText(reply.id, verdict);
    if (args.dryRun) {
      console.log(`[미리보기] ${reply.id} → "${text}"`);
      auto += 1;
      continue;
    }

    try {
      const published = await publishReply({ userId, accessToken, text, replyToId: reply.id });
      await appendLog({
        replyId: reply.id,
        postId: post.id,
        status: "auto",
        repliedWith: text,
        publishedReplyId: published.replyId,
        decidedAt: new Date().toISOString(),
      });
      auto += 1;
    } catch (error) {
      console.error(`답글을 달지 못했습니다 (${reply.id}): ${error.message}`);
    }
  }
}

const prefix = args.dryRun ? "[미리보기] " : "";
if (args.markHandled) {
  console.log(`${prefix}쌓여 있던 댓글 ${backlog}건을 답글 없이 닫았습니다. 이미 처리 ${skipped}건.`);
  console.log("다음 실행부터는 새로 달리는 댓글만 봅니다.");
} else {
  console.log(`${prefix}자동 답글 ${auto}건 · 사장님 확인 필요 ${pending}건 · 이미 처리 ${skipped}건`);
}

if (pending > 0) {
  console.log("확인이 필요한 댓글이 있습니다. 쓰레드 앱에서 읽어주세요:");
  for (const permalink of pendingPermalinks) console.log(`  ${permalink}`);
}

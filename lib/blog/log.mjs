/**
 * 블로그 발행 이력(.smartplace/blog-log.jsonl — 깃에 올라가지 않음).
 * 스마트플레이스 소식 이력과 따로 둬서 서로의 '오늘 이미 올림' 판단이 섞이지 않게 한다.
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";

import { LOCAL_DIR } from "../smartplace/local-store.mjs";

export const BLOG_LOG_PATH = `${LOCAL_DIR}blog-log.jsonl`;

export async function readBlogLog() {
  try {
    const raw = await readFile(BLOG_LOG_PATH, "utf8");
    return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function appendBlogLog(entry) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await appendFile(BLOG_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

/**
 * 이미 최종 발행 버튼까지 누른 기록이 있으면 다시 올리지 않는다(중복 발행 방지).
 * slot은 그날 몇 번째 글인지(0=오전, 1=오후). 하루 1편이던 때의 기록은 slot이 없어 오전 글로 본다.
 */
export function alreadyPublished(log, date, branchId, slot = 0) {
  return log.some((entry) => entry.date === date && entry.branch === branchId && (entry.slot ?? 0) === slot && entry.submitted);
}

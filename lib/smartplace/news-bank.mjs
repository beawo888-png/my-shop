/**
 * 스마트플레이스 소식 원고집(content/smartplace/posts.txt) 파서와 오늘 원고 선택.
 *
 * 형식:
 *   == id: <아이디> | day: <월~일> | photo: <public/images/wangjing 기준 경로>
 *   본문 ...
 *
 * 같은 요일 원고가 주마다 돌아가고, 판교점과 모란본점은 같은 날 서로 다른 원고를 받는다.
 *
 * 날짜별 원고(content/smartplace/plan-YYYY-MM.json)에 그날·그 지점 항목이 있으면 그것이 먼저다.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { BRANCHES, fillPlaceholders, findPlaceholders, KNOWN_PLACEHOLDERS } from "./branches.mjs";
import { kstDateKey, kstDayIndex } from "../threads/schedule.mjs";

export const BANK_URL = new URL("../../content/smartplace/posts.txt", import.meta.url);
export const PHOTO_ROOT = fileURLToPath(new URL("../../public/images/wangjing/", import.meta.url));

export const LENGTH_MIN = 80;
export const LENGTH_MAX = 400;

/** 날짜별 원고 규칙. 본문 길이는 스마트플레이스 본문칸 한도(해시태그 포함). */
export const PLAN_TITLE_MIN = 5;
export const PLAN_TITLE_MAX = 40;
export const PLAN_BODY_MIN = 10;
export const PLAN_BODY_MAX = 1000;
export const PLAN_EMOJI_COUNT = 3;
export const PLAN_HASHTAG_COUNT = 5;

export const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 같은 날 두 지점이 서로 다른 원고를 받도록 주 순번을 어긋나게 둔다. */
const BRANCH_OFFSET = { pangyo: 0, moran: 2 };

const HEADER = /^==\s*id:\s*([A-Za-z0-9-]+)\s*\|\s*day:\s*([월화수목금토일])\s*\|\s*photo:\s*(\S+)\s*$/;

export function parseNewsBank(raw) {
  const lines = raw.split(/\r?\n/);
  const posts = [];
  let current = null;

  const finish = () => {
    if (!current) return;
    // 블록 사이의 "#" 구분 주석은 본문에서 뺀다.
    const body = current.body.filter((line) => !line.startsWith("#"));
    current.text = body.join("\n").replace(/^\n+/, "").replace(/\s+$/, "");
    delete current.body;
    posts.push(current);
  };

  for (const [index, line] of lines.entries()) {
    const header = HEADER.exec(line);
    if (header) {
      finish();
      current = { id: header[1], day: header[2], photo: header[3], body: [], line: index + 1 };
      continue;
    }
    if (line.startsWith("==")) throw new Error(`원고집 ${index + 1}번째 줄: 헤더 형식이 잘못됐습니다.`);
    if (current) current.body.push(line);
    else if (line.trim() && !line.startsWith("#")) {
      throw new Error(`원고집 ${index + 1}번째 줄: 블록 헤더(== id: ...) 앞에 본문이 있습니다.`);
    }
  }
  finish();
  return { posts };
}

export async function loadNewsBank() {
  return parseNewsBank(await readFile(BANK_URL, "utf8"));
}

/** 원고 한 편을 지점용으로 완성한다. */
export function renderPost(post, branchId) {
  const branch = BRANCHES[branchId];
  if (!branch) throw new Error(`알 수 없는 지점: ${branchId}`);
  const text = fillPlaceholders(post.text, branch);
  const photo = fillPlaceholders(post.photo, branch);
  const [title, ...rest] = text.split("\n");
  const body = rest.join("\n").replace(/^\n+/, "");
  return { id: post.id, day: post.day, branch: branchId, source: "bank", title, body, text, photo, photoPath: `${PHOTO_ROOT}${photo}` };
}

/** 그 달의 날짜별 원고 파일 주소. dateKey는 "2026-10-20" 같은 KST 날짜. */
export function planUrl(dateKey) {
  return new URL(`../../content/smartplace/plan-${dateKey.slice(0, 7)}.json`, import.meta.url);
}

/** 그 날짜가 든 달의 날짜별 원고. 파일이 없으면 빈 목록. */
export async function loadNewsPlan(date = new Date()) {
  const url = planUrl(kstDateKey(date));
  if (!existsSync(url)) return { posts: [] };
  const plan = JSON.parse(await readFile(url, "utf8"));
  if (!Array.isArray(plan.posts)) throw new Error(`${fileURLToPath(url)}: posts 목록이 없습니다.`);
  return plan;
}

const hashtagLine = (tags) => tags.map((tag) => `#${String(tag).replace(/^#/, "")}`).join(" ");

/** 날짜별 원고 한 편을 올릴 모양으로 만든다. 본문칸에는 본문 + 빈 줄 + 해시태그가 들어간다. */
export function renderPlanPost(entry) {
  const body = `${entry.body.replace(/\s+$/, "")}\n\n${hashtagLine(entry.hashtags ?? [])}`;
  return {
    id: `plan-${entry.date}-${entry.branch}`,
    day: DAYS[kstWeekday(new Date(`${entry.date}T09:00:00+09:00`))],
    branch: entry.branch,
    source: "plan",
    title: entry.title,
    body,
    text: `${entry.title}\n\n${body}`,
    photo: entry.photo,
    photoPath: `${PHOTO_ROOT}${entry.photo}`,
    hashtags: entry.hashtags,
  };
}

/** KST 기준 요일(0=일). */
export function kstWeekday(date) {
  // 1970-01-01은 목요일(4).
  return (kstDayIndex(date) + 4) % 7;
}

/** 오늘 이 지점에 올릴 원고. 날짜별 원고(plan)에 있으면 그것을, 없으면 요일별 원고집을 쓴다. */
export function selectNewsPost({ posts, plan = [], branchId, date = new Date() }) {
  const dateKey = kstDateKey(date);
  const planned = plan.find((entry) => entry.date === dateKey && entry.branch === branchId);
  if (planned) return renderPlanPost(planned);

  const day = DAYS[kstWeekday(date)];
  const candidates = posts.filter((post) => post.day === day);
  if (!candidates.length) throw new Error(`${day}요일 원고가 없습니다.`);
  const week = Math.floor(kstDayIndex(date) / 7);
  const offset = BRANCH_OFFSET[branchId] ?? 0;
  const post = candidates[(week + offset) % candidates.length];
  return renderPost(post, branchId);
}

const countEmoji = (text) =>
  [...new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(text)].filter(({ segment }) =>
    /\p{Extended_Pictographic}/u.test(segment),
  ).length;

/** 원고 점검. 날짜별 원고(source: "plan")는 이모티콘 3개·해시태그 5개 규칙, 원고집은 해시태그·이모지 금지. */
export function checkNewsText(text, post) {
  if (post?.source === "plan") return checkPlanPost(post);
  const problems = [];
  const length = [...(text ?? "")].length;
  if (!text?.trim()) return ["본문이 비어 있습니다"];
  if (length < LENGTH_MIN || length > LENGTH_MAX) problems.push(`${length}자 (${LENGTH_MIN}~${LENGTH_MAX}자 범위 밖)`);
  if (/#\S/.test(text)) problems.push("해시태그가 들어 있습니다");
  if (/\p{Extended_Pictographic}/u.test(text)) problems.push("이모지가 들어 있습니다");
  return problems;
}

/** 날짜별 원고 한 편 점검(renderPlanPost 결과 또는 원본 항목). */
export function checkPlanPost(post) {
  const problems = [];
  const title = post.title?.trim() ?? "";
  const titleLength = [...title].length;
  if (titleLength < PLAN_TITLE_MIN || titleLength > PLAN_TITLE_MAX) {
    problems.push(`제목 ${titleLength}자 (${PLAN_TITLE_MIN}~${PLAN_TITLE_MAX}자 범위 밖)`);
  }
  if (countEmoji(title)) problems.push("제목에 이모티콘이 들어 있습니다");

  const tags = post.hashtags ?? [];
  if (tags.length !== PLAN_HASHTAG_COUNT) problems.push(`해시태그 ${tags.length}개 (${PLAN_HASHTAG_COUNT}개여야 합니다)`);
  if (tags.some((tag) => !/^#?[^\s#]+$/.test(String(tag)))) problems.push("해시태그에 빈칸이나 # 이 섞여 있습니다");
  if (new Set(tags.map((tag) => String(tag).replace(/^#/, ""))).size !== tags.length) problems.push("해시태그가 중복됩니다");

  // 원본 항목의 body는 해시태그 전 글, renderPlanPost의 body는 해시태그까지 붙은 본문칸 내용.
  const rendered = post.source === "plan" ? post : renderPlanPost(post);
  const story = rendered.body.slice(0, rendered.body.lastIndexOf("\n\n"));
  if (/#\S/.test(story)) problems.push("본문 안에 해시태그가 들어 있습니다 (hashtags 칸에만 넣어 주세요)");
  const emoji = countEmoji(story);
  if (emoji !== PLAN_EMOJI_COUNT) problems.push(`이모티콘 ${emoji}개 (${PLAN_EMOJI_COUNT}개여야 합니다)`);
  const bodyLength = [...rendered.body].length;
  if (!story.trim()) problems.push("본문이 비어 있습니다");
  else if (bodyLength < PLAN_BODY_MIN || bodyLength > PLAN_BODY_MAX) {
    problems.push(`본문 ${bodyLength}자 (해시태그 포함 ${PLAN_BODY_MIN}~${PLAN_BODY_MAX}자 범위 밖)`);
  }
  return problems;
}

/** 날짜별 원고 전체 점검. */
export function validateNewsPlan({ posts }) {
  const problems = [];
  const seen = new Set();
  for (const [index, entry] of posts.entries()) {
    const where = `${entry.date ?? "?"} ${entry.branch ?? "?"}(${index + 1}번째 항목)`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "")) problems.push(`${where}: 날짜 형식이 잘못됐습니다`);
    if (!BRANCHES[entry.branch]) problems.push(`${where}: 알 수 없는 지점`);
    const key = `${entry.date}|${entry.branch}`;
    if (seen.has(key)) problems.push(`${where}: 같은 날짜·지점 항목이 중복됩니다`);
    seen.add(key);
    if (typeof entry.title !== "string" || typeof entry.body !== "string" || !Array.isArray(entry.hashtags)) {
      problems.push(`${where}: title·body·hashtags 칸이 필요합니다`);
      continue;
    }
    for (const problem of checkPlanPost(entry)) problems.push(`${where}: ${problem}`);
    if (!entry.photo || !existsSync(`${PHOTO_ROOT}${entry.photo}`)) problems.push(`${where}: 사진이 없습니다 (${entry.photo})`);
  }
  return problems;
}

/** 원고집 전체 점검. 사람이 읽을 수 있는 오류 목록을 돌려준다. */
export function validateNewsBank({ posts }) {
  const problems = [];
  const ids = new Set();

  for (const post of posts) {
    const where = `${post.id}(${post.line}번째 줄)`;
    if (ids.has(post.id)) problems.push(`${where}: id가 중복됩니다`);
    ids.add(post.id);

    for (const key of [...findPlaceholders(post.text), ...findPlaceholders(post.photo)]) {
      if (!KNOWN_PLACEHOLDERS.includes(key)) problems.push(`${where}: 알 수 없는 자리표시 {${key}}`);
    }
    if (problems.some((p) => p.startsWith(where))) continue;

    for (const branchId of Object.keys(BRANCHES)) {
      const rendered = renderPost(post, branchId);
      for (const problem of checkNewsText(rendered.text)) problems.push(`${where} [${branchId}]: ${problem}`);
      if (!existsSync(rendered.photoPath)) problems.push(`${where} [${branchId}]: 사진이 없습니다 (${rendered.photo})`);
    }
  }

  for (const day of DAYS) {
    const count = posts.filter((post) => post.day === day).length;
    if (count < 3) problems.push(`${day}요일 원고가 ${count}편뿐입니다 (두 지점이 같은 글을 받지 않으려면 3편 이상 필요)`);
  }
  return problems;
}

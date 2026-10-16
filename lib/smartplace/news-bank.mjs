/**
 * 스마트플레이스 소식 원고집(content/smartplace/posts.txt) 파서와 오늘 원고 선택.
 *
 * 형식:
 *   == id: <아이디> | day: <월~일> | photo: <public/images/wangjing 기준 경로>
 *   본문 ...
 *
 * 같은 요일 원고가 주마다 돌아가고, 판교점과 모란본점은 같은 날 서로 다른 원고를 받는다.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { BRANCHES, fillPlaceholders, findPlaceholders, KNOWN_PLACEHOLDERS } from "./branches.mjs";
import { kstDayIndex } from "../threads/schedule.mjs";

export const BANK_URL = new URL("../../content/smartplace/posts.txt", import.meta.url);
export const PHOTO_ROOT = fileURLToPath(new URL("../../public/images/wangjing/", import.meta.url));

export const LENGTH_MIN = 80;
export const LENGTH_MAX = 400;

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
  const [title] = text.split("\n");
  return { id: post.id, day: post.day, branch: branchId, title, text, photo, photoPath: `${PHOTO_ROOT}${photo}` };
}

/** KST 기준 요일(0=일). */
export function kstWeekday(date) {
  // 1970-01-01은 목요일(4).
  return (kstDayIndex(date) + 4) % 7;
}

/** 오늘 이 지점에 올릴 원고. */
export function selectNewsPost({ posts, branchId, date = new Date() }) {
  const day = DAYS[kstWeekday(date)];
  const candidates = posts.filter((post) => post.day === day);
  if (!candidates.length) throw new Error(`${day}요일 원고가 없습니다.`);
  const week = Math.floor(kstDayIndex(date) / 7);
  const offset = BRANCH_OFFSET[branchId] ?? 0;
  const post = candidates[(week + offset) % candidates.length];
  return renderPost(post, branchId);
}

export function checkNewsText(text) {
  const problems = [];
  const length = [...(text ?? "")].length;
  if (!text?.trim()) return ["본문이 비어 있습니다"];
  if (length < LENGTH_MIN || length > LENGTH_MAX) problems.push(`${length}자 (${LENGTH_MIN}~${LENGTH_MAX}자 범위 밖)`);
  if (/#\S/.test(text)) problems.push("해시태그가 들어 있습니다");
  if (/\p{Extended_Pictographic}/u.test(text)) problems.push("이모지가 들어 있습니다");
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

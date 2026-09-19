/**
 * 쓰레드 원고집(content/threads/posts.txt) 파서.
 *
 * 형식:
 *   == id: <아이디> | theme: <주제>
 *   본문 ...
 *   (다음 == 줄 전까지)
 *
 * "#"으로 시작하는 줄은 블록 밖에서만 주석으로 취급한다.
 */

export const LENGTH_TARGET = 200;
export const LENGTH_MIN = 185;
export const LENGTH_MAX = 215;

const HEADER = /^==\s*id:\s*([A-Za-z0-9-]+)\s*\|\s*theme:\s*(.+?)\s*$/;

/** 공백과 줄바꿈을 포함한 글자 수(코드 포인트 기준). */
export function countCharacters(text) {
  return [...text].length;
}

export function parsePostBank(raw) {
  const lines = raw.split(/\r?\n/);
  const posts = [];
  let current = null;

  for (const [index, line] of lines.entries()) {
    const header = HEADER.exec(line);
    if (header) {
      if (current) posts.push(finishPost(current));
      current = { id: header[1], theme: header[2], body: [], line: index + 1 };
      continue;
    }
    if (current) {
      current.body.push(line);
      continue;
    }
    if (line.trim() && !line.startsWith("#")) {
      throw new Error(`원고집 ${index + 1}번째 줄: 블록 헤더(== id: ...) 앞에 본문이 있습니다.`);
    }
  }
  if (current) posts.push(finishPost(current));

  return { posts };
}

function finishPost({ id, theme, body, line }) {
  const text = body.join("\n").replace(/^\n+/, "").replace(/\s+$/, "");
  return { id, theme, text, line, length: countCharacters(text) };
}

/**
 * 본문 한 편이 쓰레드 원고 규칙을 지키는지 본다.
 * 원고집이든 Claude가 새로 쓴 글이든 올리기 전에 같은 잣대로 통과시킨다.
 */
export function checkPostContent(text) {
  const problems = [];
  const length = countCharacters(text ?? "");

  if (!text?.trim()) return ["본문이 비어 있습니다"];
  if (length < LENGTH_MIN || length > LENGTH_MAX) {
    problems.push(`${length}자 (${LENGTH_MIN}~${LENGTH_MAX}자 범위 밖)`);
  }
  if (/#\S/.test(text)) problems.push("해시태그가 들어 있습니다");
  if (/[*_`>]{2,}|^\s*[*#-]\s/m.test(text)) problems.push("마크다운 기호가 들어 있습니다");
  if (/\p{Extended_Pictographic}/u.test(text)) problems.push("이모지가 들어 있습니다");

  return problems;
}

/** 원고집 전체를 검사하고 사람이 읽을 수 있는 오류 목록을 돌려준다. */
export function validateBank({ posts }) {
  const problems = [];
  const seenIds = new Set();
  const seenTexts = new Map();

  if (posts.length === 0) problems.push("원고가 한 편도 없습니다.");

  for (const post of posts) {
    if (seenIds.has(post.id)) {
      problems.push(`${post.id}: id가 중복입니다 (${post.line}번째 줄).`);
    }
    seenIds.add(post.id);

    if (!post.text) {
      problems.push(`${post.id}: 본문이 비어 있습니다.`);
      continue;
    }
    for (const problem of checkPostContent(post.text)) {
      problems.push(`${post.id}: ${problem}`);
    }
    const previous = seenTexts.get(post.text);
    if (previous) {
      problems.push(`${post.id}: ${previous}와 본문이 같습니다.`);
    } else {
      seenTexts.set(post.text, post.id);
    }
  }

  return problems;
}

export async function loadPostBank(fileUrl = new URL("../../content/threads/posts.txt", import.meta.url)) {
  const { readFile } = await import("node:fs/promises");
  return parsePostBank(await readFile(fileUrl, "utf8"));
}

#!/usr/bin/env node
/** 원고집 글자수와 형식을 점검한다. `npm run threads:check` */

import { loadPostBank, validateBank, LENGTH_MAX, LENGTH_MIN, LENGTH_TARGET } from "../lib/threads/post-bank.mjs";

const bank = await loadPostBank();
const problems = validateBank(bank);
const lengths = bank.posts.map((post) => post.length);
const average = Math.round(lengths.reduce((sum, value) => sum + value, 0) / (lengths.length || 1));

for (const post of bank.posts) {
  const mark = post.length < LENGTH_MIN || post.length > LENGTH_MAX ? "✗" : "·";
  console.log(`${mark} ${String(post.length).padStart(3)}자  ${post.id.padEnd(22)} ${post.theme}`);
}

console.log(
  `\n총 ${bank.posts.length}편 · 평균 ${average}자 · 기준 ${LENGTH_MIN}~${LENGTH_MAX}자 (목표 ${LENGTH_TARGET}자)`,
);

if (problems.length) {
  console.error(`\n문제 ${problems.length}건:\n- ${problems.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("문제 없습니다.");
}

#!/usr/bin/env node
/** 스마트플레이스 소식 원고집·날짜별 원고 점검. `npm run smartplace:check` */

import { readdir } from "node:fs/promises";

import { BRANCH_IDS } from "../../lib/smartplace/branches.mjs";
import { DAYS, loadNewsBank, loadNewsPlan, renderPost, validateNewsBank, validateNewsPlan } from "../../lib/smartplace/news-bank.mjs";

const bank = await loadNewsBank();
for (const day of [...DAYS.slice(1), DAYS[0]]) {
  for (const post of bank.posts.filter((p) => p.day === day)) {
    const lengths = BRANCH_IDS.map((id) => [...renderPost(post, id).text].length).join("/");
    console.log(`${day}  ${post.id.padEnd(20)} ${lengths}자  ${post.photo}`);
  }
}

const problems = validateNewsBank(bank);
console.log(`\n총 ${bank.posts.length}편 (지점별 글자 수: ${BRANCH_IDS.join("/")})`);

// 날짜별 원고(plan-YYYY-MM.json)는 달마다 따로 점검한다.
const planFiles = (await readdir(new URL("../../content/smartplace/", import.meta.url))).filter((name) =>
  /^plan-\d{4}-\d{2}\.json$/.test(name),
);
for (const name of planFiles.sort()) {
  const month = name.slice(5, 12);
  const plan = await loadNewsPlan(new Date(`${month}-01T09:00:00+09:00`));
  const planProblems = validateNewsPlan(plan);
  console.log(`${name}: ${plan.posts.length}편`);
  problems.push(...planProblems.map((problem) => `${name} ${problem}`));
}

if (problems.length) {
  console.error(`\n문제 ${problems.length}건:\n- ${problems.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("문제 없습니다.");
}

#!/usr/bin/env node
/** 스마트플레이스 소식 원고집 점검. `npm run smartplace:check` */

import { BRANCH_IDS } from "../../lib/smartplace/branches.mjs";
import { DAYS, loadNewsBank, renderPost, validateNewsBank } from "../../lib/smartplace/news-bank.mjs";

const bank = await loadNewsBank();
for (const day of [...DAYS.slice(1), DAYS[0]]) {
  for (const post of bank.posts.filter((p) => p.day === day)) {
    const lengths = BRANCH_IDS.map((id) => [...renderPost(post, id).text].length).join("/");
    console.log(`${day}  ${post.id.padEnd(20)} ${lengths}자  ${post.photo}`);
  }
}

const problems = validateNewsBank(bank);
console.log(`\n총 ${bank.posts.length}편 (지점별 글자 수: ${BRANCH_IDS.join("/")})`);
if (problems.length) {
  console.error(`\n문제 ${problems.length}건:\n- ${problems.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("문제 없습니다.");
}

#!/usr/bin/env node
/** 네이버 블로그 메뉴 소개 원고집 점검과 앞으로 2주 일정 보기. `npm run blog:check` */

import { BODY_LENGTH_RANGE, loadMenuPosts, renderMenuPost, toPlainText, validateMenuPosts } from "../../lib/blog/menu-posts.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const bank = await loadMenuPosts();
console.log(`메뉴 ${bank.menus.length}개 (한 바퀴 ${bank.menus.length}일)\n`);

const start = new Date();
for (let day = 0; day < 14; day += 1) {
  const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
  const cells = BRANCH_IDS.map((branchId) => {
    const post = renderMenuPost({ bank, branchId, date });
    return `${BRANCHES[branchId].name} ${post.id} (${[...toPlainText(post)].length}자)`;
  });
  console.log(`${kstDateKey(date)}  ${cells.join("  |  ")}`);
}

const problems = validateMenuPosts(bank);
// 메뉴 한 바퀴 × 글감 두 벌을 모두 만들어 글 길이를 본다.
const [minLength, maxLength] = BODY_LENGTH_RANGE;
for (let day = 0; day < bank.menus.length * 2; day += 1) {
  const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
  for (const branchId of BRANCH_IDS) {
    const post = renderMenuPost({ bank, branchId, date });
    const length = [...toPlainText(post)].length;
    if (length < minLength || length > maxLength) {
      problems.push(`${BRANCHES[branchId].name} ${post.id}: ${length}자 (${minLength}~${maxLength}자로 맞춰 주세요)`);
    }
  }
}
const unique = [...new Set(problems)];
if (unique.length) {
  console.error(`\n문제 ${unique.length}건:\n- ${unique.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\n문제 없습니다.");
}

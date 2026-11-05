#!/usr/bin/env node
/** 네이버 블로그 메뉴 소개 원고집 점검과 앞으로 2주 일정 보기. `npm run blog:check` */

import { loadMenuPosts, POSTS_PER_DAY, renderMenuPost, toPlainText, validateMenuPosts } from "../../lib/blog/menu-posts.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const bank = await loadMenuPosts();
console.log(`메뉴 ${bank.menus.length}개, 지점마다 하루 ${POSTS_PER_DAY}편 (한 바퀴 ${bank.menus.length / POSTS_PER_DAY}일)\n`);

const start = new Date();
for (let day = 0; day < 14; day += 1) {
  const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
  const cells = BRANCH_IDS.map((branchId) => {
    const posts = Array.from({ length: POSTS_PER_DAY }, (_, slot) => renderMenuPost({ bank, branchId, date, slot }));
    return `${BRANCHES[branchId].name} ${posts.map((post) => `${post.id}(${[...toPlainText(post)].length}자)`).join(", ")}`;
  });
  console.log(`${kstDateKey(date)}  ${cells.join("  |  ")}`);
}

const problems = validateMenuPosts(bank);
if (problems.length) {
  console.error(`\n문제 ${problems.length}건:\n- ${problems.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\n문제 없습니다.");
}

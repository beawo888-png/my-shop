#!/usr/bin/env node
/** 모임 글 원고집 점검과 앞으로 2주 일정 보기. `npm run moim:check` */

import {
  loadGatheringPosts,
  loadPhotoPools,
  postLength,
  renderGatheringPost,
  SLOTS,
  validateGatheringPosts,
} from "../../lib/blog/gathering-posts.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { readConfig } from "../../lib/smartplace/local-store.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const bank = await loadGatheringPosts();
const config = await readConfig();
console.log(`테마 ${bank.themes.length}개 · 발행 기간 ${bank.startDate} ~ ${bank.endDate} · 지점마다 하루 ${SLOTS.length}편\n`);

for (const branchId of BRANCH_IDS) {
  const pools = loadPhotoPools(branchId, config);
  const ai = Object.entries(pools.ai).map(([theme, list]) => `${theme} ${list.length}장`).join(", ") || "없음";
  console.log(`${BRANCHES[branchId].name} 사진 폴더: ${pools.dir}`);
  console.log(`  실제 사진 ${pools.fallback ? "없음 (홈페이지 사진으로 대신)" : `${pools.real.length}장`} · AI 연출: ${ai}`);
}
console.log("");

const start = new Date(Math.max(Date.now(), new Date(`${bank.startDate}T18:00:00+09:00`).getTime()));
for (let day = 0; day < 14; day += 1) {
  const date = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
  if (kstDateKey(date) > bank.endDate) break;
  const cells = BRANCH_IDS.map((branchId) =>
    SLOTS.map((slot) => {
      const post = renderGatheringPost({ bank, branchId, slot, date });
      return `${post.title} (${postLength(post)}자)`;
    }).join(" / "),
  );
  console.log(`${kstDateKey(date)}\n  판교: ${cells[0]}\n  모란: ${cells[1]}`);
}

const problems = validateGatheringPosts(bank);
if (problems.length) {
  console.error(`\n문제 ${problems.length}건:\n- ${problems.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("\n문제 없습니다.");
}

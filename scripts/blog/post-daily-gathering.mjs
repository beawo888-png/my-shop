#!/usr/bin/env node
/**
 * 매일 저녁 판교점·모란본점 네이버 블로그에 '모임 키워드' 글(연말모임·회식·청첩장모임·가족모임 등)을 지점마다 2편씩 올린다.
 * 첫 편은 18:00, 둘째 편은 18:30. 사장님 PC의 작업 스케줄러가 18:00·18:30·19:10에 실행한다
 * (19:10은 놓친 글을 올리는 예비 실행. 이미 올린 글은 다시 올리지 않는다).
 * 설명서: docs/operations/naver-blog-gathering.md
 *
 * 사용법
 *   node scripts/blog/post-daily-gathering.mjs              # 지금 올릴 차례인 글 발행
 *   node scripts/blog/post-daily-gathering.mjs --dry-run    # 브라우저 없이 오늘 글 보기
 *   node scripts/blog/post-daily-gathering.mjs --check      # 화면에 다 채우고 최종 '발행'은 누르지 않기
 *   옵션: --branch=pangyo|moran  --slot=1|2  --date=2026-11-05  --force
 */

import { createInterface } from "node:readline/promises";

import { BLOG_BRANCHES, postWriteUrl } from "../../lib/blog/branch-info.mjs";
import { publishBlogPost } from "../../lib/blog/editor.mjs";
import {
  loadGatheringPosts,
  loadPhotoPools,
  postLength,
  renderGatheringPost,
  SLOT_TIMES,
  SLOTS,
  validateGatheringPosts,
} from "../../lib/blog/gathering-posts.mjs";
import { alreadyPublished, appendBlogLog, readBlogLog } from "../../lib/blog/log.mjs";
import { toPlainText } from "../../lib/blog/menu-posts.mjs";
import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { launchBrowser, LoginRequiredError, openWhenLoggedIn } from "../../lib/smartplace/browser.mjs";
import { readConfig } from "../../lib/smartplace/local-store.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const ALERT_TITLE = "네이버 블로그 모임 글 자동 발행";

function parseArgs(argv) {
  const args = { dryRun: false, check: false, force: false, date: undefined, slots: undefined, branches: BRANCH_IDS };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--force") args.force = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice(7);
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else if (arg.startsWith("--slot=")) args.slots = arg.slice(7).split(",").map((n) => Number(n) - 1);
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  for (const slot of args.slots ?? []) if (!SLOTS.includes(slot)) throw new Error("--slot은 1 또는 2입니다.");
  return args;
}

/** 지금(KST) 올릴 차례가 된 편. 18:00이 지나면 첫 편, 18:30이 지나면 둘째 편까지. */
function dueSlots(now) {
  const hhmm = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(11, 16);
  return SLOTS.filter((slot) => hhmm >= SLOT_TIMES[slot]);
}

async function openBrowser(branchId, channel) {
  const deadline = Date.now() + 60 * 60_000;
  for (;;) {
    try {
      return await launchBrowser({ branchId, channel });
    } catch (error) {
      if (Date.now() > deadline) throw error;
      console.warn(`⚠️  브라우저가 아직 다른 작업에 쓰이는 중이라 2분 뒤 다시 엽니다: ${error.message.split("\n")[0]}`);
      await new Promise((r) => setTimeout(r, 2 * 60_000));
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const now = args.date ? new Date(`${args.date}T18:40:00+09:00`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);
  const today = kstDateKey(now);
  const slots = args.slots ?? (args.dryRun || args.check || args.date ? SLOTS : dueSlots(now));

  const bank = await loadGatheringPosts();
  const problems = validateGatheringPosts(bank);
  if (problems.length) throw new Error(`모임 글 원고집에 문제가 있습니다:\n- ${problems.join("\n- ")}`);
  if (today < bank.startDate || today > bank.endDate) {
    console.log(`${today}: 모임 글 발행 기간(${bank.startDate} ~ ${bank.endDate})이 아닙니다. 기간을 늘리려면 원고집의 endDate를 바꾸세요.`);
    return;
  }
  if (!slots.length) {
    console.log(`아직 올릴 시간이 아닙니다 (첫 편 ${SLOT_TIMES[0]}, 둘째 편 ${SLOT_TIMES[1]}).`);
    return;
  }

  const config = await readConfig();
  const log = await readBlogLog();
  const warnings = [];
  const jobs = [];
  for (const branchId of args.branches) {
    const pools = loadPhotoPools(branchId, config);
    const name = BRANCHES[branchId].name;
    if (pools.fallback) warnings.push(`${name}: 사진 폴더(${pools.dir})에 사진이 없어 홈페이지 사진으로 올립니다.`);
    for (const slot of slots) {
      const post = renderGatheringPost({ bank, branchId, slot, date: now, photos: pools });
      console.log(`\n── ${today} · ${name} 블로그 · ${slot + 1}편 · ${post.id} (${postLength(post)}자) ──\n`);
      console.log(`[제목] ${post.title}\n[본문]\n${toPlainText(post)}\n[태그] ${post.tags.map((t) => `#${t}`).join(" ")}`);
      console.log(`[사진] ${post.photos.join("\n       ")}`);
      if (!post.aiPhoto) warnings.push(`${name} ${slot + 1}편(${post.themeId}): AI 연출 사진이 없어 실제 사진만 넣습니다.`);

      if (!args.dryRun && !args.check && !args.force && alreadyPublished(log, today, branchId, { kind: "gathering", slot })) {
        console.log(`\n${name} ${slot + 1}편: 오늘 이미 올렸습니다. 건너뜁니다.`);
        continue;
      }
      jobs.push({ branchId, slot, post });
    }
  }
  console.log("\n────────────────────────────");
  for (const warning of new Set(warnings)) console.warn(`⚠️  ${warning}`);
  if (args.dryRun || !jobs.length) return;

  const failures = [];
  for (const branchId of args.branches) {
    const mine = jobs.filter((job) => job.branchId === branchId);
    if (!mine.length) continue;
    const name = BRANCHES[branchId].name;
    const blogId = config.branches?.[branchId]?.blogId ?? BLOG_BRANCHES[branchId].blogId;
    const url = postWriteUrl(blogId);
    const context = await openBrowser(branchId, config.browserChannel ?? "chrome");
    try {
      for (const { slot, post } of mine) {
        const label = `${name} ${slot + 1}편`;
        const page = await context.newPage();
        try {
          await openWhenLoggedIn(page, url, {
            onWait: () => alertOwner(`${name} 네이버 로그인이 필요합니다. 방금 열린 브라우저 창에서 ${name} 아이디(${blogId})로 로그인해 주세요. (20분 동안 기다립니다)`, ALERT_TITLE),
          });
          const result = await publishBlogPost(page, {
            url,
            post,
            category: config.blogGatheringCategory ?? config.blogCategory,
            selectors: config.blogSelectors,
            submit: !args.check,
            shotName: `blog-moim-${today}-${branchId}-${slot + 1}`,
          });
          if (result.unlinked?.length) {
            const message = `${label}: '${result.unlinked.join("', '")}'에 링크를 걸지 못해 주소를 글자로 넣었습니다. 글에서 눌러지는지 확인해 주세요.`;
            if (args.check) console.warn(`⚠️  ${message}`);
            else failures.push(message);
          }
          if (args.check) {
            console.log(`\n🔎 ${label}: 최종 '발행' 직전까지 채웠습니다. 화면을 확인하세요. (발행은 누르지 않았습니다)`);
            const rl = createInterface({ input: process.stdin, output: process.stdout });
            await rl.question("확인이 끝났으면 여기서 엔터를 누르세요. 쓰던 글은 발행되지 않고 임시저장에만 남습니다. ");
            rl.close();
            continue;
          }
          await appendBlogLog({
            kind: "gathering",
            date: today,
            branch: branchId,
            slot,
            postId: post.id,
            title: post.title,
            submitted: result.submitted,
            verified: result.verified,
            postUrl: result.postUrl,
            at: new Date().toISOString(),
          });
          if (result.verified) console.log(`\n✅ ${label}: 블로그 발행 완료 ${result.postUrl ?? ""}`);
          else failures.push(`${label}: 발행 버튼은 눌렀지만 완료 화면을 확인하지 못했습니다. 블로그에서 한 번 확인해 주세요.`);
        } catch (error) {
          if (error instanceof LoginRequiredError) {
            failures.push(`${name} 네이버 로그인이 풀렸습니다. 'npm run blog:setup -- --branch=${branchId}'로 다시 로그인해 주세요.`);
            break;
          }
          failures.push(`${label}: ${error.message}`);
        } finally {
          await page.close().catch(() => {});
        }
      }
    } finally {
      await context.close().catch(() => {});
    }
  }

  if (failures.length) {
    alertOwner(failures.join("\n"), ALERT_TITLE);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  alertOwner(error.message, ALERT_TITLE);
  process.exitCode = 1;
});

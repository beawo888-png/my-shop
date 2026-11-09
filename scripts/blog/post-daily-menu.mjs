#!/usr/bin/env node
/**
 * 매일 오전 10시 반(KST)에 판교점·모란본점 네이버 블로그 '메뉴추천' 카테고리에 메뉴 소개 글을 올린다.
 * 지점마다 하루 2편, 모두 4편을 판교점 1 → 모란본점 1 → 판교점 2 → 모란본점 2 순서로 한 번에 올린다.
 * 사장님 PC의 작업 스케줄러가 실행한다 (docs/operations/naver-blog-automation.md).
 *
 * 사용법
 *   node scripts/blog/post-daily-menu.mjs              # 두 지점 발행
 *   node scripts/blog/post-daily-menu.mjs --dry-run    # 브라우저 없이 오늘 글만 보기
 *   node scripts/blog/post-daily-menu.mjs --check      # 화면에 다 채우고 최종 '발행'은 누르지 않기
 *   옵션: --branch=pangyo|moran  --slot=1|2(그날 첫째·둘째 글만)  --date=2026-11-06  --force
 *   메뉴를 직접 골라 한 편 올리기: --branch=pangyo --menu=어향육사 (순서대로 나가는 글과 따로 센다)
 */

import { createInterface } from "node:readline/promises";

import { BLOG_BRANCHES, postWriteUrl } from "../../lib/blog/branch-info.mjs";
import { publishBlogPost } from "../../lib/blog/editor.mjs";
import { alreadyPublished, appendBlogLog, readBlogLog } from "../../lib/blog/log.mjs";
import { CATEGORY, findMenu, loadMenuPosts, POSTS_PER_DAY, renderMenuPost, toPlainText, validateMenuPosts } from "../../lib/blog/menu-posts.mjs";
import { formatBlogReport, shortReason } from "../../lib/blog/report.mjs";
import { sendKakaoMemo } from "../../lib/notify/kakao.mjs";
import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { launchBrowser, LoginRequiredError, openWhenLoggedIn } from "../../lib/smartplace/browser.mjs";
import { readConfig } from "../../lib/smartplace/local-store.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const ALERT_TITLE = "네이버 블로그 자동 발행";

function parseArgs(argv) {
  const args = { dryRun: false, check: false, force: false, date: undefined, slots: undefined, menu: undefined, branches: BRANCH_IDS };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--check") args.check = true;
    else if (arg === "--force") args.force = true;
    else if (arg.startsWith("--date=")) args.date = arg.slice(7);
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else if (arg.startsWith("--slot=")) args.slots = arg.slice(7).split(",").map((n) => Number(n) - 1);
    else if (arg.startsWith("--menu=")) args.menu = arg.slice(7).trim();
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  if (args.menu && (args.branches.length !== 1 || args.slots)) {
    throw new Error("--menu는 지점 하나와 같이 씁니다. 예: --branch=pangyo --menu=어향육사");
  }
  for (const slot of args.slots ?? []) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= POSTS_PER_DAY) throw new Error(`--slot은 1~${POSTS_PER_DAY} 중에서 고릅니다.`);
  }
  return args;
}

/**
 * 스마트플레이스 작업이 같은 크롬 프로필을 쓰는 중이면 열리지 않는다. 2분마다 다시 시도한다(최대 60분).
 * 엣지(켜 둔 창에 다시 붙는 방식)는 같이 붙을 수 있어서 바로 열린다.
 */
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
  const now = args.date ? new Date(`${args.date}T10:00:00+09:00`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`날짜 형식이 잘못됐습니다: ${args.date}`);
  const today = kstDateKey(now);
  // 직접 고른 메뉴는 순번 대신 "manual"로 센다.
  const slots = args.menu ? ["manual"] : (args.slots ?? Array.from({ length: POSTS_PER_DAY }, (_, slot) => slot));
  const slotLabel = (slot) => (slot === "manual" ? "직접 고른 글" : `${slot + 1}번째 글`);

  const bank = await loadMenuPosts();
  const problems = validateMenuPosts(bank);
  if (problems.length) throw new Error(`블로그 원고집에 문제가 있습니다:\n- ${problems.join("\n- ")}`);

  const config = await readConfig();
  const log = await readBlogLog();
  const jobs = [];
  // 한 블로그에 두 편이 연달아 올라가지 않게 지점을 번갈아 올린다.
  for (const slot of slots) {
    for (const branchId of args.branches) {
      const post =
        slot === "manual"
          ? renderMenuPost({ bank, branchId, date: now, menuId: findMenu(bank, args.menu).id })
          : renderMenuPost({ bank, branchId, date: now, slot });
      console.log(`\n── ${today} · ${BRANCHES[branchId].name} 블로그 ${slotLabel(slot)} · ${post.id} · 카테고리 ${config.blogCategory ?? CATEGORY} ──\n`);
      console.log(`[제목] ${post.title}\n[본문]\n${toPlainText(post)}\n[태그] ${post.tags.map((t) => `#${t}`).join(" ")}`);

      const posted =
        slot === "manual"
          ? log.some((e) => e.date === today && e.branch === branchId && e.slot === "manual" && e.menuId === post.menuId && e.submitted)
          : alreadyPublished(log, today, branchId, slot);
      if (!args.dryRun && !args.check && !args.force && posted) {
        console.log(`\n${BRANCHES[branchId].name}: 오늘 ${slotLabel(slot)}(${post.menuId})은 이미 올렸습니다. 건너뜁니다.`);
        continue;
      }
      jobs.push({ branchId, slot, post });
    }
  }
  console.log("\n────────────────────────────");
  if (args.dryRun || !jobs.length) return;

  const failures = [];
  // 카카오톡으로 보낼 글마다의 결과
  const results = [];
  for (const { branchId, slot, post } of jobs) {
    const branchName = BRANCHES[branchId].name;
    const name = `${branchName} ${slotLabel(slot)}`;
    const report = { branch: branchName, slot: slotLabel(slot), menu: findMenu(bank, post.menuId).name, status: "fail" };
    results.push(report);
    const blogId = config.branches?.[branchId]?.blogId ?? BLOG_BRANCHES[branchId].blogId;
    const url = postWriteUrl(blogId);
    const context = await openBrowser(branchId, config.browserChannel ?? "chrome");
    // 스마트플레이스 작업과 겹쳐도 서로의 탭을 건드리지 않게 새 탭에서 한다.
    const page = await context.newPage();
    try {
      await openWhenLoggedIn(page, url, {
        onWait: () => alertOwner(`${branchName} 네이버 로그인이 필요합니다. 방금 열린 브라우저 창에서 ${branchName} 아이디(${blogId})로 로그인해 주세요. (20분 동안 기다립니다)`, ALERT_TITLE),
      });
      const result = await publishBlogPost(page, {
        url,
        post,
        // config.json의 blogCategory로 바꿀 수 있다. 빈 글자("")면 카테고리를 고르지 않는다(기본 카테고리).
        category: config.blogCategory ?? CATEGORY,
        selectors: config.blogSelectors,
        submit: !args.check,
        shotName: `blog-${today}-${branchId}-${slot === "manual" ? post.menuId : slot + 1}`,
      });
      if (result.unlinked?.length) {
        const message = `${name}: '${result.unlinked.join("', '")}'에 링크를 걸지 못해 주소를 글자로 넣었습니다. 글에서 눌러지는지 확인해 주세요.`;
        if (args.check) console.warn(`⚠️  ${message}`);
        else failures.push(message);
        report.reason = "링크 확인 필요";
      }
      if (args.check) {
        console.log(`\n🔎 ${name}: 최종 '발행' 직전까지 채웠습니다. 화면을 확인하세요. (발행은 누르지 않았습니다)`);
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        await rl.question("확인이 끝났으면 여기서 엔터를 누르세요. 쓰던 글은 발행되지 않고 임시저장에만 남습니다. ");
        rl.close();
        continue;
      }
      await appendBlogLog({
        date: today,
        branch: branchId,
        slot,
        postId: post.id,
        menuId: post.menuId,
        title: post.title,
        submitted: result.submitted,
        verified: result.verified,
        postUrl: result.postUrl,
        at: new Date().toISOString(),
      });
      if (result.verified) {
        console.log(`\n✅ ${name}: 블로그 발행 완료 ${result.postUrl ?? ""}`);
        report.status = report.reason ? "warn" : "ok";
      } else {
        failures.push(`${name}: 발행 버튼은 눌렀지만 완료 화면을 확인하지 못했습니다. 블로그에서 한 번 확인해 주세요.`);
        report.status = "warn";
        report.reason = "발행 확인 필요";
      }
    } catch (error) {
      if (error instanceof LoginRequiredError) {
        failures.push(`${branchName} 네이버 로그인이 풀렸습니다. 'npm run blog:setup -- --branch=${branchId}'로 다시 로그인해 주세요.`);
        report.reason = "로그인 풀림";
      } else {
        failures.push(`${name} 블로그: ${error.message}`);
        report.reason = shortReason(error.message);
      }
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  // 시험 실행(--check)은 발행하지 않으니 알리지 않는다.
  if (!args.check) await sendKakaoMemo(formatBlogReport({ date: today, results }), { link: "https://blog.naver.com/" + BLOG_BRANCHES.pangyo.blogId });

  if (failures.length) {
    alertOwner(failures.join("\n"), ALERT_TITLE);
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  await sendKakaoMemo(`[왕징 블로그] 발행을 시작하지 못했어요: ${error.message}`);
  alertOwner(error.message, ALERT_TITLE);
  process.exitCode = 1;
});

#!/usr/bin/env node
/**
 * 처음 한 번(또는 로그인이 풀렸을 때) 실행한다. `npm run blog:setup`
 * 한 지점만 다시 하려면 `npm run blog:setup -- --branch=moran`
 *
 * 스마트플레이스 자동화와 같은 지점별 전용 브라우저 창을 쓴다.
 * 1. 그 지점 아이디로 네이버에 로그인한다 ('로그인 상태 유지' 체크). 비밀번호는 어디에도 저장하지 않는다.
 * 2. 블로그 글쓰기 화면이 열리는지 확인한다.
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { BLOG_BRANCHES, postWriteUrl } from "../../lib/blog/branch-info.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { isLoginPage, launchBrowser } from "../../lib/smartplace/browser.mjs";
import { CONFIG_PATH, readConfig, writeConfig } from "../../lib/smartplace/local-store.mjs";

const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const targets = branchArg ? branchArg.slice(9).split(",") : BRANCH_IDS;
for (const id of targets) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const rl = readline.createInterface({ input, output });
const config = await readConfig();
config.branches ??= {};

for (const branchId of targets) {
  const name = BRANCHES[branchId].name;
  const blogId = config.branches[branchId]?.blogId ?? BLOG_BRANCHES[branchId].blogId;

  console.log(`\n━━━━━ ${name} 블로그 (${blogId}) ━━━━━`);
  const context = await launchBrowser({ branchId, channel: config.browserChannel ?? "chrome" });
  const page = await context.newPage();
  await page.goto(postWriteUrl(blogId), { waitUntil: "domcontentloaded" });

  console.log(`[1] 방금 열린 브라우저 창에서 ${name} 네이버 아이디(${blogId})로 로그인해 주세요. '로그인 상태 유지'를 꼭 체크하세요.`);
  console.log("    (이미 로그인돼 있으면 그대로 넘어가면 됩니다)");
  console.log("[2] 블로그 글쓰기 화면이 뜨는지 확인해 주세요. 글은 쓰지 마세요. 확인만 하면 됩니다.");
  const answer = (await rl.question(`블로그 아이디가 ${blogId}가 아니면 여기에 아이디를 입력하고, 맞으면 그냥 엔터를 누르세요. `)).trim();

  if (answer && answer !== blogId) {
    config.branches[branchId] = { ...config.branches[branchId], blogId: answer };
    await writeConfig(config);
    console.log(`  저장: ${name} 블로그 아이디 = ${answer}`);
  }
  if (isLoginPage(page.url())) {
    console.log(`⚠️  아직 로그인 화면입니다. 'npm run blog:setup -- --branch=${branchId}'로 다시 해 주세요.`);
  }
  await page.close().catch(() => {});
  await context.close();
}

rl.close();
console.log(`\n설정 파일: ${CONFIG_PATH}`);
console.log("이제 'npm run blog:test'로 최종 발행 직전까지 잘 채워지는지 확인해 보세요.");

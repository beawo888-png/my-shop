#!/usr/bin/env node
/**
 * 처음 한 번(또는 로그인이 풀렸을 때) 실행한다. `npm run smartplace:setup`
 *
 * 1. 전용 크롬 창에서 네이버에 로그인한다 ('로그인 상태 유지' 체크).
 * 2. 판교점, 모란본점의 '소식 작성' 화면을 차례로 열면 그 주소를 저장한다.
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { isLoginPage, launchBrowser } from "../../lib/smartplace/browser.mjs";
import { CONFIG_PATH, readConfig, writeConfig } from "../../lib/smartplace/local-store.mjs";

const rl = readline.createInterface({ input, output });
const config = await readConfig();
config.branches ??= {};

const context = await launchBrowser({ channel: config.browserChannel ?? "chrome" });
const page = context.pages()[0] ?? (await context.newPage());
await page.goto("https://new.smartplace.naver.com/", { waitUntil: "domcontentloaded" });

console.log("\n[1단계] 열린 크롬 창에서 네이버에 로그인해 주세요. '로그인 상태 유지'를 꼭 체크하세요.");
await rl.question("로그인이 끝나면 여기서 엔터를 누르세요. ");

for (const branchId of BRANCH_IDS) {
  const name = BRANCHES[branchId].name;
  const saved = config.branches[branchId]?.newsUrl;
  console.log(`\n[${name}] 스마트플레이스에서 ${name}을 고른 뒤, 소식 메뉴의 '새 소식 작성' 화면까지 들어가 주세요.`);
  if (saved) console.log(`  (지금 저장된 주소: ${saved} — 그대로 두려면 's' 입력)`);
  const answer = (await rl.question("그 화면이 열렸으면 엔터를 누르세요. ")).trim();
  if (answer === "s" && saved) continue;

  const pages = context.pages();
  const current = pages[pages.length - 1];
  const url = current.url();
  if (isLoginPage(url) || !/smartplace\.naver\.com/.test(url)) {
    console.log(`⚠️  지금 화면(${url})은 스마트플레이스가 아닌 것 같습니다. 다시 실행해 주세요.`);
    continue;
  }
  config.branches[branchId] = { ...config.branches[branchId], newsUrl: url };
  console.log(`  저장: ${url}`);
}

await writeConfig(config);
await context.close();
rl.close();
console.log(`\n설정을 저장했습니다: ${CONFIG_PATH}`);
console.log("이제 'npm run smartplace:test'로 등록 직전까지 잘 채워지는지 확인해 보세요.");

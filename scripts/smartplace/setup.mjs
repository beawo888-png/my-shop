#!/usr/bin/env node
/**
 * 처음 한 번(또는 로그인이 풀렸을 때) 실행한다. `npm run smartplace:setup`
 * 한 지점만 다시 하려면 `npm run smartplace:setup -- --branch=moran`
 *
 * 판교점과 모란본점은 네이버 아이디가 달라서 지점마다 전용 크롬 창을 따로 연다.
 * 1. 그 지점 아이디로 네이버에 로그인한다 ('로그인 상태 유지' 체크).
 * 2. 그 지점의 '새 소식 작성' 화면을 열면 주소를 저장한다.
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

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
  const saved = config.branches[branchId]?.newsUrl;

  console.log(`\n━━━━━ ${name} ━━━━━`);
  const context = await launchBrowser({ branchId, channel: config.browserChannel ?? "chrome" });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://new.smartplace.naver.com/", { waitUntil: "domcontentloaded" });

  console.log(`[1] 방금 열린 크롬 창에서 ${name} 네이버 아이디로 로그인해 주세요. '로그인 상태 유지'를 꼭 체크하세요.`);
  console.log("    (이미 로그인돼 있으면 그대로 넘어가면 됩니다)");
  console.log(`[2] 로그인 후 ${name} → 소식 → '새 소식 작성' 화면까지 들어가 주세요.`);
  if (saved) console.log(`    지금 저장된 주소: ${saved} — 로그인만 하고 주소는 그대로 두려면 's' 입력`);
  const answer = (await rl.question("그 화면이 열렸으면 여기서 엔터를 누르세요. ")).trim();

  if (!(answer === "s" && saved)) {
    const pages = context.pages();
    const url = pages[pages.length - 1].url();
    if (isLoginPage(url) || !/smartplace\.naver\.com/.test(url)) {
      console.log(`⚠️  지금 화면(${url})은 스마트플레이스가 아닌 것 같습니다. 'npm run smartplace:setup -- --branch=${branchId}'로 다시 해 주세요.`);
    } else {
      config.branches[branchId] = { ...config.branches[branchId], newsUrl: url };
      await writeConfig(config);
      console.log(`  저장: ${url}`);
    }
  }
  await context.close();
}

rl.close();
console.log(`\n설정 파일: ${CONFIG_PATH}`);
console.log("이제 'npm run smartplace:test'로 등록 직전까지 잘 채워지는지 확인해 보세요.");

#!/usr/bin/env node
/**
 * 한 매장의 네이버 검색광고 연결 설정. 매장마다 한 번 실행한다.
 *
 *   npm run agent:ads-setup -- --store=pangyo
 *
 * 1. 검색광고 API 열쇠 3개를 입력받는다(검색광고 관리시스템 → 도구 → API 사용 관리).
 * 2. 그 계정의 캠페인을 보여주고, 이 매장 캠페인을 고른다.
 *    두 매장이 한 광고 계정을 같이 쓰면 여기서 매장마다 자기 캠페인만 골라야 서로 섞이지 않는다.
 * 3. 이 매장 샌드박스(.smartplace/stores/<매장>/searchad.json, 깃에 안 올라감)에만 저장한다.
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { createSandbox } from "../../lib/store-agent/sandbox.mjs";
import { createSearchAdClient } from "../../lib/store-agent/searchad-client.mjs";
import { loadStore } from "../../lib/store-agent/stores.mjs";

const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
if (!storeArg) throw new Error("--store=<매장 id>가 필요합니다. 예: npm run agent:ads-setup -- --store=pangyo");
const store = loadStore(storeArg.slice(8));
const sandbox = createSandbox(store.id);
await sandbox.init();

const rl = readline.createInterface({ input, output });
const saved = (await sandbox.readCredentials()) ?? {};
console.log(`\n━━━━━ ${store.shortName} 검색광고 연결 ━━━━━`);
console.log("검색광고 관리시스템(searchad.naver.com) → 도구 → API 사용 관리에서 값을 복사해 붙여 넣으세요.");
console.log("이미 저장된 값을 그대로 쓰려면 그냥 엔터를 누르세요.\n");

async function ask(label, key) {
  const hint = saved[key] ? ` [저장됨: …${String(saved[key]).slice(-4)}]` : "";
  const answer = (await rl.question(`${label}${hint}: `)).trim();
  return answer || saved[key];
}

const credentials = {
  customerId: await ask("CUSTOMER_ID (숫자)", "customerId"),
  accessLicense: await ask("엑세스라이선스", "accessLicense"),
  secretKey: await ask("비밀키", "secretKey"),
};
if (!credentials.customerId || !credentials.accessLicense || !credentials.secretKey) {
  rl.close();
  throw new Error("세 값이 모두 필요합니다. 다시 실행해 주세요.");
}

const client = createSearchAdClient(credentials);
let campaigns;
try {
  campaigns = await client.listCampaigns();
} catch (error) {
  rl.close();
  throw new Error(`연결 확인 실패: ${error.message}\n값을 다시 확인해 주세요. 저장하지 않았습니다.`);
}

// 키워드가 있는 캠페인(파워링크 등)만 고를 수 있다. 플레이스 광고는 키워드가 없다.
const usable = campaigns.filter((c) => c.campaignTp !== "PLACE");
if (!usable.length) {
  rl.close();
  throw new Error("키워드를 쓰는 캠페인이 없습니다(플레이스 광고만 있음).");
}
console.log("\n이 계정의 캠페인:");
usable.forEach((c, i) => console.log(`  ${i + 1}. ${c.name}  (${c.campaignTp}${c.userLock ? ", 꺼짐" : ""})`));
const before = new Set(saved.campaignIds ?? []);
const defaults = usable.map((c, i) => (before.has(c.nccCampaignId) ? i + 1 : null)).filter(Boolean);
const picked = (await rl.question(`\n${store.shortName} 캠페인 번호를 쉼표로 고르세요${defaults.length ? ` [지금: ${defaults.join(",")}]` : ""}: `)).trim();
rl.close();

const numbers = picked ? picked.split(",").map((n) => Number(n.trim())) : defaults;
if (!numbers.length || numbers.some((n) => !Number.isInteger(n) || n < 1 || n > usable.length)) throw new Error("캠페인 번호가 올바르지 않습니다. 저장하지 않았습니다.");

const campaignIds = numbers.map((n) => usable[n - 1].nccCampaignId);
await sandbox.writeCredentials({ ...credentials, campaignIds });
console.log(`\n✅ 저장: ${numbers.map((n) => usable[n - 1].name).join(", ")}`);
console.log(`   (${sandbox.credentialsPath})`);
console.log(`이제 'npm run agent:daily -- --store=${store.id} --skip-daily --check'로 계획만 미리 볼 수 있습니다.`);

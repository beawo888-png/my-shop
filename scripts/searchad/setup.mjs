#!/usr/bin/env node
/**
 * 처음 한 번 실행한다. `npm run ads:setup` (한 지점만: `npm run ads:setup -- --branch=moran`)
 *
 * 지점마다 네이버 검색광고(searchad.naver.com) → 도구 → API 사용 관리에서 받은
 * 액세스라이선스(API 키) · 비밀키 · CUSTOMER_ID를 입력받아 .smartplace/searchad.json에 저장하고,
 * 바로 캠페인 목록을 읽어 키가 맞는지 확인한다. 키는 깃에 올라가지 않는다.
 */

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { createClient, readSearchadKeys, SEARCHAD_PATH, writeSearchadKeys } from "../../lib/searchad/client.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";

const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const targets = branchArg ? branchArg.slice(9).split(",") : BRANCH_IDS;
for (const id of targets) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const rl = readline.createInterface({ input, output });
const keys = await readSearchadKeys();

console.log("네이버 검색광고 → 도구 → API 사용 관리에서 지점 계정마다 라이선스를 발급받아 주세요.");
console.log("입력한 키는 이 PC의 .smartplace/searchad.json에만 저장됩니다.\n");

for (const branchId of targets) {
  const name = BRANCHES[branchId].name;
  const saved = keys[branchId];
  console.log(`━━━━━ ${name} 검색광고 계정 ━━━━━`);
  if (saved) console.log("  이미 저장된 키가 있습니다. 그대로 두려면 세 칸 모두 엔터만 누르세요.");
  const apiKey = (await rl.question("  액세스라이선스(API 키): ")).trim() || saved?.apiKey;
  const secretKey = (await rl.question("  비밀키: ")).trim() || saved?.secretKey;
  const customerId = (await rl.question("  CUSTOMER_ID(숫자): ")).trim() || saved?.customerId;
  if (!apiKey || !secretKey || !customerId) {
    console.log(`  ⚠️  ${name}: 세 가지가 모두 있어야 합니다. 건너뜁니다.\n`);
    continue;
  }
  try {
    const campaigns = await createClient({ apiKey, secretKey, customerId }).get("/ncc/campaigns");
    keys[branchId] = { apiKey, secretKey, customerId };
    await writeSearchadKeys(keys);
    console.log(`  ✅ 연결됐습니다. 캠페인 ${Array.isArray(campaigns) ? campaigns.length : 0}개를 찾았습니다.\n`);
  } catch (error) {
    console.log(`  ❌ 연결 실패: ${error.message}`);
    console.log("     키를 다시 확인하고 이 명령을 한 번 더 실행해 주세요. (저장하지 않았습니다)\n");
  }
}

rl.close();
console.log(`설정 파일: ${SEARCHAD_PATH}`);
console.log("이제 'npm run ads:keywords'로 키워드 분석 엑셀을 만들 수 있습니다.");

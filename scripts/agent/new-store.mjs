#!/usr/bin/env node
/**
 * 생성 에이전트: 새 매장(작업 단위)이 생길 때만 실행한다. 전담 에이전트를 만들어 주고 빠진다.
 *
 *   npm run agent:new-store                         # 질문에 답하며 만들기
 *   npm run agent:new-store -- --answers=답.json     # 미리 적어 둔 답으로 만들기
 *
 * 만드는 것
 *   stores/<매장 id>/store.json        매장 정보·말투·금지 표현·핵심 키워드 (기본 틀 stores/_template/store.json에서 시작)
 *   .smartplace/stores/<매장 id>/      그 매장 전용 기억 공간 (사장님 PC에만, 깃에 안 올라감)
 * 다른 매장 폴더는 읽지도 고치지도 않는다. 같은 id가 이미 있으면 멈춘다.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { BRANCHES } from "../../lib/smartplace/branches.mjs";
import { createSandbox } from "../../lib/store-agent/sandbox.mjs";
import { assertStoreId, renderStoreTemplate, storeFilePath, TEMPLATE_PATH, validateStore } from "../../lib/store-agent/stores.mjs";

const answersArg = process.argv.find((arg) => arg.startsWith("--answers="));

const list = (text) =>
  String(text ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

async function askAll() {
  const rl = readline.createInterface({ input, output });
  const q = async (label) => (await rl.question(`${label}\n> `)).trim();
  console.log("\n새 매장 전담 에이전트를 만듭니다. 질문 6개에 답해 주세요.\n");
  const answers = {
    id: await q("1. 매장 id (영문 소문자, 예: bundang)"),
    name: await q("2. 매장 전체 이름 (예: 왕징양다리양꼬치 분당점)"),
    shortName: await q("3. 짧은 이름 (예: 분당점)"),
    tone: await q("4. 원하는 말투 한 줄 (예: 친근하고 따뜻하게, 이모지는 가끔)"),
    examples: list(await q("   말투 예시 문장 2~3개 (쉼표로 구분, 없으면 엔터)")),
    forbidden: list(await q("5. 쓰면 안 되는 표현 (쉼표로 구분, 없으면 엔터 = 기본값)")),
    coreKeywords: list(await q("6. 검색광고에서 절대 지우면 안 되는 핵심 키워드 (쉼표로 구분)")),
  };
  rl.close();
  return answers;
}

const answers = answersArg ? JSON.parse(await readFile(answersArg.slice(10), "utf8")) : await askAll();
assertStoreId(answers.id);
answers.branchId = answers.branchId ?? answers.id;

const file = storeFilePath(answers.id);
if (existsSync(file)) throw new Error(`'${answers.id}' 매장이 이미 있습니다(${file}). 기존 매장은 건드리지 않습니다. 다른 id를 쓰세요.`);

const store = renderStoreTemplate(await readFile(TEMPLATE_PATH, "utf8"), answers);
// 스마트플레이스·블로그 화면 자동화가 아직 이 매장을 모르면, 그 채널은 꺼 둔 채로 만든다.
const knownBranch = Boolean(BRANCHES[store.branchId]);
if (!knownBranch) store.channels.smartplace = false;

const problems = validateStore(store, answers.id);
if (problems.length) throw new Error(`답에 문제가 있습니다: ${problems.join(", ")}`);

await mkdir(path.dirname(file), { recursive: true });
await writeFile(file, `${JSON.stringify(store, null, 2)}\n`, "utf8");
const sandbox = createSandbox(store.id);
await sandbox.init();

console.log(`\n✅ ${store.shortName} 전담 에이전트를 만들었습니다.`);
console.log(`   매장 파일: ${path.relative(process.cwd(), file)}`);
console.log(`   기억 공간: ${sandbox.dir}`);
console.log("\n다음 할 일");
console.log(`  1. 검색광고 연결: npm run agent:ads-setup -- --store=${store.id}`);
console.log(`  2. 미리 보기:     npm run agent:daily -- --store=${store.id} --check`);
if (!knownBranch) {
  console.log("\n⚠️  스마트플레이스·블로그 자동화는 아직 이 매장 화면 정보(지점 정보·블로그 아이디)가 없어 꺼 두었습니다.");
  console.log("   lib/smartplace/branches.mjs와 lib/blog/branch-info.mjs에 이 매장을 추가한 뒤 store.json의 channels.smartplace를 true로 바꾸세요.");
}

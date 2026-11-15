/**
 * 작업 단위 = 매장. 매장 하나 = stores/<매장 id>/store.json 하나 = 전담 에이전트 하나.
 * 이 파일은 매장 목록을 찾고 매장 파일을 읽어 점검만 한다. 매장끼리의 데이터는 여기서 섞지 않는다.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STORES_DIR = fileURLToPath(new URL("../../stores/", import.meta.url));
export const TEMPLATE_PATH = path.join(STORES_DIR, "_template", "store.json");

/** 매장 id: 영문 소문자로 시작, 영문 소문자·숫자·하이픈 2~31자. 폴더 이름으로 쓰므로 경로 문자를 막는다. */
export const STORE_ID_PATTERN = /^[a-z][a-z0-9-]{1,30}$/;

export function assertStoreId(id) {
  if (typeof id !== "string" || !STORE_ID_PATTERN.test(id)) {
    throw new Error(`매장 id가 올바르지 않습니다: ${JSON.stringify(id)} (영문 소문자로 시작, 영문 소문자·숫자·하이픈만)`);
  }
  return id;
}

export function storeFilePath(id) {
  return path.join(STORES_DIR, assertStoreId(id), "store.json");
}

/** 매장 폴더 목록. 밑줄(_)로 시작하는 폴더(기본 틀)는 매장이 아니다. */
export function listStoreIds(dir = STORES_DIR) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && STORE_ID_PATTERN.test(entry.name))
    .filter((entry) => existsSync(path.join(dir, entry.name, "store.json")))
    .map((entry) => entry.name)
    .sort();
}

export function validateStore(store, expectedId) {
  const problems = [];
  if (!store || typeof store !== "object") return ["매장 파일이 비어 있습니다"];
  if (!STORE_ID_PATTERN.test(store.id ?? "")) problems.push("id가 올바르지 않습니다");
  if (expectedId && store.id !== expectedId) problems.push(`폴더 이름(${expectedId})과 id(${store.id})가 다릅니다`);
  for (const key of ["name", "shortName"]) {
    if (typeof store[key] !== "string" || !store[key].trim() || store[key].includes("{{")) problems.push(`${key}가 비어 있습니다`);
  }
  if (store.branchId != null && !STORE_ID_PATTERN.test(store.branchId)) problems.push("branchId가 올바르지 않습니다");
  if (typeof store.voice?.tone !== "string" || !store.voice.tone.trim() || store.voice.tone.includes("{{")) problems.push("voice.tone(말투)이 비어 있습니다");
  if (store.voice?.forbidden != null && !Array.isArray(store.voice.forbidden)) problems.push("voice.forbidden은 목록이어야 합니다");
  const core = store.searchAd?.coreKeywords;
  if (core != null && (!Array.isArray(core) || core.some((k) => typeof k !== "string" || !k.trim()))) {
    problems.push("searchAd.coreKeywords는 글자 목록이어야 합니다");
  }
  return problems;
}

export function loadStore(id, dir = STORES_DIR) {
  assertStoreId(id);
  const file = path.join(dir, id, "store.json");
  let store;
  try {
    store = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`매장 '${id}'이 없습니다. 있는 매장: ${listStoreIds(dir).join(", ") || "(없음)"}`);
    throw new Error(`stores/${id}/store.json을 읽지 못했습니다: ${error.message}`);
  }
  const problems = validateStore(store, id);
  if (problems.length) throw new Error(`stores/${id}/store.json 문제: ${problems.join(", ")}`);
  return store;
}

/** 새 매장 파일을 기본 틀(stores/_template/store.json)에서 만든다. {{이름}} 자리를 답으로 채운다. */
export function renderStoreTemplate(templateText, answers) {
  const filled = templateText.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!(key in answers)) throw new Error(`기본 틀의 ${match} 자리에 넣을 답이 없습니다`);
    return JSON.stringify(String(answers[key])).slice(1, -1);
  });
  const store = JSON.parse(filled);
  if (answers.examples?.length) store.voice.examples = answers.examples;
  if (answers.forbidden?.length) store.voice.forbidden = answers.forbidden;
  if (answers.coreKeywords?.length) store.searchAd.coreKeywords = answers.coreKeywords;
  if (answers.channels) store.channels = { ...store.channels, ...answers.channels };
  return store;
}

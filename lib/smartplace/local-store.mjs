/**
 * 사장님 PC에만 두는 파일들(.smartplace/ — 깃에 올라가지 않음).
 *   config.json   지점별 '소식 작성' 화면 주소, 선택자 덮어쓰기
 *   profile-pangyo/, profile-moran/
 *                 지점별 네이버 로그인이 유지되는 전용 크롬 프로필 (지점마다 아이디가 다르다)
 *   log.jsonl     발행 이력 (같은 날 두 번 올리지 않기 위해)
 *   screenshots/  매 실행 화면 기록
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const LOCAL_DIR = fileURLToPath(new URL("../../.smartplace/", import.meta.url));
export const CONFIG_PATH = `${LOCAL_DIR}config.json`;
export function profileDir(branchId) {
  return `${LOCAL_DIR}profile-${branchId}`;
}
export const LOG_PATH = `${LOCAL_DIR}log.jsonl`;
export const SCREENSHOT_DIR = `${LOCAL_DIR}screenshots`;

export async function readConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { branches: {} };
    throw new Error(`.smartplace/config.json을 읽지 못했습니다: ${error.message}`);
  }
}

export async function writeConfig(config) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function readLog() {
  try {
    const raw = await readFile(LOG_PATH, "utf8");
    return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function appendLog(entry) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

/** 이미 등록 버튼까지 누른 기록이 있으면 다시 올리지 않는다(중복 게시 방지). */
export function alreadyPosted(log, date, branchId) {
  return log.some((entry) => entry.date === date && entry.branch === branchId && entry.submitted);
}

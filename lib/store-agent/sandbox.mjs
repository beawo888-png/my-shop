/**
 * 매장 전담 에이전트의 독립 공간(샌드박스).
 *
 * 매장마다 사장님 PC의 .smartplace/stores/<매장 id>/ 폴더 하나만 쓴다(깃에 올라가지 않음).
 *   memory.json      기억: 채널별 수습/자동 상태, 사장님 피드백, 지키라는 키워드, 지운 키워드
 *   searchad.json    네이버 검색광고 API 열쇠와 이 매장 캠페인 번호 (비밀값이라 이 폴더에만 둔다)
 *   pending/         사장님 승인을 기다리는 계획
 *   history.jsonl    한 일 기록
 *
 * 에이전트 코드는 createSandbox(매장 id)로 받은 객체만 쓴다. 그래서 다른 매장 폴더의 경로를 만들 방법이 없다.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assertStoreId } from "./stores.mjs";

export const SANDBOX_ROOT = fileURLToPath(new URL("../../.smartplace/stores/", import.meta.url));

export const CHANNELS = ["searchAd"];

export function emptyMemory() {
  return {
    version: 1,
    trust: Object.fromEntries(CHANNELS.map((channel) => [channel, { mode: "probation", streak: 0 }])),
    /** 사장님이 "이건 지우지 마"라고 한 키워드(승인 때 계획에서 뺀 것 포함). 핵심 키워드처럼 지킨다. */
    protectedKeywords: [],
    /** 에이전트가 지운 키워드. 다시 추가하지 않으려고 남긴다. */
    deletedKeywords: [],
    /** 사장님 피드백 기록 (최근 것이 뒤) */
    feedback: [],
  };
}

/** 계획 내용(할 일 목록)의 지문. 승인 파일을 사장님이 고쳤는지 알아보는 데 쓴다. */
export function planDigest(actions) {
  const normalized = actions.map((a) => ({ type: a.type, keywordId: a.keywordId })).sort((a, b) => `${a.type}${a.keywordId}`.localeCompare(`${b.type}${b.keywordId}`));
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex").slice(0, 16);
}

export function createSandbox(storeId, root = SANDBOX_ROOT) {
  assertStoreId(storeId);
  const dir = path.join(root, storeId);
  const memoryPath = path.join(dir, "memory.json");
  const credentialsPath = path.join(dir, "searchad.json");
  const historyPath = path.join(dir, "history.jsonl");
  const pendingDir = path.join(dir, "pending");

  async function readJson(file, fallback) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return fallback;
      throw new Error(`${path.relative(root, file)}을 읽지 못했습니다: ${error.message}`);
    }
  }

  async function writeJson(file, data) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  function pendingPath(channel) {
    if (!CHANNELS.includes(channel)) throw new Error(`알 수 없는 채널: ${channel}`);
    return path.join(pendingDir, `${channel}.json`);
  }

  return {
    storeId,
    dir,
    exists: () => existsSync(dir),
    init: async () => {
      await mkdir(pendingDir, { recursive: true });
      if (!existsSync(memoryPath)) await writeJson(memoryPath, emptyMemory());
    },

    readMemory: async () => {
      const saved = await readJson(memoryPath, null);
      const base = emptyMemory();
      if (!saved) return base;
      return { ...base, ...saved, trust: { ...base.trust, ...(saved.trust ?? {}) } };
    },
    writeMemory: (memory) => writeJson(memoryPath, memory),

    readCredentials: () => readJson(credentialsPath, null),
    writeCredentials: (credentials) => writeJson(credentialsPath, credentials),
    credentialsPath,

    readPending: (channel) => readJson(pendingPath(channel), null),
    writePending: (channel, pending) => writeJson(pendingPath(channel), pending),
    clearPending: (channel) => rm(pendingPath(channel), { force: true }),
    pendingPath,
    listPending: async () => {
      try {
        return (await readdir(pendingDir)).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -5));
      } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    },

    appendHistory: async (entry) => {
      await mkdir(dir, { recursive: true });
      await appendFile(historyPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, "utf8");
    },
    readHistory: async () => {
      try {
        const raw = await readFile(historyPath, "utf8");
        return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
      } catch (error) {
        if (error.code === "ENOENT") return [];
        throw error;
      }
    },
  };
}

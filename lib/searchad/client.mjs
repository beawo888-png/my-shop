/**
 * 네이버 검색광고 API(https://api.searchad.naver.com)에 읽기 전용으로 접속한다.
 *
 * 공식 문서: https://naver.github.io/searchad-apidoc/
 * 서명: base64(HMAC-SHA256(비밀키, "<타임스탬프>.<메서드>.<경로>")) — 경로에는 ?뒤 쿼리를 넣지 않는다.
 *
 * 키는 지점마다 다르다(판교점·모란본점 광고 계정이 따로). .smartplace/searchad.json에만 둔다(깃에 올라가지 않음).
 * 이 클라이언트는 GET만 할 수 있다. 광고 설정을 바꾸는 요청은 일부러 만들지 않았다.
 */

import { createHmac } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";

import { LOCAL_DIR } from "../smartplace/local-store.mjs";

export const API_HOST = "https://api.searchad.naver.com";
export const SEARCHAD_PATH = `${LOCAL_DIR}searchad.json`;

export function sign(timestamp, method, uri, secretKey) {
  return createHmac("sha256", secretKey).update(`${timestamp}.${method}.${uri}`).digest("base64");
}

/** 쿼리 값: 배열·객체는 JSON 문자열로(fields, timeRange), 나머지는 그대로. */
function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    query.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{apiKey: string, secretKey: string, customerId: string|number}} keys
 * @param {{fetch?: typeof fetch, now?: () => number, wait?: (ms: number) => Promise<void>, gapMs?: number}} [options]
 */
export function createClient(keys, options = {}) {
  for (const name of ["apiKey", "secretKey", "customerId"]) {
    if (!keys?.[name]) throw new Error(`검색광고 API 키에 ${name}이(가) 없습니다. 'npm run ads:setup'을 먼저 실행해 주세요.`);
  }
  const doFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const wait = options.wait ?? sleep;
  const gapMs = options.gapMs ?? 150; // 네이버가 짧은 시간에 너무 많은 요청을 막아서(1016, 429) 조금씩 쉰다

  async function get(uri, params) {
    for (let attempt = 0; ; attempt += 1) {
      const timestamp = String(now());
      const response = await doFetch(`${API_HOST}${uri}${toQuery(params)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Timestamp": timestamp,
          "X-API-KEY": keys.apiKey,
          "X-Customer": String(keys.customerId),
          "X-Signature": sign(timestamp, "GET", uri, keys.secretKey),
        },
      });
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      const code = body?.code;
      const tooMany = response.status === 429 || code === 1016;
      if (tooMany && attempt < 4) {
        await wait(1000 * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        const message = body?.title ?? body?.message ?? text;
        const hint = response.status === 401 || response.status === 403 ? " (API 키·비밀키·CUSTOMER_ID가 맞는지 확인해 주세요)" : "";
        const error = new Error(`검색광고 API ${uri} 실패: ${response.status} ${message}${hint}`);
        error.status = response.status;
        error.code = code;
        throw error;
      }
      await wait(gapMs);
      return body;
    }
  }

  return { get };
}

/** .smartplace/searchad.json → { pangyo: {apiKey, secretKey, customerId}, moran: {...} } */
export async function readSearchadKeys() {
  try {
    return JSON.parse(await readFile(SEARCHAD_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`.smartplace/searchad.json을 읽지 못했습니다: ${error.message}`);
  }
}

export async function writeSearchadKeys(data) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(SEARCHAD_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

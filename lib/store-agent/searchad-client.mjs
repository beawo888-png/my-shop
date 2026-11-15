/**
 * 네이버 검색광고 API 클라이언트 (https://api.searchad.naver.com).
 *
 * 열쇠 3개가 필요하다. 검색광고 관리시스템 → 도구 → API 사용 관리에서 발급한다.
 *   accessLicense (엑세스라이선스), secretKey (비밀키), customerId (CUSTOMER_ID)
 * 요청마다 "시각.메서드.경로"를 비밀키로 HMAC-SHA256 서명해 X-Signature 헤더에 넣는다.
 */

import { createHmac } from "node:crypto";

export const SEARCHAD_HOST = "https://api.searchad.naver.com";

export function signRequest({ timestamp, method, uri, secretKey }) {
  return createHmac("sha256", secretKey).update(`${timestamp}.${method.toUpperCase()}.${uri}`).digest("base64");
}

export class SearchAdError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "SearchAdError";
    this.status = status;
    this.body = body;
  }
}

/** "< 10" 같은 검색량 글자를 숫자로. "< 10"은 0으로 본다(10 미만). */
export function parseVolume(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.trim().startsWith("<")) return 0;
    const n = Number(value.replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** 키워드 도구에 보낼 때는 띄어쓰기를 뺀 대문자로 비교한다(네이버가 그렇게 돌려준다). */
export function volumeKey(keyword) {
  return keyword.replace(/\s+/g, "").toUpperCase();
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export function createSearchAdClient({ accessLicense, secretKey, customerId, fetchImpl = globalThis.fetch, now = () => Date.now() }) {
  if (!accessLicense || !secretKey || !customerId) throw new Error("검색광고 API 열쇠(accessLicense, secretKey, customerId)가 모두 필요합니다.");

  async function request(method, uri, { query, body } = {}) {
    const timestamp = String(now());
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const v of value) params.append(key, v);
      else params.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const url = `${SEARCHAD_HOST}${uri}${params.size ? `?${params}` : ""}`;
    const response = await fetchImpl(url, {
      method,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": String(customerId),
        "X-Signature": signRequest({ timestamp, method, uri, secretKey }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!response.ok) {
      const detail = (data && (data.title || data.message || data.detail)) || text.slice(0, 200);
      throw new SearchAdError(`검색광고 API ${method} ${uri} 실패 (${response.status}): ${detail}`, { status: response.status, body: data });
    }
    return data;
  }

  return {
    request,
    listCampaigns: () => request("GET", "/ncc/campaigns"),
    listAdgroups: (campaignId) => request("GET", "/ncc/adgroups", { query: { nccCampaignId: campaignId } }),
    listKeywords: (adgroupId) => request("GET", "/ncc/keywords", { query: { nccAdgroupId: adgroupId } }),

    /** 키워드별 기간 합계. 돌려주는 값: Map(키워드 id → { impCnt, clkCnt, salesAmt, ccnt }) */
    async getStats(ids, { since, until }) {
      const result = new Map();
      for (const part of chunk(ids, 50)) {
        const data = await request("GET", "/stats", {
          query: {
            ids: part,
            fields: ["impCnt", "clkCnt", "salesAmt", "ccnt"],
            timeRange: { since, until },
          },
        });
        for (const row of data?.data ?? []) {
          result.set(row.id, {
            impCnt: Number(row.impCnt) || 0,
            clkCnt: Number(row.clkCnt) || 0,
            salesAmt: Number(row.salesAmt) || 0,
            ccnt: Number(row.ccnt) || 0,
          });
        }
      }
      return result;
    },

    /** 한 달 검색량(PC+모바일). 돌려주는 값: Map(volumeKey(키워드) → 숫자) */
    async getMonthlyVolumes(keywords) {
      const result = new Map();
      const hints = [...new Set(keywords.map(volumeKey))].filter(Boolean);
      for (const part of chunk(hints, 5)) {
        const data = await request("GET", "/keywordstool", { query: { hintKeywords: part.join(","), showDetail: 1 } });
        for (const row of data?.keywordList ?? []) {
          const key = volumeKey(row.relKeyword ?? "");
          if (!part.includes(key)) continue;
          const pc = parseVolume(row.monthlyPcQcCnt);
          const mobile = parseVolume(row.monthlyMobileQcCnt);
          if (pc === null && mobile === null) continue;
          result.set(key, (pc ?? 0) + (mobile ?? 0));
        }
      }
      return result;
    },

    pauseKeyword: (keyword) =>
      request("PUT", `/ncc/keywords/${keyword.keywordId}`, {
        query: { fields: "userLock" },
        body: { nccKeywordId: keyword.keywordId, nccAdgroupId: keyword.adgroupId, userLock: true },
      }),
    deleteKeyword: (keyword) => request("DELETE", `/ncc/keywords/${keyword.keywordId}`),
  };
}

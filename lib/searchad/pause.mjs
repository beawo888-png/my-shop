/**
 * 키워드 끄기·되돌리기 (2주 시험용).
 *
 * - '끄기'는 네이버의 사용자 중지(userLock)다. 키워드·입찰가·설정은 그대로 남고, 되돌리면 그대로 다시 켜진다.
 * - 라이브애드 캠페인(이름에 '프로그램')은 절대 건드리지 않는다. 목록에 같은 단어가 있어도 건너뛴다.
 * - 이미 꺼져 있던 키워드는 건드리지 않고 기록에도 넣지 않는다. 그래서 되돌릴 때 원래 꺼져 있던 것을 켜는 일이 없다.
 * - 이 프로그램이 끈 키워드만 .smartplace/paused-keywords.json에 남기고, 되돌릴 때는 그 기록만 켠다.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";

import { LOCAL_DIR } from "../smartplace/local-store.mjs";
import { campaignGroup } from "./history.mjs";
import { CAMPAIGN_TYPES, chunk, mapLimit, normalizeKeyword } from "./keywords.mjs";

export const PAUSE_LOG = `${LOCAL_DIR}paused-keywords.json`;

const listOf = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

/** 캠페인·광고그룹·키워드 목록만(성과 없이) 읽는다. */
export async function listAccount(client, { onProgress, concurrency = 4 } = {}) {
  const campaigns = listOf(await client.get("/ncc/campaigns"));
  const adgroups = (await mapLimit(campaigns, concurrency, async (c) => listOf(await client.get("/ncc/adgroups", { nccCampaignId: c.nccCampaignId })))).flat();
  onProgress?.(`캠페인 ${campaigns.length}개, 광고그룹 ${adgroups.length}개`);
  let done = 0;
  const keywords = (
    await mapLimit(adgroups, concurrency, async (group) => {
      try {
        return listOf(await client.get("/ncc/keywords", { nccAdgroupId: group.nccAdgroupId }));
      } catch (error) {
        if (error.status !== 400 && error.status !== 403) throw error;
        return [];
      } finally {
        done += 1;
        if (done % 500 === 0 && done < adgroups.length) onProgress?.(`키워드 읽는 중… 광고그룹 ${done}/${adgroups.length}`);
      }
    })
  ).flat();
  onProgress?.(`키워드 ${keywords.length}개`);
  return { campaigns, adgroups, keywords };
}

/**
 * 끌 단어 목록(targets: [{keyword, …}]) → 계정에서 실제로 끌 키워드.
 * 같은 단어가 여러 광고그룹에 있으면 모두 끈다(라이브애드 캠페인 제외).
 */
export function planPause({ campaigns, adgroups, keywords }, targets) {
  const wanted = new Map(targets.map((t) => [normalizeKeyword(t.keyword), t]));
  const campaignById = new Map(campaigns.map((c) => [c.nccCampaignId, c]));
  const groupById = new Map(adgroups.map((g) => [g.nccAdgroupId, g]));
  const toPause = [];
  const liveAd = [];
  const alreadyOff = [];
  const found = new Set();
  for (const k of keywords) {
    const key = normalizeKeyword(k.keyword);
    if (!wanted.has(key)) continue;
    found.add(key);
    const group = groupById.get(k.nccAdgroupId);
    const campaign = campaignById.get(k.nccCampaignId ?? group?.nccCampaignId);
    const item = {
      nccKeywordId: k.nccKeywordId,
      nccAdgroupId: k.nccAdgroupId,
      keyword: k.keyword,
      campaign: campaign?.name ?? "",
      campaignType: CAMPAIGN_TYPES[campaign?.campaignTp] ?? campaign?.campaignTp ?? "",
      adgroup: group?.name ?? "",
    };
    if (campaignGroup(campaign) === "라이브애드") liveAd.push(item);
    else if (k.userLock) alreadyOff.push(item);
    else toPause.push(item);
  }
  const notFound = [...wanted.values()].filter((t) => !found.has(normalizeKeyword(t.keyword))).map((t) => t.keyword);
  return { toPause, liveAd, alreadyOff, notFound };
}

/** userLock을 바꾼다(true = 끄기, false = 다시 켜기). 50개씩. */
export async function setUserLock(client, items, userLock, { onProgress } = {}) {
  if (typeof client.put !== "function") throw new Error("이 클라이언트는 광고를 바꿀 수 없습니다(allowWrite 필요).");
  let done = 0;
  for (const part of chunk(items, 50)) {
    await client.put("/ncc/keywords", { fields: "userLock" }, part.map((i) => ({ nccKeywordId: i.nccKeywordId, nccAdgroupId: i.nccAdgroupId, userLock })));
    done += part.length;
    onProgress?.(`${done}/${items.length}`);
  }
}

export async function readPauseLog() {
  try {
    return JSON.parse(await readFile(PAUSE_LOG, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { batches: [] };
    throw new Error(`.smartplace/paused-keywords.json을 읽지 못했습니다: ${error.message}`);
  }
}

export async function writePauseLog(log) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(PAUSE_LOG, `${JSON.stringify(log, null, 2)}\n`, "utf8");
}

/** 아직 되돌리지 않은 기록 중 가장 최근 것(지점별) */
export function openBatches(log, branchId) {
  return log.batches.filter((b) => !b.restoredAt && (!branchId || b.branch === branchId));
}

/**
 * 지점 광고 계정에 넣어 둔 키워드를 모두 읽고, 최근 성과와 네이버 월간 검색수를 붙여
 * "어떤 키워드가 검색이 잘 되고, 돈값을 하는지"를 판정한다. 읽기만 하고 아무것도 바꾸지 않는다.
 */

export const CAMPAIGN_TYPES = {
  WEB_SITE: "파워링크",
  SHOPPING: "쇼핑검색",
  POWER_CONTENTS: "파워컨텐츠",
  BRAND_SEARCH: "브랜드검색",
  PLACE: "플레이스",
  CATALOG: "카탈로그",
};

const STATUS = { ELIGIBLE: "노출 가능", PAUSED: "중지", ENABLED: "켜짐", DISABLED: "꺼짐" };
export const statusLabel = (item) => (item?.userLock ? "사용자 중지" : STATUS[item?.status] ?? item?.status ?? "");

export const STAT_FIELDS = ["impCnt", "clkCnt", "salesAmt", "ctr", "cpc", "avgRnk", "ccnt"];

/** 지점별로 새 키워드 후보를 찾을 때 쓰는 씨앗 단어와 지역 이름. 홈페이지(lib/smartplace/branches.mjs)와 같은 동네만 쓴다. */
export const BRANCH_SEEDS = {
  pangyo: {
    hints: ["판교양꼬치", "판교양다리", "판교양갈비", "판교회식", "판교역맛집", "판교단체회식", "분당양꼬치", "판교중식"],
    areas: ["판교", "분당", "백현", "삼평", "운중", "정자", "서판교"],
  },
  moran: {
    hints: ["모란양꼬치", "모란양다리", "모란역맛집", "성남양꼬치", "성남양다리", "모란회식", "성남단체회식", "모란중식"],
    areas: ["모란", "성남", "중원", "수진", "신흥", "태평", "단대", "남한산성"],
  },
};

/** 왕징과 관련 있는 검색어로 보는 단어. 하나라도 들어 있어야 후보가 된다. */
const RELEVANT = ["양꼬치", "양다리", "양갈비", "양고기", "꼬치", "꿔바로우", "마라", "중식", "중국", "회식", "단체", "모임", "맛집", "술집", "고량주", "연태"];
/** 손님이 아닌 사람이 찾는 검색어. 후보에서 뺀다. */
const IRRELEVANT = ["레시피", "만드는", "알바", "창업", "프랜차이즈", "가맹", "택배", "밀키트", "도매", "구인", "후기쓰기"];

/** 사장님이 특히 팔고 싶은 메뉴. 이 단어가 들어간 키워드는 '집중 메뉴'로 표시한다. */
export const FOCUS_MENUS = ["양다리", "양꼬치"];

export const normalizeKeyword = (keyword) => String(keyword ?? "").replace(/\s+/g, "").toUpperCase();

/** 키워드 도구의 검색수는 숫자 또는 "< 10" 같은 글자로 온다. "< 10"은 0으로 세고 글자는 따로 남긴다. */
export function parseCount(value) {
  if (typeof value === "number") return value;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  if (text.startsWith("<")) return 0;
  const number = Number(text.replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

const listOf = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

/** 성과(노출·클릭·비용 등)를 id별로 받는다. */
export async function fetchStats(client, ids, timeRange) {
  const stats = new Map();
  for (const part of chunk([...new Set(ids)], 50)) {
    const body = await client.get("/stats", { ids: part.join(","), fields: STAT_FIELDS, timeRange });
    for (const row of listOf(body)) stats.set(row.id, row);
  }
  return stats;
}

/**
 * 키워드 도구로 월간 검색수를 받는다. 한 번에 5개, 띄어쓰기 없이.
 * @returns {Map<string, object>} 정규화한 키워드 → 키워드 도구 한 줄
 */
export async function fetchSearchVolumes(client, keywords, { onError } = {}) {
  const volumes = new Map();
  const unique = [...new Set(keywords.map(normalizeKeyword).filter(Boolean))];
  for (const part of chunk(unique, 5)) {
    try {
      const body = await client.get("/keywordstool", { hintKeywords: part.join(","), showDetail: 1 });
      for (const row of body?.keywordList ?? []) {
        const key = normalizeKeyword(row.relKeyword);
        if (!volumes.has(key)) volumes.set(key, row);
      }
    } catch (error) {
      onError?.(part, error);
    }
  }
  return volumes;
}

export function monthlySearches(row) {
  if (!row) return { pc: 0, mobile: 0, total: 0, text: "", found: false };
  const pc = parseCount(row.monthlyPcQcCnt);
  const mobile = parseCount(row.monthlyMobileQcCnt);
  const text = [row.monthlyPcQcCnt, row.monthlyMobileQcCnt].some((v) => String(v).startsWith("<")) && pc + mobile < 10 ? "10 미만" : "";
  return { pc, mobile, total: pc + mobile, text, found: true };
}

/** 계정 전체를 읽는다: 캠페인 → 광고그룹 → 키워드, 그리고 각각의 성과. */
export async function collectAccount(client, { timeRange, onProgress } = {}) {
  const campaigns = listOf(await client.get("/ncc/campaigns"));
  onProgress?.(`캠페인 ${campaigns.length}개`);
  const adgroups = [];
  for (const campaign of campaigns) {
    const groups = listOf(await client.get("/ncc/adgroups", { nccCampaignId: campaign.nccCampaignId }));
    adgroups.push(...groups);
  }
  onProgress?.(`광고그룹 ${adgroups.length}개`);
  const keywords = [];
  for (const group of adgroups) {
    try {
      keywords.push(...listOf(await client.get("/ncc/keywords", { nccAdgroupId: group.nccAdgroupId })));
    } catch (error) {
      // 플레이스처럼 키워드를 직접 넣지 않는 광고그룹은 키워드 조회가 거절될 수 있다. 그 그룹은 그룹 성과만 본다.
      if (error.status !== 400 && error.status !== 403) throw error;
    }
  }
  onProgress?.(`키워드 ${keywords.length}개`);
  const stats = await fetchStats(
    client,
    [...campaigns.map((c) => c.nccCampaignId), ...adgroups.map((g) => g.nccAdgroupId), ...keywords.map((k) => k.nccKeywordId)],
    timeRange,
  );
  return { campaigns, adgroups, keywords, stats };
}

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function statNumbers(stat) {
  const impressions = num(stat?.impCnt);
  const clicks = num(stat?.clkCnt);
  const cost = num(stat?.salesAmt);
  return {
    impressions,
    clicks,
    cost,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    cpc: clicks ? Math.round(cost / clicks) : 0,
    avgRank: num(stat?.avgRnk),
    conversions: num(stat?.ccnt),
  };
}

/**
 * 키워드 한 줄의 판정. 기준은 그 지점 키워드 전체의 평균과 비교한다(비싼 동네·싼 동네가 달라서).
 *   잘 되는 키워드: 30일 클릭 10회 이상 + 클릭당 비용이 지점 평균 이하
 *   비싼 키워드:    지점 광고비의 5% 이상을 쓰면서 클릭당 비용이 평균의 1.5배 이상
 *   클릭률 낮음:    노출 300회 이상인데 클릭률이 지점 평균의 절반 미만 (검색한 사람이 안 누름)
 *   노출 안 됨:     30일 동안 노출 0 (입찰가가 낮거나 꺼져 있음)
 *   검색 거의 없음: 월간 검색수 50 미만
 */
export function judgeKeyword(row, baseline) {
  if (row.status !== "노출 가능" && row.impressions === 0) return { verdict: "꺼져 있음", reason: `상태: ${row.status || "확인 필요"}` };
  if (row.impressions === 0) return { verdict: "노출 안 됨", reason: "30일 동안 한 번도 안 보임. 입찰가나 노출 조건 확인" };
  if (row.cost >= baseline.totalCost * 0.05 && baseline.avgCpc && row.cpc >= baseline.avgCpc * 1.5) {
    return { verdict: "비싼 키워드", reason: `광고비의 ${Math.round((row.cost / baseline.totalCost) * 100)}%, 클릭당 ${row.cpc.toLocaleString()}원 (평균 ${baseline.avgCpc.toLocaleString()}원)` };
  }
  if (row.impressions >= 300 && baseline.avgCtr && row.ctr < baseline.avgCtr / 2) {
    return { verdict: "클릭률 낮음", reason: `클릭률 ${row.ctr.toFixed(2)}% (평균 ${baseline.avgCtr.toFixed(2)}%). 문구나 키워드 의도 확인` };
  }
  if (row.clicks >= 10 && (!baseline.avgCpc || row.cpc <= baseline.avgCpc)) {
    return { verdict: "잘 되는 키워드", reason: `클릭 ${row.clicks}회, 클릭당 ${row.cpc.toLocaleString()}원 (평균 이하)` };
  }
  if (!row.searches.found) return { verdict: "보통", reason: "네이버 검색수 정보 없음" };
  if (row.searches.text) return { verdict: "검색 거의 없음", reason: "월 검색 10회 미만" };
  if (row.searches.total < 50) return { verdict: "검색 거의 없음", reason: `월 검색 ${row.searches.total}회` };
  return { verdict: "보통", reason: "" };
}

/** 계정 데이터 + 검색수 → 키워드 표(광고비 많은 순)와 지점 합계 */
export function analyzeKeywords({ campaigns, adgroups, keywords, stats }, volumes) {
  const campaignById = new Map(campaigns.map((c) => [c.nccCampaignId, c]));
  const groupById = new Map(adgroups.map((g) => [g.nccAdgroupId, g]));
  const rows = keywords.map((keyword) => {
    const group = groupById.get(keyword.nccAdgroupId);
    const campaign = campaignById.get(keyword.nccCampaignId ?? group?.nccCampaignId);
    const bid = keyword.useGroupBidAmt ? num(group?.bidAmt) : num(keyword.bidAmt);
    return {
      keyword: keyword.keyword,
      campaignType: CAMPAIGN_TYPES[campaign?.campaignTp] ?? campaign?.campaignTp ?? "",
      campaign: campaign?.name ?? "",
      adgroup: group?.name ?? "",
      status: statusLabel(keyword),
      bid,
      focus: FOCUS_MENUS.filter((menu) => keyword.keyword?.includes(menu)).join(", "),
      searches: monthlySearches(volumes.get(normalizeKeyword(keyword.keyword))),
      competition: volumes.get(normalizeKeyword(keyword.keyword))?.compIdx ?? "",
      ...statNumbers(stats.get(keyword.nccKeywordId)),
    };
  });
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  const baseline = {
    totalCost,
    avgCpc: totalClicks ? Math.round(totalCost / totalClicks) : 0,
    avgCtr: totalImpressions ? (totalClicks / totalImpressions) * 100 : 0,
  };
  for (const row of rows) Object.assign(row, judgeKeyword(row, baseline));
  rows.sort((a, b) => b.cost - a.cost || b.searches.total - a.searches.total);
  return { rows, baseline, totalClicks, totalImpressions };
}

/** 캠페인·광고그룹 표 (플레이스 광고처럼 키워드가 없는 광고도 여기서 성과를 본다) */
export function analyzeGroups({ campaigns, adgroups, stats }) {
  const campaignById = new Map(campaigns.map((c) => [c.nccCampaignId, c]));
  return adgroups
    .map((group) => {
      const campaign = campaignById.get(group.nccCampaignId);
      return {
        campaignType: CAMPAIGN_TYPES[campaign?.campaignTp] ?? campaign?.campaignTp ?? "",
        campaign: campaign?.name ?? "",
        campaignStatus: statusLabel(campaign),
        campaignBudget: campaign?.useDailyBudget ? num(campaign.dailyBudget) : 0,
        adgroup: group.name,
        status: statusLabel(group),
        bid: num(group.bidAmt),
        groupBudget: group.useDailyBudget ? num(group.dailyBudget) : 0,
        ...statNumbers(stats.get(group.nccAdgroupId)),
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

/** 키워드 도구의 연관 검색어 중 그 지점 동네 + 왕징 관련 + 아직 안 넣은 것만 고른다. 검색수 많은 순. */
export function pickCandidates(volumeRows, { areas, registered }) {
  const have = new Set([...registered].map(normalizeKeyword));
  const seen = new Set();
  const out = [];
  for (const row of volumeRows) {
    const key = normalizeKeyword(row.relKeyword);
    if (!key || have.has(key) || seen.has(key)) continue;
    const word = row.relKeyword;
    if (!areas.some((area) => word.includes(area))) continue;
    if (!RELEVANT.some((term) => word.includes(term))) continue;
    if (IRRELEVANT.some((term) => word.includes(term))) continue;
    seen.add(key);
    const searches = monthlySearches(row);
    if (searches.total < 30) continue;
    out.push({
      keyword: word,
      searches,
      competition: row.compIdx ?? "",
      focus: FOCUS_MENUS.filter((menu) => word.includes(menu)).join(", "),
      avgDepth: num(row.plAvgDepth),
    });
  }
  return out.sort((a, b) => Number(Boolean(b.focus)) - Number(Boolean(a.focus)) || b.searches.total - a.searches.total);
}

/** 연관 검색어 원본(키워드 도구가 준 순서 그대로) */
export async function fetchRelated(client, hints, { onError } = {}) {
  const rows = [];
  for (const part of chunk(hints.map(normalizeKeyword), 5)) {
    try {
      const body = await client.get("/keywordstool", { hintKeywords: part.join(","), showDetail: 1 });
      rows.push(...(body?.keywordList ?? []));
    } catch (error) {
      onError?.(part, error);
    }
  }
  return rows;
}

/** 어제까지 N일 (한국 날짜 기준) */
export function lastDays(days, now = new Date()) {
  const kst = (offset) => new Date(now.getTime() + 9 * 3600_000 - offset * 86_400_000).toISOString().slice(0, 10);
  return { since: kst(days), until: kst(1) };
}

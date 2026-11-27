/**
 * 라이브애드 감시: 매일 아침 어제 하루 라이브애드 캠페인 성과를 지난 14일 평소와 비교한다.
 *
 * 2026-08-14~27 라이브애드가 약해졌을 때 노출은 절반쯤 남고 순위도 비슷했지만 클릭이 약 70% 줄었고,
 * 두 주 동안 아무도 몰랐다(사장님 말씀으로 그 사이 매출 약 1,500만 원 감소). 그래서 클릭을 가장 먼저 본다.
 *   약해짐 의심: 클릭이 평소(지난 28일 중간값)의 50% 미만, 노출이 40% 미만, 또는 평균 순위가 2칸 이상 밀림
 *   멈춤 의심:   노출 0 (광고가 아예 안 나감)
 * 읽기만 한다. 라이브애드 캠페인은 절대 바꾸지 않는다.
 */

import { addDays, buildDailyRows, collectHistory } from "./history.mjs";

/** 평소 = 지난 28일 중간값. 8월처럼 2주 가까이 약해져도 '평소'가 같이 내려가 알림이 멈추지 않게 넉넉히 잡는다. */
export const BASELINE_DAYS = 28;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** 어제까지 BASELINE_DAYS+1일 */
export function watchRange(yesterday) {
  return { since: addDays(yesterday, -BASELINE_DAYS), until: yesterday };
}

/** 한 날의 상태와 이유 */
export function judgeDay(row, base) {
  const la = row["라이브애드"];
  const reasons = [];
  if (base.impressions > 0 && la.impressions === 0) return { status: "멈춤 의심", reasons: ["노출 0"] };
  if (base.clicks > 0 && la.clicks < base.clicks * 0.5) reasons.push(`클릭 ${la.clicks} (평소 ${Math.round(base.clicks)})`);
  if (base.impressions > 0 && la.impressions < base.impressions * 0.4) reasons.push(`노출 ${la.impressions.toLocaleString()} (평소 ${Math.round(base.impressions).toLocaleString()})`);
  if (base.rank !== null && row.liveAdRank !== null && row.liveAdRank >= base.rank + 2) reasons.push(`순위 ${row.liveAdRank.toFixed(1)}위 (평소 ${base.rank.toFixed(1)}위)`);
  return { status: reasons.length ? "약해짐 의심" : "정상", reasons };
}

/**
 * rows: 날짜순 BASELINE_DAYS+1줄(마지막 = 어제). 평소 = 앞의 BASELINE_DAYS일 중간값.
 * 어제가 이상하면, 거슬러 올라가며 같은 기준으로 며칠째인지 센다.
 */
export function evaluateLiveAd(rows) {
  const past = rows.slice(0, -1);
  const last = rows.at(-1);
  const ranks = past.map((r) => r.liveAdRank).filter((v) => v !== null);
  const base = {
    clicks: median(past.map((r) => r["라이브애드"].clicks)),
    impressions: median(past.map((r) => r["라이브애드"].impressions)),
    rank: ranks.length ? median(ranks) : null,
  };
  const today = judgeDay(last, base);
  let streak = 0;
  for (let i = rows.length - 1; i >= 0 && judgeDay(rows[i], base).status !== "정상"; i -= 1) streak += 1;
  return {
    date: last.date,
    status: today.status,
    reasons: today.reasons,
    streak,
    clicks: last["라이브애드"].clicks,
    cost: last["라이브애드"].cost,
    base,
  };
}

/** 지점 하나 점검: 라이브애드 캠페인만 날짜별로 읽는다. */
export async function watchBranch(client, yesterday, { onProgress } = {}) {
  const range = watchRange(yesterday);
  const history = await collectHistory(client, range, { onProgress, only: "라이브애드" });
  if (!history.length) return { date: yesterday, status: "캠페인 없음", reasons: ["이름에 '프로그램'이 들어간 캠페인을 찾지 못했습니다"], streak: 0 };
  return { ...evaluateLiveAd(buildDailyRows(history, range, null)), campaigns: history.length };
}

const short = (name) => name.replace(/(본)?점$/, "");
const md = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/**
 * 카톡 한 통(200자 안). 보낼 일이 없으면 null.
 * 보내는 때: 어느 지점이든 이상(약해짐·멈춤·캠페인 없음·점검 실패), 또는 heartbeat(월요일 '정상 감시 중' 확인).
 * @param {Array<{name: string, result?: object, error?: string}>} branches
 */
export function formatWatchMessage(branches, { date, heartbeat = false } = {}) {
  const problems = branches.filter((b) => b.error || b.result?.status !== "정상");
  if (!problems.length && !heartbeat) return null;
  const head = problems.length ? `[왕징 라이브애드] ${md(date)} 확인 필요` : `[왕징 라이브애드] ${md(date)} 이번 주도 정상 감시 중`;
  const lines = branches.map((b) => {
    if (b.error) return `❌ ${short(b.name)}: 점검 실패 (${b.error.slice(0, 40)})`;
    const r = b.result;
    if (r.status === "정상") return `✅ ${short(b.name)}: 정상 (클릭 ${r.clicks}, 평소 ${Math.round(r.base.clicks)})`;
    const days = r.streak > 1 ? ` ${r.streak}일째` : "";
    return `⚠️ ${short(b.name)}: ${r.status}${days} - ${r.reasons.join(", ")}`;
  });
  const tail = problems.some((b) => !b.error && b.result?.status !== "캠페인 없음")
    ? "라이브애드 화면에서 캠페인 상태·잔액·연동을 확인해 주세요."
    : problems.length
      ? "PC 알림 창이나 .smartplace/livead-watch.log를 봐 주세요."
      : "";
  return [head, ...lines, tail].filter(Boolean).join("\n");
}

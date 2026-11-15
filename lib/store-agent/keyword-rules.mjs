/**
 * 검색광고 키워드 정리 계획을 세운다. 네이버에 아무것도 보내지 않는 순수 계산이다.
 *
 * - 삭제: 기간 내 노출 0번 + 한 달 검색량이 기준 미만 ("검색량 없는 키워드")
 * - 일시중지: 클릭은 기준 이상인데 전환 0 + 광고비 기준 이상 (매장 전체에 전환 기록이 있을 때만)
 * - 남김: 그 밖의 모든 키워드. 효율 좋은 순으로 몇 개를 보고서에 보여준다.
 * - 핵심 키워드, 사장님이 지키라고 한 키워드, 이미 일시중지된 키워드, 등록한 지 얼마 안 된 키워드는 건드리지 않는다.
 */

import { volumeKey } from "./searchad-client.mjs";

const DAY = 24 * 60 * 60 * 1000;

function normalize(keyword) {
  return keyword.replace(/\s+/g, "").toLowerCase();
}

/** 오늘(KST 날짜 글자)을 빼고 그 전 N일. 돌려주는 값: { since, until } (YYYY-MM-DD) */
export function statsWindow(today, windowDays) {
  const end = new Date(`${today}T00:00:00Z`).getTime() - DAY;
  const start = end - (windowDays - 1) * DAY;
  const fmt = (t) => new Date(t).toISOString().slice(0, 10);
  return { since: fmt(start), until: fmt(end) };
}

export function planKeywordActions({ keywords, stats, volumes, rules, coreKeywords = [], protectedKeywords = [], today }) {
  const keep = new Set([...coreKeywords, ...protectedKeywords].map(normalize));
  const todayMs = new Date(`${today}T00:00:00Z`).getTime();
  const totalConversions = [...stats.values()].reduce((sum, s) => sum + s.ccnt, 0);
  const canJudgeConversions = totalConversions > 0;

  const actions = [];
  const kept = [];
  const notes = [];
  let skippedYoung = 0;
  let volumeUnknown = 0;

  for (const kw of keywords) {
    const s = stats.get(kw.nccKeywordId) ?? { impCnt: 0, clkCnt: 0, salesAmt: 0, ccnt: 0 };
    const metrics = { ...s };
    const base = { keywordId: kw.nccKeywordId, adgroupId: kw.nccAdgroupId, keyword: kw.keyword, metrics };

    if (kw.userLock) continue; // 이미 꺼진 키워드는 노출이 0일 수밖에 없다. 판단하지 않는다.
    if (keep.has(normalize(kw.keyword))) {
      kept.push(base);
      continue;
    }
    const registered = kw.regTm ? new Date(kw.regTm).getTime() : NaN;
    if (Number.isFinite(registered) && todayMs - registered < rules.minAgeDays * DAY) {
      skippedYoung += 1;
      kept.push(base);
      continue;
    }

    if (s.impCnt === 0) {
      const volume = volumes.has(volumeKey(kw.keyword)) ? volumes.get(volumeKey(kw.keyword)) : null;
      metrics.monthlySearch = volume;
      if (volume === null) {
        // 검색량을 모르면 지우지 않는다. 다음에 다시 본다.
        volumeUnknown += 1;
        kept.push(base);
      } else if (volume < rules.minMonthlySearch) {
        actions.push({ type: "delete", ...base, reason: `${rules.windowDays}일 노출 0 · 월 검색량 ${volume}` });
      } else {
        kept.push(base);
      }
      continue;
    }

    if (canJudgeConversions && s.ccnt === 0 && s.clkCnt >= rules.pauseMinClicks && s.salesAmt >= rules.pauseMinCost) {
      actions.push({ type: "pause", ...base, reason: `클릭 ${s.clkCnt} · 전환 0 · 광고비 ${s.salesAmt.toLocaleString("ko-KR")}원` });
      continue;
    }
    kept.push(base);
  }

  if (!canJudgeConversions) notes.push("전환 기록이 없어 '클릭만 많고 전환 없는 키워드' 일시중지는 판단하지 않았습니다.");
  if (skippedYoung) notes.push(`등록 ${rules.minAgeDays}일이 안 된 키워드 ${skippedYoung}개는 아직 판단하지 않았습니다.`);
  if (volumeUnknown) notes.push(`검색량을 못 받은 키워드 ${volumeUnknown}개는 지우지 않았습니다.`);

  // 효율 좋은 키워드: 전환 많은 순, 같으면 클릭률 높은 순
  const top = kept
    .filter((k) => k.metrics.clkCnt > 0)
    .sort((a, b) => b.metrics.ccnt - a.metrics.ccnt || b.metrics.clkCnt / b.metrics.impCnt - a.metrics.clkCnt / a.metrics.impCnt)
    .slice(0, rules.topCount)
    .map((k) => ({ keyword: k.keyword, ...k.metrics }));

  return { actions, top, notes, keptCount: kept.length };
}

/** 자동 발행 중에도 승인을 받아야 하는 예외 */
export function exceptionFlags(actions, approvalRules) {
  const flags = [];
  const deletes = actions.filter((a) => a.type === "delete").length;
  const pauses = actions.filter((a) => a.type === "pause").length;
  if (deletes > approvalRules.maxAutoDeletes) flags.push(`한 번에 ${deletes}개 삭제 (기준 ${approvalRules.maxAutoDeletes}개 초과)`);
  if (pauses > approvalRules.maxAutoPauses) flags.push(`한 번에 ${pauses}개 일시중지 (기준 ${approvalRules.maxAutoPauses}개 초과)`);
  return flags;
}

/** 사람이 읽는 계획 요약 (터미널·승인 화면용) */
export function describePlan(plan) {
  const lines = [];
  const deletes = plan.actions.filter((a) => a.type === "delete");
  const pauses = plan.actions.filter((a) => a.type === "pause");
  lines.push(`삭제 ${deletes.length}개 · 일시중지 ${pauses.length}개 · 그대로 ${plan.keptCount}개`);
  for (const a of deletes) lines.push(`  🗑  ${a.keyword}  (${a.reason})`);
  for (const a of pauses) lines.push(`  ⏸  ${a.keyword}  (${a.reason})`);
  if (plan.top.length) {
    lines.push("효율 좋은 키워드:");
    for (const t of plan.top) lines.push(`  👍 ${t.keyword}  노출 ${t.impCnt} · 클릭 ${t.clkCnt} · 전환 ${t.ccnt}`);
  }
  for (const note of plan.notes) lines.push(`※ ${note}`);
  return lines.join("\n");
}

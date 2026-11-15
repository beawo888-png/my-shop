/**
 * 전담 에이전트의 "검색광고 정리" 단계. 자기 매장 샌드박스와 자기 매장 광고 캠페인만 쓴다.
 *
 * 1. 이 매장 캠페인의 키워드와 최근 성과, 한 달 검색량을 가져온다.
 * 2. 기본 틀 규칙 + 매장 규칙으로 삭제·일시중지 계획을 세운다.
 * 3. 수습 기간이거나 예외가 있으면 승인 대기 파일을 남기고 알린다. 자동이면 바로 적용한다.
 */

import { resolveRules } from "./base-template.mjs";
import { describePlan, exceptionFlags, planKeywordActions, statsWindow } from "./keyword-rules.mjs";
import { planDigest } from "./sandbox.mjs";
import { createSearchAdClient } from "./searchad-client.mjs";
import { approvalNeeded, recordReview, trustState } from "./trust.mjs";

export const CHANNEL = "searchAd";
const FEEDBACK_KEEP = 50;
const DELETED_KEEP = 500;

export async function clientFor(sandbox, factory = createSearchAdClient) {
  const credentials = await sandbox.readCredentials();
  if (!credentials?.accessLicense || !credentials?.secretKey || !credentials?.customerId) return { client: null, credentials };
  return { client: factory(credentials), credentials };
}

/** 이 매장 캠페인(설정에 적힌 번호)에 속한 키워드만 모은다. */
export async function collectKeywords(client, campaignIds) {
  const keywords = [];
  for (const campaignId of campaignIds) {
    const adgroups = await client.listAdgroups(campaignId);
    for (const group of adgroups ?? []) {
      const list = await client.listKeywords(group.nccAdgroupId);
      for (const kw of list ?? []) keywords.push({ ...kw, nccAdgroupId: kw.nccAdgroupId ?? group.nccAdgroupId });
    }
  }
  return keywords;
}

export async function buildPlan({ store, memory, client, campaignIds, today }) {
  const rules = resolveRules(store);
  const keywords = await collectKeywords(client, campaignIds);
  const window = statsWindow(today, rules.searchAd.windowDays);
  const stats = await client.getStats(
    keywords.map((k) => k.nccKeywordId),
    window,
  );
  // 노출 0인 키워드만 검색량을 물어본다(키워드 도구는 한 번에 5개라 느리다).
  const zero = keywords.filter((k) => !k.userLock && !(stats.get(k.nccKeywordId)?.impCnt > 0)).map((k) => k.keyword);
  const volumes = zero.length ? await client.getMonthlyVolumes(zero) : new Map();
  const result = planKeywordActions({
    keywords,
    stats,
    volumes,
    rules: rules.searchAd,
    coreKeywords: store.searchAd?.coreKeywords ?? [],
    protectedKeywords: memory.protectedKeywords ?? [],
    today,
  });
  return { date: today, window, ...result, flags: exceptionFlags(result.actions, rules.approval) };
}

export async function applyActions(client, actions) {
  const done = [];
  const failed = [];
  for (const action of actions) {
    try {
      if (action.type === "delete") await client.deleteKeyword(action);
      else if (action.type === "pause") await client.pauseKeyword(action);
      else throw new Error(`알 수 없는 작업: ${action.type}`);
      done.push(action);
    } catch (error) {
      failed.push({ ...action, error: error.message });
    }
  }
  return { done, failed };
}

function rememberApplied(memory, done, today) {
  const deleted = done.filter((a) => a.type === "delete").map((a) => ({ keyword: a.keyword, date: today }));
  return { ...memory, deletedKeywords: [...(memory.deletedKeywords ?? []), ...deleted].slice(-DELETED_KEEP) };
}

function shortSummary(done, failed) {
  const d = done.filter((a) => a.type === "delete").length;
  const p = done.filter((a) => a.type === "pause").length;
  return `키워드 삭제 ${d} · 중지 ${p}${failed.length ? ` · 실패 ${failed.length}` : ""}`;
}

function ageDays(isoTime, now) {
  return (now - new Date(isoTime).getTime()) / (24 * 60 * 60 * 1000);
}

/**
 * 매일 실행. 돌려주는 값: { status, summary, detail }
 * status: skipped | waiting | nothing | pending | applied | checked
 */
export async function runSearchAdStep({ store, sandbox, today, check = false, force = false, clientFactory, now = Date.now(), log = console.log }) {
  if (store.channels?.searchAd === false) return { status: "skipped", summary: "검색광고 꺼짐" };
  const { client, credentials } = await clientFor(sandbox, clientFactory);
  if (!client) return { status: "skipped", summary: `검색광고 설정 필요: npm run agent:ads-setup -- --store=${store.id}` };
  const campaignIds = credentials.campaignIds ?? [];
  if (!campaignIds.length) return { status: "skipped", summary: `이 매장 캠페인이 정해지지 않음: npm run agent:ads-setup -- --store=${store.id}` };

  const rules = resolveRules(store);
  const pending = await sandbox.readPending(CHANNEL);
  if (pending && !force) {
    if (ageDays(pending.createdAt, now) <= rules.trust.pendingMaxAgeDays) {
      return { status: "waiting", summary: `승인 대기 중인 키워드 정리가 있음: npm run agent:approve -- --store=${store.id}` };
    }
    await sandbox.clearPending(CHANNEL);
    await sandbox.appendHistory({ channel: CHANNEL, kind: "expired", date: today, createdAt: pending.createdAt });
    log(`  검색광고: ${rules.trust.pendingMaxAgeDays}일 넘게 승인되지 않은 계획은 버리고 새로 만듭니다.`);
  }

  const history = await sandbox.readHistory();
  if (!force && !check && history.some((e) => e.channel === CHANNEL && e.date === today && ["applied", "pending", "nothing"].includes(e.kind))) {
    return { status: "skipped", summary: "검색광고: 오늘 이미 정리함" };
  }

  const memory = await sandbox.readMemory();
  const plan = await buildPlan({ store, memory, client, campaignIds, today });
  const detail = describePlan(plan);
  log(detail.replace(/^/gm, "    "));

  if (check) return { status: "checked", summary: "검색광고: 계획만 세움(적용 안 함)", detail };
  if (!plan.actions.length) {
    await sandbox.appendHistory({ channel: CHANNEL, kind: "nothing", date: today, top: plan.top });
    return { status: "nothing", summary: "검색광고: 정리할 키워드 없음", detail };
  }

  const gate = approvalNeeded({ memory, channel: CHANNEL, flags: plan.flags, promoteAfter: rules.trust.promoteAfter });
  if (gate.required) {
    await sandbox.writePending(CHANNEL, { createdAt: new Date(now).toISOString(), storeId: store.id, reasons: gate.reasons, digest: planDigest(plan.actions), originalKeywords: plan.actions.map((a) => a.keyword), ...plan });
    await sandbox.appendHistory({ channel: CHANNEL, kind: "pending", date: today, actions: plan.actions.length, reasons: gate.reasons });
    return {
      status: "pending",
      summary: `키워드 정리 ${plan.actions.length}건 승인 필요 (${gate.reasons[0]})`,
      detail,
    };
  }

  const { done, failed } = await applyActions(client, plan.actions);
  await sandbox.writeMemory(rememberApplied(memory, done, today));
  await sandbox.appendHistory({ channel: CHANNEL, kind: "applied", mode: "auto", date: today, done, failed });
  return { status: "applied", summary: `자동 ${shortSummary(done, failed)}`, detail, failed };
}

/**
 * 사장님이 승인 대기 계획을 확인했을 때. 사장님은 pending 파일에서 할 일을 지워 "이건 하지 마"를 표시할 수 있다.
 * decision: "approve" | "reject"
 */
export async function reviewPending({ store, sandbox, decision, today, clientFactory }) {
  const pending = await sandbox.readPending(CHANNEL);
  if (!pending) return { status: "none" };
  const rules = resolveRules(store);
  let memory = await sandbox.readMemory();
  const edited = planDigest(pending.actions) !== pending.digest;

  // 사장님이 계획에서 뺀 키워드 = 지우거나 끄지 말라는 뜻. 다음부터 지킨다.
  const original = pending.originalKeywords ?? null;
  const removed = original ? original.filter((k) => !pending.actions.some((a) => a.keyword === k)) : [];

  if (decision === "reject") {
    const reviewed = recordReview(memory, CHANNEL, "rejected", { promoteAfter: rules.trust.promoteAfter });
    memory = withFeedback(reviewed.memory, { date: today, channel: CHANNEL, outcome: "rejected", count: pending.actions.length });
    await sandbox.writeMemory(memory);
    await sandbox.clearPending(CHANNEL);
    await sandbox.appendHistory({ channel: CHANNEL, kind: "rejected", date: today });
    return { status: "rejected", trust: trustState(memory, CHANNEL) };
  }

  const { client } = await clientFor(sandbox, clientFactory);
  if (!client) throw new Error(`검색광고 열쇠가 없습니다: npm run agent:ads-setup -- --store=${store.id}`);
  const { done, failed } = await applyActions(client, pending.actions);
  memory = rememberApplied(memory, done, today);
  if (removed.length) memory = { ...memory, protectedKeywords: [...new Set([...(memory.protectedKeywords ?? []), ...removed])] };
  const reviewed = recordReview(memory, CHANNEL, edited ? "edited" : "approved", { promoteAfter: rules.trust.promoteAfter });
  memory = withFeedback(reviewed.memory, { date: today, channel: CHANNEL, outcome: edited ? "edited" : "approved", removed });
  await sandbox.writeMemory(memory);
  await sandbox.clearPending(CHANNEL);
  await sandbox.appendHistory({ channel: CHANNEL, kind: "applied", mode: edited ? "edited" : "approved", date: today, done, failed, removed });
  return { status: "applied", edited, removed, done, failed, promoted: reviewed.promoted, trust: trustState(memory, CHANNEL), summary: shortSummary(done, failed) };
}

function withFeedback(memory, entry) {
  return { ...memory, feedback: [...(memory.feedback ?? []), entry].slice(-FEEDBACK_KEEP) };
}

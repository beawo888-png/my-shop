/**
 * 수습 기간 → 자동 발행 규칙.
 *
 * - 채널마다 처음엔 "수습(probation)": 사장님 승인을 받아야 적용한다.
 * - 수정 없이 연속 N번(기본 5번) 승인되면 "자동(auto)"으로 바뀐다.
 * - 사장님이 계획을 고치거나 거절하면 연속 횟수는 0으로 돌아간다.
 * - 자동이어도 계획에 예외 표시(flags)가 있으면 승인을 받는다.
 */

export function trustState(memory, channel) {
  return memory.trust?.[channel] ?? { mode: "probation", streak: 0 };
}

/** 이 계획을 바로 적용해도 되는지. 돌려주는 값: { required, reasons } */
export function approvalNeeded({ memory, channel, flags = [], promoteAfter }) {
  const state = trustState(memory, channel);
  const reasons = [];
  if (state.mode !== "auto") reasons.push(`수습 기간 (무수정 승인 ${state.streak}/${promoteAfter})`);
  reasons.push(...flags);
  return { required: reasons.length > 0, reasons };
}

/**
 * 사장님이 계획을 확인한 결과를 기억에 반영한다. 원래 memory는 바꾸지 않고 새 객체를 돌려준다.
 * outcome: "approved"(그대로 승인) | "edited"(고쳐서 승인) | "rejected"(거절)
 */
export function recordReview(memory, channel, outcome, { promoteAfter }) {
  const state = trustState(memory, channel);
  let next;
  let promoted = false;
  if (outcome === "approved") {
    const streak = state.streak + 1;
    promoted = state.mode !== "auto" && streak >= promoteAfter;
    next = { mode: promoted || state.mode === "auto" ? "auto" : "probation", streak };
  } else if (outcome === "edited" || outcome === "rejected") {
    // 고치거나 거절했다는 건 아직 믿고 맡길 단계가 아니라는 뜻이다. 자동이었어도 수습으로 돌린다.
    next = { mode: "probation", streak: 0 };
  } else {
    throw new Error(`알 수 없는 확인 결과: ${outcome}`);
  }
  return { memory: { ...memory, trust: { ...memory.trust, [channel]: next } }, promoted, demoted: state.mode === "auto" && next.mode !== "auto" };
}

/** 사장님이 자동 발행 결과를 고쳤을 때 등, 수동으로 수습으로 되돌린다. */
export function demote(memory, channel) {
  return { ...memory, trust: { ...memory.trust, [channel]: { mode: "probation", streak: 0 } } };
}

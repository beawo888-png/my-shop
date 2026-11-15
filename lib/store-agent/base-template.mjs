/**
 * 모든 매장 전담 에이전트가 공유하는 "기본 틀".
 *
 * 매장마다 다른 값은 stores/<매장>/store.json에 두고, 여기 값은 그 매장 파일에 없을 때만 쓴다.
 * 기본 틀을 바꾸면 모든 매장에 똑같이 적용된다. 한 매장만 다르게 하려면 그 매장의 store.json에 같은 이름으로 적는다.
 */

/** 검색광고 키워드 정리 규칙 */
export const BASE_SEARCHAD_RULES = {
  /** 성과를 보는 기간(일). 오늘을 빼고 그 전 N일을 본다. */
  windowDays: 30,
  /** 이 기간 노출이 0번이고, 한 달 검색량(PC+모바일)이 이 숫자보다 적으면 "검색량 없음"으로 보고 삭제한다. */
  minMonthlySearch: 10,
  /** 등록한 지 이 날짜보다 안 된 키워드는 아직 판단하지 않는다. */
  minAgeDays: 30,
  /** 클릭이 이만큼 이상인데 전환(예약·전화 등)이 0이면 일시중지 후보로 본다. */
  pauseMinClicks: 20,
  /** 그러면서 광고비가 이 금액(원) 이상 들었을 때만 일시중지한다. */
  pauseMinCost: 30000,
  /** 보고서에 "효율 좋은 키워드"로 보여줄 개수 */
  topCount: 3,
};

/** 자동 발행 중이라도 항상 사장님 승인을 받는 경우 */
export const BASE_APPROVAL_RULES = {
  /** 한 번에 이 개수를 넘게 삭제하면 승인 */
  maxAutoDeletes: 10,
  /** 한 번에 이 개수를 넘게 일시중지하면 승인 */
  maxAutoPauses: 10,
};

/** 수습 → 자동 발행 승격 규칙 */
export const BASE_TRUST_RULES = {
  /** 수정 없이 연속으로 이만큼 승인되면 그 채널은 자동 발행으로 바뀐다. */
  promoteAfter: 5,
  /** 승인 대기 계획이 이 날짜보다 오래되면 적용하지 않고 새로 만든다(성과가 이미 바뀌었으므로). */
  pendingMaxAgeDays: 3,
};

/** 매장 파일의 값으로 기본 틀을 덮어 실제로 쓸 규칙을 만든다. */
export function resolveRules(store) {
  return {
    searchAd: { ...BASE_SEARCHAD_RULES, ...(store.searchAd?.rules ?? {}) },
    approval: { ...BASE_APPROVAL_RULES, ...(store.searchAd?.approval ?? {}) },
    trust: { ...BASE_TRUST_RULES, ...(store.trust ?? {}) },
  };
}

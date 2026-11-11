/**
 * 블로그 발행 결과를 카카오톡 한 통(200자 이내)으로 줄인다.
 * results: [{ branch: "판교점", slot: "1번째 글" | "직접 고른 글", menu: "어향육사", status: "ok" | "warn" | "fail", reason? }]
 */

import { clip } from "../notify/kakao.mjs";

const ICON = { ok: "✅", warn: "⚠️", fail: "❌" };

export function formatBlogReport({ date, results }) {
  const [, month, day] = date.split("-").map(Number);
  const failed = results.filter((r) => r.status === "fail").length;
  const head = failed ? `[왕징 블로그] ${month}/${day} 발행 ${results.length - failed}편 성공, ${failed}편 실패` : `[왕징 블로그] ${month}/${day} ${results.length}편 발행 완료`;
  const lines = results.map((r) => {
    const short = r.branch.replace(/(본)?점$/, "");
    const slot = r.slot.replace("번째 글", "").replace("직접 고른 글", "직접");
    return `${ICON[r.status]} ${short} ${slot} ${r.menu}${r.reason ? ` - ${r.reason}` : ""}`;
  });
  const tail = failed ? "\n자세한 내용은 PC 알림 창을 봐 주세요." : "";
  return clip([head, ...lines].join("\n") + tail);
}

/** PC 알림용 긴 오류 문장을 카톡에 맞게 짧게 줄인다. */
export function shortReason(message) {
  if (/로그인/.test(message)) return "로그인 풀림";
  if (/카테고리/.test(message)) return "카테고리 못 찾음";
  if (/사진/.test(message)) return "사진 올리기 실패";
  if (/링크/.test(message)) return "링크 확인 필요";
  if (/완료 화면/.test(message)) return "발행 확인 필요";
  return [...message.replace(/\s+/g, " ")].slice(0, 20).join("");
}

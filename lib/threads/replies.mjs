/**
 * 쓰레드 댓글(답글) 읽기·분류·답글 달기.
 *
 * 쓰레드는 댓글을 "답글(reply)"이라고 부른다. 답글을 다는 것도 글 올리는 것과
 * 같은 2단계인데, 컨테이너를 만들 때 `reply_to_id`에 그 댓글 id를 넣는다.
 *
 * 문서: https://developers.facebook.com/docs/threads/reply-management
 */

import { ThreadsApiError } from "./threads-client.mjs";

const DEFAULT_API_BASE = "https://graph.threads.net/v1.0";

/** 답글도 글과 같은 500자 제한을 받는다. */
export const REPLY_MAX_LENGTH = 500;

/**
 * 손님 글을 그대로 되받아 쓰지 않는다. 미리 적어둔 문장 중에서 고른다.
 * 쓰레드 본문과 같은 담백한 말투로, 짧게.
 *
 * 댓글 종류마다 답글이 다르다. 칭찬에 "그렇죠 ㅠㅠ"는 안 맞고,
 * 위로에 "봐주셔서 감사합니다"는 데면데면하다.
 */
export const REPLY_TEXTS = {
  // 맛있다, 잘 봤다 같은 칭찬
  praise: [
    "읽어주셔서 감사합니다.",
    "고맙습니다. 오늘도 좋은 하루 되세요.",
    "그 말씀에 힘이 납니다. 감사합니다.",
    "감사합니다. 덕분에 오늘도 문 엽니다.",
    "응원 감사합니다.",
    "고맙습니다. 또 뵙겠습니다.",
    "이런 말씀이 제일 큽니다. 감사합니다.",
    "감사합니다. 오늘도 불 앞에 서 있겠습니다.",
    "봐주셔서 감사합니다.",
  ],
  // 같이 마음 아파해주는 말에는 같이 끄덕인다.
  empathy: ["그렇죠 ㅠㅠ", "공감입니다."],
  // 기운 내라고 해주는 말에는 고맙다고 받는다.
  cheer: ["감사합니다.", "화이팅입니다."],
  // 같은 장사하는 분. 역시 사장님이 직접 고른 문장이다.
  peer: ["맞습니다.", "다들 똑같으시군요."],
};

/** 같은 장사를 하는 분이 남긴 말. 제일 먼저 본다. */
const PEER = [
  "저도 자영업", "저도 장사", "저도 가게", "저도 식당", "저도 사장",
  "같은 마음", "같은 처지", "동종업계", "저희도", "우리도 그래",
];

/** 기운 내라고 건네는 말. 고맙다고 받는다. */
const CHEER = [
  "힘내", "토닥", "응원할", "위로", "고생 많", "고생많", "수고 많", "수고많", "애쓰",
];

/**
 * 같이 마음 아파해주는 말. 같이 끄덕인다.
 * 실제로 달린 댓글을 보고 늘려왔다. 공감은 사람마다 말이 달라서
 * 낱말만으로는 다 못 잡는다.
 */
const EMPATHY = [
  "저도 그래", "저도 그렇", "저도요", "맞아요", "맞네요", "그러게", "그쵸", "그죠",
  "공감", "울컥", "눈물", "뭉클", "마음이", "짠하", "먹먹", "와닿",
  // "그 끄덕임 알아요", "그 마음 알죠"
  "알아요", "알죠", "알겠어요", "알 것 같",
  // "그 한마디가 참 큰힘이 될때가 있어요"
  "큰힘", "큰 힘", "힘이 되", "힘이 돼",
  "똑같", "그러니까",
];

/**
 * 분명한 호의로만 받아들일 말.
 * 하나라도 있어야 자동 답글 후보가 된다.
 */
const PRAISE = [
  "맛있", "맛나", "존맛", "좋아요", "좋네요", "좋습니다", "잘 보고", "잘보고",
  "응원", "화이팅", "파이팅", "최고", "감사", "고맙",
  "멋있", "멋지", "대박", "훌륭", "따뜻", "잘 읽", "잘읽",
];

/**
 * 하나라도 있으면 자동 답글을 달지 않는다.
 * 물어보는 글, 불만, 홍보는 사람이 읽고 답해야 한다.
 */
const NEEDS_OWNER = [
  // 물어보는 글
  "?", "？", "가요", "까요", "되나요", "하나요", "있나요", "인가요", "시나요", "나요?",
  "어디", "언제", "얼마", "몇 시", "몇시", "예약", "주차", "문의", "포장", "배달",
  "영업시간", "영업 시간", "오픈", "브레이크",
  "메뉴", "가격", "위치", "주소", "전화",
  // 불만
  "별로", "실망", "불친절", "비싸", "맛없", "최악", "환불", "불만", "짜증", "싫",
  "머리카락", "이물", "위생", "더럽", "불쾌", "기다렸", "기다리", "늦게", "느려",
  "안 가", "안가", "다신", "다시는", "짜요", "싱거",
  // 홍보·스팸
  "http", "www.", ".com", "dm", "DM", "디엠", "홍보", "맞팔", "팔로우", "구독",
  "수익", "대출", "투자", "부업",
];

/** 자동 답글은 짧고 분명한 말에만 단다. 긴 글은 사람이 읽어야 한다. */
const AUTO_REPLY_MAX_CHARS = 60;

function includesAny(haystack, needles) {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * 댓글 한 줄을 어떻게 처리할지 정한다.
 *
 * 질문·불만·홍보가 하나라도 섞여 있으면 종류와 상관없이 사장님께 넘긴다.
 * 그 관문을 지난 다음에야 종류를 가린다.
 *
 * @returns {"peer"|"cheer"|"empathy"|"praise"|"needs-owner"}
 *   needs-owner가 아니면 그 종류에 맞는 답글을 자동으로 단다.
 */
export function classifyReply(text) {
  const body = String(text ?? "").trim();
  if (!body) return "needs-owner";
  if ([...body].length > AUTO_REPLY_MAX_CHARS) return "needs-owner";

  const lower = body.toLowerCase();
  if (includesAny(lower, NEEDS_OWNER.map((w) => w.toLowerCase()))) return "needs-owner";
  if (body.includes("@")) return "needs-owner";

  // 좁은 쪽부터 본다. 같은 장사하는 분이면 그 인사가 먼저다.
  if (includesAny(body, PEER)) return "peer";
  if (includesAny(body, CHEER)) return "cheer";
  if (includesAny(body, EMPATHY)) return "empathy";
  if (includesAny(body, PRAISE)) return "praise";

  return "needs-owner";
}

/** 같은 댓글에는 늘 같은 답글이 나오도록 id로 고른다. */
export function pickReplyText(replyId, category = "praise", banks = REPLY_TEXTS) {
  const texts = banks[category] ?? banks.praise;
  const id = String(replyId ?? "");
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.codePointAt(0)) % 2147483647;
  return texts[hash % texts.length];
}

async function getJson(url, { fetchImpl = globalThis.fetch, label }) {
  let response;
  let body;
  try {
    response = await fetchImpl(url);
    body = await response.text();
  } catch (error) {
    throw new ThreadsApiError(`${label} 요청 실패: ${error.message}`);
  }
  if (!response.ok) {
    throw new ThreadsApiError(`${label} 실패 (HTTP ${response.status}): ${body.slice(0, 300)}`, {
      status: response.status,
      body,
    });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new ThreadsApiError(`${label} 응답을 해석할 수 없습니다: ${body.slice(0, 200)}`);
  }
}

/** 최근에 올린 내 글 id를 가져온다. 댓글은 이 글들에 달린다. */
export async function fetchRecentPosts({
  userId,
  accessToken,
  limit = 25,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
}) {
  if (!userId) throw new ThreadsApiError("THREADS_USER_ID가 없습니다.");
  if (!accessToken) throw new ThreadsApiError("THREADS_ACCESS_TOKEN이 없습니다.");

  const url = new URL(`${apiBase}/${encodeURIComponent(userId)}/threads`);
  url.searchParams.set("fields", "id,timestamp,permalink");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  const json = await getJson(url, { fetchImpl, label: "내 글 목록" });
  return Array.isArray(json?.data) ? json.data : [];
}

/** 글 한 편에 달린 답글을 가져온다. */
export async function fetchReplies({
  postId,
  accessToken,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
}) {
  const url = new URL(`${apiBase}/${encodeURIComponent(postId)}/replies`);
  url.searchParams.set("fields", "id,text,username,timestamp,hide_status,is_reply_owned_by_me");
  url.searchParams.set("reverse", "false");
  url.searchParams.set("access_token", accessToken);

  const json = await getJson(url, { fetchImpl, label: "답글 목록" });
  return Array.isArray(json?.data) ? json.data : [];
}

/**
 * 답글 하나를 단다. 글 올릴 때와 같은 2단계에 reply_to_id만 더 넣는다.
 * @returns {Promise<{creationId: string, replyId: string}>}
 */
export async function publishReply({
  userId,
  accessToken,
  text,
  replyToId,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
  publishDelayMs = 5000,
}) {
  if (!userId) throw new ThreadsApiError("THREADS_USER_ID가 없습니다.");
  if (!accessToken) throw new ThreadsApiError("THREADS_ACCESS_TOKEN이 없습니다.");
  if (!replyToId) throw new ThreadsApiError("답글을 달 댓글 id가 없습니다.");
  if (!text?.trim()) throw new ThreadsApiError("답글 본문이 비어 있습니다.");
  if ([...text].length > REPLY_MAX_LENGTH) {
    throw new ThreadsApiError(`답글이 ${REPLY_MAX_LENGTH}자를 넘습니다.`);
  }

  const form = (params) => ({
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  const containerUrl = `${apiBase}/${encodeURIComponent(userId)}/threads`;
  const containerResponse = await fetchImpl(
    containerUrl,
    form({ media_type: "TEXT", text, reply_to_id: replyToId, access_token: accessToken }),
  );
  const containerBody = await containerResponse.text();
  if (!containerResponse.ok) {
    throw new ThreadsApiError(`답글 컨테이너 생성 실패 (HTTP ${containerResponse.status}): ${containerBody.slice(0, 300)}`, {
      status: containerResponse.status,
      body: containerBody,
    });
  }
  const container = JSON.parse(containerBody);
  if (!container?.id) {
    throw new ThreadsApiError(`답글 컨테이너 응답에 id가 없습니다: ${containerBody.slice(0, 200)}`);
  }

  if (publishDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, publishDelayMs));
  }

  const publishUrl = `${apiBase}/${encodeURIComponent(userId)}/threads_publish`;
  const publishResponse = await fetchImpl(
    publishUrl,
    form({ creation_id: container.id, access_token: accessToken }),
  );
  const publishBody = await publishResponse.text();
  if (!publishResponse.ok) {
    throw new ThreadsApiError(`답글 발행 실패 (HTTP ${publishResponse.status}): ${publishBody.slice(0, 300)}`, {
      status: publishResponse.status,
      body: publishBody,
    });
  }
  const published = JSON.parse(publishBody);
  if (!published?.id) {
    throw new ThreadsApiError(`답글 발행 응답에 id가 없습니다: ${publishBody.slice(0, 200)}`);
  }

  return { creationId: container.id, replyId: published.id };
}

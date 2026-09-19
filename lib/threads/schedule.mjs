/**
 * 한국 시간(KST) 기준 날짜 계산과 원고 순번 결정.
 *
 * 깃허브 액션은 UTC로 돌기 때문에 "오늘"의 기준을 한 곳에서만 정한다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** KST 기준 YYYY-MM-DD. */
export function kstDateKey(date = new Date()) {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** KST 기준 일련번호(1970-01-01 = 0). 순번 회전의 기준값. */
export function kstDayIndex(date = new Date()) {
  return Math.floor((date.getTime() + KST_OFFSET_MS) / DAY_MS);
}

/**
 * 오늘 올릴 원고를 고른다.
 *
 * 기본은 날짜 기반 회전이라 이력이 없어도 같은 날에는 늘 같은 글이 나온다.
 * 최근에 올린 글(recentIds)은 건너뛰어서 한 바퀴 안에 같은 글이 두 번 나가지 않는다.
 */
export function selectPost({ posts, date = new Date(), recentIds = [] }) {
  if (!posts?.length) throw new Error("원고집이 비어 있어 오늘 올릴 글을 고를 수 없습니다.");

  const recent = new Set(recentIds.slice(-Math.min(posts.length - 1, 30)));
  const start = ((kstDayIndex(date) % posts.length) + posts.length) % posts.length;

  for (let step = 0; step < posts.length; step += 1) {
    const candidate = posts[(start + step) % posts.length];
    if (!recent.has(candidate.id)) return candidate;
  }
  return posts[start];
}

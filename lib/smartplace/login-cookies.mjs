/**
 * 네이버 로그인이 PC를 다시 켜도 남는지 알아본다. 쿠키 값은 읽지 않고 이름과 만료 시각만 본다.
 *
 * 네이버 로그인 쿠키(NID_AUT·NID_SES)는 '로그인 상태 유지'를 체크하지 않으면 만료 시각이 없는 세션 쿠키라서,
 * 엣지 창이 닫히면(윈도우 업데이트 재부팅, 창 강제 종료) 바로 사라진다. 2026-11 초 로그인이 자꾸 풀리던 원인이다.
 * (엣지의 '이전 세션 이어서 열기'로 세션 쿠키를 남기는 방법은 엣지가 그 설정을 보호해 프로필 파일로는 바꿀 수 없었다.)
 */

export const LOGIN_COOKIES = ["NID_AUT", "NID_SES"];

/**
 * cookies: [{ name, expires }] (Playwright 모양, expires -1 = 세션 쿠키)
 * 돌려주는 값: "persistent"(재부팅해도 남음) | "session"(창이 닫히면 사라짐) | "none"(로그인 안 됨)
 */
export function loginPersistence(cookies, now = Date.now()) {
  const found = LOGIN_COOKIES.map((name) => cookies.find((c) => c.name === name));
  if (found.some((c) => !c)) return "none";
  return found.every((c) => c.expires > now / 1000) ? "persistent" : "session";
}

export async function contextLoginPersistence(context) {
  const cookies = await context.cookies("https://www.naver.com").catch(() => []);
  return loginPersistence(cookies);
}

export const SESSION_ONLY_WARNING =
  "'로그인 상태 유지'가 꺼진 로그인이라, PC가 다시 켜지거나 이 창이 닫히면 로그인이 풀립니다. " +
  "이 창에서 네이버 로그아웃 → 로그인 화면에서 '로그인 상태 유지'를 켜고 다시 로그인해 주세요.";

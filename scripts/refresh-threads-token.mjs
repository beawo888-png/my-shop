#!/usr/bin/env node
/**
 * Threads 장기 액세스 토큰(60일)을 갱신해서 새 토큰을 출력한다.
 * 출력된 값을 저장소 Secrets의 THREADS_ACCESS_TOKEN에 다시 넣으면 된다.
 *
 *   THREADS_ACCESS_TOKEN=... node scripts/refresh-threads-token.mjs
 *
 * 토큰은 발급 후 24시간이 지나야 갱신할 수 있고, 만료되면 재발급만 가능하다.
 */

const token = process.env.THREADS_ACCESS_TOKEN;
if (!token) {
  console.error("THREADS_ACCESS_TOKEN 환경변수가 필요합니다.");
  process.exit(1);
}

const url = new URL("https://graph.threads.net/refresh_access_token");
url.searchParams.set("grant_type", "th_refresh_token");
url.searchParams.set("access_token", token);

const response = await fetch(url);
const body = await response.text();

if (!response.ok) {
  console.error(`갱신 실패 (HTTP ${response.status}): ${body}`);
  process.exit(1);
}

const { access_token: accessToken, expires_in: expiresIn } = JSON.parse(body);
const days = Math.round((expiresIn ?? 0) / 86400);
console.log(`새 토큰 (약 ${days}일 유효):\n\n${accessToken}\n`);
console.log("저장소 Settings → Secrets and variables → Actions → THREADS_ACCESS_TOKEN 에 붙여넣으세요.");

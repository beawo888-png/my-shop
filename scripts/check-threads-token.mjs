#!/usr/bin/env node
/**
 * Threads 토큰이 아직 살아 있는지 확인한다.
 * 글을 올리지 않고 내 계정 정보만 읽으므로, 토큰을 갈아끼운 뒤 확인용으로 쓰면 된다.
 *
 *   THREADS_ACCESS_TOKEN=... node scripts/check-threads-token.mjs
 *
 * 토큰 값 자체는 어디에도 출력하지 않는다.
 */

const token = process.env.THREADS_ACCESS_TOKEN;
const expectedUserId = process.env.THREADS_USER_ID;

if (!token) {
  console.error("THREADS_ACCESS_TOKEN 환경변수가 필요합니다.");
  process.exit(1);
}

const url = new URL("https://graph.threads.net/v1.0/me");
url.searchParams.set("fields", "id,username");
url.searchParams.set("access_token", token);

let response;
let body;
try {
  response = await fetch(url);
  body = await response.text();
} catch (error) {
  console.error(`Threads API에 연결하지 못했습니다: ${error.message}`);
  process.exit(1);
}

if (!response.ok) {
  // 오류 응답이 토큰을 되비칠 수 있으니 그대로 찍지 않는다.
  console.error(`토큰이 동작하지 않습니다 (HTTP ${response.status}).`);
  console.error(body.replaceAll(token, "<토큰>"));
  console.error("만료됐다면 Meta 콘솔에서 새로 발급해 THREADS_ACCESS_TOKEN Secret에 넣으세요.");
  process.exit(1);
}

const { id, username } = JSON.parse(body);
console.log(`토큰 정상 · 계정 @${username} (id ${id})`);

if (expectedUserId && expectedUserId !== id) {
  console.error(`THREADS_USER_ID(${expectedUserId})와 계정 id가 다릅니다. 이대로면 발행이 실패합니다.`);
  process.exit(1);
}

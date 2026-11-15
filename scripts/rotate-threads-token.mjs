#!/usr/bin/env node
/**
 * Threads 장기 토큰(60일)을 갱신해서 저장소 Secret에 다시 넣는다.
 * 깃허브 액션이 한 달에 두 번 돌려주므로 사람이 손댈 일이 없다.
 *
 *   THREADS_ACCESS_TOKEN=... GH_SECRETS_TOKEN=... node scripts/rotate-threads-token.mjs
 *
 * 필요한 환경변수
 *   THREADS_ACCESS_TOKEN  현재 토큰
 *   GH_SECRETS_TOKEN      Secrets 쓰기 권한이 있는 깃허브 토큰
 *   GITHUB_REPOSITORY     owner/repo (액션이 자동으로 넣어준다)
 *   THREADS_USER_ID       (선택) 갱신한 토큰이 이 계정인지 대조한다
 *
 * --dry-run 을 주면 갱신만 해보고 Secret은 건드리지 않는다.
 *
 * 토큰 값은 성공하든 실패하든 출력하지 않는다.
 */

import sodium from "libsodium-wrappers";

const SECRET_NAME = "THREADS_ACCESS_TOKEN";

const dryRun = process.argv.includes("--dry-run");
const currentToken = process.env.THREADS_ACCESS_TOKEN;
const githubToken = process.env.GH_SECRETS_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const expectedUserId = process.env.THREADS_USER_ID;

// 가릴 값을 먼저 모아둔다. 아래 어떤 줄에서 끝내든 토큰이 묻어 나가지 않게.
const secrets = [currentToken, githubToken].filter(Boolean);

/** 토큰이 오류 메시지에 묻어 나가지 않게 가린다. */
function scrub(text) {
  return secrets.reduce((acc, secret) => acc.replaceAll(secret, "<가림>"), String(text ?? ""));
}

function fail(message) {
  console.error(scrub(message));
  process.exit(1);
}

if (!currentToken) fail("THREADS_ACCESS_TOKEN 환경변수가 필요합니다.");
if (!dryRun && !githubToken) {
  fail(
    "GH_SECRETS_TOKEN 환경변수가 필요합니다.\n" +
      "Secrets 쓰기 권한이 있는 깃허브 토큰을 같은 이름의 Secret으로 등록하세요.",
  );
}
if (!dryRun && !repository) fail("GITHUB_REPOSITORY 환경변수가 필요합니다. (owner/repo)");

async function request(url, init) {
  let response;
  let body;
  try {
    response = await fetch(url, init);
    body = await response.text();
  } catch (error) {
    fail(`연결하지 못했습니다 (${url.host ?? url}): ${error.message}`);
  }
  return { response, body };
}

// 1. 새 토큰을 받는다. 여기서 실패하면 Secret은 그대로 둔다.
const refreshUrl = new URL("https://graph.threads.net/refresh_access_token");
refreshUrl.searchParams.set("grant_type", "th_refresh_token");
refreshUrl.searchParams.set("access_token", currentToken);

const refresh = await request(refreshUrl);
if (!refresh.response.ok) {
  fail(
    `갱신 실패 (HTTP ${refresh.response.status}): ${scrub(refresh.body)}\n` +
      "이미 만료됐다면 갱신이 안 됩니다. Meta 콘솔에서 새로 발급받아야 합니다.",
  );
}

const { access_token: newToken, expires_in: expiresIn } = JSON.parse(refresh.body);
if (!newToken) fail("갱신 응답에 토큰이 없습니다.");
secrets.push(newToken);
const days = Math.round((expiresIn ?? 0) / 86400);

// 2. 새 토큰이 진짜 되는지 써보고 나서 저장한다.
const meUrl = new URL("https://graph.threads.net/v1.0/me");
meUrl.searchParams.set("fields", "id,username");
meUrl.searchParams.set("access_token", newToken);

const me = await request(meUrl);
if (!me.response.ok) {
  fail(`새 토큰이 동작하지 않아 저장하지 않았습니다 (HTTP ${me.response.status}): ${scrub(me.body)}`);
}
const { id, username } = JSON.parse(me.body);
if (expectedUserId && expectedUserId !== id) {
  fail(`새 토큰의 계정이 THREADS_USER_ID와 다릅니다. 저장하지 않았습니다.`);
}

if (dryRun) {
  console.log(`갱신만 확인했습니다 · 약 ${days}일 · 계정 @${username} (Secret은 그대로)`);
  process.exit(0);
}

// 3. 저장소 공개키로 봉해서 Secret에 덮어쓴다.
const api = `https://api.github.com/repos/${repository}/actions/secrets`;
const headers = {
  authorization: `Bearer ${githubToken}`,
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
};

const key = await request(`${api}/public-key`, { headers });
if (!key.response.ok) {
  fail(
    `저장소 공개키를 읽지 못했습니다 (HTTP ${key.response.status}): ${scrub(key.body)}\n` +
      "GH_SECRETS_TOKEN에 이 저장소의 Secrets 읽기·쓰기 권한이 있는지 확인하세요.",
  );
}
const { key: publicKey, key_id: keyId } = JSON.parse(key.body);

await sodium.ready;
const encryptedValue = sodium.to_base64(
  sodium.crypto_box_seal(
    sodium.from_string(newToken),
    sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL),
  ),
  sodium.base64_variants.ORIGINAL,
);

const put = await request(`${api}/${SECRET_NAME}`, {
  method: "PUT",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId }),
});
if (!put.response.ok) {
  fail(`Secret을 저장하지 못했습니다 (HTTP ${put.response.status}): ${scrub(put.body)}`);
}

console.log(`${SECRET_NAME} 갱신 완료 · 약 ${days}일 유효 · 계정 @${username}`);

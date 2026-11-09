/**
 * 카카오톡 '나에게 보내기'로 사장님 휴대폰에 알림을 보낸다.
 *
 * 카카오 개발자 앱의 REST API 키와, 처음 한 번 `npm run kakao:setup`으로 받은 토큰을
 * .smartplace/kakao.json(깃에 올라가지 않음)에 둔다. 접근 토큰은 몇 시간마다 만료되므로
 * 보낼 때마다 갱신 토큰으로 새로 받는다. 갱신 토큰도 약 두 달 뒤 만료되는데, 한 달 이내로 남으면
 * 카카오가 새 갱신 토큰을 같이 주므로 매일 쓰면 계속 이어진다.
 *
 * 알림은 덤이다. 실패해도 발행 작업을 멈추지 않도록 sendKakaoMemo는 예외를 던지지 않는다.
 */

import { readFile, writeFile } from "node:fs/promises";

import { LOCAL_DIR } from "../smartplace/local-store.mjs";

export const KAKAO_PATH = `${LOCAL_DIR}kakao.json`;
export const REDIRECT_URI = "http://localhost:5174/kakao";
/** 카카오 텍스트 메시지 본문 한도 */
export const TEXT_MAX = 200;

const AUTH_HOST = "https://kauth.kakao.com";
const API_HOST = "https://kapi.kakao.com";

export async function readKakao() {
  try {
    return JSON.parse(await readFile(KAKAO_PATH, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw new Error(`.smartplace/kakao.json을 읽지 못했습니다: ${error.message}`);
  }
}

export async function writeKakao(data) {
  await writeFile(KAKAO_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function authorizeUrl(restApiKey) {
  const params = new URLSearchParams({ client_id: restApiKey, redirect_uri: REDIRECT_URI, response_type: "code", scope: "talk_message" });
  return `${AUTH_HOST}/oauth/authorize?${params}`;
}

async function tokenRequest(params) {
  const response = await fetch(`${AUTH_HOST}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`카카오 토큰 요청 실패 (${response.status}): ${body.error_description ?? body.error ?? "응답 없음"}`);
  return body;
}

/** 토큰 응답을 저장할 모양으로 합친다. 갱신 응답에는 refresh_token이 없을 수 있어 기존 값을 지킨다. */
export function mergeTokens(saved, token, now = Date.now()) {
  return {
    ...saved,
    accessToken: token.access_token,
    expiresAt: now + token.expires_in * 1000,
    ...(token.refresh_token
      ? { refreshToken: token.refresh_token, refreshExpiresAt: now + token.refresh_token_expires_in * 1000 }
      : {}),
  };
}

/** 처음 설정: 로그인 후 받은 code로 토큰을 받는다. */
export async function exchangeCode({ restApiKey, clientSecret, code }) {
  const token = await tokenRequest({
    grant_type: "authorization_code",
    client_id: restApiKey,
    redirect_uri: REDIRECT_URI,
    code,
    ...(clientSecret ? { client_secret: clientSecret } : {}),
  });
  return mergeTokens({ restApiKey, ...(clientSecret ? { clientSecret } : {}) }, token);
}

async function freshAccessToken(saved) {
  if (saved.accessToken && saved.expiresAt - Date.now() > 5 * 60_000) return saved;
  const token = await tokenRequest({
    grant_type: "refresh_token",
    client_id: saved.restApiKey,
    refresh_token: saved.refreshToken,
    ...(saved.clientSecret ? { client_secret: saved.clientSecret } : {}),
  });
  const next = mergeTokens(saved, token);
  await writeKakao(next);
  return next;
}

export function clip(text, max = TEXT_MAX) {
  const chars = [...text];
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join("")}…`;
}

/** 알림을 보낸다. 성공하면 true, 설정이 없거나 실패하면 false(콘솔에만 남긴다). */
export async function sendKakaoMemo(text, { link = "https://blog.naver.com", buttonTitle = "블로그 보기" } = {}) {
  try {
    const saved = await readKakao();
    if (!saved?.refreshToken) {
      console.warn("ℹ️  카카오톡 알림이 설정되지 않아 보내지 않았습니다. ('npm run kakao:setup')");
      return false;
    }
    const { accessToken } = await freshAccessToken(saved);
    const template = { object_type: "text", text: clip(text), link: { web_url: link, mobile_web_url: link }, button_title: buttonTitle };
    const response = await fetch(`${API_HOST}/v2/api/talk/memo/default/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: new URLSearchParams({ template_object: JSON.stringify(template) }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`(${response.status}) ${body.msg ?? body.error_description ?? "응답 없음"}`);
    }
    return true;
  } catch (error) {
    console.warn(`⚠️  카카오톡 알림을 보내지 못했습니다: ${error.message}. 계속 안 되면 'npm run kakao:setup'을 다시 해 주세요.`);
    return false;
  }
}

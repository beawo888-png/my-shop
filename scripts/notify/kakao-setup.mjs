#!/usr/bin/env node
/**
 * 카카오톡 '나에게 보내기' 알림을 처음 한 번 설정한다. `npm run kakao:setup`
 * (docs/operations/kakao-notify.md에 카카오 개발자 앱 만드는 법이 있다)
 *
 * 1. 카카오 개발자 앱의 REST API 키를 입력받는다(클라이언트 시크릿을 켰다면 그것도).
 * 2. 브라우저로 카카오 로그인·동의 화면을 열고, 이 PC의 localhost:5174로 돌아오는 code를 받는다.
 * 3. 토큰을 .smartplace/kakao.json에 저장하고 시험 메시지를 보낸다.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { authorizeUrl, exchangeCode, KAKAO_PATH, readKakao, REDIRECT_URI, sendKakaoMemo, writeKakao } from "../../lib/notify/kakao.mjs";
import { LOCAL_DIR } from "../../lib/smartplace/local-store.mjs";

function openInBrowser(url) {
  const [command, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url.replace(/&/g, "^&")]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]];
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

/** localhost:5174/kakao로 돌아오는 로그인 결과(code)를 기다린다(최대 10분). */
function waitForCode() {
  const { port, pathname } = new URL(REDIRECT_URI);
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      if (url.pathname !== pathname) {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(code ? "<h2>카카오톡 알림 연결 완료! 이 창은 닫아도 됩니다.</h2>" : `<h2>연결 실패: ${error ?? "알 수 없음"}</h2>`);
      server.close();
      clearTimeout(timer);
      if (code) resolve(code);
      else reject(new Error(`카카오 로그인이 취소되었거나 실패했습니다: ${error ?? "알 수 없음"}`));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error("10분 안에 카카오 로그인이 끝나지 않았습니다. 다시 실행해 주세요."));
    }, 10 * 60_000);
    server.on("error", reject);
    server.listen(Number(port), "127.0.0.1");
  });
}

const rl = readline.createInterface({ input, output });
const saved = await readKakao();
console.log("카카오톡 알림 설정을 시작합니다.");
console.log(`카카오 개발자 앱의 Redirect URI에 ${REDIRECT_URI} 가 등록돼 있어야 합니다.\n`);
const keyHint = saved?.restApiKey ? ` (엔터: 저장된 키 ${saved.restApiKey.slice(0, 4)}… 그대로)` : "";
const restApiKey = (await rl.question(`REST API 키를 붙여 넣고 엔터${keyHint}: `)).trim() || saved?.restApiKey;
if (!restApiKey) throw new Error("REST API 키가 없습니다.");
const clientSecret = (await rl.question("클라이언트 시크릿(켜지 않았으면 그냥 엔터): ")).trim() || undefined;
rl.close();

const codePromise = waitForCode();
console.log("\n브라우저에서 카카오 로그인 화면이 열립니다. 사장님 카카오 계정으로 로그인하고 '카카오톡 메시지 전송'에 동의해 주세요.");
openInBrowser(authorizeUrl(restApiKey));
const code = await codePromise;

await mkdir(LOCAL_DIR, { recursive: true });
await writeKakao(await exchangeCode({ restApiKey, clientSecret, code }));
console.log(`저장: ${KAKAO_PATH}`);

const sent = await sendKakaoMemo("[왕징 블로그] 카카오톡 알림이 연결됐어요. 매일 블로그 발행 결과를 이리로 보내 드릴게요.");
console.log(sent ? "✅ 시험 메시지를 보냈습니다. 카카오톡 '나와의 채팅'을 확인해 주세요." : "❌ 시험 메시지를 보내지 못했습니다. 위 메시지를 확인해 주세요.");
if (!sent) process.exitCode = 1;

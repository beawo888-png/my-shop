/**
 * 네이버 스마트플레이스 '소식' 화면을 조작하는 부분.
 *
 * 네이버 화면 구조는 예고 없이 바뀐다. 그래서 고정 CSS 대신 버튼 글자·입력창 종류로 찾고,
 * 안 맞으면 .smartplace/config.json의 "selectors"로 덮어쓸 수 있게 했다.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

import { profileDir, SCREENSHOT_DIR } from "./local-store.mjs";

export const DEFAULT_SELECTORS = {
  // 소식 작성 화면이 아니라 목록 화면일 때 누를 버튼
  writeButton: "role=button[name=/새\\s*소식|소식\\s*(쓰기|작성|올리기|등록)|글\\s*쓰기/]",
  title: "input[placeholder*='제목'], textarea[placeholder*='제목']",
  text: "textarea:not([placeholder*='제목']), [contenteditable='true']",
  photo: "input[type='file']",
  // 사진을 넣으면 뜨는 사진 편집 창(자르기·모자이크)의 '확인'
  photoEditorDone: "role=button[name=/^\\s*확인\\s*$/]",
  submit: "role=button[name=/^\\s*(등록|등록하기|게시|게시하기|올리기|발행|완료)\\s*$/]",
  confirm: "role=button[name=/^\\s*(확인|등록|게시|소식\\s*등록)\\s*$/]",
};

export class LoginRequiredError extends Error {}

// 엣지 창을 계속 켜 두고 다시 붙을 때 쓰는 지점별 포트
const EDGE_DEBUG_PORTS = { pangyo: 9311, moran: 9312 };
const EDGE_PATHS = [
  process.env.SMARTPLACE_EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

/**
 * 자동화 브라우저에서는 네이버가 로그인을 창이 열려 있는 동안만 유지해 준다.
 * 그래서 엣지는 작업이 끝나도 닫지 않고 켜 둔 채, 다음 작업 때 그 창에 다시 붙는다.
 * 돌려준 context의 close()는 창을 닫지 않고 연결만 끊는다. 창이 없으면 새로 띄운다.
 */
async function attachKeptEdge(chromium, branchId, profile) {
  const port = EDGE_DEBUG_PORTS[branchId];
  if (!port) throw new Error(`${branchId} 지점의 엣지 포트가 정해져 있지 않습니다.`);
  const endpoint = `http://127.0.0.1:${port}`;
  const connect = () => chromium.connectOverCDP(endpoint, { timeout: 3_000 });

  let browser = await connect().catch(() => null);
  if (!browser) {
    const edgePath = EDGE_PATHS.find((path) => existsSync(path));
    if (!edgePath) throw new Error("엣지를 찾지 못했습니다. SMARTPLACE_EDGE_PATH로 msedge.exe 위치를 지정해 주세요.");
    const child = spawn(edgePath, [
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${resolve(profile)}`,
      // 자동화 창이라는 표시(navigator.webdriver)는 숨기지 않는다.
      "--enable-automation",
      "--no-first-run",
      "--no-default-browser-check",
      "--window-size=1280,900",
      "--lang=ko-KR",
      "about:blank",
    ], { detached: true, stdio: "ignore" });
    child.unref();
    const deadline = Date.now() + 30_000;
    while (!browser && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1_000));
      browser = await connect().catch(() => null);
    }
    if (!browser) throw new Error("엣지 창에 연결하지 못했습니다.");
  }

  const context = browser.contexts()[0];
  context.close = () => browser.close();
  return context;
}

/** 지점마다 다른 네이버 아이디를 쓰므로 크롬 프로필도 지점별로 따로 연다. */
export async function launchBrowser({ branchId, channel = "chrome", headless = process.env.SMARTPLACE_HEADLESS === "1" }) {
  const { chromium } = await import("playwright");
  // 엣지는 크롬 프로필 폴더를 같이 쓰면 꼬일 수 있어 따로 둔다.
  const profile = channel === "msedge" ? `${profileDir(branchId)}-edge` : profileDir(branchId);
  if (channel === "msedge" && !headless) return attachKeptEdge(chromium, branchId, profile);
  const options = { headless, viewport: { width: 1280, height: 900 }, locale: "ko-KR", slowMo: 60 };
  // 크롬이 기본 위치에 없으면 SMARTPLACE_CHROME_PATH로 실행 파일을 직접 지정한다.
  const executablePath = process.env.SMARTPLACE_CHROME_PATH;
  if (executablePath) return chromium.launchPersistentContext(profile, { ...options, executablePath });
  try {
    return await chromium.launchPersistentContext(profile, { ...options, channel });
  } catch (error) {
    if (!channel) throw error;
    console.warn(`⚠️  ${channel} 실행 실패, 기본 크로미움으로 다시 시도합니다: ${error.message.split("\n")[0]}`);
    return chromium.launchPersistentContext(profile, options);
  }
}

export function isLoginPage(url) {
  return /nid\.naver\.com|\/login/i.test(url);
}

/**
 * url을 열고, 로그인 화면이 나오면 사장님이 그 창에서 로그인할 때까지 기다린다(기본 20분).
 * onWait는 기다리기 시작할 때 한 번 불린다(알림 창 띄우기 등).
 */
export async function openWhenLoggedIn(page, url, { onWait, timeoutMs = 20 * 60_000 } = {}) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  if (!isLoginPage(page.url())) return;
  onWait?.();
  const deadline = Date.now() + timeoutMs;
  while (isLoginPage(page.url())) {
    if (Date.now() > deadline) throw new LoginRequiredError("네이버 로그인을 기다리다 시간이 지났습니다.");
    await page.waitForTimeout(2_000);
  }
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  if (isLoginPage(page.url())) throw new LoginRequiredError("네이버 로그인이 풀렸습니다.");
}

async function firstVisible(page, selector, timeout = 0) {
  const locator = page.locator(selector);
  const deadline = Date.now() + timeout;
  do {
    const count = await locator.count();
    for (let i = 0; i < count; i += 1) {
      const item = locator.nth(i);
      if (await item.isVisible().catch(() => false)) return item;
    }
    if (Date.now() < deadline) await page.waitForTimeout(500);
  } while (Date.now() < deadline);
  return null;
}

export async function screenshot(page, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true }).catch(() => {});
  return path;
}

/**
 * 소식 한 편을 채운다. submit이 false면 등록 직전에서 멈춘다(점검용).
 * 돌려주는 값: { submitted, verified }
 */
export async function postNews(page, { url, post, selectors = {}, submit = true, shotName }) {
  const sel = { ...DEFAULT_SELECTORS, ...selectors };

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  if (isLoginPage(page.url())) throw new LoginRequiredError("네이버 로그인이 풀렸습니다.");
  // 로그인이 풀려도 주소는 그대로 두고 '네이버 로그인이 필요한 기능입니다' 창만 띄우는 경우
  if (await page.getByText(/로그인이 필요한/).first().isVisible().catch(() => false)) {
    throw new LoginRequiredError("네이버 로그인이 풀렸습니다.");
  }

  let editor = await firstVisible(page, sel.text, 8_000);
  if (!editor) {
    const write = await firstVisible(page, sel.writeButton, 3_000);
    if (!write) throw new Error("소식 작성 화면을 찾지 못했습니다. config.json의 주소가 '소식 작성' 화면인지 확인해 주세요.");
    await write.click();
    editor = await firstVisible(page, sel.text, 10_000);
    if (!editor) throw new Error("본문 입력칸을 찾지 못했습니다. (selectors.text 확인 필요)");
  }

  // 사진: 숨겨진 파일 입력에도 바로 넣을 수 있다.
  const photoInput = page.locator(sel.photo).first();
  if (await photoInput.count()) {
    await photoInput.setInputFiles(post.photoPath);
    await page.waitForTimeout(4_000);
    // 사진 편집 창이 화면을 덮으면 '확인'으로 닫는다. 편집 창 버튼이 가장 나중에 그려진다.
    const editorCanvas = page.locator("canvas").first();
    if (await editorCanvas.isVisible().catch(() => false)) {
      const done = page.locator(sel.photoEditorDone);
      for (let i = (await done.count()) - 1; i >= 0; i -= 1) {
        if (await done.nth(i).isVisible().catch(() => false)) {
          await done.nth(i).click();
          break;
        }
      }
      const closed = await editorCanvas.waitFor({ state: "hidden", timeout: 15_000 }).then(() => true, () => false);
      if (!closed) throw new Error("사진 편집 창을 닫지 못했습니다. (selectors.photoEditorDone 확인 필요)");
      await page.waitForTimeout(1_500);
    }
  } else {
    console.warn("⚠️  사진 올리는 칸을 찾지 못해 글만 올립니다. (selectors.photo 확인 필요)");
  }

  // 제목칸이 따로 있으면 제목칸엔 title, 본문칸엔 body(날짜별 원고는 본문 + 빈 줄 + 해시태그).
  // 제목칸이 없으면 제목을 첫 줄로 둔 text 전체를 본문칸에 넣는다.
  let body = post.text;
  const title = await firstVisible(page, sel.title);
  if (title) {
    await title.fill(post.title);
    body = post.body ?? post.text.split("\n").slice(1).join("\n").replace(/^\n+/, "");
  }

  await editor.click();
  const tag = await editor.evaluate((el) => el.tagName.toLowerCase());
  if (tag === "textarea" || tag === "input") await editor.fill(body);
  else await page.keyboard.insertText(body);
  await page.waitForTimeout(1_000);

  const submitButton = await firstVisible(page, sel.submit, 5_000);
  if (!submitButton) throw new Error("등록 버튼을 찾지 못했습니다. (selectors.submit 확인 필요)");

  if (!submit) {
    await screenshot(page, `${shotName}-check`);
    return { submitted: false, verified: false };
  }

  page.once("dialog", (dialog) => dialog.accept().catch(() => {}));
  await submitButton.click();

  // 확인 창이 한 번 더 뜨는 경우
  const confirm = await firstVisible(page, sel.confirm, 3_000);
  if (confirm) await confirm.click().catch(() => {});

  await page.waitForTimeout(5_000);
  const stillEditing = await firstVisible(page, sel.text);
  const leftText = stillEditing ? await stillEditing.evaluate((el) => (el.value ?? el.textContent ?? "").trim()) : "";
  await screenshot(page, shotName);
  return { submitted: true, verified: !leftText };
}

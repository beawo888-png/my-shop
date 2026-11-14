/**
 * 네이버 블로그 글쓰기 화면(스마트에디터 ONE)을 조작하는 부분.
 *
 * 블로그도 공식 글쓰기 API가 없어서, 지점별 전용 브라우저 창을 프로그램이 대신 조작한다.
 * 순서: 제목 → 본문 붙여넣기(사진 자리는 [[사진1]] 같은 표시) → 표시 자리에 사진 넣기
 *       → 예약·지도 글자에 링크 걸기 → '발행' → 카테고리 → 태그 → 최종 '발행'
 * 발행 창에서 카테고리('메뉴추천')를 고른다. 카테고리가 블로그에 없으면 발행하지 않고 멈춘다.
 *
 * 네이버 화면 구조는 예고 없이 바뀐다. 안 맞으면 .smartplace/config.json의 "blogSelectors"로 덮어쓴다.
 */

import { blocksToHtml, postLinks, splitByPhotos } from "./menu-posts.mjs";
import { isLoginPage, LoginRequiredError, screenshot } from "../smartplace/browser.mjs";

export const DEFAULT_BLOG_SELECTORS = {
  // 편집기가 떠 있는지 알아보는 표시
  editorReady: ".se-documentTitle, .se-title-text, .se-content",
  title: ".se-documentTitle .se-text-paragraph, .se-title-text .se-text-paragraph, .se-title-text",
  body: ".se-component.se-text .se-text-paragraph",
  paragraph: ".se-text-paragraph",
  imageComponent: ".se-component.se-image",
  imageButton: "button.se-image-toolbar-button, button[data-name='image']",
  // 편집기가 띄우는 창(링크 카드 넣기 등)과 그 닫기 버튼. 열려 있으면 다른 클릭을 모두 막는다.
  popup: "[data-group='popupLayer'] .se-popup, .se-popup",
  popupClose: ".se-popup-close-button, .se-popup-button-cancel, button[class*='close']",
  // 들어오자마자 뜨는 창들: '작성 중인 글이 있습니다'(이어 쓰지 않음), 도움말
  draftCancel: ".se-popup-alert-confirm .se-popup-button-cancel, .se-popup-button-cancel",
  helpClose: ".se-help-panel-close-button, button[class*='help'][class*='close']",
  publishOpen: "role=button[name=/^\\s*발행\\s*$/]",
  categoryButton: "button[class*='selectbox_button'], button[aria-label*='카테고리']",
  tagInput: "input#tag-input, input[placeholder*='태그']",
  publishConfirm: "button[class*='confirm_btn'], role=button[name=/^\\s*발행\\s*$/]",
};

const photoMarker = (n) => `[[사진${n}]]`;

/** 편집기가 iframe(#mainFrame) 안에 뜨는 경우와 바로 뜨는 경우를 모두 찾는다. */
async function findEditorFrame(page, sel, timeout = 40_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (await frame.locator(sel.editorReady).first().isVisible().catch(() => false)) return frame;
    }
    await page.waitForTimeout(1_000);
  }
  return null;
}

async function clickIfVisible(frame, selector, timeout = 2_000) {
  const item = frame.locator(selector).first();
  if (await item.isVisible({ timeout }).catch(() => false)) {
    await item.click().catch(() => {});
    return true;
  }
  return false;
}

async function visibleLast(frame, selector) {
  const locator = frame.locator(selector);
  for (let i = (await locator.count()) - 1; i >= 0; i -= 1) {
    if (await locator.nth(i).isVisible().catch(() => false)) return locator.nth(i);
  }
  return null;
}

/**
 * 지금 커서 자리에 HTML을 붙여 넣는다. 굵은 글씨·링크를 살리려고 실제 클립보드를 먼저 쓰고,
 * 안 되면 붙여넣기 이벤트, 그것도 안 되면 글자만 입력한다.
 */
async function pasteHtml(page, frame, { html, text }) {
  try {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://blog.naver.com" });
    await frame.evaluate(async ({ html, text }) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    }, { html, text });
    await page.keyboard.press("Control+V");
    return "clipboard";
  } catch {
    const handled = await frame.evaluate(({ html, text }) => {
      const target = document.activeElement ?? document.body;
      const data = new DataTransfer();
      data.setData("text/html", html);
      data.setData("text/plain", text);
      const event = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    }, { html, text });
    if (handled) return "event";
    await page.keyboard.insertText(text);
    return "text";
  }
}

async function documentText(frame, sel) {
  return frame.locator(sel.paragraph).evaluateAll((els) => els.map((el) => el.textContent ?? "").join("\n"));
}

/** [[사진n]] 표시가 있는 문단을 비우고 그 자리에 사진을 넣는다. */
async function replaceMarkerWithPhoto(page, frame, sel, marker, photoPath) {
  const paragraph = frame.locator(sel.paragraph, { hasText: marker }).first();
  if (!(await paragraph.count())) throw new Error(`본문에서 사진 자리(${marker})를 찾지 못했습니다.`);
  await paragraph.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Shift+Home");
  await page.keyboard.press("Delete");

  const before = await frame.locator(sel.imageComponent).count();
  const button = frame.locator(sel.imageButton).first();
  if (!(await button.isVisible().catch(() => false))) throw new Error("사진 버튼을 찾지 못했습니다. (blogSelectors.imageButton 확인 필요)");
  const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 15_000 }), button.click()]);
  await chooser.setFiles(photoPath);

  const deadline = Date.now() + 60_000;
  while ((await frame.locator(sel.imageComponent).count()) <= before) {
    if (Date.now() > deadline) throw new Error(`사진이 올라가지 않았습니다: ${photoPath}`);
    await page.waitForTimeout(1_000);
  }
  await page.waitForTimeout(1_500);
}

/** 편집기에 떠 있는 창을 닫는다. 링크 카드 창 같은 것이 남아 있으면 다음 클릭이 모두 막힌다. */
async function closePopups(page, frame, sel) {
  for (let i = 0; i < 3; i += 1) {
    const popup = await visibleLast(frame, sel.popup);
    if (!popup) return;
    const close = popup.locator(sel.popupClose).first();
    if (await close.isVisible().catch(() => false)) await close.click({ timeout: 3_000 }).catch(() => {});
    else await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  }
}

/**
 * 예약·지도 글자 줄이 눌러지게 한다. 붙여넣기로 링크가 들어갔으면 그대로 둔다.
 * 아니면 그 줄 끝에 주소를 이어 쓴다(네이버가 주소 글자를 링크로 바꿔 준다).
 * 편집기의 링크 버튼은 '링크 카드 넣기' 창을 열어 화면을 막아서 쓰지 않는다. 이 단계는 실패해도 발행을 멈추지 않는다.
 * 돌려주는 값: 링크가 걸린 것을 확인하지 못한 글자 목록.
 */
async function applyLinks(page, frame, sel, links) {
  const failed = [];
  for (const { text, href } of links) {
    try {
      await closePopups(page, frame, sel);
      const paragraph = frame.locator(sel.paragraph, { hasText: text }).first();
      if (!(await paragraph.count())) throw new Error("본문에서 그 줄을 찾지 못했습니다.");
      if (await paragraph.locator("a[href]").count()) continue;
      await paragraph.click({ timeout: 5_000 });
      await page.keyboard.press("End");
      await page.keyboard.insertText(` ${href}`);
      await page.keyboard.press("Space");
      await page.waitForTimeout(1_000);
      await closePopups(page, frame, sel);
      if (!(await paragraph.locator("a[href]").count())) failed.push(text);
    } catch (error) {
      console.warn(`⚠️  '${text}' 줄에 주소를 넣지 못했습니다: ${error.message.split("\n")[0]}`);
      await closePopups(page, frame, sel);
      failed.push(text);
    }
  }
  return failed;
}

/** 발행된 글 주소(blog.naver.com/아이디/글번호 또는 logNo=글번호)를 이 탭과 그 안의 iframe 주소에서 찾는다. */
export function findPostUrl(urls) {
  return urls.find((raw) => /^https:\/\/(m\.)?blog\.naver\.com\/[^/?#]+\/\d{6,}/.test(raw) || /[?&]logNo=\d{6,}/.test(raw)) ?? null;
}

async function chooseCategory(page, frame, sel, category) {
  const button = await visibleLast(frame, sel.categoryButton);
  if (!button) throw new Error("발행 창에서 카테고리 선택 버튼을 찾지 못했습니다. (blogSelectors.categoryButton 확인 필요)");
  if ((await button.textContent())?.trim() === category) return;
  await button.click();
  await page.waitForTimeout(800);
  const option = frame.getByText(category, { exact: true });
  for (let i = (await option.count()) - 1; i >= 0; i -= 1) {
    const item = option.nth(i);
    if (!(await item.isVisible().catch(() => false))) continue;
    // 버튼 자신의 글자가 아니라 펼쳐진 목록의 항목을 누른다.
    if (await item.evaluate((el, btn) => btn.contains(el), await button.elementHandle())) continue;
    await item.click();
    await page.waitForTimeout(500);
    return;
  }
  throw new Error(`블로그에 '${category}' 카테고리가 없습니다. 블로그 관리 → 카테고리 관리에서 먼저 만들어 주세요.`);
}

async function addTags(page, frame, sel, tags) {
  const input = await visibleLast(frame, sel.tagInput);
  if (!input) {
    console.warn("⚠️  태그 입력칸을 찾지 못해 태그 없이 발행합니다. (blogSelectors.tagInput 확인 필요)");
    return;
  }
  for (const tag of tags) {
    await input.click();
    await page.keyboard.insertText(tag);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(150);
  }
}

export class WrongBlogError extends Error {}

/** 주소들 중 하나라도 그 블로그 아이디의 것인지 본다(blog.naver.com/아이디/... 또는 ?blogId=아이디). */
export function urlBelongsToBlog(urls, blogId) {
  const id = blogId.toLowerCase();
  return urls.some((raw) => {
    try {
      const url = new URL(raw);
      if (!/(^|\.)blog\.naver\.com$/.test(url.hostname)) return false;
      return url.pathname.split("/")[1]?.toLowerCase() === id || url.searchParams.get("blogId")?.toLowerCase() === id;
    } catch {
      return false;
    }
  });
}

/**
 * 글 한 편을 채운다. submit이 false면 발행 창에서 태그까지 넣고 최종 '발행' 직전에서 멈춘다.
 * blogId가 있으면, 글쓰기 화면과 발행된 글이 그 블로그의 것인지 확인한다. 브라우저 창에 다른 네이버 아이디로
 * 로그인돼 있으면 네이버가 그 아이디의 글쓰기 화면을 열어 엉뚱한 블로그에 올라가기 때문이다.
 * 돌려주는 값: { submitted, verified, postUrl, unlinked(링크를 못 건 글자) }
 */
export async function publishBlogPost(page, { url, blogId, post, category, selectors = {}, submit = true, shotName }) {
  const sel = { ...DEFAULT_BLOG_SELECTORS, ...selectors };

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  if (isLoginPage(page.url())) throw new LoginRequiredError("네이버 로그인이 풀렸습니다.");

  const frame = await findEditorFrame(page, sel);
  if (!frame) {
    await screenshot(page, `${shotName}-no-editor`);
    throw new Error("블로그 글쓰기 화면이 열리지 않았습니다. 이 창에 로그인된 아이디가 이 블로그 주인인지 확인해 주세요.");
  }
  if (blogId && !urlBelongsToBlog([page.url(), frame.url()], blogId)) {
    await screenshot(page, `${shotName}-wrong-blog`);
    throw new WrongBlogError(`이 창은 ${blogId}가 아닌 다른 네이버 아이디로 로그인돼 있어 글을 쓰지 않았습니다.`);
  }
  await clickIfVisible(frame, sel.draftCancel);
  await clickIfVisible(frame, sel.helpClose);

  // 제목
  const title = frame.locator(sel.title).first();
  await title.click();
  await page.keyboard.insertText(post.title);

  // 본문: 사진 자리에 표시 문단을 넣어 한 번에 붙여 넣는다.
  const parts = splitByPhotos(post.blocks);
  const photos = parts.filter((part) => part.type === "photo");
  const html = parts
    .map((part) =>
      part.type === "photo"
        ? `<p>${photoMarker(photos.indexOf(part) + 1)}</p>${part.label ? blocksToHtml([{ type: "text", lines: [part.label] }]) : ""}`
        : blocksToHtml(part.blocks),
    )
    .join("");
  const text = html.replace(/<\/p>/g, "\n").replace(/<br>/g, "").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

  await frame.locator(sel.body).first().click();
  const method = await pasteHtml(page, frame, { html, text });
  await page.waitForTimeout(2_000);
  const written = await documentText(frame, sel);
  if (!written.includes(photoMarker(1))) {
    await screenshot(page, `${shotName}-paste-failed`);
    throw new Error("본문을 붙여 넣지 못했습니다. (blogSelectors.body 확인 필요)");
  }
  if (method !== "clipboard") console.warn(`⚠️  본문을 ${method === "event" ? "붙여넣기 이벤트" : "글자 입력"}로 넣었습니다. 굵은 글씨·링크가 빠졌을 수 있습니다.`);

  for (const [i, photo] of photos.entries()) {
    await replaceMarkerWithPhoto(page, frame, sel, photoMarker(i + 1), photo.path);
  }
  const leftover = (await documentText(frame, sel)).match(/\[\[사진\d+\]\]/);
  if (leftover) throw new Error(`사진 자리 표시(${leftover[0]})가 본문에 남았습니다.`);

  const unlinked = await applyLinks(page, frame, sel, postLinks(post));

  // 발행 창
  await closePopups(page, frame, sel);
  const open = await visibleLast(frame, sel.publishOpen);
  if (!open) throw new Error("'발행' 버튼을 찾지 못했습니다. (blogSelectors.publishOpen 확인 필요)");
  await open.click();
  await page.waitForTimeout(1_500);
  if (category) await chooseCategory(page, frame, sel, category);
  await addTags(page, frame, sel, post.tags);

  if (!submit) {
    await screenshot(page, `${shotName}-check`);
    return { submitted: false, verified: false, postUrl: null, unlinked };
  }

  const confirm = await visibleLast(frame, sel.publishConfirm);
  if (!confirm) throw new Error("최종 '발행' 버튼을 찾지 못했습니다. (blogSelectors.publishConfirm 확인 필요)");
  await confirm.click();

  // 발행되면 글 보기 화면(blog.naver.com/아이디/글번호)으로 넘어간다. 편집기가 iframe 안에 있으면
  // 바깥 주소는 안 바뀌고 iframe 주소에 글번호(logNo)가 붙는다. 글 보기 화면도 편집기와 같은 se- 모양을 써서,
  // 화면 모양이 아니라 글 주소가 생겼는지로 완료를 본다.
  let postUrl = null;
  const deadline = Date.now() + 60_000;
  while (!postUrl && Date.now() < deadline) {
    await page.waitForTimeout(2_000);
    postUrl = findPostUrl([page.url(), ...page.frames().map((f) => f.url())]);
  }
  const left = Boolean(postUrl);
  await page.waitForTimeout(2_000);
  await screenshot(page, shotName);
  // 발행된 글 주소가 다른 블로그면 완료로 치지 않는다.
  if (postUrl && blogId && !urlBelongsToBlog([postUrl], blogId)) {
    return { submitted: true, verified: false, postUrl, unlinked, wrongBlog: true };
  }
  return { submitted: true, verified: left, postUrl, unlinked };
}

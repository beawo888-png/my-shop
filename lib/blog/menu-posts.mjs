/**
 * 네이버 블로그 메뉴 소개 원고집(content/blog/menu-posts.json)으로 오늘 글을 만든다.
 *
 * - 메뉴가 하루에 하나씩 돌아가고, 모란본점은 판교점과 반 바퀴 어긋나서 같은 날 다른 메뉴가 나간다.
 * - 메뉴마다 글감이 두 벌(A·B)이라, 같은 메뉴라도 두 블로그에는 서로 다른 벌이 나간다.
 *   한 바퀴를 돌 때마다 벌을 바꿔서 같은 블로그에 똑같은 글이 연달아 올라가지 않게 한다.
 * - 글은 블록 목록으로 만든다. 블로그 화면에는 HTML로 붙여 넣고, 미리보기는 글자로 보여 준다.
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { BRANCHES, fillPlaceholders, findPlaceholders, KNOWN_PLACEHOLDERS } from "../smartplace/branches.mjs";
import { kstDayIndex } from "../threads/schedule.mjs";
import { BLOG_BRANCHES } from "./branch-info.mjs";

export const MENU_POSTS_URL = new URL("../../content/blog/menu-posts.json", import.meta.url);
export const PHOTO_ROOT = fileURLToPath(new URL("../../public/images/wangjing/", import.meta.url));

export const TITLE_MAX = 40;
export const TAG_MAX = 30;
export const COMMON_TAGS = ["왕징양다리양꼬치", "양꼬치맛집", "양고기맛집"];
/** 사장님 요청으로 모든 글에 꼭 넣는 양다리구이 예약 안내. */
export const LAMB_LEG_NOTICE = "⏰ 양다리구이는 1시간 전에 예약하셔야 기다리지 않고 바로 드실 수 있어요!";
export const MAP_LINK_TEXT = "📍 네이버 지도로 위치 보기";
export const BOOKING_LINK_TEXT = "📅 네이버 예약 바로가기";

const VARIANT_FIELDS = ["titles", "hooks", "tastes", "pairings"];

export async function loadMenuPosts() {
  return JSON.parse(await readFile(MENU_POSTS_URL, "utf8"));
}

export function validateMenuPosts(bank) {
  const problems = [];
  const checkText = (where, text) => {
    for (const key of findPlaceholders(text)) {
      if (!KNOWN_PLACEHOLDERS.includes(key)) problems.push(`${where}: 알 수 없는 자리표시 {${key}}`);
    }
  };
  for (const field of ["greetings", "closings"]) {
    if (!bank[field]?.length) problems.push(`${field}가 비어 있습니다.`);
    bank[field]?.forEach((text, i) => checkText(`${field}[${i}]`, text));
  }
  if (!bank.menus?.length) problems.push("메뉴가 없습니다.");
  const ids = new Set();
  for (const menu of bank.menus ?? []) {
    const where = menu.id ?? "(id 없음)";
    if (!menu.id || ids.has(menu.id)) problems.push(`${where}: id가 없거나 겹칩니다.`);
    ids.add(menu.id);
    for (const key of ["name", "photo", "emoji"]) if (!menu[key]) problems.push(`${where}: ${key}가 없습니다.`);
    if (menu.photo && !existsSync(`${PHOTO_ROOT}${menu.photo}`)) problems.push(`${where}: 사진이 없습니다 (${menu.photo})`);
    if (!menu.tags?.length) problems.push(`${where}: tags가 없습니다.`);
    if (!menu.pairWith?.length) problems.push(`${where}: pairWith가 없습니다.`);
    for (const field of VARIANT_FIELDS) {
      if (menu[field]?.length !== 2) {
        problems.push(`${where}: ${field}는 두 벌(A·B)이어야 합니다.`);
        continue;
      }
      if (menu[field][0] === menu[field][1]) problems.push(`${where}: ${field} 두 벌이 똑같습니다.`);
      menu[field].forEach((text, i) => checkText(`${where}.${field}[${i}]`, text));
    }
    for (const title of menu.titles ?? []) {
      for (const branch of Object.values(BRANCHES)) {
        const filled = fillPlaceholders(title, branch);
        if ([...filled].length > TITLE_MAX) problems.push(`${where}: 제목이 ${TITLE_MAX}자를 넘습니다 (${filled})`);
      }
    }
    // 지점마다 가격이 달라 글에 가격을 넣지 않는다.
    if ("price" in menu || /\d원/.test(JSON.stringify(menu))) problems.push(`${where}: 가격은 넣지 않습니다 (지점마다 다름).`);
    for (const tag of menu.tags ?? []) if (/[#\s]/.test(tag)) problems.push(`${where}: 태그에 # 또는 띄어쓰기가 있습니다 (${tag})`);
  }
  return problems;
}

/** 첫 발행일. 이날 판교점은 원고집 첫 메뉴, 모란본점은 가운데 메뉴부터 나간다. */
export const START_DATE = "2026-11-02";
const START_DAY = kstDayIndex(new Date(`${START_DATE}T10:00:00+09:00`));

/** 같은 날 두 지점이 다른 메뉴를 받도록 모란본점을 반 바퀴 어긋나게 둔다. */
function branchOffset(branchId, menuCount) {
  return branchId === "moran" ? Math.floor(menuCount / 2) : 0;
}

/** 오늘 그 지점에 나갈 메뉴와 글감 벌(0=A, 1=B)을 고른다. */
export function selectMenu({ menus, branchId, date = new Date() }) {
  if (!menus?.length) throw new Error("원고집에 메뉴가 없습니다.");
  const n = menus.length;
  const days = kstDayIndex(date) - START_DAY;
  const k = days + branchOffset(branchId, n);
  const index = ((k % n) + n) % n;
  // 바퀴 수는 날짜로 센다. 어긋난 순번(k)으로 세면 메뉴 절반은 두 블로그가 같은 벌을 받는다.
  const cycle = Math.floor(days / n);
  // 같은 메뉴가 두 블로그에 나갈 때 서로 다른 벌이 되도록 모란본점은 한 칸 밀어 둔다.
  const variant = (((cycle + (branchId === "moran" ? 1 : 0)) % 2) + 2) % 2;
  return { menu: menus[index], variant, cycle };
}

function pick(list, seed) {
  return list[((seed % list.length) + list.length) % list.length];
}

function lines(text) {
  return text.split("\n");
}

/**
 * 오늘 올릴 글을 만든다.
 * 돌려주는 값: { id, menuId, variant, title, blocks, tags, photos }
 *   blocks: { type: "text", lines } | { type: "heading", text } | { type: "photo", path, caption }
 *         | { type: "info", items: [{ label, value }] } | { type: "notice", text }
 *         | { type: "links", items: [{ text, href }] } | { type: "spacer" }
 */
export function renderMenuPost({ bank, branchId, date = new Date() }) {
  const branch = BRANCHES[branchId];
  const info = BLOG_BRANCHES[branchId];
  if (!branch || !info) throw new Error(`알 수 없는 지점: ${branchId}`);
  const { menu, variant } = selectMenu({ menus: bank.menus, branchId, date });
  const fill = (text) => fillPlaceholders(text, branch);
  // 인사·맺음말도 같은 날 두 블로그가 겹치지 않게 모란본점은 두 칸 밀어 둔다.
  const day = kstDayIndex(date) + (branchId === "moran" ? 2 : 0);

  const menuPhoto = `${PHOTO_ROOT}${menu.photo}`;
  const storePhoto = `${PHOTO_ROOT}${info.storefront}`;
  const blocks = [
    { type: "text", lines: lines(fill(pick(bank.greetings, day))) },
    { type: "spacer" },
    { type: "text", lines: lines(fill(menu.hooks[variant])) },
    { type: "photo", path: menuPhoto, caption: `왕징 ${branch.name} ${menu.name}` },
    { type: "heading", text: `${menu.emoji} ${menu.name}, 이런 맛이에요` },
    { type: "text", lines: lines(fill(menu.tastes[variant])) },
    { type: "spacer" },
    { type: "heading", text: "🍽️ 함께 드시면 더 좋아요" },
    { type: "text", lines: lines(fill(menu.pairings[variant])) },
    { type: "spacer" },
    { type: "heading", text: "📋 메뉴 정보" },
    {
      type: "info",
      items: [
        { label: "메뉴", value: menu.name },
        { label: "함께 추천", value: menu.pairWith.join(", ") },
      ],
    },
    { type: "spacer" },
    { type: "heading", text: `📍 ${branch.name} 안내` },
    {
      type: "info",
      items: [
        { label: "상호", value: info.fullName },
        { label: "주소", value: info.address },
        { label: "오시는 길", value: info.transit },
        { label: "주차", value: info.parking },
        { label: "단체석", value: info.groupSeats },
        { label: "전화", value: branch.phone },
      ],
    },
    { type: "spacer" },
    { type: "notice", text: LAMB_LEG_NOTICE },
    {
      type: "links",
      items: [
        { text: BOOKING_LINK_TEXT, href: info.bookingUrl },
        { text: MAP_LINK_TEXT, href: info.mapUrl },
      ],
    },
    { type: "photo", path: storePhoto, caption: `왕징양다리양꼬치 ${branch.name}` },
    { type: "text", lines: lines(fill(pick(bank.closings, day))) },
  ];

  const tags = [...new Set([...info.tags, ...menu.tags, ...COMMON_TAGS])].slice(0, TAG_MAX);
  return {
    id: `${menu.id}-${"AB"[variant]}`,
    menuId: menu.id,
    variant,
    title: fill(menu.titles[variant]),
    blocks,
    tags,
    photos: [menuPhoto, storePhoto],
  };
}

/** 미리보기·점검용 글자 버전. 사진 자리는 [사진: ...]으로 보인다. */
export function toPlainText(post) {
  const out = [];
  for (const block of post.blocks) {
    if (block.type === "text") out.push(...block.lines);
    else if (block.type === "heading") out.push("", block.text);
    else if (block.type === "photo") out.push(`[사진: ${block.caption}]`);
    else if (block.type === "info") out.push(...block.items.map((item) => `- ${item.label}: ${item.value}`));
    else if (block.type === "notice") out.push(block.text);
    else if (block.type === "links") out.push(...block.items.map((item) => `${item.text} → ${item.href}`));
    else if (block.type === "spacer") out.push("");
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 블로그 편집기에 붙여 넣을 HTML. 사진 블록은 빼고, 사진 사이의 글 덩어리 하나만 만든다. */
export function blocksToHtml(blocks) {
  const html = [];
  for (const block of blocks) {
    if (block.type === "text") {
      for (const line of block.lines) html.push(line ? `<p>${escapeHtml(line)}</p>` : "<p><br></p>");
    } else if (block.type === "heading") {
      html.push(`<p><b>${escapeHtml(block.text)}</b></p>`);
    } else if (block.type === "info") {
      for (const item of block.items) html.push(`<p>✔ <b>${escapeHtml(item.label)}</b> : ${escapeHtml(item.value)}</p>`);
    } else if (block.type === "notice") {
      html.push(`<p><b>${escapeHtml(block.text)}</b></p>`);
    } else if (block.type === "links") {
      // 편집기가 붙여넣기에서 링크를 빼 버려도, 발행 전에 이 글자에 링크를 다시 건다(editor.mjs).
      for (const item of block.items) html.push(`<p><b><a href="${escapeHtml(item.href)}">${escapeHtml(item.text)}</a></b></p>`);
    } else if (block.type === "spacer") {
      html.push("<p><br></p>");
    }
  }
  return html.join("");
}

/** 링크를 걸어야 할 글자와 주소 목록. */
export function postLinks(post) {
  return post.blocks.filter((block) => block.type === "links").flatMap((block) => block.items);
}

/** 블록을 사진 기준으로 나눈다: [글, 사진, 글, 사진, 글] 순서의 조각 목록. */
export function splitByPhotos(blocks) {
  const parts = [];
  let current = [];
  for (const block of blocks) {
    if (block.type === "photo") {
      if (current.length) parts.push({ type: "html", blocks: current });
      parts.push(block);
      current = [];
    } else {
      current.push(block);
    }
  }
  if (current.length) parts.push({ type: "html", blocks: current });
  return parts;
}

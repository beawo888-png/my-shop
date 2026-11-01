/**
 * 네이버 블로그 '모임 키워드' 글(연말모임·회식·단체모임·청첩장모임·가족모임 등)을 만든다.
 * 원고집: content/blog/gathering-posts.json
 *
 * - 매일 지점마다 2편(slot 0·1)씩 나간다. 같은 날 같은 블로그의 두 편, 같은 날 두 블로그는 서로 다른 테마다.
 * - 테마가 몇 번째로 나오는지(k)에 따라 검색어·제목 꼬리·도입·이유·팁을 다르게 엮어서
 *   한 블로그 안에서 같은 제목이 다시 나오지 않게 한다.
 * - 사진은 사장님 PC의 지점별 사진 폴더(판교블로그이미지·모란블로그이미지)에서 돌아가며 쓰고,
 *   그 안의 AI연출/<테마id>/ 폴더에 있는 단체 모임 연출 사진을 한 장 넣는다(아래에 'AI 연출 이미지' 표시).
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BRANCH_IDS, BRANCHES, fillPlaceholders, findPlaceholders, KNOWN_PLACEHOLDERS } from "../smartplace/branches.mjs";
import { kstDateKey, kstDayIndex } from "../threads/schedule.mjs";
import { BLOG_BRANCHES } from "./branch-info.mjs";
import { BOOKING_LINK_TEXT, COMMON_TAGS, LAMB_LEG_NOTICE, MAP_LINK_TEXT, PHOTO_ROOT, TAG_MAX, toPlainText } from "./menu-posts.mjs";

export const GATHERING_POSTS_URL = new URL("../../content/blog/gathering-posts.json", import.meta.url);
export const REPO_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const SLOTS = [0, 1];
/** 지점마다 하루 두 편: 18:00에 첫 편, 18:30에 둘째 편. 한꺼번에 두 편이 올라가면 기계가 쓴 티가 나서 30분 띄운다. */
export const SLOT_TIMES = ["18:00", "18:30"];
export const TITLE_MAX = 45;
/** 글자 수(띄어쓰기 포함). 사장님 요청: 2000자 정도. */
export const LENGTH_MIN = 1800;
export const LENGTH_MAX = 3200;
export const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
/** 사장님 PC의 지점별 사진 폴더 이름. 프로젝트 폴더 안(또는 바로 바깥)에 둔다. */
export const PHOTO_FOLDER_NAMES = { pangyo: "판교블로그이미지", moran: "모란블로그이미지" };
export const AI_FOLDER = "AI연출";
/** 사진 폴더가 없을 때 쓰는 홈페이지 사진. 모란본점에는 모란본점 사진만 쓴다. */
const FALLBACK_PHOTOS = { pangyo: ["pangyo-group-dining.jpg"], moran: ["moran-group-dining.jpg"] };

export async function loadGatheringPosts() {
  return JSON.parse(await readFile(GATHERING_POSTS_URL, "utf8"));
}

function md(date) {
  return kstDateKey(date).slice(5);
}

function inSeason(theme, date) {
  const today = md(date);
  if (theme.from && today < theme.from) return false;
  if (theme.until && today > theme.until) return false;
  return true;
}

/** 그날 그 지점에서 돌릴 테마 목록. weight 2인 테마는 목록 가운데에 한 번 더 넣어 자주 나오게 한다. */
export function eligibleThemes(bank, branchId, date) {
  const list = bank.themes.filter((theme) => (!theme.branches || theme.branches.includes(branchId)) && inSeason(theme, date));
  const out = [...list];
  for (const theme of list) {
    for (let w = 1; w < (theme.weight ?? 1); w += 1) out.splice(Math.floor(out.length / 2), 0, theme);
  }
  return out;
}

const at18 = (dateKey) => new Date(`${dateKey}T18:00:00+09:00`);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 첫날부터 그날까지 지점별 일정을 차례로 정한다.
 * 돌려주는 값: { [dateKey]: { [branchId]: [{ theme, k, p }, { theme, k, p }] } }
 *   k: 그 블로그에서 이 테마가 몇 번째로 나오는지(0부터), p: 첫날부터 센 글 순번
 */
export function buildSchedule(bank, untilDate) {
  const start = kstDayIndex(at18(bank.startDate));
  const last = Math.min(kstDayIndex(untilDate), kstDayIndex(at18(bank.endDate)));
  const counts = Object.fromEntries(BRANCH_IDS.map((id) => [id, {}]));
  const schedule = {};
  for (let day = start; day <= last; day += 1) {
    const date = new Date(at18(bank.startDate).getTime() + (day - start) * DAY_MS);
    const key = kstDateKey(date);
    const takenToday = new Set();
    schedule[key] = {};
    for (const [b, branchId] of BRANCH_IDS.entries()) {
      const list = eligibleThemes(bank, branchId, date);
      if (!list.length) throw new Error(`${key} ${branchId}: 쓸 수 있는 테마가 없습니다.`);
      const mine = new Set();
      schedule[key][branchId] = SLOTS.map((slot) => {
        const p = (day - start) * SLOTS.length + slot;
        const offset = b * Math.floor(list.length / 2);
        // 같은 블로그 두 편은 반드시 다르게, 두 블로그끼리도 가능하면 다르게 고른다.
        let chosen;
        for (const avoidOther of [true, false]) {
          for (let step = 0; step < list.length && !chosen; step += 1) {
            const theme = list[(p + offset + step) % list.length];
            if (mine.has(theme.id) || (avoidOther && takenToday.has(theme.id))) continue;
            chosen = theme;
          }
          if (chosen) break;
        }
        if (!chosen) throw new Error(`${key} ${branchId}: 두 편에 서로 다른 테마를 고르지 못했습니다.`);
        mine.add(chosen.id);
        const k = counts[branchId][chosen.id] ?? 0;
        counts[branchId][chosen.id] = k + 1;
        return { theme: chosen, k, p };
      });
      for (const id of mine) takenToday.add(id);
    }
  }
  return schedule;
}

/** 그날 그 지점의 slot번째 글 정보. 발행 기간 밖이면 null. */
export function selectGathering({ bank, branchId, slot, date = new Date() }) {
  const key = kstDateKey(date);
  if (key < bank.startDate || key > bank.endDate) return null;
  return buildSchedule(bank, date)[key]?.[branchId]?.[slot] ?? null;
}

function pick(list, n) {
  return list[((n % list.length) + list.length) % list.length];
}

function lines(text) {
  return text.split("\n");
}

function listPhotos(dir) {
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => PHOTO_EXTENSIONS.includes(path.extname(name).toLowerCase()))
    .map((name) => path.join(dir, name))
    .filter((file) => statSync(file).isFile())
    .sort((a, b) => a.localeCompare(b, "ko"));
}

/** 지점 사진 폴더 위치: config.blogPhotoDirs.<지점> → 프로젝트 폴더 안 → 프로젝트 폴더 바로 바깥. */
export function photoDirFor(branchId, config = {}) {
  const configured = config.blogPhotoDirs?.[branchId];
  if (configured) return configured;
  const name = PHOTO_FOLDER_NAMES[branchId];
  const candidates = [path.join(REPO_ROOT, name), path.join(REPO_ROOT, "..", name)];
  return candidates.find((dir) => existsSync(dir)) ?? candidates[0];
}

/**
 * 글에 넣을 사진 목록을 읽는다(사장님 PC 폴더).
 * 돌려주는 값: { dir, real: [실제 사진], ai: { [테마id]: [AI 연출 사진] }, fallback: 폴더가 비어 홈페이지 사진을 쓰는지 }
 */
export function loadPhotoPools(branchId, config = {}) {
  const dir = photoDirFor(branchId, config);
  const real = listPhotos(dir);
  const aiRoot = path.join(dir, AI_FOLDER);
  const ai = {};
  if (existsSync(aiRoot)) {
    for (const name of readdirSync(aiRoot)) {
      const sub = path.join(aiRoot, name);
      if (statSync(sub).isDirectory()) ai[name] = listPhotos(sub);
    }
    ai["공통"] = [...(ai["공통"] ?? []), ...listPhotos(aiRoot)];
  }
  const fallback = real.length === 0;
  return { dir, real: fallback ? FALLBACK_PHOTOS[branchId].map((f) => `${PHOTO_ROOT}${f}`) : real, ai, fallback };
}

/**
 * 글 한 편을 만든다. 블록 구조는 메뉴 글(menu-posts.mjs)과 같아서 같은 편집기 코드로 올린다.
 * 돌려주는 값: { id, themeId, slot, title, blocks, tags, photos, aiPhoto }
 */
export function renderGatheringPost({ bank, branchId, slot, date = new Date(), photos }) {
  const branch = BRANCHES[branchId];
  const info = BLOG_BRANCHES[branchId];
  if (!branch || !info) throw new Error(`알 수 없는 지점: ${branchId}`);
  const picked = selectGathering({ bank, branchId, slot, date });
  if (!picked) return null;
  const { theme, k, p } = picked;
  const b = BRANCH_IDS.indexOf(branchId);
  const fill = (text) => fillPlaceholders(text, branch);
  const pools = photos ?? { real: FALLBACK_PHOTOS[branchId].map((f) => `${PHOTO_ROOT}${f}`), ai: {} };

  // 테마 안의 글감은 k로 돌린다. 모듈로가 서로소(5·6)라 30번까지 제목이 겹치지 않는다.
  const keyword = fill(pick(theme.keywords, k));
  const tail = fill(pick(theme.tails, k));
  const title = `${keyword}, ${tail}`;
  const hook = pick(theme.hooks, k + b);
  const why = pick(theme.whys, Math.floor(k / 3) + k + b);
  const tip = pick(theme.tips, k + 2 * b + 1);
  const course = pick(bank.courses, p + b);
  const space = pick(bank.spaces[branchId], p);
  const booking = pick(bank.bookingTips, p + 2 * b);
  const faq = pick(bank.faqs, p + 3 * b + 1);

  const realPhotos = [...new Set([pick(pools.real, p * 2), pick(pools.real, p * 2 + 1)])];
  const aiList = pools.ai?.[theme.id]?.length ? pools.ai[theme.id] : pools.ai?.["공통"] ?? [];
  const aiPhoto = aiList.length ? pick(aiList, k) : null;
  const menuPhoto = `${PHOTO_ROOT}menu/${course.photo}`;
  const storePhoto = `${PHOTO_ROOT}${info.storefront}`;

  const blocks = [
    { type: "text", lines: lines(fill(pick(bank.greetings, p + 2 * b))) },
    { type: "spacer" },
    { type: "text", lines: lines(fill(hook)) },
    { type: "photo", path: realPhotos[0], caption: `왕징 ${branch.name}` },
    { type: "spacer" },
    { type: "text", lines: lines(fill(why)) },
  ];
  if (aiPhoto) {
    blocks.push({ type: "photo", path: aiPhoto, caption: `왕징 ${branch.name} ${theme.name}`, ai: true });
    blocks.push({ type: "text", lines: [bank.aiCaption] });
  }
  blocks.push(
    { type: "spacer" },
    { type: "heading", text: `🏮 왕징 ${branch.name}은 이런 곳이에요` },
    { type: "text", lines: lines(fill(space)) },
  );
  if (realPhotos[1]) blocks.push({ type: "photo", path: realPhotos[1], caption: `왕징 ${branch.name} 매장` });
  blocks.push(
    { type: "spacer" },
    { type: "heading", text: "🍽️ 모임 메뉴, 이렇게 고르세요" },
    { type: "text", lines: lines(fill(course.text)) },
    { type: "photo", path: menuPhoto, caption: "왕징양다리양꼬치 메뉴" },
    { type: "spacer" },
    { type: "text", lines: lines(fill(tip)) },
    { type: "spacer" },
    { type: "text", lines: lines(fill(booking)) },
    { type: "spacer" },
    { type: "text", lines: lines(fill(faq)) },
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
    { type: "text", lines: lines(fill(pick(bank.closings, p + 3 + b))) },
  );

  const tags = [...new Set([...theme.tags.map((t) => (t.startsWith(branch.area) ? t : `${branch.area}${t}`)), ...theme.tags, ...info.tags, ...COMMON_TAGS])].slice(0, TAG_MAX);
  return {
    id: `${theme.id}-${k}`,
    themeId: theme.id,
    slot,
    title,
    blocks,
    tags,
    photos: blocks.filter((block) => block.type === "photo").map((block) => block.path),
    aiPhoto,
  };
}

export function postLength(post) {
  return [...toPlainText(post).replace(/\[사진: [^\]]*\]\n?/g, "")].length;
}

export function validateGatheringPosts(bank) {
  const problems = [];
  const checkText = (where, text) => {
    for (const key of findPlaceholders(text)) {
      if (!KNOWN_PLACEHOLDERS.includes(key)) problems.push(`${where}: 알 수 없는 자리표시 {${key}}`);
    }
    if (/\d{1,3},\d{3}원|\d+원/.test(text)) problems.push(`${where}: 가격은 넣지 않습니다 (지점마다 다름).`);
  };
  for (const field of ["greetings", "closings", "bookingTips", "faqs"]) {
    if (!bank[field]?.length) problems.push(`${field}가 비어 있습니다.`);
    bank[field]?.forEach((text, i) => checkText(`${field}[${i}]`, text));
  }
  for (const branchId of BRANCH_IDS) {
    if (!bank.spaces?.[branchId]?.length) problems.push(`spaces.${branchId}가 비어 있습니다.`);
    bank.spaces?.[branchId]?.forEach((text, i) => checkText(`spaces.${branchId}[${i}]`, text));
  }
  for (const [i, course] of (bank.courses ?? []).entries()) {
    checkText(`courses[${i}]`, course.text);
    if (!existsSync(`${PHOTO_ROOT}menu/${course.photo}`)) problems.push(`courses[${i}]: 사진이 없습니다 (${course.photo})`);
  }
  const ids = new Set();
  for (const theme of bank.themes ?? []) {
    const where = theme.id ?? "(id 없음)";
    if (!theme.id || ids.has(theme.id)) problems.push(`${where}: id가 없거나 겹칩니다.`);
    ids.add(theme.id);
    for (const key of ["name", "emoji", "aiPrompt"]) if (!theme[key]) problems.push(`${where}: ${key}가 없습니다.`);
    for (const [field, size] of [["keywords", 5], ["tails", 6], ["hooks", 3], ["whys", 3], ["tips", 3]]) {
      if (theme[field]?.length !== size) problems.push(`${where}: ${field}는 ${size}개여야 합니다.`);
      if (new Set(theme[field]).size !== theme[field]?.length) problems.push(`${where}: ${field}에 똑같은 글이 있습니다.`);
      theme[field]?.forEach((text, i) => checkText(`${where}.${field}[${i}]`, text));
    }
    for (const tag of theme.tags ?? []) if (/[#\s]/.test(tag)) problems.push(`${where}: 태그에 # 또는 띄어쓰기가 있습니다 (${tag})`);
  }
  return problems;
}

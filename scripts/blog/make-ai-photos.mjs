#!/usr/bin/env node
/**
 * 모임 글에 넣을 'AI 연출 사진'을 만든다. 우리 매장 내부 사진을 참고 사진으로 넣고,
 * 같은 매장에서 손님들이 모임(송년회·회식·청첩장 모임·가족모임 등)을 하는 장면을 그리게 한다.
 * 결과는 지점 사진 폴더의 AI연출/<테마id>/에 저장된다. 사장님이 보고 어색한 사진은 지우면, 남은 사진만 글에 들어간다.
 *
 * 준비: OpenAI API 키를 환경 변수 OPENAI_API_KEY에 넣는다(키는 깃에도 설정 파일에도 저장하지 않는다).
 *   PowerShell:  setx OPENAI_API_KEY "sk-..."   (창을 새로 열어야 적용)
 *
 * 사용법
 *   npm run moim:ai-photos                              # 두 지점, 모든 테마, 테마마다 2장
 *   npm run moim:ai-photos -- --branch=moran --theme=wedding --count=3
 *   npm run moim:ai-photos -- --dry-run                 # 그림은 만들지 않고 요청 내용만 보기
 *
 * 참고 사진: 홈페이지의 지점 내부 사진(public/images/wangjing/<지점>-group-dining.jpg)에
 *   지점 사진 폴더의 AI연출/참고/ 안 사진(최대 3장)을 더한다. 매장 내부가 잘 보이는 사진을 넣어 두면 더 비슷해진다.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AI_FOLDER, loadGatheringPosts, photoDirFor, PHOTO_EXTENSIONS } from "../../lib/blog/gathering-posts.mjs";
import { PHOTO_ROOT } from "../../lib/blog/menu-posts.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { readConfig } from "../../lib/smartplace/local-store.mjs";

const INTERIORS = {
  pangyo:
    "dark charcoal walls and ceiling, a long black leather tufted banquette bench along the wall, black marble-pattern tables each with a built-in stainless charcoal grill and skewer rack, black chairs on the aisle side, red Chinese lanterns with tassels and warm Edison pendant lamps, a large backlit menu board on the wall, beige floor tiles",
  moran:
    "two long rows of warm wood-grain tables each with a built-in charcoal grill and a shiny silver exhaust duct hanging from the ceiling above it, black leather banquette benches along both walls, black chairs on the aisle side, a row of red Chinese lanterns down the middle, menu posters on the walls, glass front doors with green plants at the far end, beige floor tiles",
};

function parseArgs(argv) {
  const args = { branches: BRANCH_IDS, themes: undefined, count: 2, dryRun: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
    else if (arg.startsWith("--theme=")) args.themes = arg.slice(8).split(",");
    else if (arg.startsWith("--count=")) args.count = Number(arg.slice(8));
    else throw new Error(`알 수 없는 옵션: ${arg}`);
  }
  for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);
  if (!Number.isInteger(args.count) || args.count < 1 || args.count > 10) throw new Error("--count는 1~10입니다.");
  return args;
}

function buildPrompt(branchId, theme) {
  return [
    "Edit the reference photo(s) of our real restaurant: a Korean charcoal lamb skewer restaurant.",
    `Keep the SAME interior exactly: ${INTERIORS[branchId]}. Keep the same camera angle, layout, furniture, colors and lighting as the reference.`,
    `Fill the seats with customers: ${theme.aiPrompt}.`,
    "Photorealistic candid photo, like a real evening shot with a good camera, warm cozy lighting, glowing charcoal, lamb skewers sizzling on the table grills, plates of food and drinks on the tables.",
    "Natural relaxed poses, realistic hands and faces, people look East Asian (Korean) unless described otherwise, all drinking people are adults.",
    "No added text, captions, logos, watermarks or signs. Do not change the existing menu board. No celebrities.",
  ].join(" ");
}

async function referencePhotos(branchId, dir) {
  const files = [`${PHOTO_ROOT}${branchId}-group-dining.jpg`];
  const extra = path.join(dir, AI_FOLDER, "참고");
  if (existsSync(extra)) {
    const names = (await readdir(extra)).filter((n) => PHOTO_EXTENSIONS.includes(path.extname(n).toLowerCase())).sort();
    files.push(...names.slice(0, 3).map((n) => path.join(extra, n)));
  }
  return files;
}

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

async function generate({ apiKey, model, prompt, refs }) {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", "1536x1024");
  form.append("quality", "high");
  form.append("n", "1");
  if (model.startsWith("gpt-image-1")) form.append("input_fidelity", "high");
  for (const file of refs) {
    const type = MIME[path.extname(file).toLowerCase()] ?? "image/jpeg";
    form.append("image[]", new Blob([await readFile(file)], { type }), path.basename(file));
  }
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`이미지 생성 실패 (${response.status}): ${body.error?.message ?? JSON.stringify(body).slice(0, 300)}`);
  const b64 = body.data?.[0]?.b64_json;
  if (!b64) throw new Error("이미지 생성 결과가 비어 있습니다.");
  return Buffer.from(b64, "base64");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readConfig();
  const bank = await loadGatheringPosts();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!args.dryRun && !apiKey) {
    throw new Error("OPENAI_API_KEY가 없습니다. PowerShell에서 setx OPENAI_API_KEY \"sk-...\" 를 실행하고 창을 새로 열어 주세요.");
  }
  const model = config.aiImageModel ?? "gpt-image-1";

  let made = 0;
  for (const branchId of args.branches) {
    const dir = photoDirFor(branchId, config);
    const refs = await referencePhotos(branchId, dir);
    const themes = bank.themes.filter(
      (t) => (!t.branches || t.branches.includes(branchId)) && (!args.themes || args.themes.includes(t.id)),
    );
    for (const theme of themes) {
      const out = path.join(dir, AI_FOLDER, theme.id);
      const prompt = buildPrompt(branchId, theme);
      console.log(`\n── ${BRANCHES[branchId].name} · ${theme.name} → ${out}`);
      console.log(`참고 사진: ${refs.join(", ")}`);
      if (args.dryRun) {
        console.log(prompt);
        continue;
      }
      await mkdir(out, { recursive: true });
      for (let i = 0; i < args.count; i += 1) {
        const image = await generate({ apiKey, model, prompt, refs });
        const file = path.join(out, `${theme.id}-${new Date().toISOString().replace(/[:.]/g, "-")}-${i + 1}.png`);
        await writeFile(file, image);
        made += 1;
        console.log(`  ✅ ${file}`);
      }
    }
  }
  if (!args.dryRun) {
    console.log(`\n${made}장을 만들었습니다. 폴더를 열어 보고 어색한 사진(손·얼굴·글자가 이상한 것, 매장과 다른 것)은 지워 주세요.`);
    console.log("남은 사진만 블로그 글에 들어가고, 사진 아래에 'AI 연출 이미지' 표시가 붙습니다.");
  }
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exitCode = 1;
});

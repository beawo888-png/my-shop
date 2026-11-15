#!/usr/bin/env node
/**
 * 키워드 끄기 2주 시험. 세 단계로 나눠서, 사장님이 엑셀로 확인한 것만 끈다.
 *
 *   1) npm run ads:pause            끌 목록 만들기(아무것도 안 바꿈) → 바탕화면 `왕징 끌 키워드 확인.xlsx`
 *                                   끄고 싶지 않은 줄은 엑셀에서 지우고 저장한다.
 *   2) npm run ads:pause-apply      엑셀에 남은 줄만 끈다. 끈 것은 .smartplace/paused-keywords.json에 기록.
 *   3) npm run ads:pause-restore    이 프로그램이 끈 키워드를 모두 다시 켠다(언제든).
 *
 * 옵션: --branch=pangyo|moran, --list=data/searchad/pause-2026-11-recipe.json
 * 라이브애드 캠페인(이름에 '프로그램')은 절대 건드리지 않는다.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, readSearchadKeys } from "../../lib/searchad/client.mjs";
import { listAccount, openBatches, planPause, readPauseLog, setUserLock, writePauseLog } from "../../lib/searchad/pause.mjs";
import { desktopDir } from "../../lib/smartplace/bookings.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { LOCAL_DIR } from "../../lib/smartplace/local-store.mjs";

const args = process.argv.slice(2);
const arg = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const mode = args.includes("--restore") ? "restore" : args.includes("--apply") ? "apply" : "plan";
const listPath = arg("list") ?? "data/searchad/pause-2026-11-recipe.json";
const targets = arg("branch") ? arg("branch").split(",") : BRANCH_IDS;
for (const id of targets) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const REVIEW_FILE = path.join(desktopDir(), "왕징 끌 키워드 확인.xlsx");
const PLAN_FILE = `${LOCAL_DIR}pause-plan.json`;
const short = (id) => BRANCHES[id].name.replace(/(본)?점$/, "");
const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

const keys = await readSearchadKeys();
const clientFor = (id, write = false) => {
  if (!keys[id]) throw new Error(`${BRANCHES[id].name}: 검색광고 API 키가 없습니다. 'npm run ads:setup -- --branch=${id}'`);
  return createClient(keys[id], { allowWrite: write });
};

if (mode === "plan") {
  const list = JSON.parse(await readFile(listPath, "utf8"));
  console.log(`목록: ${list.name}`);
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const guide = book.addWorksheet("읽어 주세요");
  guide.columns = [{ width: 100 }];
  for (const line of [
    "왕징 끌 키워드 확인 (아직 아무것도 바꾸지 않았습니다)",
    "",
    "1. 지점별 '끌 키워드' 시트를 보시고, 끄고 싶지 않은 줄은 줄 전체를 삭제한 뒤 저장해 주세요.",
    "   '우리 메뉴' 칸이 '예'인 것은 우리 가게 메뉴 이름이라 따로 표시했습니다. 동네 이름 없이 전국에서 검색되어 대부분 레시피 검색입니다.",
    "2. 엑셀을 닫고 'npm run ads:pause-apply'를 실행하면 남은 줄만 끕니다.",
    "3. 언제든 'npm run ads:pause-restore'로 이 프로그램이 끈 키워드를 모두 다시 켤 수 있습니다.",
    "",
    "'끄기'는 네이버 '사용자 중지'입니다. 키워드·입찰가는 그대로 남아 다시 켜면 원래대로 돌아옵니다.",
    "라이브애드 캠페인(이름에 '프로그램')은 건드리지 않습니다.",
    "",
    `왜: ${list.why}`,
  ]) guide.addRow([line]);
  guide.getRow(1).font = { bold: true, size: 13 };

  const plan = { createdOn: today, list: list.name, branches: {} };
  for (const id of targets) {
    const wanted = list.branches[id] ?? [];
    if (!wanted.length) continue;
    console.log(`\n━━━━━ ${BRANCHES[id].name} ━━━━━`);
    const account = await listAccount(clientFor(id), { onProgress: (t) => console.log(`  읽음: ${t}`) });
    const result = planPause(account, wanted);
    plan.branches[id] = result.toPause;
    const info = new Map(wanted.map((w) => [w.keyword.replace(/\s+/g, "").toUpperCase(), w]));
    const sheet = book.addWorksheet(`${short(id)} 끌 키워드`, { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = [
      { header: "키워드", key: "keyword", width: 20 },
      { header: "30일 광고비(원, 단어 합계)", key: "cost", width: 20 },
      { header: "30일 클릭(단어 합계)", key: "clicks", width: 16 },
      { header: "우리 메뉴", key: "menu", width: 10 },
      { header: "광고 종류", key: "type", width: 11 },
      { header: "캠페인", key: "campaign", width: 26 },
      { header: "광고그룹", key: "adgroup", width: 26 },
      { header: "키워드 ID (지우지 마세요)", key: "id", width: 26 },
    ];
    sheet.getRow(1).font = { bold: true };
    for (const item of result.toPause) {
      const w = info.get(item.keyword.replace(/\s+/g, "").toUpperCase()) ?? {};
      sheet.addRow({ keyword: item.keyword, cost: w.cost30 ?? "", clicks: w.clicks30 ?? "", menu: w.ourMenu ? "예" : "", type: item.campaignType, campaign: item.campaign, adgroup: item.adgroup, id: item.nccKeywordId });
    }
    const etc = book.addWorksheet(`${short(id)} 참고`);
    etc.columns = [{ header: "구분", key: "kind", width: 30 }, { header: "키워드", key: "keyword", width: 20 }, { header: "캠페인", key: "campaign", width: 30 }];
    etc.getRow(1).font = { bold: true };
    for (const i of result.liveAd) etc.addRow({ kind: "라이브애드 캠페인이라 건드리지 않음", keyword: i.keyword, campaign: i.campaign });
    for (const i of result.alreadyOff) etc.addRow({ kind: "이미 꺼져 있음", keyword: i.keyword, campaign: i.campaign });
    for (const k of result.notFound) etc.addRow({ kind: "계정에서 찾지 못함", keyword: k });
    const words = new Set(result.toPause.map((i) => i.keyword));
    console.log(`  끌 키워드: ${words.size}개 단어, ${result.toPause.length}곳 (라이브애드라 건너뜀 ${result.liveAd.length}, 이미 꺼짐 ${result.alreadyOff.length}, 못 찾음 ${result.notFound.length})`);
  }
  await writeFile(PLAN_FILE, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  await book.xlsx.writeFile(REVIEW_FILE);
  console.log(`\n✅ 확인용 엑셀: ${REVIEW_FILE}`);
  console.log("   끄고 싶지 않은 줄은 지우고 저장한 뒤 'npm run ads:pause-apply'를 실행하세요. (아직 아무것도 바꾸지 않았습니다)");
}

if (mode === "apply") {
  const plan = JSON.parse(await readFile(PLAN_FILE, "utf8").catch(() => "null"));
  if (!plan) throw new Error("먼저 'npm run ads:pause'로 끌 목록을 만들어 주세요.");
  const ageDays = (Date.parse(today) - Date.parse(plan.createdOn)) / 86_400_000;
  if (ageDays > 3) throw new Error(`끌 목록이 ${plan.createdOn}에 만든 것이라 오래됐습니다. 'npm run ads:pause'로 다시 만들어 주세요.`);
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile(REVIEW_FILE);
  const log = await readPauseLog();
  for (const id of targets) {
    const planned = plan.branches[id] ?? [];
    const sheet = book.getWorksheet(`${short(id)} 끌 키워드`);
    if (!planned.length || !sheet) continue;
    // 사장님이 엑셀에 남겨 둔 줄만 (지운 줄은 끄지 않는다)
    const kept = new Set();
    sheet.eachRow((row, i) => {
      if (i > 1) kept.add(String(row.getCell(8).value ?? ""));
    });
    const items = planned.filter((p) => kept.has(p.nccKeywordId));
    if (!items.length) {
      console.log(`${BRANCHES[id].name}: 끌 키워드가 없습니다.`);
      continue;
    }
    console.log(`${BRANCHES[id].name}: ${items.length}곳을 끕니다 (엑셀에서 뺀 ${planned.length - items.length}곳 제외)`);
    const batch = { id: `${today}-${id}`, branch: id, list: plan.list, pausedAt: new Date().toISOString(), items: [] };
    log.batches.push(batch);
    try {
      await setUserLock(clientFor(id, true), items, true, {
        onProgress: (t) => console.log(`  끔: ${t}`),
      });
      batch.items = items;
    } finally {
      // 중간에 멈춰도 '끄려고 한 것'을 남겨 둔다. 되돌리기는 이미 켜진 것을 다시 켜도 문제없다.
      if (!batch.items.length) batch.items = items;
      await writePauseLog(log);
    }
    console.log(`  ✅ ${BRANCHES[id].name} 끄기 완료. 되돌리기: npm run ads:pause-restore -- --branch=${id}`);
  }
}

if (mode === "restore") {
  const log = await readPauseLog();
  for (const id of targets) {
    const batches = openBatches(log, id);
    if (!batches.length) {
      console.log(`${BRANCHES[id].name}: 되돌릴 기록이 없습니다.`);
      continue;
    }
    const items = batches.flatMap((b) => b.items);
    console.log(`${BRANCHES[id].name}: 이 프로그램이 끈 ${items.length}곳을 다시 켭니다.`);
    await setUserLock(clientFor(id, true), items, false, { onProgress: (t) => console.log(`  켬: ${t}`) });
    for (const b of batches) b.restoredAt = new Date().toISOString();
    await writePauseLog(log);
    console.log(`  ✅ ${BRANCHES[id].name} 다시 켜기 완료`);
  }
}

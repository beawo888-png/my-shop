#!/usr/bin/env node
/**
 * 라이브애드 감시. 매일 아침 작업 스케줄러가 실행한다(`npm run ads:watch-schedule`로 등록).
 * 어제 라이브애드 캠페인의 클릭·노출·순위를 지난 28일 평소와 비교해, 이상하면 카카오톡 '나에게 보내기'로 알린다.
 * 정상이면 조용히 끝나고, 월요일에만 "이번 주도 정상 감시 중" 한 통을 보낸다(감시가 살아 있다는 확인).
 *
 *   npm run ads:watch           실제 실행 (이상하면 카톡)
 *   npm run ads:watch-test      카톡은 안 보내고 화면에 결과와 보낼 메시지만 보여 줌
 *   옵션: --date=2026-08-20 (그날을 '어제'로 보고 점검), --always (정상이어도 카톡)
 */

import { appendFile, mkdir, readFile } from "node:fs/promises";

import { createClient, readSearchadKeys } from "../../lib/searchad/client.mjs";
import { lastDays } from "../../lib/searchad/keywords.mjs";
import { formatWatchMessage, watchBranch } from "../../lib/searchad/watch.mjs";
import { weekday } from "../../lib/searchad/history.mjs";
import { sendKakaoMemo } from "../../lib/notify/kakao.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { LOCAL_DIR } from "../../lib/smartplace/local-store.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const always = args.includes("--always");
const dateArg = args.find((a) => a.startsWith("--date="))?.slice(7);
if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) throw new Error("--date=YYYY-MM-DD 로 써 주세요.");
const yesterday = dateArg ?? lastDays(1).until;
const LOG = `${LOCAL_DIR}livead-watch.jsonl`;

const keys = await readSearchadKeys();
const branches = [];
for (const branchId of BRANCH_IDS) {
  const name = BRANCHES[branchId].name;
  if (!keys[branchId]) {
    branches.push({ name, error: "검색광고 API 키 없음 (npm run ads:setup)" });
    continue;
  }
  try {
    const result = await watchBranch(createClient(keys[branchId]), yesterday);
    branches.push({ name, result });
    const detail = result.reasons.length ? result.reasons.join(", ") : `클릭 ${result.clicks ?? "-"}, 평소 ${result.base ? Math.round(result.base.clicks) : "-"}`;
    console.log(`${name} ${yesterday}: ${result.status} - ${detail}`);
  } catch (error) {
    branches.push({ name, error: error.message });
    console.log(`${name}: 점검 실패 - ${error.message}`);
  }
}

// 같은 날 두 번 실행돼도 같은 내용을 두 번 보내지 않는다.
const today = lastDays(0).since; // 한국 날짜로 오늘
const heartbeat = always || weekday(today) === "월";
const message = formatWatchMessage(branches, { date: yesterday, heartbeat });
const sentBefore = await readFile(LOG, "utf8").then(
  (raw) => raw.split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).some((e) => e.ranOn === today && e.message === message && e.sent),
  () => false,
);

let sent = false;
if (!message) console.log("이상 없음. 카톡은 보내지 않습니다.");
else if (dryRun) console.log(`\n[시험 실행: 보내지 않음]\n${message}`);
else if (sentBefore && !always) console.log("오늘 같은 알림을 이미 보냈습니다.");
else sent = await sendKakaoMemo(message, { link: "https://livead.co.kr/app/dashboard", buttonTitle: "라이브애드 열기" });

if (!dryRun) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await appendFile(LOG, `${JSON.stringify({ ranOn: today, checked: yesterday, branches: branches.map((b) => ({ name: b.name, status: b.error ? "점검 실패" : b.result.status, reasons: b.error ? [b.error] : b.result.reasons, clicks: b.result?.clicks })), message, sent })}\n`);
}

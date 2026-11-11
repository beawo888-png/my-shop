#!/usr/bin/env node
/**
 * 지난 기간의 방문 예약 손님을 한꺼번에 바탕화면 엑셀의 '예약고객' 시트에 일자 순으로 채운다.
 *
 * 사용법
 *   node scripts/smartplace/backfill-bookings.mjs --from=2026-01-01            # 어제까지
 *   옵션: --to=2026-10-17  --branch=pangyo|moran
 */

import { alertOwner } from "../../lib/smartplace/alert.mjs";
import { BOOKING_FILE_LABEL, bookingBusinessId, bookingListUrl, bookingWorkbookPath, fetchBookingsByDate, writeBookingDays } from "../../lib/smartplace/bookings.mjs";
import { BRANCH_IDS, BRANCHES } from "../../lib/smartplace/branches.mjs";
import { launchBrowser, openWhenLoggedIn } from "../../lib/smartplace/browser.mjs";
import { readConfig } from "../../lib/smartplace/local-store.mjs";
import { kstDateKey } from "../../lib/threads/schedule.mjs";

const args = { from: undefined, to: kstDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000)), branches: BRANCH_IDS };
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--from=")) args.from = arg.slice(7);
  else if (arg.startsWith("--to=")) args.to = arg.slice(5);
  else if (arg.startsWith("--branch=")) args.branches = arg.slice(9).split(",");
  else throw new Error(`알 수 없는 옵션: ${arg}`);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(args.from ?? "") || !/^\d{4}-\d{2}-\d{2}$/.test(args.to)) throw new Error("--from=YYYY-MM-DD 가 필요합니다.");
for (const id of args.branches) if (!BRANCHES[id]) throw new Error(`알 수 없는 지점: ${id} (pangyo | moran)`);

const config = await readConfig();
for (const branchId of args.branches) {
  const name = BRANCHES[branchId].name;
  const bizId = bookingBusinessId(config.branches?.[branchId]?.newsUrl);
  console.log(`\n━━━━━ ${name} · ${args.from} ~ ${args.to} ━━━━━`);
  const context = await launchBrowser({ branchId, channel: config.browserChannel ?? "chrome" });
  try {
    const page = context.pages()[0] ?? (await context.newPage());
    await openWhenLoggedIn(page, bookingListUrl(bizId, args.to), {
      onWait: () => alertOwner(`${name} 네이버 로그인이 필요합니다. 방금 열린 브라우저 창(엣지)에서 ${name} 아이디로 로그인해 주세요. (20분 동안 기다립니다)`),
    });
    const byDate = await fetchBookingsByDate(page, bizId, args.from, args.to);
    const filePath = bookingWorkbookPath(BOOKING_FILE_LABEL[branchId]);
    await writeBookingDays(filePath, byDate);
    const rows = [...byDate.values()].flat();
    console.log(`  예약 있는 날 ${byDate.size}일 · 손님 ${rows.length}건 (취소 ${rows.filter((r) => r.note === "취소").length}건) → ${filePath}`);
  } finally {
    await context.close().catch(() => {});
  }
}

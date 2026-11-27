import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { isMaskedRow, privacyAuthDue, savedDates, waitForPrivacyAuth, writeBookingDays } from "../lib/smartplace/bookings.mjs";

test("개인정보 인증은 마지막 인증 뒤 3일이 지나야 다시 받는다", () => {
  assert.equal(privacyAuthDue(undefined, "2026-11-27"), true);
  assert.equal(privacyAuthDue("2026-11-27", "2026-11-27"), false);
  assert.equal(privacyAuthDue("2026-11-27", "2026-11-29"), false);
  assert.equal(privacyAuthDue("2026-11-27", "2026-11-30"), true);
  assert.equal(privacyAuthDue("2026-11-28", "2026-12-01"), true);
  assert.equal(privacyAuthDue("2026-11-27", "2026-11-28", 1), true);
});

test("네이버가 가린 이름·번호를 알아본다", () => {
  assert.equal(isMaskedRow({ name: "이*영", phone: "***-****-8885" }), true);
  assert.equal(isMaskedRow({ name: "홍길동", phone: "***-****-8885" }), true);
  assert.equal(isMaskedRow({ name: "홍길동", phone: "010-1234-5678" }), false);
});

test("엑셀에서 마지막 일자, 가려진 첫 일자, 제대로 저장된 일자를 찾는다", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "bookings-"));
  try {
    const file = path.join(dir, "test.xlsx");
    await writeBookingDays(
      file,
      new Map([
        ["2026-11-24", [{ name: "이*영", phone: "***-****-0001", note: "" }]],
        ["2026-11-25", [{ name: "홍길동", phone: "010-1234-5678", note: "" }]],
        ["2026-11-26", [{ name: "김철수", phone: "010-1111-2222", note: "" }, { name: "이*희", phone: "***-****-0438", note: "취소" }]],
      ]),
    );
    const s = await savedDates(file, "2026-11-25");
    assert.equal(s.last, "2026-11-26");
    assert.equal(s.firstMasked, "2026-11-26"); // 11-24는 since 이전이라 다시 받지 않는다
    assert.deepEqual([...s.clean], ["2026-11-25"]);
    assert.deepEqual(await savedDates(path.join(dir, "none.xlsx")), { last: null, firstMasked: null, clean: new Set() });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("개인정보 인증: 살아 있으면 바로, 꺼져 있고 기다리지 않으면 false, 기다리면 알리고 인증을 본다", async () => {
  const fakePage = (states) => ({
    evaluate: async () => states.shift() ?? true,
    waitForTimeout: async () => {},
  });
  assert.equal(await waitForPrivacyAuth(fakePage([true]), "1"), true);
  assert.equal(await waitForPrivacyAuth(fakePage([false]), "1"), false);
  let waited = 0;
  assert.equal(await waitForPrivacyAuth(fakePage([false, false, true]), "1", { timeoutMs: 60_000, onWait: () => (waited += 1) }), true);
  assert.equal(waited, 1);
});

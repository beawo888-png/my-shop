import assert from "node:assert/strict";
import { test } from "node:test";

import { BRANCH_IDS, fillPlaceholders, BRANCHES } from "../lib/smartplace/branches.mjs";
import { alreadyPosted } from "../lib/smartplace/local-store.mjs";
import { kstWeekday, loadNewsBank, parseNewsBank, selectNewsPost, validateNewsBank } from "../lib/smartplace/news-bank.mjs";

const bank = await loadNewsBank();
const at9 = (day) => new Date(`${day}T09:00:00+09:00`);

test("원고집이 규칙을 모두 지킨다", () => {
  assert.deepEqual(validateNewsBank(bank), []);
});

test("한국 시간 기준 요일을 계산한다", () => {
  assert.equal(kstWeekday(at9("2026-10-15")), 4); // 목
  assert.equal(kstWeekday(new Date("2026-10-17T15:30:00Z")), 0); // 일 00:30 KST
});

test("그날 요일 원고가 나오고, 두 지점은 같은 날 서로 다른 원고를 받는다", () => {
  for (let day = 0; day < 56; day += 1) {
    const date = new Date(Date.UTC(2026, 9, 15 + day, 0, 0, 0));
    const [pangyo, moran] = BRANCH_IDS.map((branchId) => selectNewsPost({ posts: bank.posts, branchId, date }));
    assert.notEqual(pangyo.id, moran.id);
    assert.equal(pangyo.day, "일월화수목금토"[kstWeekday(date)]);
  }
});

test("지점마다 4주 동안 같은 원고가 반복되지 않는다", () => {
  for (const branchId of BRANCH_IDS) {
    const ids = Array.from({ length: 28 }, (_, day) =>
      selectNewsPost({ posts: bank.posts, branchId, date: new Date(Date.UTC(2026, 9, 15 + day)) }).id,
    );
    assert.equal(new Set(ids).size, 28);
  }
});

test("자리표시가 지점 정보로 바뀐다", () => {
  const post = selectNewsPost({ posts: bank.posts, branchId: "moran", date: at9("2026-10-15") });
  assert.doesNotMatch(post.text, /[{}]/);
  assert.equal(fillPlaceholders("{지점} {전화}", BRANCHES.pangyo), "판교점 0507-1313-5688");
  assert.throws(() => fillPlaceholders("{없는값}", BRANCHES.pangyo));
});

test("등록 버튼을 누른 지점은 같은 날 다시 올리지 않는다", () => {
  const log = [{ date: "2026-10-16", branch: "pangyo", submitted: true }];
  assert.equal(alreadyPosted(log, "2026-10-16", "pangyo"), true);
  assert.equal(alreadyPosted(log, "2026-10-16", "moran"), false);
  assert.equal(alreadyPosted(log, "2026-10-17", "pangyo"), false);
});

test("헤더 형식이 틀리면 알려 준다", () => {
  assert.throws(() => parseNewsBank("== id: x | day: 월\n본문"), /헤더 형식/);
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { BRANCH_IDS, fillPlaceholders, BRANCHES } from "../lib/smartplace/branches.mjs";
import { alreadyPosted } from "../lib/smartplace/local-store.mjs";
import {
  checkNewsText,
  checkPlanPost,
  kstWeekday,
  loadNewsBank,
  loadNewsPlan,
  parseNewsBank,
  PHOTO_ROOT,
  renderPlanPost,
  selectNewsPost,
  validateNewsBank,
  validateNewsPlan,
} from "../lib/smartplace/news-bank.mjs";

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

// ── 날짜별 원고(plan-YYYY-MM.json) ──

const plan = await loadNewsPlan(at9("2026-10-20"));
const sample = {
  date: "2026-10-20",
  branch: "pangyo",
  photo: "menu/fresh-lamb-skewers.jpg",
  title: "판교 양꼬치, 기본은 생양꼬치부터",
  body: "숯불 향이 퍼집니다 🔥\n담백한 생양꼬치입니다 😋\n\n판교역에서 만나요 🍢",
  hashtags: ["판교양꼬치", "판교맛집", "판교역맛집", "생양꼬치", "왕징양다리양꼬치"],
};

test("10월 날짜별 원고가 규칙을 모두 지킨다", () => {
  assert.equal(plan.posts.length, 28);
  assert.deepEqual(validateNewsPlan(plan), []);
});

test("그날·그 지점 항목이 날짜별 원고에 있으면 그것을 먼저 쓴다", () => {
  for (const branchId of BRANCH_IDS) {
    const entry = plan.posts.find((p) => p.date === "2026-10-20" && p.branch === branchId);
    const post = selectNewsPost({ posts: bank.posts, plan: plan.posts, branchId, date: at9("2026-10-20") });
    assert.equal(post.source, "plan");
    assert.equal(post.id, `plan-2026-10-20-${branchId}`);
    assert.equal(post.title, entry.title);
    assert.equal(post.body, `${entry.body}\n\n${entry.hashtags.map((t) => `#${t}`).join(" ")}`);
    assert.equal(post.photo, entry.photo);
    assert.equal(post.photoPath, `${PHOTO_ROOT}${entry.photo}`);
    assert.equal(post.day, "화");
  }
});

test("날짜별 원고에 없는 날은 요일별 원고집을 쓴다", () => {
  const date = at9("2026-11-02");
  const post = selectNewsPost({ posts: bank.posts, plan: plan.posts, branchId: "moran", date });
  assert.equal(post.source, "bank");
  assert.equal(post.id, selectNewsPost({ posts: bank.posts, branchId: "moran", date }).id);
});

test("제목칸에는 제목, 본문칸에는 나머지가 들어간다 (postNews와 같은 나누기)", () => {
  const post = selectNewsPost({ posts: bank.posts, plan: plan.posts, branchId: "pangyo", date: at9("2026-10-18") });
  // 제목칸이 없을 때 text 전체를 넣어도 첫 줄이 제목이고, 예전처럼 첫 줄을 잘라도 body와 같다.
  assert.equal(post.text.split("\n")[0], post.title);
  assert.equal(post.text.split("\n").slice(1).join("\n").replace(/^\n+/, ""), post.body);
  assert.ok(!post.body.includes(post.title));
  assert.match(post.body, /\n\n#판교양꼬치 #\S+ #\S+ #\S+ #\S+$/);

  const bankPost = selectNewsPost({ posts: bank.posts, branchId: "pangyo", date: at9("2026-10-15") });
  assert.equal(bankPost.body, bankPost.text.split("\n").slice(1).join("\n").replace(/^\n+/, ""));
});

test("날짜별 원고는 이모티콘 3개·해시태그 5개·제목 5~40자·본문 10~1000자를 검사한다", () => {
  assert.deepEqual(checkPlanPost(sample), []);
  assert.deepEqual(checkNewsText(renderPlanPost(sample).text, renderPlanPost(sample)), []);

  const problems = (patch) => checkPlanPost({ ...sample, ...patch }).join(" / ");
  assert.match(problems({ body: "숯불 향이 퍼집니다 🔥 맛있어요" }), /이모티콘 1개/);
  assert.match(problems({ body: `${sample.body} 🎉` }), /이모티콘 4개/);
  assert.match(problems({ hashtags: sample.hashtags.slice(0, 4) }), /해시태그 4개/);
  assert.match(problems({ hashtags: [...sample.hashtags.slice(0, 4), "판교 맛집"] }), /빈칸/);
  assert.match(problems({ hashtags: [...sample.hashtags.slice(0, 4), "판교맛집"] }), /중복/);
  assert.match(problems({ body: `${sample.body} #판교` }), /본문 안에 해시태그/);
  assert.match(problems({ title: "양꼬치" }), /제목 3자/);
  assert.match(problems({ title: "가".repeat(41) }), /제목 41자/);
  assert.match(problems({ title: "판교 양꼬치 🔥 추천" }), /제목에 이모티콘/);
  assert.match(problems({ body: `${"가".repeat(1000)} 🔥😋🍢` }), /본문 \d+자/);
});

test("원고집(posts.txt)은 예전 규칙 그대로 해시태그·이모지를 막는다", () => {
  const text = `${"가".repeat(90)} 🔥`;
  assert.match(checkNewsText(text).join(), /이모지/);
  assert.match(checkNewsText(`${"가".repeat(90)} #판교`).join(), /해시태그/);
});

test("날짜별 원고의 날짜·지점 중복과 사진 누락을 잡는다", () => {
  const problems = validateNewsPlan({ posts: [sample, { ...sample, photo: "menu/없는사진.jpg" }, { ...sample, branch: "seoul", date: "10/20" }] });
  assert.ok(problems.some((p) => p.includes("중복")));
  assert.ok(problems.some((p) => p.includes("사진이 없습니다")));
  assert.ok(problems.some((p) => p.includes("알 수 없는 지점")));
  assert.ok(problems.some((p) => p.includes("날짜 형식")));
});

test("날짜별 원고 파일이 없는 달은 빈 목록이다", async () => {
  assert.deepEqual((await loadNewsPlan(at9("2030-01-05"))).posts, []);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(
  new URL("../lib/home-i18n/ko.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("FAQ content preserves the Korean locale compatibility alias", async () => {
  const compatibilitySource = await readFile(new URL("../lib/faq-content.ts", import.meta.url), "utf8");
  assert.match(compatibilitySource, /import\s+\{\s*koHomeCopy\s*\}\s+from\s+["']\.\/home-i18n\/ko["']/);
  assert.match(compatibilitySource, /export const FAQ_ITEMS = koHomeCopy\.faq\.items;/);
  assert.doesNotMatch(compatibilitySource, /question: "/);
});

test("FAQ content defines the six approved questions in order", () => {
  const questions = [
    "양고기 특유의 잡내가 걱정돼요.",
    "통양다리구이는 어떻게 주문하나요?",
    "단체 회식이나 청첩장 모임도 가능한가요?",
    "주차는 어떻게 하나요?",
    "예약은 꼭 해야 하나요?",
    "양고기 말고 다른 메뉴도 있나요?",
  ];

  let previousIndex = -1;
  for (const question of questions) {
    const questionIndex = source.indexOf(question);
    assert.ok(questionIndex > previousIndex, `${question} 순서가 올바라야 합니다`);
    previousIndex = questionIndex;
  }
  assert.equal(source.match(/question: "/g)?.length, 6);
});

test("FAQ content contains the approved business facts", () => {
  for (const phrase of [
    "15가지 향신 재료를 24시간 우려낸 비법",
    "48시간 저온 숙성",
    "대 1,700g(3~4인, 90,000원)",
    "중 1,500g(2~3인, 80,000원)",
    "400℃ 숯불에서 60분",
    "모란본점 최대 46명",
    "판교점 최대 70명",
    "가게 앞 무료주차 4대",
    "라스트리트 주차장 3시간 무료",
    "네이버 예약",
    "연태구냥·공부가주",
    "맥주도 다양하게 준비",
  ]) {
    assert.ok(source.includes(phrase), `FAQ should include ${phrase}`);
  }
});

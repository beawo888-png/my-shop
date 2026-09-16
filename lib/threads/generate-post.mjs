/**
 * Claude로 오늘의 원고를 새로 뽑아내는 (선택) 경로.
 *
 * ANTHROPIC_API_KEY가 있을 때만 쓰인다. 실패하면 호출한 쪽에서
 * 원고집(content/threads/posts.txt)으로 되돌아간다.
 */

import Anthropic from "@anthropic-ai/sdk";

import { LENGTH_MAX, LENGTH_MIN, LENGTH_TARGET, countCharacters } from "./post-bank.mjs";

export const DEFAULT_MODEL = "claude-opus-5";

const SYSTEM_PROMPT = `당신은 조회수 10만을 기본으로 내는 한국어 스레드(Threads) 글쓰기 전문가입니다.
독자는 한국에서 식당·카페·술집을 직접 운영하는 외식업 자영업 사장님들입니다.

글의 규칙:
- 공백과 줄바꿈을 포함해 ${LENGTH_MIN}자 이상 ${LENGTH_MAX}자 이하로 씁니다. ${LENGTH_TARGET}자에 가장 가깝게 맞춥니다.
- 첫 줄은 장면이나 숫자로 시작하는 훅입니다. "여러분", "오늘은 ~에 대해" 같은 도입부는 쓰지 않습니다.
- 한 줄은 짧게, 문단은 빈 줄로 나눕니다. 모바일에서 읽히는 호흡으로 씁니다.
- 새벽 준비, 재료비, 배달 수수료, 노쇼, 리뷰, 직원, 마감 후처럼 실제로 겪는 장면 하나만 다룹니다.
- 훈계하거나 조언하지 않습니다. 사장님이 직접 겪은 일을 담담하게 말하는 1인칭으로 씁니다.
- 마지막은 과장된 감동이나 구호 대신, 내일 또 문을 여는 사람의 담담한 한 줄로 닫습니다.
- 해시태그, 이모지, 굵은 글씨, 마크다운 기호를 쓰지 않습니다.
- 특정 가게 이름, 브랜드, 실제 인물, 정치적 소재를 넣지 않습니다.

출력 형식: 본문만 그대로 출력합니다. 설명, 따옴표, 제목을 붙이지 않습니다.`;

function buildUserPrompt({ recentTexts, themeHint }) {
  const parts = [];
  if (themeHint) parts.push(`오늘 다룰 장면: ${themeHint}`);
  if (recentTexts.length) {
    parts.push(
      "아래는 최근에 이미 올린 글입니다. 같은 장면, 같은 문장, 같은 마무리를 반복하지 마세요.\n\n" +
        recentTexts.map((text, index) => `[${index + 1}]\n${text}`).join("\n\n"),
    );
  }
  parts.push("오늘 올릴 글 한 편을 써 주세요.");
  return parts.join("\n\n");
}

function extractText(response) {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/**
 * 규칙을 통과하는 원고 한 편을 만든다. 길이가 안 맞으면 피드백을 주고 다시 시킨다.
 * @returns {Promise<{text: string, length: number, model: string}>}
 */
export async function generatePost({
  recentTexts = [],
  themeHint,
  client = new Anthropic(),
  model = DEFAULT_MODEL,
  maxAttempts = 3,
} = {}) {
  const messages = [{ role: "user", content: buildUserPrompt({ recentTexts, themeHint }) }];
  const failures = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages,
    });

    if (response.stop_reason === "refusal") {
      throw new Error(`모델이 생성을 거부했습니다: ${response.stop_details?.explanation ?? "사유 미상"}`);
    }

    const text = extractText(response);
    const length = countCharacters(text);

    if (length >= LENGTH_MIN && length <= LENGTH_MAX) {
      return { text, length, model: response.model ?? model };
    }

    failures.push(`${length}자`);
    messages.push(
      { role: "assistant", content: text },
      {
        role: "user",
        content:
          `지금 글은 ${length}자입니다. 내용과 호흡은 살리되 길이를 ${LENGTH_MIN}~${LENGTH_MAX}자로 ` +
          `맞춰 다시 써 주세요. 본문만 출력합니다.`,
      },
    );
  }

  throw new Error(`${maxAttempts}번 시도했지만 길이를 못 맞췄습니다 (${failures.join(", ")}).`);
}

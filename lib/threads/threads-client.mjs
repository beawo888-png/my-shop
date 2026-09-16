/**
 * Threads Graph API 텍스트 게시.
 *
 * 2단계로 동작한다.
 *   1) POST /{user-id}/threads          → 컨테이너 생성 (creation_id)
 *   2) POST /{user-id}/threads_publish  → 실제 발행
 *
 * 문서: https://developers.facebook.com/docs/threads/posts
 */

const DEFAULT_API_BASE = "https://graph.threads.net/v1.0";
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];

/** Threads 텍스트 글 최대 길이. */
export const THREADS_MAX_LENGTH = 500;

export class ThreadsApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ThreadsApiError";
    this.status = status;
    this.body = body;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function postForm(url, params, { fetchImpl, label }) {
  let lastError;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);

    let response;
    try {
      response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(params).toString(),
      });
    } catch (error) {
      lastError = new ThreadsApiError(`${label} 요청 실패: ${error.message}`);
      continue;
    }

    const text = await response.text();
    if (response.ok) {
      try {
        return JSON.parse(text);
      } catch {
        throw new ThreadsApiError(`${label} 응답을 해석할 수 없습니다: ${text.slice(0, 200)}`, {
          status: response.status,
          body: text,
        });
      }
    }

    lastError = new ThreadsApiError(`${label} 실패 (HTTP ${response.status}): ${text.slice(0, 300)}`, {
      status: response.status,
      body: text,
    });
    if (!isRetryable(response.status)) throw lastError;
  }

  throw lastError;
}

/**
 * 텍스트 글 한 편을 올린다.
 * @returns {Promise<{creationId: string, postId: string}>}
 */
export async function publishTextPost({
  userId,
  accessToken,
  text,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = globalThis.fetch,
  publishDelayMs = 5000,
}) {
  if (!userId) throw new ThreadsApiError("THREADS_USER_ID가 없습니다.");
  if (!accessToken) throw new ThreadsApiError("THREADS_ACCESS_TOKEN이 없습니다.");
  if (!text?.trim()) throw new ThreadsApiError("올릴 본문이 비어 있습니다.");
  if ([...text].length > THREADS_MAX_LENGTH) {
    throw new ThreadsApiError(`본문이 ${THREADS_MAX_LENGTH}자를 넘습니다.`);
  }

  const container = await postForm(
    `${apiBase}/${encodeURIComponent(userId)}/threads`,
    { media_type: "TEXT", text, access_token: accessToken },
    { fetchImpl, label: "컨테이너 생성" },
  );
  if (!container?.id) {
    throw new ThreadsApiError(`컨테이너 응답에 id가 없습니다: ${JSON.stringify(container)}`);
  }

  // Threads는 컨테이너 생성 직후 발행하면 아직 준비되지 않았다는 응답을 줄 수 있다.
  if (publishDelayMs > 0) await sleep(publishDelayMs);

  const published = await postForm(
    `${apiBase}/${encodeURIComponent(userId)}/threads_publish`,
    { creation_id: container.id, access_token: accessToken },
    { fetchImpl, label: "발행" },
  );
  if (!published?.id) {
    throw new ThreadsApiError(`발행 응답에 id가 없습니다: ${JSON.stringify(published)}`);
  }

  return { creationId: container.id, postId: published.id };
}

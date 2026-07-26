import { requireAdminSession } from "@/lib/admin/require-admin";
import { visitRepository } from "@/lib/ai-visits/repository";
import { summarizeVisits } from "@/lib/ai-visits/summarize";
import type { Purpose, VisitSummary } from "@/lib/ai-visits/types";

export const dynamic = "force-dynamic";

const PURPOSE_LABELS: Record<Purpose, string> = {
  search_indexing: "검색 인덱싱",
  training: "학습",
  realtime_citation: "실시간 인용",
  other: "기타",
};

function emptySummary(): VisitSummary {
  return {
    total: 0,
    byPurpose: {
      search_indexing: 0,
      training: 0,
      realtime_citation: 0,
      other: 0,
    },
    bots: [],
  };
}

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatChange(bot: VisitSummary["bots"][number]) {
  if (bot.isNew) return `신규 +${bot.currentCount}`;
  const sign = bot.delta > 0 ? "+" : "";
  const percent = bot.percentChange === null ? "-" : `${sign}${bot.percentChange}%`;
  return `${sign}${bot.delta} (${percent})`;
}

export default async function AiVisitsAdminPage() {
  await requireAdminSession();

  let summary = emptySummary();
  let storageError = false;
  try {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const rows = await visitRepository.listSince(since);
    summary = summarizeVisits(rows);
  } catch {
    storageError = true;
  }

  const kpis = [
    { label: "전체 AI/크롤러 방문 수", value: summary.total, tone: "red" },
    {
      label: "검색 인덱싱 방문 수",
      value: summary.byPurpose.search_indexing,
      tone: "gold",
    },
    { label: "학습 방문 수", value: summary.byPurpose.training, tone: "ink" },
    {
      label: "실시간 인용 방문 수",
      value: summary.byPurpose.realtime_citation,
      tone: "red",
    },
  ];

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">최근 30일</p>
          <h1>AI 어시스턴트별 방문</h1>
          <p>
            User-Agent 기준 요청 기록이며, 표시된 이름만으로 실제 봇 신원을 보증하지
            않습니다.
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="admin-logout-button">
            로그아웃
          </button>
        </form>
      </header>

      {storageError ? (
        <p className="admin-error" role="alert">
          방문 저장소 연결을 확인해 주세요. 공개 홈페이지 운영에는 영향이 없습니다.
        </p>
      ) : null}

      <section className="admin-kpi-grid" aria-label="AI 방문 요약">
        {kpis.map((kpi) => (
          <article className={`admin-kpi admin-kpi--${kpi.tone}`} key={kpi.label}>
            <h2>{kpi.label}</h2>
            <strong>{kpi.value.toLocaleString("ko-KR")}</strong>
          </article>
        ))}
      </section>

      <section className="admin-table-card" aria-labelledby="bot-visits-title">
        <div className="admin-section-heading">
          <div>
            <p className="admin-eyebrow">봇별 방문</p>
            <h2 id="bot-visits-title">방문과 변화</h2>
          </div>
          <span>현재 30일과 직전 30일 비교</span>
        </div>
        {summary.bots.length === 0 ? (
          <p className="admin-empty">아직 기록된 AI 어시스턴트 방문이 없습니다.</p>
        ) : (
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>봇 이름</th>
                  <th>회사</th>
                  <th>목적</th>
                  <th>방문 수</th>
                  <th>최근 방문 시간</th>
                  <th>가장 많이 본 페이지</th>
                  <th>변화</th>
                </tr>
              </thead>
              <tbody>
                {summary.bots.map((bot) => (
                  <tr key={bot.botId}>
                    <td><strong>{bot.botName}</strong></td>
                    <td>{bot.vendor}</td>
                    <td>
                      <span className={`admin-purpose admin-purpose--${bot.purpose}`}>
                        {PURPOSE_LABELS[bot.purpose]}
                      </span>
                    </td>
                    <td>{bot.currentCount.toLocaleString("ko-KR")}</td>
                    <td>{formatDate(bot.lastVisitedAt)}</td>
                    <td><code>{bot.topPath ?? "-"}</code></td>
                    <td>{formatChange(bot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-purpose-grid" aria-label="방문 목적 설명">
        <article>
          <h2>검색 인덱싱</h2>
          <p>검색 결과나 AI 검색 결과에 보여줄 후보 페이지를 찾는 방문</p>
        </article>
        <article>
          <h2>학습</h2>
          <p>모델 학습·지식 수집 목적의 방문</p>
        </article>
        <article>
          <h2>실시간 인용</h2>
          <p>사용자가 AI에게 질문했을 때 답변·출처 확인을 위해 들어오는 방문</p>
        </article>
      </section>
    </main>
  );
}

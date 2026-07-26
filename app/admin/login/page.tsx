import { getAdminSession } from "@/lib/admin/require-admin";
import { sanitizeAdminNext } from "@/lib/admin/redirect";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  if (await getAdminSession()) redirect("/admin/ai-visits");
  const params = await searchParams;
  const next = sanitizeAdminNext(params.next ?? null);

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <p className="admin-eyebrow">관리자 전용</p>
        <h1 id="admin-login-title">왕징 운영자 로그인</h1>
        <p className="admin-login-copy">
          AI 어시스턴트 방문 현황은 운영자만 확인할 수 있습니다.
        </p>
        {params.error ? (
          <p className="admin-error" role="alert">
            로그인 정보를 확인해 주세요.
          </p>
        ) : null}
        <form action="/api/admin/login" method="post" className="admin-login-form">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="current-password"
          />
          <button type="submit">로그인</button>
        </form>
        <p className="admin-security-note">
          비밀번호와 방문 데이터는 일반 홈페이지에 표시되지 않습니다.
        </p>
      </section>
    </main>
  );
}

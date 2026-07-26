import { ADMIN_SESSION_COOKIE } from "@/lib/admin/require-admin";
import {
  hashLoginSource,
  isLoginAllowed,
  loginLimitRepository,
} from "@/lib/admin/rate-limit";
import { sanitizeAdminNext } from "@/lib/admin/redirect";
import { verifyPassword } from "@/lib/admin/password";
import { createSession } from "@/lib/admin/session";
import { NextResponse } from "next/server";

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function clientAddress(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function loginRedirect(request: Request, next: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", "invalid");
  url.searchParams.set("next", next);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const next = sanitizeAdminNext(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : null,
  );
  if (typeof password !== "string") return loginRedirect(request, next);

  const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const sessionSecret = process.env.ADMIN_SESSION_SECRET ?? "";
  const ipHashSecret = process.env.ADMIN_IP_HASH_SECRET ?? "";

  try {
    const sourceHash = hashLoginSource(clientAddress(request), ipHashSecret);
    if (!(await isLoginAllowed(sourceHash))) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "900" },
      });
    }

    if (!(await verifyPassword(password, passwordHash))) {
      await loginLimitRepository.recordFailure(sourceHash, new Date());
      return loginRedirect(request, next);
    }

    await loginLimitRepository.clear(sourceHash);
    const response = NextResponse.redirect(new URL(next, request.url), 303);
    response.cookies.set(ADMIN_SESSION_COOKIE, createSession(sessionSecret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/admin",
      maxAge: 12 * 60 * 60,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return new NextResponse("관리자 로그인을 사용할 수 없습니다.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

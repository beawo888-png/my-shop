import { ADMIN_SESSION_COOKIE } from "@/lib/admin/require-admin";
import { buildSameOriginUrl } from "@/lib/admin/request-origin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const redirectUrl = buildSameOriginUrl("/admin/login", request.headers, request.url);
  if (!redirectUrl) return new NextResponse("Forbidden", { status: 403 });

  const response = NextResponse.redirect(redirectUrl, 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

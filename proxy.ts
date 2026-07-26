import { after, NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canonicalizeAdminPath } from "@/lib/admin/redirect";
import { handleAiVisitRequest } from "@/lib/ai-visits/proxy-handler";

export function proxy(request: NextRequest) {
  const canonicalPath = canonicalizeAdminPath(request.nextUrl.pathname);
  if (canonicalPath) {
    return NextResponse.redirect(new URL(canonicalPath, request.url), 308);
  }

  handleAiVisitRequest(
    {
      method: request.method,
      pathname: request.nextUrl.pathname,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
    },
    { schedule: (task) => after(task) },
  );

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff|woff2|ttf|mp4|webm)$).*)",
  ],
};

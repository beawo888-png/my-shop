"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Clarity 프로젝트 ID는 페이지에 그대로 노출되는 공개 값이다.
// Vercel 프로덕션 배포에서만 기본 ID를 쓰고, 로컬·프리뷰는 기록하지 않는다.
const CLARITY_ID =
  process.env.NEXT_PUBLIC_CLARITY_ID ??
  (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? "ywavzrnkrt" : undefined);

export function Clarity() {
  const pathname = usePathname();

  // 운영자 화면은 녹화하지 않는다.
  if (!CLARITY_ID || pathname?.startsWith("/admin")) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(CLARITY_ID)});`}
    </Script>
  );
}

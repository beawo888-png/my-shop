import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://xn--vr0bn4e2wh79mca68ih9mf4j.com"),
  applicationName: "판교왕징 | 판교 양꼬치·중국 양고기 다이닝",
  title: "왕징양다리양꼬치 | 판교·모란 통양다리구이·양꼬치",
  description:
    "판교 회식과 모란 가족모임에 어울리는 왕징양다리양꼬치입니다. 48시간 숙성과 고온 숯불로 완성한 통양다리구이와 양꼬치를 대왕판교로606번길 판교점·모란본점에서 만나보세요.",
  keywords: [
    "왕징양다리양꼬치",
    "판교 통양다리구이",
    "모란 양꼬치",
    "판교 회식",
    "모란 가족모임",
    "판교 중국요리",
    "모란 중국요리",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "왕징양다리양꼬치 | 판교·모란 통양다리구이·양꼬치",
    description:
      "48시간 숙성과 고온 숯불로 완성한 통양다리구이와 양꼬치를 판교점·모란본점에서 만나보세요.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "판교왕징 | 판교 양꼬치·중국 양고기 다이닝",
  description:
    "경기 성남시 분당구 대왕판교로606번길 10에서 양꼬치와 중국 양고기 요리, 단체석과 주차 편의를 제공하는 판교왕징입니다.",
  keywords: [
    "판교왕징",
    "판교 양꼬치",
    "판교 회식",
    "판교 단체모임",
    "판교 중국요리",
  ],
  openGraph: {
    title: "판교왕징 | 판교 양꼬치·중국 양고기 다이닝",
    description: "불향으로 완성한 양고기, 중요한 자리를 위한 판교왕징",
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

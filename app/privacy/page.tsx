import type { Metadata } from "next";
import { SiteHeader } from "@/components/home/site-header";

const canonical = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/privacy";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 왕징양다리양꼬치",
  description: "왕징양다리양꼬치 홈페이지와 매장 운영 도구(에이스톡)의 개인정보처리방침입니다.",
  alternates: { canonical },
  robots: { index: true, follow: true },
};

const sectionStyle = { marginTop: 32 } as const;
const textStyle = { lineHeight: 1.8, margin: "8px 0" } as const;

export default function PrivacyPage() {
  return (
    <main className="reviews-page">
      <SiteHeader homePath="/" />

      <section className="reviews-page__hero" aria-labelledby="privacy-title">
        <div className="reviews-page__shell">
          <p className="reviews-page__eyebrow">PRIVACY POLICY</p>
          <h1 id="privacy-title">개인정보처리방침</h1>
          <p className="reviews-page__lead">시행일: 2026년 11월 25일</p>
        </div>
      </section>

      <section className="reviews-page__content">
        <div className="reviews-page__shell" style={{ maxWidth: 760 }}>
          <p style={textStyle}>
            왕징양다리양꼬치(모란본점·판교점, 이하 &ldquo;매장&rdquo;)는 홈페이지와 매장 운영 도구 &ldquo;에이스톡&rdquo;을
            운영하면서 이용자의 개인정보를 소중히 다룹니다.
          </p>

          <h2 style={sectionStyle}>1. 홈페이지에서 수집하는 정보</h2>
          <p style={textStyle}>
            홈페이지는 회원가입이나 주문 기능이 없으며, 이름·전화번호 같은 개인정보를 입력받지 않습니다. 사이트 개선을
            위해 방문한 페이지 주소, 브라우저 종류, 들어온 경로 같은 접속 기록이 자동으로 남을 수 있습니다.
          </p>

          <h2 style={sectionStyle}>2. 에이스톡과 구글·유튜브 계정 정보</h2>
          <p style={textStyle}>
            에이스톡은 매장이 직접 만든 홍보 영상을 매장의 유튜브 채널에 올리기 위한 내부 도구입니다. 매장 대표가 직접
            구글 계정으로 허락한 경우에만 YouTube API 서비스를 사용하며, 영상 업로드와 채널 정보 확인에 필요한 권한만
            요청합니다.
          </p>
          <ul style={textStyle}>
            <li>구글이 발급한 접근 정보는 매장 컴퓨터에만 저장되며 외부에 전달하거나 판매하지 않습니다.</li>
            <li>매장 채널 외 다른 사용자의 유튜브 데이터는 수집하지 않습니다.</li>
            <li>
              연결 해제는 언제든지{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
                구글 계정 권한 설정
              </a>
              에서 할 수 있습니다.
            </li>
          </ul>
          <p style={textStyle}>
            에이스톡은 YouTube API 서비스를 사용하며, 이용자는{" "}
            <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">
              YouTube 서비스 약관
            </a>
            과{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google 개인정보처리방침
            </a>
            의 적용을 받습니다.
          </p>

          <h2 style={sectionStyle}>3. 보관 기간과 파기</h2>
          <p style={textStyle}>
            접속 기록은 사이트 운영에 필요한 기간 동안만 보관한 뒤 지웁니다. 유튜브 연결 정보는 연결을 해제하면 즉시
            삭제합니다.
          </p>

          <h2 style={sectionStyle}>4. 문의</h2>
          <p style={textStyle}>개인정보 관련 문의: wangjing.lamb@gmail.com</p>
        </div>
      </section>
    </main>
  );
}

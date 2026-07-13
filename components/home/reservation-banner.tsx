import Image from "next/image";
import { SITE } from "@/lib/site-content";

export function ReservationBanner() {
  return (
    <section className="reservation" aria-labelledby="reservation-title">
      <Image
        src="/images/wangjing/feast.jpg"
        alt="양고기와 중국 요리가 풍성하게 차려진 왕징 한 상"
        fill
        sizes="100vw"
      />
      <div className="reservation__overlay" />
      <div className="reservation__content">
        <p className="eyebrow eyebrow--gold">RESERVATION</p>
        <h2 id="reservation-title">오늘의 좋은 자리를 왕징에서</h2>
        <p>네이버 예약으로 원하는 시간과 인원을 편리하게 알려주세요.</p>
        <div className="button-row button-row--center">
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
          <a className="button button--outline" href={SITE.phoneHref}>
            전화 문의
          </a>
        </div>
      </div>
    </section>
  );
}

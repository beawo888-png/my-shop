import { SITE } from "@/lib/site-content";

export function MobileBookingBar() {
  return (
    <aside className="mobile-booking" aria-label="빠른 예약">
      <a
        href={SITE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="네이버 예약 페이지 열기"
      >
        네이버 예약
      </a>
    </aside>
  );
}

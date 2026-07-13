import { SITE } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__brand">
        <span>{SITE.hanja}</span>
        <strong>{SITE.name}</strong>
        <p>불향으로 기억되는 판교의 중국 양고기 다이닝</p>
      </div>
      <address>
        <p>{SITE.address}</p>
        <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
      </address>
      <nav aria-label="푸터 메뉴">
        <a href={SITE.bookingUrl} target="_blank" rel="noreferrer">
          네이버 예약
        </a>
        <a href={SITE.mapUrl} target="_blank" rel="noreferrer">
          네이버 지도
        </a>
      </nav>
      <p className="site-footer__copyright">
        © 2026 판교왕징. All rights reserved.
      </p>
    </footer>
  );
}

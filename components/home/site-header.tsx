import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="판교왕징 처음으로">
        <span>{SITE.hanja}</span>
        {SITE.name}
      </a>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => (
          <a href={item.href} key={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a
        className="button button--primary header-booking"
        href={SITE.bookingUrl}
        target="_blank"
        rel="noreferrer"
      >
        네이버 예약
      </a>
    </header>
  );
}

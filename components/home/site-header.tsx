"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

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
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav
        className="mobile-nav"
        id="mobile-navigation"
        aria-label="모바일 메뉴"
        hidden={!open}
      >
        {NAV_ITEMS.map((item) => (
          <a
            href={item.href}
            key={item.href}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a
          href={SITE.bookingUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          네이버 예약
        </a>
      </nav>
    </header>
  );
}

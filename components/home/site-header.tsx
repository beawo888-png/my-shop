"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/home/brand-logo";
import { BOOKING_LOCATIONS, NAV_ITEMS } from "@/lib/site-content";

type SiteHeaderProps = {
  sectionRoot?: "" | "/";
  home?: boolean;
};

export function SiteHeader({ sectionRoot = "", home = false }: SiteHeaderProps) {
  const resolveNavHref = (item: (typeof NAV_ITEMS)[number]) =>
    item.href.startsWith("#") ? `${sectionRoot}${item.href}` : item.href;

  const [open, setOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const bookingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bookingOpen) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!bookingMenuRef.current?.contains(event.target as Node)) {
        setBookingOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBookingOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [bookingOpen]);

  return (
    <header className={home ? "site-header site-header--home" : "site-header"}>
      <a
        className="wordmark"
        href={sectionRoot === "/" ? "/" : "#top"}
        aria-label="왕징양다리양꼬치 처음으로"
      >
        <BrandLogo
          className="brand-logo--header"
          sizes={home ? "(max-width: 767px) 170px, 250px" : "(max-width: 767px) 132px, 190px"}
          preload
        />
      </a>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        {NAV_ITEMS.map((item) => (
          <a
            href={resolveNavHref(item)}
            key={item.href}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noreferrer" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="header-booking" ref={bookingMenuRef}>
        <button
          className="button button--primary header-booking__trigger"
          type="button"
          aria-haspopup="true"
          aria-expanded={bookingOpen}
          aria-controls="booking-branch-menu"
          onClick={() => setBookingOpen((value) => !value)}
        >
          네이버 예약
          <ChevronDown aria-hidden="true" />
        </button>
        <nav
          className="header-booking__menu"
          id="booking-branch-menu"
          aria-label="예약 지점 선택"
          hidden={!bookingOpen}
        >
          {BOOKING_LOCATIONS.map((booking) => (
            <a
              href={booking.url}
              key={booking.id}
              target="_blank"
              rel="noreferrer"
              onClick={() => setBookingOpen(false)}
            >
              {booking.label}
            </a>
          ))}
        </nav>
      </div>
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
            href={resolveNavHref(item)}
            key={item.href}
            target={item.newTab ? "_blank" : undefined}
            rel={item.newTab ? "noreferrer" : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <div className="mobile-nav__booking">
          <p>네이버 예약</p>
          {BOOKING_LOCATIONS.map((booking) => (
            <a
              href={booking.url}
              key={booking.id}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              {booking.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}

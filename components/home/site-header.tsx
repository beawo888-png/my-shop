"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/home/brand-logo";
import {
  LanguageSelector,
  LocaleLink,
} from "@/components/home/language-selector";
import {
  HOME_COPY,
  HOME_LOCALES,
  LOCALE_CONFIG,
  type HomeCopy,
  type HomeNavItem,
  type Locale,
} from "@/lib/home-i18n";
import { BOOKING_LOCATIONS } from "@/lib/site-content";

type SiteHeaderProps = {
  locale?: Locale;
  copy?: HomeCopy["header"];
  homePath?: string;
  home?: boolean;
};

export function SiteHeader({
  locale = "ko",
  copy = HOME_COPY.ko.header,
  homePath = "/",
  home = false,
}: SiteHeaderProps) {
  const resolveNavHref = (item: HomeNavItem) =>
    item.href.startsWith("#") ? `${home ? "" : homePath}${item.href}` : item.href;

  const [open, setOpen] = useState(false);

  return (
    <header className={home ? "site-header site-header--home" : "site-header"}>
      <a
        className="wordmark"
        href={home ? "#top" : homePath}
        aria-label={copy.homeAria}
      >
        <BrandLogo
          className="brand-logo--header"
          sizes={home ? "(max-width: 767px) 170px, 250px" : "(max-width: 767px) 132px, 190px"}
          preload
        />
      </a>
      <nav className="desktop-nav" aria-label={copy.desktopNavAria}>
        {copy.nav.map((item) => (
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
      <LanguageSelector locale={locale} copy={copy} />
      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? copy.closeMenuAria : copy.openMenuAria}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav
        className="mobile-nav"
        id="mobile-navigation"
        aria-label={copy.mobileNavAria}
        hidden={!open}
      >
        {copy.nav.map((item) => (
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
        <div className="mobile-nav__languages">
          <p>{copy.languageGroupLabel}</p>
          <div>
            {HOME_LOCALES.map((targetLocale) => (
              <LocaleLink
                key={targetLocale}
                targetLocale={targetLocale}
                currentLocale={locale}
                onSelect={() => setOpen(false)}
              >
                {LOCALE_CONFIG[targetLocale].label}
              </LocaleLink>
            ))}
          </div>
        </div>
        <div className="mobile-nav__booking">
          <p>{copy.bookingGroupLabel}</p>
          {BOOKING_LOCATIONS.map((booking) => (
            <a
              href={booking.url}
              key={booking.id}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              {copy.bookingLabels[booking.id]}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}

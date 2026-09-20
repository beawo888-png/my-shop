"use client";

import { ChevronDown } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  buildLocaleHref,
  HOME_LOCALES,
  LOCALE_CONFIG,
  type HomeCopy,
  type Locale,
} from "@/lib/home-i18n";

export function LocaleLink({
  targetLocale,
  currentLocale,
  children,
  onSelect,
}: {
  targetLocale: Locale;
  currentLocale: Locale;
  children: ReactNode;
  onSelect?: (sameLocale: boolean) => void;
}) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = buildLocaleHref(targetLocale, window.location.hash);
    const modifiedClick =
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0;

    if (modifiedClick) {
      event.currentTarget.setAttribute("href", href);
      return;
    }

    if (event.currentTarget.getAttribute("href") !== href) {
      event.preventDefault();
      window.location.assign(href);
    }
    onSelect?.(targetLocale === currentLocale);
  };

  return (
    <a
      href={buildLocaleHref(targetLocale)}
      hrefLang={targetLocale === "zh" ? "zh-CN" : targetLocale}
      aria-current={targetLocale === currentLocale ? "page" : undefined}
      onClick={handleClick}
      onAuxClick={(event) => {
        event.currentTarget.setAttribute(
          "href",
          buildLocaleHref(targetLocale, window.location.hash),
        );
      }}
    >
      {children}
    </a>
  );
}

export function LanguageSelector({
  locale,
  copy,
}: {
  locale: Locale;
  copy: HomeCopy["header"];
}) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnPointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="language-selector" ref={selectorRef}>
      <button
        className="language-selector__trigger"
        type="button"
        aria-label={copy.languageMenuAria}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="language-menu"
        ref={triggerRef}
        onClick={() => setOpen((value) => !value)}
      >
        {LOCALE_CONFIG[locale].label}
        <ChevronDown aria-hidden="true" />
      </button>
      <nav
        className="language-selector__menu"
        id="language-menu"
        aria-label={copy.languageMenuAria}
        hidden={!open}
      >
        {HOME_LOCALES.map((targetLocale) => (
          <LocaleLink
            key={targetLocale}
            targetLocale={targetLocale}
            currentLocale={locale}
            onSelect={(sameLocale) => {
              setOpen(false);
              if (sameLocale) {
                triggerRef.current?.focus();
              }
            }}
          >
            {LOCALE_CONFIG[targetLocale].label}
          </LocaleLink>
        ))}
      </nav>
    </div>
  );
}

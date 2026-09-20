import { SITE } from "@/lib/site-content";
import type { HomeCopy } from "@/lib/home-i18n";

export function MobileBookingBar({ copy }: { copy: HomeCopy["mobileBooking"] }) {
  return (
    <aside className="mobile-booking" aria-label={copy.aria}>
      <a
        href={SITE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={copy.linkAria}
      >
        {copy.label}
      </a>
    </aside>
  );
}

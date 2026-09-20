import Link from "next/link";

import { LOCATIONS } from "@/lib/site-content";
import type { HomeCopy } from "@/lib/home-i18n";

const SOCIAL_LINKS = [
  {
    shortLabel: "Instagram",
    icon: "instagram",
    href: "https://www.instagram.com/wangjingyangdali_official/",
  },
  {
    shortLabel: "YouTube",
    icon: "youtube",
    href: "https://www.youtube.com/@wangjing_lamb",
  },
  {
    shortLabel: "Kakao",
    icon: "kakao",
    href: "https://place.map.kakao.com/1387600612",
  },
  {
    shortLabel: "TikTok",
    icon: "tiktok",
    href: "https://www.tiktok.com/@wangjing_lamb",
  },
] as const;

type SocialPlatform = (typeof SOCIAL_LINKS)[number]["icon"];

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "instagram":
      return (
        <svg
          className="site-footer__social-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="instagram-gradient" x1="2" y1="22" x2="22" y2="2">
              <stop offset="0" stopColor="#ffb000" />
              <stop offset="0.48" stopColor="#f02b68" />
              <stop offset="1" stopColor="#7b35c8" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#instagram-gradient)" />
          <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" />
          <circle cx="16.7" cy="7.5" r="1" fill="#fff" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          className="site-footer__social-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <rect y="4.5" width="24" height="15" rx="4.5" fill="#ff0033" />
          <path d="M10 8.4 16 12l-6 3.6Z" fill="#fff" />
        </svg>
      );
    case "kakao":
      return (
        <svg
          className="site-footer__social-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="12" fill="#fee500" />
          <path d="M12 6.4c-4 0-7.2 2.5-7.2 5.6 0 2 1.4 3.8 3.5 4.8l-.9 3.1 3.7-2.3h.9c4 0 7.2-2.5 7.2-5.6S16 6.4 12 6.4Z" fill="#191919" />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          className="site-footer__social-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="12" fill="#090909" />
          <path d="M14.2 5.1c.5 2.4 1.8 3.8 4.2 4.1v2.4a8 8 0 0 1-4.1-1.2v4.8a4.8 4.8 0 1 1-4.8-4.8h.7v2.5a2.3 2.3 0 1 0 1.7 2.3V5.1Z" fill="#25f4ee" transform="translate(-.7 .35)" />
          <path d="M14.2 5.1c.5 2.4 1.8 3.8 4.2 4.1v2.4a8 8 0 0 1-4.1-1.2v4.8a4.8 4.8 0 1 1-4.8-4.8h.7v2.5a2.3 2.3 0 1 0 1.7 2.3V5.1Z" fill="#fe2c55" transform="translate(.7 -.35)" />
          <path d="M14.2 5.1c.5 2.4 1.8 3.8 4.2 4.1v2.4a8 8 0 0 1-4.1-1.2v4.8a4.8 4.8 0 1 1-4.8-4.8h.7v2.5a2.3 2.3 0 1 0 1.7 2.3V5.1Z" fill="#fff" />
        </svg>
      );
  }
}

export function SiteFooter({ copy, branches, homePath }: {
  copy: HomeCopy["footer"];
  branches: HomeCopy["branches"];
  homePath: string;
}) {
  const moran = LOCATIONS[0];
  const pangyo = LOCATIONS[1];

  return (
    <footer id="footer" className="site-footer">
      <div className="site-footer__main">
        <section className="site-footer__brand" aria-labelledby="footer-brand">
          <h2 id="footer-brand">{copy.brandName}</h2>
          <p>PREMIUM CHINESE LAMB DINING</p>
          <div className="site-footer__socials" aria-label={copy.channelAria}>
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.icon}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${copy.socialLabels[social.icon]} ${copy.newWindowAria}`}
              >
                <SocialIcon platform={social.icon} />
                {social.shortLabel}
              </a>
            ))}
          </div>
        </section>

        <section className="site-footer__branch" aria-labelledby="footer-moran">
          <p className="site-footer__eyebrow" id="footer-moran">
            MORAN
          </p>
          <h2>{branches[moran.id].name}</h2>
          <address>{moran.address}</address>
          <a className="site-footer__phone" href={moran.phoneHref}>
            <span aria-hidden="true">☎</span> {moran.phoneDisplay}
          </a>
        </section>

        <section className="site-footer__branch" aria-labelledby="footer-pangyo">
          <p className="site-footer__eyebrow" id="footer-pangyo">
            PANGYO
          </p>
          <h2>{branches[pangyo.id].name}</h2>
          <address>{pangyo.address}</address>
          <a className="site-footer__phone" href={pangyo.phoneHref}>
            <span aria-hidden="true">☎</span> {pangyo.phoneDisplay}
          </a>
        </section>

        <nav className="site-footer__nav" aria-label={copy.navAria}>
          <p className="site-footer__eyebrow">{copy.navTitle}</p>
          <Link href="/menu">{copy.menu}</Link>
          <Link href={`${homePath}#group`}>{copy.group}</Link>
          <Link href={`${homePath}#reservation`}>{copy.reservation}</Link>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>
          {copy.legal}
        </p>
        <a
          href="https://www.instagram.com/wangjingyangdali_official/"
          target="_blank"
          rel="noreferrer"
        >
          @wangjingyangdali_official
        </a>
      </div>
    </footer>
  );
}

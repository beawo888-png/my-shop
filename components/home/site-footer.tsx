import Link from "next/link";

import { LOCATIONS } from "@/lib/site-content";

const SOCIAL_LINKS = [
  {
    label: "인스타그램",
    shortLabel: "Instagram",
    href: "https://www.instagram.com/wangjingyangdali_official/",
  },
  {
    label: "유튜브",
    shortLabel: "YouTube",
    href: "https://www.youtube.com/@wangjing_lamb",
  },
  {
    label: "카카오맵",
    shortLabel: "Kakao",
    href: "https://place.map.kakao.com/1387600612",
  },
  {
    label: "틱톡",
    shortLabel: "TikTok",
    href: "https://www.tiktok.com/@wangjing_lamb",
  },
] as const;

export function SiteFooter() {
  const moran = LOCATIONS[0];
  const pangyo = LOCATIONS[1];

  return (
    <footer id="footer" className="site-footer">
      <div className="site-footer__main">
        <section className="site-footer__brand" aria-labelledby="footer-brand">
          <h2 id="footer-brand">왕징양다리양꼬치</h2>
          <p>PREMIUM CHINESE LAMB DINING</p>
          <div className="site-footer__socials" aria-label="왕징 공식 채널">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${social.label} 새 창에서 열기`}
              >
                {social.shortLabel}
              </a>
            ))}
          </div>
        </section>

        <section className="site-footer__branch" aria-labelledby="footer-moran">
          <p className="site-footer__eyebrow" id="footer-moran">
            MORAN
          </p>
          <h2>{moran.name}</h2>
          <address>{moran.address}</address>
          <a className="site-footer__phone" href={moran.phoneHref}>
            <span aria-hidden="true">☎</span> {moran.phoneDisplay}
          </a>
        </section>

        <section className="site-footer__branch" aria-labelledby="footer-pangyo">
          <p className="site-footer__eyebrow" id="footer-pangyo">
            PANGYO
          </p>
          <h2>{pangyo.name}</h2>
          <address>{pangyo.address}</address>
          <a className="site-footer__phone" href={pangyo.phoneHref}>
            <span aria-hidden="true">☎</span> {pangyo.phoneDisplay}
          </a>
        </section>

        <nav className="site-footer__nav" aria-label="푸터 메뉴">
          <p className="site-footer__eyebrow">NAV</p>
          <Link href="/menu">대표메뉴</Link>
          <Link href="/#group">단체모임</Link>
          <Link href="/#reservation">예약</Link>
        </nav>
      </div>

      <div className="site-footer__bottom">
        <p>
          © 2026 왕징양다리양꼬치 메뉴/가격은 매장 상황에 따라 다를 수 있습니다.
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

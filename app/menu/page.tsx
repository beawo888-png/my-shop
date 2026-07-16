import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/home/brand-logo";
import { FullMenuCard } from "@/components/menu/full-menu-card";
import {
  PANGYO_MENU_CHECKED_AT,
  PANGYO_MENU_COUNT,
  PANGYO_MENU_GROUPS,
} from "@/lib/menu-content";
import { buildPangyoMenuStructuredData } from "@/lib/menu-structured-data";

const canonical = "https://xn--vr0bn4e2wh79mca68ih9mf4j.com/menu";
const bookingUrl = "https://booking.naver.com/booking/6/bizes/970819";
const placeUrl = "https://map.naver.com/v5/entry/place/1873196958";

export const metadata: Metadata = {
  title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
  description:
    "왕징양다리양꼬치 판교점의 양다리, 양꼬치, 중국요리, 식사와 주류 44개 메뉴 및 가격을 사진과 함께 확인하세요.",
  alternates: { canonical },
  openGraph: {
    title: "판교점 전체 메뉴 | 왕징양다리양꼬치",
    description: "판교점의 양고기와 중국요리 44개 메뉴 및 가격 안내",
    url: canonical,
    locale: "ko_KR",
    type: "website",
  },
};

export default function MenuPage() {
  const menuStructuredData = buildPangyoMenuStructuredData();

  return (
    <div className="full-menu-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(menuStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <header className="full-menu-header">
        <div className="full-menu-header__inner">
          <Link href="/" aria-label="왕징양다리양꼬치 홈페이지로 이동">
            <BrandLogo
              className="brand-logo--menu"
              sizes="(max-width: 767px) 112px, 176px"
            />
          </Link>
          <Link className="full-menu-home-link" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </header>

      <main>
        <section className="full-menu-hero" aria-labelledby="full-menu-title">
          <div className="full-menu-shell">
            <p className="full-menu-eyebrow">PANGYO · 44 MENUS</p>
            <h1 id="full-menu-title">판교점 전체 메뉴</h1>
            <p className="full-menu-hero__description">
              양다리와 꼬치부터 중국요리, 식사, 주류까지 44개 메뉴를 사진과
              함께 확인하세요.
            </p>
            <p className="full-menu-checked">
              네이버 플레이스 등록 메뉴 {PANGYO_MENU_COUNT}개 ·{" "}
              {PANGYO_MENU_CHECKED_AT} 확인
            </p>
          </div>
        </section>

        <nav className="full-menu-categories" aria-label="메뉴 분류 바로가기">
          <ul className="full-menu-shell">
            {PANGYO_MENU_GROUPS.map((group) => (
              <li key={group.id}>
                <a href={"#menu-" + group.id}>
                  {group.title} {group.items.length}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="full-menu-content full-menu-shell">
          {PANGYO_MENU_GROUPS.map((group) => (
            <section
              className="full-menu-section"
              id={"menu-" + group.id}
              key={group.id}
              aria-labelledby={"menu-title-" + group.id}
            >
              <div className="full-menu-section__heading">
                <h2 id={"menu-title-" + group.id}>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <ul className="full-menu-section__items">
                {group.items.map((item, index) => (
                  <FullMenuCard
                    item={item}
                    fallbackImageSrc={group.fallbackImageSrc}
                    key={`${group.id}-${item.name}-${item.price}-${index}`}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>

      <footer className="full-menu-footer">
        <div className="full-menu-shell">
          <h2>방문 전 확인해 주세요</h2>
          <p>
            메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다. 최신
            정보는 네이버 플레이스에서 확인해 주세요.
          </p>
          <p className="full-menu-checked">
            판교점 네이버 플레이스 기준 · {PANGYO_MENU_CHECKED_AT} 확인
          </p>
          <div className="full-menu-footer__actions">
            <a href={bookingUrl} target="_blank" rel="noreferrer">
              판교점 예약
            </a>
            <a href={placeUrl} target="_blank" rel="noreferrer">
              네이버 플레이스
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

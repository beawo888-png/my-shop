import Link from "next/link";
import { BrandLogo } from "@/components/home/brand-logo";
import { FullMenuCard } from "@/components/menu/full-menu-card";
import {
  PANGYO_MENU_CHECKED_AT,
  PANGYO_MENU_COUNT,
  PANGYO_MENU_GROUPS,
  type FullMenuGroup,
} from "@/lib/menu-content";
import { buildPangyoMenuStructuredData } from "@/lib/menu-structured-data";

const bookingUrl = "https://booking.naver.com/booking/6/bizes/970819";
const placeUrl = "https://map.naver.com/v5/entry/place/1873196958";

type CategoryMenuPageProps = {
  group: FullMenuGroup;
};

export function CategoryMenuPage({ group }: CategoryMenuPageProps) {
  const menuStructuredData = buildPangyoMenuStructuredData(
    [group],
    `/menu/${group.id}`,
  );
  const regularItems = group.items.filter(
    (item) => item.subsection !== "highball",
  );
  const highballItems = group.items.filter(
    (item) => item.subsection === "highball",
  );

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
            <p className="full-menu-eyebrow">PANGYO · {group.items.length} MENUS</p>
            <h1 id="full-menu-title">{group.title}</h1>
            <p className="full-menu-hero__description">{group.description}</p>
            <p className="full-menu-checked">
              전체 등록 메뉴 {PANGYO_MENU_COUNT}개 · {PANGYO_MENU_CHECKED_AT} 확인
            </p>
          </div>
        </section>

        <nav className="full-menu-categories" aria-label="메뉴 카테고리">
          <ul className="full-menu-shell">
            {PANGYO_MENU_GROUPS.map((menuGroup) => (
              <li key={menuGroup.id}>
                <Link
                  href={`/menu/${menuGroup.id}`}
                  aria-current={menuGroup.id === group.id ? "page" : undefined}
                >
                  {menuGroup.title} {menuGroup.items.length}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="full-menu-content full-menu-shell">
          <section
            className="full-menu-section"
            aria-labelledby={`menu-title-${group.id}`}
          >
            <div className="full-menu-section__heading">
              <h2 id={`menu-title-${group.id}`}>{group.title}</h2>
              <p>{group.description}</p>
            </div>
            <ul className="full-menu-section__items">
              {regularItems.map((item, index) => (
                <FullMenuCard
                  item={item}
                  fallbackImageSrc={group.fallbackImageSrc}
                  key={`${group.id}-${item.name}-${item.price}-${index}`}
                />
              ))}
            </ul>
            {highballItems.length > 0 ? (
              <section
                className="full-menu-subsection"
                aria-labelledby="highball-title"
              >
                <div className="full-menu-subsection__heading">
                  <h2 id="highball-title">하이볼</h2>
                  <p>각 브랜드의 개성을 시원하게 즐기는 하이볼 메뉴</p>
                </div>
                <ul className="full-menu-section__items full-menu-section__items--highballs">
                  {highballItems.map((item, index) => (
                    <FullMenuCard
                      item={item}
                      fallbackImageSrc={group.fallbackImageSrc}
                      key={`${group.id}-highball-${item.name}-${item.price}-${index}`}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
          </section>
        </div>
      </main>

      <footer className="full-menu-footer">
        <div className="full-menu-shell">
          <h2>방문 전 확인해 주세요</h2>
          <p>
            메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다. 최신 정보는
            네이버 플레이스에서 확인해 주세요.
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

import { SiteHeader } from "@/components/home/site-header";
import { MenuExplorer } from "@/components/menu/menu-explorer";
import {
  PANGYO_MENU_CHECKED_AT,
  PANGYO_MENU_GROUPS,
  type FullMenuGroup,
} from "@/lib/menu-content";
import { buildPangyoMenuStructuredData } from "@/lib/menu-structured-data";
import { BOOKING_LOCATIONS } from "@/lib/site-content";

type CategoryMenuPageProps = { group?: FullMenuGroup };

export function CategoryMenuPage({ group }: CategoryMenuPageProps) {
  const structuredGroups = group ? [group] : PANGYO_MENU_GROUPS;
  const structuredPath = group ? `/menu/${group.id}` : "/menu";
  const menuStructuredData = buildPangyoMenuStructuredData(structuredGroups, structuredPath);

  return (
    <div className="full-menu-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(menuStructuredData).replace(/</g, "\\u003c") }} />
      <SiteHeader homePath="/" />
      <main>
        <MenuExplorer groups={PANGYO_MENU_GROUPS} initialGroupId={group?.id} />
      </main>
      <footer className="full-menu-footer">
        <div className="full-menu-shell">
          <h2>방문 전 확인해 주세요</h2>
          <p>메뉴와 가격은 매장 운영 상황에 따라 변경될 수 있습니다. 최신 정보는 네이버 플레이스에서 확인해 주세요.</p>
          <p className="full-menu-checked">모란본점·판교점 공통 메뉴 · {PANGYO_MENU_CHECKED_AT} 확인</p>
          <div className="full-menu-footer__actions">
            {BOOKING_LOCATIONS.map((booking) => (
              <a href={booking.url} target="_blank" rel="noreferrer" key={booking.id}>{booking.label}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

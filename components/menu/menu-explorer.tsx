"use client";

import { useState } from "react";
import { FullMenuCard } from "@/components/menu/full-menu-card";
import type { FullMenuGroup } from "@/lib/menu-content";

type MenuExplorerProps = {
  groups: FullMenuGroup[];
  initialGroupId?: string;
};

const MENU_CATEGORY_LABELS: Record<string, string> = {
  "signature-lamb-leg": "시그니처 양다리",
  "lamb-skewers": "양꼬치&세트메뉴",
  "chinese-dishes": "중국요리",
  meals: "식사",
  drinks: "주류&하이볼",
};

export function MenuExplorer({ groups, initialGroupId }: MenuExplorerProps) {
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId ?? "all");
  const visibleGroups =
    activeGroupId === "all"
      ? groups
      : groups.filter((group) => group.id === activeGroupId);
  return (
    <section className="full-menu-explorer" aria-label="메뉴 탐색">
      <header className="full-menu-intro full-menu-shell">
        <h1>전체메뉴</h1>
        <p>44개 메뉴 · 모란본점 · 판교점</p>
      </header>
      <div className="full-menu-filter-panel">
        <nav className="full-menu-tabs full-menu-shell" aria-label="메뉴 분류 선택">
          <div className="full-menu-tabs__scroller">
            {groups.map((group) => (
              <button
                className="full-menu-tab full-menu-tab--category"
                type="button"
                key={group.id}
                aria-pressed={activeGroupId === group.id}
                onClick={() => setActiveGroupId(group.id)}
              >
                {MENU_CATEGORY_LABELS[group.id] ?? group.title}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="full-menu-content full-menu-shell">
        {visibleGroups.length === 0 ? (
          <p className="full-menu-empty">등록된 메뉴가 없습니다.</p>
        ) : (
          visibleGroups.map((group) => {
            const regularItems = group.items.filter((item) => item.subsection !== "highball");
            const highballItems = group.items.filter((item) => item.subsection === "highball");
            return (
              <section className="full-menu-section" aria-labelledby={`menu-title-${group.id}`} key={group.id}>
                <div className="full-menu-section__heading">
                  <h2 id={`menu-title-${group.id}`}>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
                <ul className="full-menu-section__items">
                  {regularItems.map((item, index) => (
                    <FullMenuCard item={item} fallbackImageSrc={group.fallbackImageSrc} key={`${group.id}-${item.name}-${item.price}-${index}`} />
                  ))}
                </ul>
                {highballItems.length > 0 ? (
                  <section className="full-menu-subsection" aria-labelledby={`highball-title-${group.id}`}>
                    <div className="full-menu-subsection__heading">
                      <h2 id={`highball-title-${group.id}`}>하이볼</h2>
                      <p>각 브랜드의 개성을 시원하게 즐기는 하이볼 메뉴</p>
                    </div>
                    <ul className="full-menu-section__items full-menu-section__items--highballs">
                      {highballItems.map((item, index) => (
                        <FullMenuCard item={item} fallbackImageSrc={group.fallbackImageSrc} key={`${group.id}-highball-${item.name}-${item.price}-${index}`} />
                      ))}
                    </ul>
                  </section>
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </section>
  );
}

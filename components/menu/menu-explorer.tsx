"use client";

import { useState } from "react";
import { FullMenuCard } from "@/components/menu/full-menu-card";
import type { FullMenuGroup } from "@/lib/menu-content";

type MenuBranchId = "all" | "moran" | "pangyo";

const MENU_BRANCHES: { id: MenuBranchId; label: string }[] = [
  { id: "all", label: "전체메뉴" },
  { id: "moran", label: "모란본점" },
  { id: "pangyo", label: "판교점" },
];

type MenuExplorerProps = {
  groups: FullMenuGroup[];
  initialGroupId?: string;
};

export function MenuExplorer({ groups, initialGroupId }: MenuExplorerProps) {
  const [activeBranch, setActiveBranch] = useState<MenuBranchId>("all");
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId ?? "all");
  const visibleGroups =
    activeGroupId === "all"
      ? groups
      : groups.filter((group) => group.id === activeGroupId);
  const visibleCount = visibleGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const branchLabel =
    MENU_BRANCHES.find((branch) => branch.id === activeBranch)?.label ??
    "전체메뉴";

  return (
    <section className="full-menu-explorer" aria-label="메뉴 탐색">
      <div className="full-menu-filter-panel">
        <nav className="full-menu-tabs full-menu-shell" aria-label="지점별 메뉴 선택">
          <div className="full-menu-tabs__scroller">
            {MENU_BRANCHES.map((branch) => (
              <button
                className="full-menu-tab full-menu-tab--branch"
                type="button"
                key={branch.id}
                aria-pressed={activeBranch === branch.id}
                onClick={() => setActiveBranch(branch.id)}
              >
                {branch.label}
              </button>
            ))}
          </div>
        </nav>
        <nav className="full-menu-tabs full-menu-shell" aria-label="메뉴 분류 선택">
          <div className="full-menu-tabs__scroller">
            <button
              className="full-menu-tab full-menu-tab--category"
              type="button"
              aria-pressed={activeGroupId === "all"}
              onClick={() => setActiveGroupId("all")}
            >
              전체 분류
            </button>
            {groups.map((group) => (
              <button
                className="full-menu-tab full-menu-tab--category"
                type="button"
                key={group.id}
                aria-pressed={activeGroupId === group.id}
                onClick={() => setActiveGroupId(group.id)}
              >
                {group.title} {group.items.length}
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="full-menu-content full-menu-shell">
        <div className="full-menu-results-heading">
          <div>
            <p>{branchLabel}</p>
            <h2>{activeGroupId === "all" ? "전체 메뉴" : visibleGroups[0]?.title}</h2>
          </div>
          <strong>{visibleCount} MENUS · 두 지점 공통</strong>
        </div>
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

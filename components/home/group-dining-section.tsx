import Image from "next/image";

import { BOOKING_LOCATIONS, LOCATIONS } from "@/lib/site-content";

const DINING_OCCASIONS = [
  { label: "단체회식", icon: "◎" },
  { label: "가족외식", icon: "♧" },
  { label: "청첩장모임", icon: "◇" },
  { label: "비즈니스 미팅", icon: "▣" },
  { label: "친구모임", icon: "◌" },
  { label: "데이트 · 기념일", icon: "♡" },
] as const;

const BRANCH_DINING_GUIDES = {
  moran: {
    title: "모란역 가까이에서 편안하게",
    occasions: "단체모임 · 친구모임 · 가족외식 · 청첩장모임",
    menu: "통양다리구이 · 양꼬치 · 다양한 중국요리",
    image: "/images/wangjing/moran-group-dining.jpg",
    imageAlt:
      "왕징양다리양꼬치 모란본점 단체석과 통양다리구이 식사 공간",
    recommendationTitle: "모란본점은 이런 분께 추천합니다",
    recommendation:
      "모란역 인근에서 회식, 성남 가족외식, 청첩장모임 장소를 찾는다면 모란본점이 좋습니다. 넉넉한 단체석에서 통양다리구이와 양꼬치, 다양한 중국요리를 함께 즐길 수 있습니다.",
  },
  pangyo: {
    title: "판교역과 라스트리트 가까이",
    occasions: "회식 · 비즈니스 미팅 · 가족모임 · 데이트",
    menu: "통양다리구이 · 양꼬치 · 프리미엄 양갈비",
    image: "/images/wangjing/pangyo-group-dining.jpg",
    imageAlt:
      "왕징양다리양꼬치 판교점 단체석과 통양다리구이 식사 공간",
    recommendationTitle: "판교점은 이런 분께 추천합니다",
    recommendation:
      "판교역 회식, 판교 데이트, 비즈니스 미팅 장소를 찾는다면 판교점이 좋습니다. 라스트리트 접근성과 편리한 주차, 프리미엄 양고기 메뉴로 편안한 모임을 준비할 수 있습니다.",
  },
} as const;

const BRANCH_DETAIL_LABELS = [
  { label: "오시는길", icon: "●" },
  { label: "추천모임", icon: "♧" },
  { label: "대표메뉴", icon: "♢" },
  { label: "주차안내", icon: "▰" },
] as const;

const GROUP_FEATURES = [
  { value: "48시간 숙성", detail: "잡내는 줄이고 부드러운 육질 완성", icon: "◒" },
  { value: "400℃ 숯불", detail: "풍미를 살리는 불향", icon: "♨" },
  { value: "60분 정성 구이", detail: "겉바속촉 완성", icon: "◷" },
  {
    value: "모든 모임을 위한 공간",
    detail: "회식 · 가족 · 데이트 · 청첩장모임",
    icon: "♧",
  },
] as const;

export function GroupDiningSection() {
  return (
    <section
      className="section section--light group group--seo"
      id="group"
      aria-labelledby="group-title"
    >
      <div className="group-seo__inner">
        <header className="group-seo__header">
          <p className="eyebrow eyebrow--red">DINING &amp; LOCATION</p>
          <h2 id="group-title">
            판교 회식부터 모란 가족모임까지,
            <span>두 지점에서 만나는 왕징</span>
          </h2>
          <p>
            성남 판교점과 모란본점은 왕징양다리양꼬치의 대표 메뉴인
            통양다리구이, 양꼬치, 양갈비와 정통 중국요리를 맛볼 수 있으며,
            회식 · 가족외식 · 청첩장모임 · 데이트까지 다양한 모임에 어울리는
            공간을 제공합니다.
          </p>
        </header>

        <ul className="group-seo__occasions" aria-label="추천 모임">
          {DINING_OCCASIONS.map((occasion) => (
            <li key={occasion.label}>
              <span className="group-seo__occasion-icon" aria-hidden="true">
                {occasion.icon}
              </span>
              {occasion.label}
            </li>
          ))}
        </ul>

        <div className="group-seo__branch-grid">
          {LOCATIONS.map((location) => {
            const guide = BRANCH_DINING_GUIDES[location.id];
            const booking = BOOKING_LOCATIONS.find(
              (item) => item.id === location.id,
            );

            return (
              <article className="group-seo__branch-card" key={location.id}>
                <div className="group-seo__branch-top">
                  <div>
                    <div className="group-seo__branch-heading">
                      <span>{location.areaLabel}</span>
                      <h3>{location.shortName}</h3>
                    </div>
                    <h4>{guide.title}</h4>
                  </div>
                  <div className="group-seo__branch-image">
                    <Image
                      src={guide.image}
                      alt={guide.imageAlt}
                      fill
                      sizes="(max-width: 767px) calc(100vw - 72px), 280px"
                    />
                  </div>
                </div>
                <dl>
                  {[location.transit, guide.occasions, guide.menu, location.parking].map(
                    (detail, index) => (
                      <div key={BRANCH_DETAIL_LABELS[index].label}>
                        <dt>
                          <span aria-hidden="true">
                            {BRANCH_DETAIL_LABELS[index].icon}
                          </span>
                          {BRANCH_DETAIL_LABELS[index].label}
                        </dt>
                        <dd>{detail}</dd>
                      </div>
                    ),
                  )}
                </dl>
                <div className="group-seo__actions">
                  {booking ? (
                    <a
                      className="button button--primary"
                      href={booking.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {location.shortName} 예약
                    </a>
                  ) : null}
                  <a
                    className="button button--outline-dark"
                    href={location.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {location.shortName} 길찾기
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <p className="group-seo__principle-band">
          성남에서 통양다리구이와 양꼬치를 찾는다면, 왕징양다리양꼬치는
          판교점과 모란본점 두 곳에서 동일한 숙성 원칙과 숯불 조리 방식으로
          고객을 맞이합니다. 가까운 지점을 선택해 왕징만의 깊은 풍미를
          경험해 보세요.
        </p>

        <div className="group-seo__recommendation-grid">
          {LOCATIONS.map((location) => {
            const guide = BRANCH_DINING_GUIDES[location.id];

            return (
              <article
                className="group-seo__recommendation-card"
                key={`${location.id}-recommendation`}
              >
                <div className="group-seo__recommendation-image">
                  <Image
                    src={guide.image}
                    alt={`${location.shortName} 모임 공간 추천`}
                    fill
                    sizes="(max-width: 767px) calc(100vw - 72px), 230px"
                  />
                </div>
                <div>
                  <h3>{guide.recommendationTitle}</h3>
                  <p>{guide.recommendation}</p>
                </div>
              </article>
            );
          })}
        </div>

        <ul className="group-seo__feature-band" aria-label="왕징 모임의 특징">
          {GROUP_FEATURES.map((feature) => (
            <li key={feature.value}>
              <span aria-hidden="true">{feature.icon}</span>
              <div>
                <strong>{feature.value}</strong>
                <small>{feature.detail}</small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

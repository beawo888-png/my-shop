export type NavItem = { label: string; href: `#${string}` };
export type BookingLocation = {
  id: "moran" | "pangyo";
  label: string;
  url: string;
};
export type TrustItem = { value: string; label: string };
export type MenuItem = {
  name: string;
  price: string;
  description: string;
  image: string;
  alt: string;
};
export type Review = { quote: string; category: string; date: string };
export type Location = {
  id: "moran" | "pangyo";
  areaLabel: string;
  shortName: string;
  name: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  address: string;
  transit: string;
  phoneDisplay: string;
  phoneHref: `tel:${string}`;
  mapUrl: string;
};

export const SITE = {
  name: "판교왕징",
  hanja: "王京",
  phoneDisplay: "0507-1313-5688",
  phoneHref: "tel:050713135688",
  address: "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
  transit: "판교역 4번 출구에서 약 266m",
  bookingUrl: "https://booking.naver.com/booking/6/bizes/970819",
  mapUrl:
    "https://map.naver.com/p/search/경기 성남시 분당구 대왕판교로606번길 10",
} as const;

export const BOOKING_LOCATIONS: BookingLocation[] = [
  {
    id: "moran",
    label: "모란본점 예약",
    url: "https://booking.naver.com/booking/6/bizes/721603",
  },
  {
    id: "pangyo",
    label: "판교점 예약",
    url: SITE.bookingUrl,
  },
];

export const LOCATIONS: Location[] = [
  {
    id: "moran",
    areaLabel: "MORAN",
    shortName: "모란본점",
    name: "왕징양다리양꼬치 모란본점",
    image: "/images/wangjing/moran-storefront.png",
    imageAlt: "왕징양다리양꼬치 모란본점 외관과 입구",
    imagePosition: "center 52%",
    address: "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    transit: "모란역 4번 출구에서 215m",
    phoneDisplay: "0507-1377-5688",
    phoneHref: "tel:050713775688",
    mapUrl: "https://map.naver.com/v5/entry/place/1938356292",
  },
  {
    id: "pangyo",
    areaLabel: "PANGYO",
    shortName: "판교점",
    name: "왕징양다리양꼬치 판교점",
    image: "/images/wangjing/storefront.jpg",
    imageAlt: "왕징양다리양꼬치 판교점 외관과 간판",
    imagePosition: "center",
    address: "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    transit: "판교역 4번 출구에서 266m",
    phoneDisplay: "0507-1313-5688",
    phoneHref: "tel:050713135688",
    mapUrl: "https://map.naver.com/v5/entry/place/1873196958",
  },
];

export const NAV_ITEMS: NavItem[] = [
  { label: "대표 메뉴", href: "#menu" },
  { label: "왕징 이야기", href: "#story" },
  { label: "단체 모임", href: "#group" },
  { label: "고객 리뷰", href: "#reviews" },
  { label: "지점 안내", href: "#location" },
];

export const TRUST_ITEMS: TrustItem[] = [
  { value: "3,700+", label: "방문자 리뷰" },
  { value: "판교역 4번 출구", label: "도보 약 4분" },
  { value: "주차 · 단체석", label: "예약 가능" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    name: "양꼬치",
    price: "15,000원",
    description: "숯불에 구워 육즙과 불향을 살린 왕징의 대표 메뉴",
    image: "/images/wangjing/spicy-skewers.png",
    alt: "숯불 위에서 굽고 있는 판교왕징 양꼬치",
  },
  {
    name: "양갈비살꼬치",
    price: "18,000원",
    description: "부드러운 식감과 진한 풍미를 즐기는 프리미엄 꼬치",
    image: "/images/wangjing/lamb-chops.png",
    alt: "불판 위에서 익어가는 양갈비",
  },
  {
    name: "꿔바로우",
    price: "22,000원",
    description: "바삭한 튀김옷과 새콤달콤한 소스의 인기 요리",
    image: "/images/wangjing/guobaorou.png",
    alt: "소스를 곁들인 바삭한 꿔바로우",
  },
];

export const GROUP_FEATURES = [
  "넓은 단체석과 회식 좌석",
  "건물 내 주차 가능",
  "유아 의자 · 남녀 화장실 구분",
] as const;

export const REVIEWS: Review[] = [
  {
    quote:
      "양꼬치가 부드럽고 잡내 없이 맛있어요. 넓어서 회식 장소로도 좋았습니다.",
    category: "음식 · 단체 모임",
    date: "2026. 07",
  },
  {
    quote: "판교역에서 가깝고 주차도 편해 가족들과 방문하기 좋았어요.",
    category: "위치 · 주차",
    date: "2026. 06",
  },
  {
    quote:
      "메뉴가 다양하고 직원분들이 친절하게 설명해 주셔서 즐겁게 먹었습니다.",
    category: "서비스 · 메뉴",
    date: "2026. 06",
  },
];

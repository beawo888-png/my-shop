export type NavItem = {
  label: string;
  href: string;
  newTab?: boolean;
};
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
  parking: string;
  googleDirectionsUrl: string;
  mapUrl: string;
  reviewUrl: string;
  kakaoReviewUrl: string;
  googleReviewUrl: string;
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
    transit: "모란역 4번 출구에서 215m 도보 5분",
    phoneDisplay: "0507-1377-5688",
    phoneHref: "tel:050713775688",
    parking: "가게 앞 4대 무료주차 · 모란공영주차장",
    googleDirectionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EB%91%94%EC%B4%8C%EB%8C%80%EB%A1%9C151%EB%B2%88%EA%B8%B8%2048%20%EC%84%B1%EC%8A%88%ED%8D%BC%EB%B9%8C%20102%EB%8F%99%20101%ED%98%B8",
    mapUrl: "https://map.naver.com/v5/entry/place/1938356292",
    reviewUrl:
      "https://m.place.naver.com/restaurant/1938356292/review/visitor",
    kakaoReviewUrl:
      "https://map.kakao.com/?q=왕징양다리양꼬치 모란본점",
    googleReviewUrl:
      "https://www.google.com/maps/search/?api=1&query=왕징양다리양꼬치 모란본점 경기 성남시 중원구 둔촌대로151번길 48",
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
    transit: "판교역 4번 출구에서 266m 도보 5분",
    phoneDisplay: "0507-1313-5688",
    phoneHref: "tel:050713135688",
    parking:
      "라스트리트 3시간 무료 · 공영주차장",
    googleDirectionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EB%B6%84%EB%8B%B9%EA%B5%AC%20%EB%8C%80%EC%99%95%ED%8C%90%EA%B5%90%EB%A1%9C606%EB%B2%88%EA%B8%B8%2010%2C%20205%ED%98%B8%C2%B7206%ED%98%B8",
    mapUrl: "https://map.naver.com/v5/entry/place/1873196958",
    reviewUrl:
      "https://m.place.naver.com/restaurant/1873196958/review/visitor",
    kakaoReviewUrl:
      "https://map.kakao.com/?q=왕징양다리양꼬치 판교점",
    googleReviewUrl:
      "https://www.google.com/maps/search/?api=1&query=왕징양다리양꼬치 판교점 경기 성남시 분당구 대왕판교로606번길 10",
  },
];

export const NAV_ITEMS: NavItem[] = [
  { label: "대표 메뉴", href: "/menu", newTab: true },
  { label: "브랜드 스토리", href: "#story" },
  { label: "단체 모임", href: "#group" },
  { label: "고객 리뷰", href: "/reviews" },
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

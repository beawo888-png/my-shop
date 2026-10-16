/**
 * 스마트플레이스 소식에 넣을 지점별 사실 정보.
 * 홈페이지(lib/site-content.ts, 메뉴판 data/menu.csv)와 같은 내용만 쓴다.
 */

export const BRANCHES = {
  pangyo: {
    id: "pangyo",
    name: "판교점",
    area: "판교",
    station: "판교역",
    transit: "판교역 4번 출구에서 도보 5분",
    parking: "라스트리트 주차 3시간 무료, 인근 공영주차장도 이용하실 수 있습니다.",
    occasions: "회식·비즈니스 미팅·데이트",
    groupSeats: "최대 70명",
    phone: "0507-1313-5688",
    storefront: "storefront.jpg",
    groupPhoto: "pangyo-group-dining.jpg",
  },
  moran: {
    id: "moran",
    name: "모란본점",
    area: "모란",
    station: "모란역",
    transit: "모란역 4번 출구에서 도보 5분",
    parking: "가게 앞 무료주차 4대, 바로 옆 모란공영주차장도 이용하실 수 있습니다.",
    occasions: "가족외식·청첩장 모임·단체 회식",
    groupSeats: "최대 46명",
    phone: "0507-1377-5688",
    storefront: "moran-storefront.png",
    groupPhoto: "moran-group-dining.jpg",
  },
};

export const BRANCH_IDS = Object.keys(BRANCHES);

/** 원고의 {자리표시}를 지점 정보로 바꾼다. */
const PLACEHOLDERS = {
  지점: "name",
  지역: "area",
  역: "station",
  오시는길: "transit",
  주차: "parking",
  모임: "occasions",
  단체석: "groupSeats",
  전화: "phone",
  외관사진: "storefront",
  단체석사진: "groupPhoto",
};

export function fillPlaceholders(text, branch) {
  return text.replace(/\{([^{}]+)\}/g, (match, key) => {
    const field = PLACEHOLDERS[key];
    if (!field) throw new Error(`알 수 없는 자리표시 ${match}`);
    return branch[field];
  });
}

export function findPlaceholders(text) {
  return [...text.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]);
}

export const KNOWN_PLACEHOLDERS = Object.keys(PLACEHOLDERS);

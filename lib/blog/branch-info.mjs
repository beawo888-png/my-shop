/**
 * 네이버 블로그 글 끝에 넣을 지점별 안내(주소·지도·예약)와 블로그 주소.
 * 홈페이지(lib/site-content.ts)와 같은 내용만 쓴다. 바꿀 때는 두 곳을 같이 바꾼다.
 * 네이버 비밀번호는 여기에 두지 않는다. 로그인은 지점별 전용 브라우저 창에 한 번만 해 둔다.
 */

export const BLOG_BRANCHES = {
  pangyo: {
    blogId: "wangjing_lamb",
    fullName: "왕징양다리양꼬치 판교점",
    address: "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    transit: "판교역 4번 출구에서 도보 5분 (266m)",
    parking: "라스트리트 주차 3시간 무료, 공영주차장 이용 가능",
    groupSeats: "최대 70명 (회식·비즈니스 미팅)",
    mapUrl: "https://map.naver.com/v5/entry/place/1873196958",
    bookingUrl: "https://booking.naver.com/booking/6/bizes/970819",
    storefront: "storefront.jpg",
    // 판교점 단체석 사진(pangyo-group-dining.jpg)은 메뉴판 가격과 '30분 전 예약' 문구가 읽혀서 쓰지 않는다.
    interior: "dining-room.jpg",
    tags: ["판교맛집", "판교역맛집", "판교양꼬치", "판교회식", "판교중식", "왕징판교점", "라스트리트맛집"],
  },
  moran: {
    blogId: "ruilian417",
    fullName: "왕징양다리양꼬치 모란본점",
    address: "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    transit: "모란역 4번 출구에서 도보 5분 (215m)",
    parking: "가게 앞 무료주차 4대, 모란공영주차장 이용 가능",
    groupSeats: "최대 46명 (회식·가족외식·청첩장 모임)",
    mapUrl: "https://map.naver.com/v5/entry/place/1938356292",
    bookingUrl: "https://booking.naver.com/booking/6/bizes/721603",
    storefront: "moran-storefront.png",
    interior: "moran-group-dining.jpg",
    tags: ["모란맛집", "모란역맛집", "모란양꼬치", "모란회식", "성남맛집", "성남가족외식", "왕징모란본점"],
  },
};

/** 블로그 글쓰기 화면 주소. config.json의 blogId가 있으면 그것을 쓴다. */
export function postWriteUrl(blogId) {
  return `https://blog.naver.com/${blogId}/postwrite`;
}

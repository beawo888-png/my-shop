import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(
  new URL("../lib/site-content.ts", import.meta.url),
  "utf8",
).catch(() => "");

test("site content contains verified business details", () => {
  assert.match(
    source,
    /https:\/\/booking\.naver\.com\/booking\/6\/bizes\/970819/,
  );
  assert.match(source, /0507-1313-5688/);
  assert.match(source, /tel:050713135688/);
  assert.match(source, /대왕판교로606번길 10/);
});

test("site content defines Moran and Pangyo booking choices in order", () => {
  assert.match(source, /export const BOOKING_LOCATIONS/);

  const moranUrl =
    "https://booking.naver.com/booking/6/bizes/721603";
  const pangyoUrl =
    "https://booking.naver.com/booking/6/bizes/970819";

  for (const value of [
    'id: "moran"',
    'label: "모란본점 예약"',
    moranUrl,
    'id: "pangyo"',
    'label: "판교점 예약"',
    pangyoUrl,
  ]) {
    assert.ok(source.includes(value), `booking data should include ${value}`);
  }

  const bookingStart = source.indexOf("export const BOOKING_LOCATIONS");
  const moranIndex = source.indexOf('id: "moran"', bookingStart);
  const pangyoIndex = source.indexOf('id: "pangyo"', bookingStart);
  assert.ok(moranIndex >= 0 && moranIndex < pangyoIndex);
});

test("site content defines both Wangjing locations", () => {
  assert.match(source, /export const LOCATIONS/);
  assert.match(source, /\{ label: "지점 안내", href: "#location" \}/);

  for (const value of [
    "왕징양다리양꼬치 모란본점",
    "경기 성남시 중원구 둔촌대로151번길 48 성슈퍼빌 102동 101호",
    "모란역 4번 출구에서 215m 도보 5분",
    "0507-1377-5688",
    "tel:050713775688",
    "https://map.naver.com/v5/entry/place/1938356292",
    "왕징양다리양꼬치 판교점",
    "경기 성남시 분당구 대왕판교로606번길 10, 205호·206호",
    "판교역 4번 출구에서 266m 도보 5분",
    "0507-1313-5688",
    "tel:050713135688",
    "https://map.naver.com/v5/entry/place/1873196958",
  ]) {
    assert.ok(source.includes(value), `site content should include ${value}`);
  }

  const moranIndex = source.indexOf('shortName: "모란본점"');
  const pangyoIndex = source.indexOf('shortName: "판교점"');
  assert.ok(moranIndex >= 0, "모란본점 데이터가 있어야 합니다");
  assert.ok(pangyoIndex >= 0, "판교점 데이터가 있어야 합니다");
  assert.ok(moranIndex < pangyoIndex, "모란본점이 판교점보다 먼저 와야 합니다");
});

test("location data defines parking and Google directions for both branches", () => {
  const moranGoogle =
    "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EC%A4%91%EC%9B%90%EA%B5%AC%20%EB%91%94%EC%B4%8C%EB%8C%80%EB%A1%9C151%EB%B2%88%EA%B8%B8%2048%20%EC%84%B1%EC%8A%88%ED%8D%BC%EB%B9%8C%20102%EB%8F%99%20101%ED%98%B8";
  const pangyoGoogle =
    "https://www.google.com/maps/dir/?api=1&destination=%EA%B2%BD%EA%B8%B0%20%EC%84%B1%EB%82%A8%EC%8B%9C%20%EB%B6%84%EB%8B%B9%EA%B5%AC%20%EB%8C%80%EC%99%95%ED%8C%90%EA%B5%90%EB%A1%9C606%EB%B2%88%EA%B8%B8%2010%2C%20205%ED%98%B8%C2%B7206%ED%98%B8";

  assert.match(source, /parking: string/);
  assert.match(source, /googleDirectionsUrl: string/);
  assert.ok(
    source.includes(
      "가게 앞 4대 무료주차 · 모란공영주차장",
    ),
  );
  assert.ok(
    source.includes(
      "라스트리트 3시간 무료 · 공영주차장",
    ),
  );
  assert.ok(source.includes(moranGoogle));
  assert.ok(source.includes(pangyoGoogle));
  assert.ok(source.indexOf(moranGoogle) < source.indexOf(pangyoGoogle));
});

test("site content defines branch review links and review navigation", () => {
  const moranReview =
    "https://m.place.naver.com/restaurant/1938356292/review/visitor";
  const pangyoReview =
    "https://m.place.naver.com/restaurant/1873196958/review/visitor";

  assert.match(source, /reviewUrl: string/);
  assert.match(source, /kakaoReviewUrl: string/);
  assert.match(source, /googleReviewUrl: string/);
  assert.equal(source.match(/kakaoReviewUrl:/g)?.length, 3);
  assert.equal(source.match(/googleReviewUrl:/g)?.length, 3);
  assert.ok(source.includes(moranReview));
  assert.ok(source.includes(pangyoReview));
  assert.ok(source.indexOf(moranReview) < source.indexOf(pangyoReview));
  assert.match(
    source,
    /\{ label: "고객 리뷰", href: "\/reviews" \}/,
  );
});

test("site content uses direct Kakao review URLs for both branches", () => {
  const moranKakaoReview =
    "https://place.map.kakao.com/1387600612#review";
  const pangyoKakaoReview =
    "https://place.map.kakao.com/1537703881#review";

  assert.ok(source.includes(moranKakaoReview));
  assert.ok(source.includes(pangyoKakaoReview));
  assert.ok(source.indexOf(moranKakaoReview) < source.indexOf(pangyoKakaoReview));
});

test("site content defines the three approved signature menus", () => {
  for (const menu of ["양꼬치", "양갈비살꼬치", "꿔바로우"]) {
    assert.match(source, new RegExp(menu));
  }
  for (const price of ["15,000원", "18,000원", "22,000원"]) {
    assert.match(source, new RegExp(price));
  }
});

test("site content does not contain Unsplash or fake language links", () => {
  assert.doesNotMatch(source, /images\.unsplash\.com/);
  assert.doesNotMatch(source, /KO \| EN|English/);
});

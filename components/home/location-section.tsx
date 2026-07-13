import Image from "next/image";
import { SITE } from "@/lib/site-content";

export function LocationSection() {
  return (
    <section
      className="section section--light location"
      id="location"
      aria-labelledby="location-title"
    >
      <div className="location__image image-frame">
        <Image
          src="/images/wangjing/storefront.jpg"
          alt="왕징양다리양꼬치 판교점 외관과 간판"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
      <div className="location__copy">
        <p className="eyebrow eyebrow--red">PANGYO LOCATION</p>
        <h2 id="location-title">판교점 안내</h2>
        <dl className="location-list">
          <div>
            <dt>주소</dt>
            <dd>{SITE.address}</dd>
          </div>
          <div>
            <dt>교통</dt>
            <dd>{SITE.transit} · 도보 약 4분</dd>
          </div>
          <div>
            <dt>전화</dt>
            <dd>
              <a href={SITE.phoneHref}>{SITE.phoneDisplay}</a>
            </dd>
          </div>
        </dl>
        <div className="button-row button-row--wrap">
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
          <a
            className="button button--dark"
            href={SITE.mapUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 지도
          </a>
          <a className="button button--outline-dark" href={SITE.phoneHref}>
            전화하기
          </a>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { GROUP_FEATURES, SITE } from "@/lib/site-content";

export function GroupDiningSection() {
  return (
    <section
      className="section section--light group"
      id="group"
      aria-labelledby="group-title"
    >
      <div className="group__copy">
        <p className="eyebrow eyebrow--red">GROUP DINING</p>
        <h2 id="group-title">회식과 가족 모임을 편안하게</h2>
        <p>
          판교역에서 가까운 넓은 공간과 긴 테이블을 갖춰 여러 사람이 함께하는
          자리도 여유롭게 준비할 수 있습니다.
        </p>
        <ul className="feature-list">
          {GROUP_FEATURES.map((feature) => (
            <li key={feature}>
              <span aria-hidden="true">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <div className="button-row">
          <a className="button button--dark" href={SITE.phoneHref}>
            전화 문의
          </a>
          <a
            className="button button--primary"
            href={SITE.bookingUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버 예약
          </a>
        </div>
      </div>
      <div className="group__image image-frame">
        <Image
          src="/images/wangjing/group-table.jpg"
          alt="단체 모임을 위한 판교왕징의 긴 테이블 좌석"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
    </section>
  );
}

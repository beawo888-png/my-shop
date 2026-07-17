import Link from "next/link";

export function ReviewsSection() {
  return (
    <section
      className="section section--dark reviews"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="section__heading section__heading--center">
        <p className="eyebrow eyebrow--gold">GUEST REVIEWS</p>
        <h2 id="reviews-title">지점별 고객 리뷰</h2>
        <p>모란본점과 판교점을 방문한 고객들의 실제 네이버 리뷰를 확인하세요.</p>
      </div>
      <div className="reviews__action">
        <Link className="button button--primary" href="/reviews">
          지점별 고객 리뷰 보기
        </Link>
      </div>
    </section>
  );
}

import { REVIEWS } from "@/lib/site-content";

export function ReviewsSection() {
  return (
    <section
      className="section section--dark reviews"
      id="reviews"
      aria-labelledby="reviews-title"
    >
      <div className="section__heading section__heading--center">
        <p className="eyebrow eyebrow--gold">GUEST REVIEWS</p>
        <h2 id="reviews-title">왕징을 찾은 분들의 이야기</h2>
        <p>맛과 공간, 편안한 모임을 경험한 방문자들의 후기입니다.</p>
      </div>
      <div className="review-grid">
        {REVIEWS.map((review) => (
          <article className="review-card" key={`${review.category}-${review.date}`}>
            <div className="stars" aria-label="별점 5점">
              <span aria-hidden="true">★★★★★</span>
            </div>
            <blockquote>“{review.quote}”</blockquote>
            <div className="review-card__meta">
              <span>{review.category}</span>
              <time>{review.date}</time>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

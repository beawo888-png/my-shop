import Image from "next/image";

export function StorySection() {
  return (
    <section
      className="section section--dark story"
      id="story"
      aria-labelledby="story-title"
    >
      <div className="story__image image-frame">
        <Image
          src="/images/wangjing/roast-lamb.png"
          alt="숯불 위에서 천천히 익어가는 통양다리"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
      <div className="story__copy">
        <p className="eyebrow eyebrow--gold">THE WANGJING STORY</p>
        <h2 id="story-title">한 점의 양고기에 불과 시간을 담았습니다</h2>
        <p>
          왕징은 좋은 양고기의 풍미를 가장 맛있게 전하기 위해 숯의 온도와
          굽는 시간을 세심하게 맞춥니다. 잡내 없이 부드러운 육질, 입안에
          은은히 남는 불향까지 중요한 식사를 더 오래 기억할 수 있도록
          정성껏 준비합니다.
        </p>
        <p>
          양꼬치부터 정통 중국 요리까지 한 자리에서 넉넉히 즐길 수 있어
          가족 식사와 동료 모임 모두 편안합니다.
        </p>
      </div>
    </section>
  );
}

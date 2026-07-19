import Image from "next/image";

const WANGJING_PROMISES = [
  {
    number: "01",
    title: "600일의 집념",
    description:
      "베이징 왕징에서 받은 감동을 한국에서 다시 완성하기 위해 수백 번의 테스트와 시행착오를 거쳤습니다.",
    points: [
      "베이징 왕징 골목에서 시작된 맛의 감동",
      "수백 번의 테스트와 실패",
      "600일 끝에 완성된 왕징의 맛",
    ],
  },
  {
    number: "02",
    title: "비법 숙성",
    description:
      "엄선한 양고기에 왕징의 숙성 방식을 더해 잡내는 줄이고 풍미와 육즙은 깊게 살립니다.",
    points: [
      "엄선한 프리미엄 양고기",
      "15가지 향신 재료를 24시간 우려낸 비법",
      "48시간 저온 숙성",
    ],
  },
  {
    number: "03",
    title: "정교한 온도",
    description:
      "불의 세기를 세심하게 바꾸며 겉은 노릇하고 속은 촉촉한 양다리 바베큐를 완성합니다.",
    points: [
      "초벌 180°C · 겉면을 단단하게",
      "중간 400°C · 육즙과 불향을 살리게",
      "최종 180°C · 속까지 부드럽게",
    ],
  },
  {
    number: "04",
    title: "60분의 정성",
    description:
      "서두르지 않고 손질부터 굽기까지 모든 과정을 지켜 가장 맛있는 순간을 완성합니다.",
    points: [
      "STEP 1 · 정성스러운 손질",
      "STEP 2 · 숙성된 고기 준비",
      "STEP 3 · 온도 조절과 굽기",
      "STEP 4 · 완벽한 바베큐 완성",
    ],
  },
] as const;

export function StorySection() {
  return (
    <section
      className="section section--dark story story--seo story--brand"
      id="story"
      aria-labelledby="story-title"
    >
      <div className="story__visual">
        <Image
          src="/images/wangjing/roast-lamb.png"
          alt="왕징양다리양꼬치의 숯불 통양다리구이"
          fill
          sizes="(max-width: 1023px) 100vw, 42vw"
        />
        <div className="story__visual-overlay" aria-hidden="true" />
        <div className="story__intro">
          <p className="eyebrow eyebrow--gold">BRAND STORY</p>
          <h2 id="story-title">
            한 번의 감동을,
            <span>한국에서 다시 완성하다.</span>
          </h2>

          <div className="story__brand-copy">
            <p>
              왕징양다리양꼬치는 중국 <strong>베이징 왕징(望京)</strong>에서
              맛본 양고기 바베큐의 감동에서 시작되었습니다.
            </p>
            <p>
              숯불 위에서 천천히 익어가는 양고기의 깊은 풍미와 누구나
              편안하게 즐길 수 있었던 부드러운 맛은 오래도록 기억에
              남았습니다. 그 경험은 단순히 현지의 맛을 따라 하는 것이
              아니라, <strong>한국에서도 많은 사람들이 같은 감동을 느낄 수 있는 양고기</strong>를
              만들고 싶다는 목표로 이어졌습니다.
            </p>
            <p>
              왕징양다리양꼬치는 그 목표를 이루기 위해 <strong>600일 동안</strong>
              양고기의 숙성과 조리 과정을 연구했습니다. 수많은 시행착오
              끝에 양고기 본연의 풍미를 더욱 깊게 살리고, 누구나 부담 없이
              즐길 수 있도록 자체 숙성 방식과 소스를 완성했습니다.
            </p>
            <p>
              오늘도 모든 양다리는 <strong>48시간 숙성</strong>을 거쳐
              <strong> 400℃ 숯불</strong>에서 <strong>60분 동안</strong> 정성껏
              구워집니다. 시간과 온도를 타협하지 않는 이유는 가장 맛있는
              순간의 양고기를 고객에게 전하기 위해서입니다.
            </p>
            <p>
              왕징이 만드는 것은 단순한 한 끼가 아닙니다. 가족외식, 회식,
              데이트, 청첩장 모임처럼 소중한 사람들과 함께하는 시간을 더욱
              특별하게 만드는 경험입니다. 그래서 <strong>성남 판교와 모란의
              왕징양다리양꼬치</strong>는 오늘도 좋은 음식과 따뜻한 공간으로
              고객을 맞이합니다.
            </p>
            <p>
              베이징 왕징에서 받은 영감, 600일의 연구, 48시간 숙성, 400℃
              숯불, 60분의 정성.
            </p>
          </div>

          <p className="story__closing">
            왕징양다리양꼬치는 <strong>한 점의 양고기에도 시간을 담아</strong>,
            오래 기억될 맛과 경험을 만들어갑니다.
          </p>
        </div>
      </div>

      <div className="story__standards">
        <div className="story__promise-heading">
          <p className="eyebrow eyebrow--gold">OUR FOUR PROMISES</p>
          <h2>왕징의 네 가지 약속</h2>
          <p>왕징의 양다리 바베큐가 완성되는 네 가지 기준입니다.</p>
        </div>

        <div className="story__promise-grid">
          {WANGJING_PROMISES.map((promise) => (
            <article className="story__promise-card" key={promise.number}>
              <span className="story__promise-number" aria-hidden="true">
                {promise.number}
              </span>
              <h3>{promise.title}</h3>
              <p>{promise.description}</p>
              <ul>
                {promise.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="story__promise-line">
          600일의 집념 · 비법 숙성 · 정교한 온도 · 60분의 정성
        </p>
      </div>
    </section>
  );
}

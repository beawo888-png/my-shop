export type FaqSegment = {
  text: string;
  strong?: boolean;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: readonly FaqSegment[];
};

export const FAQ_ITEMS = [
  {
    id: "lamb-aroma",
    question: "양고기 특유의 잡내가 걱정돼요.",
    answer: [
      {
        text: "왕징의 양고기는 15가지 향신 재료를 24시간 우려낸 비법으로 48시간 저온 숙성합니다. 잡내는 줄이고 풍미와 육즙은 살려, 양고기를 처음 드시는 분도 편하게 즐기실 수 있습니다. 처음이시라면 달콤 짭조름한 양념양꼬치부터 시작해 보세요.",
      },
    ],
  },
  {
    id: "whole-lamb-order",
    question: "통양다리구이는 어떻게 주문하나요?",
    answer: [
      { text: "통양다리구이는 " },
      { text: "대 1,700g(3~4인, 90,000원)", strong: true },
      { text: "과 " },
      { text: "중 1,500g(2~3인, 80,000원)", strong: true },
      {
        text: " 두 가지 크기로 준비됩니다. 400℃ 숯불에서 60분 동안 굽는 메뉴라서 방문 전에 네이버 예약이나 전화로 미리 말씀해 주시면 더 여유롭게 즐기실 수 있습니다.",
      },
    ],
  },
  {
    id: "group-dining",
    question: "단체 회식이나 청첩장 모임도 가능한가요?",
    answer: [
      { text: "네, 가능합니다. 단체석은 " },
      { text: "모란본점 최대 46명", strong: true },
      { text: ", " },
      { text: "판교점 최대 70명", strong: true },
      {
        text: "까지 이용하실 수 있습니다. 모란본점은 회식·가족외식·청첩장 모임에, 판교점은 회식·비즈니스 미팅에 특히 많이 찾아주십니다. 인원과 좌석 배치는 지점으로 전화 주시면 맞춰 준비해 드립니다.",
      },
    ],
  },
  {
    id: "parking",
    question: "주차는 어떻게 하나요?",
    answer: [
      {
        text: "모란본점은 가게 앞 무료주차 4대와 모란공영주차장을 이용하실 수 있습니다. 판교점은 라스트리트 주차장 3시간 무료이며, 인근 공영주차장도 이용 가능합니다.",
      },
    ],
  },
  {
    id: "reservation",
    question: "예약은 꼭 해야 하나요?",
    answer: [
      {
        text: "워크인 방문도 가능하지만, 저녁 시간과 주말에는 대기가 생길 수 있습니다. 네이버 예약으로 원하는 시간과 인원을 미리 알려주시면 편하게 모시겠습니다.",
      },
    ],
  },
  {
    id: "other-menu",
    question: "양고기 말고 다른 메뉴도 있나요?",
    answer: [
      {
        text: "꿔바로우, 마라샹궈, 소룽샤, 향라대하 등 정통 중국요리와 볶음밥·면·만두, 그리고 연태구냥·공부가주 같은 중국 백주와 맥주도 다양하게 준비되어 있습니다. 양고기와 곁들이기 좋은 메뉴를 취향에 맞게 선택하실 수 있습니다.",
      },
    ],
  },
] as const satisfies readonly FaqEntry[];

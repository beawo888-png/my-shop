export type FullMenuItem = {
  name: string;
  price: string;
  description?: string;
};

export type FullMenuGroup = {
  id: "lamb-skewers" | "chinese-dishes" | "meals" | "lunch" | "drinks";
  title: string;
  description: string;
  items: FullMenuItem[];
};

export const PANGYO_MENU_SOURCE_URL =
  "https://m.place.naver.com/restaurant/1873196958/menu/list";
export const PANGYO_MENU_CHECKED_AT = "2026년 7월 15일";
export const PANGYO_MENU_COUNT = 52;

export const PANGYO_MENU_GROUPS: FullMenuGroup[] = [
  {
    id: "lamb-skewers",
    title: "양고기·꼬치",
    description: "불향과 육즙을 즐기는 왕징의 대표 메뉴",
    items: [
      { name: "비쥬얼 쇼크! 육즙 팡팡 양다리", price: "90,000원" },
      { name: "비쥬얼 쇼크! 육즙 팡팡 양다리", price: "80,000원" },
      { name: "고급양갈비", price: "30,000원" },
      { name: "생양꼬치", price: "17,000원" },
      { name: "양념양꼬치", price: "18,000원" },
      { name: "양갈비살꼬치", price: "18,000원" },
      { name: "새우꼬치", price: "18,000원" },
    ],
  },
  {
    id: "chinese-dishes",
    title: "중국요리·탕",
    description: "함께 나누기 좋은 정통 중국요리",
    items: [
      { name: "꿔바로우", price: "20,000원" },
      { name: "가지튀김", price: "18,000원" },
      { name: "토마토계란볶음", price: "16,000원" },
      { name: "마파두부", price: "15,000원" },
      { name: "향라대하", price: "22,000원" },
      { name: "어향육사", price: "19,000원" },
      { name: "경장육사", price: "19,000원" },
      { name: "마라탕", price: "18,000원" },
      { name: "소룽샤", price: "38,000원" },
      { name: "지삼선", price: "18,000원" },
      { name: "건두부볶음", price: "16,000원" },
      { name: "오이무침", price: "12,000원" },
      { name: "즈란양고기", price: "28,000원" },
      { name: "마라샹궈", price: "32,000원" },
      { name: "건두부무침", price: "16,000원" },
      { name: "양탕", price: "15,000원" },
    ],
  },
  {
    id: "meals",
    title: "식사·면·디저트",
    description: "요리와 곁들이거나 든든하게 마무리하는 메뉴",
    items: [
      { name: "계란볶음밥", price: "8,000원" },
      { name: "가지볶음밥", price: "8,000원" },
      { name: "옥수수온면", price: "8,000원" },
      { name: "냉면", price: "8,000원" },
      { name: "물만두", price: "8,000원" },
      { name: "꽃빵튀김", price: "8,000원" },
    ],
  },
  {
    id: "lunch",
    title: "점심특선",
    description: "점심에만 만나는 든든한 한 그릇",
    items: [
      { name: "홍소로우+야채덮밥", price: "12,900원" },
      { name: "즈란양고기+야채덮밥", price: "12,900원" },
      { name: "목: 콜라닭 마파두부 덮밥", price: "12,900원" },
      { name: "금: 고추돼지고기 녹두나물덮밥", price: "12,900원" },
      { name: "토: 홍소돼지등뼈 브로콜리덮밥", price: "12,900원" },
    ],
  },
  {
    id: "drinks",
    title: "주류·하이볼",
    description: "양고기와 어울리는 고량주와 시원한 한 잔",
    items: [
      { name: "커티삭하이볼", price: "6,000원" },
      { name: "연태구냥 500ml 34도", price: "40,000원" },
      { name: "연태구냥 250ml 34도", price: "20,000원" },
      { name: "연태구냥 125ml 34도", price: "12,000원" },
      { name: "설원 450ml 30도", price: "25,000원" },
      { name: "설원 250ml 30도", price: "15,000원" },
      { name: "공부가주 500ml 33도", price: "50,000원" },
      { name: "노주탄 500ml 33도", price: "30,000원" },
      { name: "이과두주 125ml 56도", price: "5,000원" },
      { name: "컵술 고량주 100ml 38도", price: "5,000원" },
      { name: "칭다오 맥주 640ml 4.7도", price: "7,000원" },
      { name: "하얼빈 맥주 500ml 4.3도", price: "7,000원" },
      { name: "타이거 맥주 640ml 5도", price: "7,000원" },
      { name: "산토리하이볼", price: "8,000원" },
      { name: "봄베이하이볼", price: "8,000원" },
      { name: "짐빔하이볼", price: "7,000원" },
      { name: "제임슨하이볼", price: "8,000원" },
      { name: "연태하이볼", price: "7,000원" },
    ],
  },
];

export type MenuImageFit = "cover" | "contain";

export type FullMenuItem = {
  name: string;
  price: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageFit: MenuImageFit;
};

export type FullMenuGroup = {
  id: "lamb-skewers" | "chinese-dishes" | "meals" | "drinks";
  title: string;
  description: string;
  fallbackImageSrc: string;
  items: FullMenuItem[];
};

const menuItem = (
  name: string,
  price: string,
  description: string,
  imageFile: string,
  imageFit: MenuImageFit = "cover",
): FullMenuItem => ({
  name,
  price,
  description,
  imageSrc: `/images/wangjing/menu/${imageFile}`,
  imageAlt: `${name} 메뉴 사진`,
  imageFit,
});

export const PANGYO_MENU_SOURCE_URL =
  "https://m.place.naver.com/restaurant/1873196958/menu/list";
export const PANGYO_MENU_CHECKED_AT = "2026년 7월 15일";
export const PANGYO_MENU_COUNT = 47;

export const PANGYO_MENU_GROUPS: FullMenuGroup[] = [
  {
    id: "lamb-skewers",
    title: "양고기·꼬치",
    description: "불향과 육즙을 즐기는 왕징의 대표 메뉴",
    fallbackImageSrc: "/images/wangjing/menu/lamb-leg.jpg",
    items: [
      menuItem("비쥬얼 쇼크! 육즙 팡팡 양다리", "90,000원", "통양다리를 천천히 구워 즐기는 왕징 대표 메뉴", "lamb-leg.jpg"),
      menuItem("비쥬얼 쇼크! 육즙 팡팡 양다리", "80,000원", "육즙과 불향을 풍성하게 즐기는 통양다리", "lamb-leg.jpg"),
      menuItem("고급양갈비", "30,000원", "부드러운 육질과 진한 풍미의 양갈비", "premium-lamb-chops.jpg"),
      menuItem("생양꼬치", "17,000원", "담백한 양고기 본연의 맛을 살린 꼬치", "fresh-lamb-skewers.jpg"),
      menuItem("양념양꼬치", "18,000원", "왕징 특제 양념으로 풍미를 더한 양꼬치", "marinated-lamb-skewers.jpg"),
      menuItem("양갈비살꼬치", "18,000원", "쫄깃하고 고소한 양갈비살 꼬치", "lamb-rib-skewers.jpg"),
      menuItem("새우꼬치", "18,000원", "탱글한 새우를 노릇하게 구운 꼬치", "shrimp-skewers.png"),
    ],
  },
  {
    id: "chinese-dishes",
    title: "중국요리·탕",
    description: "함께 나누기 좋은 정통 중국요리",
    fallbackImageSrc: "/images/wangjing/menu/guobaorou.jpg",
    items: [
      menuItem("꿔바로우", "20,000원", "바삭한 튀김옷과 새콤달콤한 소스의 조화", "guobaorou.jpg"),
      menuItem("가지튀김", "18,000원", "겉은 바삭하고 속은 촉촉한 가지 요리", "fried-eggplant.jpg"),
      menuItem("토마토계란볶음", "16,000원", "부드러운 계란과 산뜻한 토마토 볶음", "tomato-egg.jpg"),
      menuItem("마파두부", "15,000원", "매콤하고 구수한 소스에 볶은 두부", "mapo-tofu.jpg"),
      menuItem("향라대하", "22,000원", "향신료의 풍미를 입힌 매콤한 새우 요리", "spicy-prawn.jpg"),
      menuItem("어향육사", "19,000원", "채소와 돼지고기를 어향 소스로 볶은 요리", "yu-xiang-pork.jpg"),
      menuItem("경장육사", "19,000원", "춘장 풍미의 돼지고기와 채소를 함께 즐기는 요리", "jingjiang-pork.jpg"),
      menuItem("마라탕", "18,000원", "얼얼하고 깊은 향의 국물 요리", "malatang.jpg"),
      menuItem("소룽샤", "38,000원", "진한 양념에 볶아낸 중국식 민물가재", "xiaolongxia.jpg"),
      menuItem("지삼선", "18,000원", "가지·감자·피망을 감칠맛 나게 볶은 요리", "di-san-xian.jpg"),
      menuItem("건두부볶음", "16,000원", "쫄깃한 건두부와 채소를 볶은 요리", "stir-fried-tofu-skin.jpg"),
      menuItem("오이무침", "12,000원", "아삭한 오이를 산뜻하게 무친 곁들임", "cucumber-salad.jpg"),
      menuItem("즈란양고기", "28,000원", "쯔란 향을 입혀 볶아낸 양고기", "cumin-lamb.jpg"),
      menuItem("마라샹궈", "32,000원", "다채로운 재료를 마라 양념에 볶은 요리", "mala-xiang-guo.jpg"),
      menuItem("건두부무침", "16,000원", "건두부와 채소를 새콤하게 무친 냉채", "tofu-skin-salad.jpg"),
      menuItem("양탕", "15,000원", "양고기의 깊고 따뜻한 맛을 담은 국물", "lamb-soup.jpg"),
    ],
  },
  {
    id: "meals",
    title: "식사·면·디저트",
    description: "요리와 곁들이거나 든든하게 마무리하는 메뉴",
    fallbackImageSrc: "/images/wangjing/menu/egg-fried-rice.jpg",
    items: [
      menuItem("계란볶음밥", "8,000원", "고슬고슬한 밥과 부드러운 계란 볶음", "egg-fried-rice.jpg"),
      menuItem("가지볶음밥", "8,000원", "가지의 감칠맛을 더한 든든한 볶음밥", "eggplant-fried-rice.jpg"),
      menuItem("옥수수온면", "8,000원", "따뜻한 국물에 담은 부드러운 옥수수면", "corn-noodle-soup.jpg"),
      menuItem("냉면", "8,000원", "시원한 육수로 깔끔하게 마무리하는 면", "cold-noodles.jpg"),
      menuItem("물만두", "8,000원", "촉촉하고 부드럽게 익힌 한입 만두", "boiled-dumplings.jpg"),
      menuItem("꽃빵튀김", "8,000원", "겉은 바삭하고 속은 폭신한 달콤한 꽃빵", "fried-flower-buns.jpg"),
    ],
  },
  {
    id: "drinks",
    title: "주류·하이볼",
    description: "양고기와 어울리는 고량주와 시원한 한 잔",
    fallbackImageSrc: "/images/wangjing/menu/chinese-liquor-toast.jpg",
    items: [
      menuItem("커티삭하이볼", "6,000원", "커티삭 위스키로 만든 시원한 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("연태구냥 500ml 34도", "40,000원", "은은한 과실 향이 특징인 중국 백주", "yantai-guniang-500ml.jpg", "contain"),
      menuItem("연태구냥 250ml 34도", "20,000원", "부드러운 향을 가볍게 즐기는 연태구냥", "yantai-guniang-250ml.jpg", "contain"),
      menuItem("연태구냥 125ml 34도", "12,000원", "한 상에 곁들이기 좋은 작은 용량의 연태구냥", "yantai-guniang-125ml.jpg", "contain"),
      menuItem("설원 450ml 30도", "25,000원", "깔끔한 목넘김의 중국 백주", "seolwon-450ml.jpg", "contain"),
      menuItem("설원 250ml 30도", "15,000원", "부담 없이 나누기 좋은 설원 백주", "seolwon-250ml.jpg", "contain"),
      menuItem("공부가주 500ml 33도", "50,000원", "깊고 부드러운 향을 지닌 중국 명주", "gongbu-gaju-500ml.jpg", "contain"),
      menuItem("노주탄 500ml 33도", "30,000원", "진한 향과 긴 여운의 중국 백주", "noju-tan-500ml.jpg", "contain"),
      menuItem("이과두주 125ml 56도", "5,000원", "힘 있는 풍미를 작은 잔으로 즐기는 고도주", "erguotou-125ml.jpg", "contain"),
      menuItem("컵술 고량주 100ml 38도", "5,000원", "양꼬치와 가볍게 곁들이는 컵 고량주", "cup-gaoliang-100ml.jpg", "contain"),
      menuItem("칭다오 맥주 640ml 4.7도", "7,000원", "양꼬치와 잘 어울리는 청량한 맥주", "beer-cheers-table.jpg", "contain"),
      menuItem("하얼빈 맥주 500ml 4.3도", "7,000원", "깔끔하고 시원한 중국 맥주", "beer-cheers-close.jpg", "contain"),
      menuItem("타이거 맥주 640ml 5도", "7,000원", "산뜻한 탄산감의 라거 맥주", "beer-cheers-table.jpg", "contain"),
      menuItem("산토리하이볼", "8,000원", "산뜻하고 깔끔하게 즐기는 위스키 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("봄베이하이볼", "8,000원", "진의 향긋함을 살린 청량한 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("짐빔하이볼", "7,000원", "버번의 고소한 풍미를 담은 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("제임슨하이볼", "8,000원", "부드러운 아이리시 위스키 하이볼", "cutty-sark-highball.jpg", "contain"),
      menuItem("연태하이볼", "7,000원", "연태구냥의 향을 산뜻하게 즐기는 하이볼", "cutty-sark-highball.jpg", "contain"),
    ],
  },
];

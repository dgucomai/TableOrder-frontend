export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: 'Main' | 'Sides' | 'Drinks';
  image: string;
  description: string;
}

export const FESTIVAL_MENU: MenuItem[] = [
  // --- Main Menu ---
  {
    id: 1,
    name: "돼지고기 두부김치",
    price: 18000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500",
    description: "돼지고기와 볶음김치, 고소한 두부의 환상 조합 (김치, 돼지, 굴소스)"
  },
  {
    id: 2,
    name: "꼬치류 세트",
    price: 18000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1532634896-26909d0d4b89?w=500",
    description: "닭껍질(2)+염통(5)+닭꼬치(2)+소떡소떡(2) / 데리야끼 or 마요네즈 선택"
  },
  {
    id: 3,
    name: "소세지 야채볶음 + 주먹밥",
    price: 17000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=500",
    description: "새콤달콤 소야와 든든한 햄야채 주먹밥 (케챱 가능)"
  },
  {
    id: 4,
    name: "해물파전",
    price: 17000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1621311749871-331be2729a00?w=500",
    description: "해물 가득 바삭한 파전과 청양고추 간장"
  },
  {
    id: 5,
    name: "피카츄+콘치즈+불닭볶음면",
    price: 16000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500",
    description: "추억의 피카츄와 고소한 콘치즈, 매콤한 불닭의 만남"
  },
  {
    id: 6,
    name: "어묵탕",
    price: 15000,
    category: 'Main',
    image: "https://images.unsplash.com/photo-1603532612711-479633e245a4?w=500",
    description: "뜨끈하고 시원한 국물이 일품인 어묵탕"
  },

  // --- Sides ---
  {
    id: 7,
    name: "단품 꼬치 (소)",
    price: 11900,
    category: 'Sides',
    image: "https://images.unsplash.com/photo-1599321955419-9c5397af3390?w=500",
    description: "가볍게 즐기는 모둠 꼬치 소자"
  },
  {
    id: 8,
    name: "프렌치 토스트",
    price: 10900,
    category: 'Sides',
    image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=500",
    description: "우유와 버터에 구운 촉촉한 식빵 (2장)"
  },
  {
    id: 9,
    name: "나초 + 치즈소스",
    price: 7900,
    category: 'Sides',
    image: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500",
    description: "바삭한 나초와 진한 치즈 소스"
  },
  {
    id: 10,
    name: "파인애플 샤베트",
    price: 7900,
    category: 'Sides',
    image: "https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=500",
    description: "입가심으로 딱! 시원하고 상큼한 샤베트"
  },
  {
    id: 11,
    name: "와사비 토마토 브륄레",
    price: 8900,
    category: 'Sides',
    image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=500",
    description: "와사비의 톡 쏘는 맛과 토마토의 달콤한 조화"
  },

  // --- Drinks ---
  {
    id: 12,
    name: "메론소다 시럽",
    price: 2900,
    category: 'Drinks',
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500",
    description: "달콤하고 시원한 메론향 소다 시럽"
  },
];
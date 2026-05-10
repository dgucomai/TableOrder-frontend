"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Layers,
  ListOrdered,
  PackageCheck,
  Search,
  ShoppingBag,
} from "lucide-react";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

interface StaffOrderItem {
  id: string;
  orderId: string;
  tableId: number;
  menuId: number;
  menuName: string;
  quantity: number;
  price: number;
  orderedAt: string;
  time: string;
  status: "준비 중" | "제공 완료";
  completedBy?: string;
  completedAt?: string;
}

const MENU_DATA: MenuItem[] = [
  {
    id: 1,
    name: "시그니처 비프 버거",
    price: 12000,
    category: "Main",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    description: "육즙 가득한 100% 소고기 패티와 특제 소스",
  },
  {
    id: 2,
    name: "크리스피 치킨 버거",
    price: 10500,
    category: "Main",
    image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500",
    description: "겉바속촉의 정석, 매콤달콤 치킨 패티",
  },
  {
    id: 3,
    name: "트러플 프라이",
    price: 6500,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1573082891205-f495f90cbca5?w=500",
    description: "풍미 넘치는 트러플 오일과 바삭한 감자",
  },
  {
    id: 4,
    name: "코울슬로",
    price: 3000,
    category: "Sides",
    image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=500",
    description: "아삭아삭 상큼한 양배추 샐러드",
  },
  {
    id: 5,
    name: "제로 콜라",
    price: 2500,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500",
    description: "양심의 가책을 덜어주는 제로 칼로리",
  },
  {
    id: 6,
    name: "바닐라 쉐이크",
    price: 5500,
    category: "Drinks",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500",
    description: "달콤하고 부드러운 우유 본연의 맛",
  },
];

const CATEGORIES = ["All", "Main", "Sides", "Drinks"];

const parseOrderTime = (value?: string) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const formatClock = (iso?: string, fallback?: string) => {
  if (!iso) return fallback || "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback || "-";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getOrdersFromStorage = (): StaffOrderItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem("staffOrders") || "[]");
    if (!Array.isArray(saved)) return [];

    return saved.map((order: any) => ({
      id: String(order.id),
      orderId: String(order.orderId || ""),
      tableId: Number(order.tableId),
      menuId: Number(order.menuId),
      menuName: String(order.menuName || order.name || ""),
      quantity: Number(order.quantity || 0),
      price: Number(order.price || 0),
      orderedAt: String(order.orderedAt || ""),
      time: String(order.time || ""),
      status: order.status === "제공 완료" ? "제공 완료" : "준비 중",
      completedBy: order.completedBy,
      completedAt: order.completedAt,
    }));
  } catch {
    return [];
  }
};

export default function StaffMenuPage() {
  const [orders, setOrders] = useState<StaffOrderItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchKeyword, setSearchKeyword] = useState("");

  const refreshOrders = () => {
    setOrders(getOrdersFromStorage());
  };

  useEffect(() => {
    refreshOrders();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "staffOrders") refreshOrders();
    };

    const handleFocus = () => refreshOrders();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const filteredMenus = useMemo(() => {
    return MENU_DATA.filter((menu) => {
      const matchesCategory = activeCategory === "All" || menu.category === activeCategory;
      const matchesSearch = menu.name.toLowerCase().includes(searchKeyword.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchKeyword]);

  const getOrdersByMenu = (menu: MenuItem) => {
    return orders.filter((order) => order.menuId === menu.id || order.menuName === menu.name);
  };

  const getPreparingOrders = (menu: MenuItem) => {
    return getOrdersByMenu(menu)
      .filter((order) => order.status === "준비 중")
      .sort((a, b) => parseOrderTime(a.orderedAt) - parseOrderTime(b.orderedAt));
  };

  const getCompletedOrders = (menu: MenuItem) => {
    return getOrdersByMenu(menu)
      .filter((order) => order.status === "제공 완료")
      .sort((a, b) => parseOrderTime(b.completedAt) - parseOrderTime(a.completedAt));
  };

  const getPreparingQuantity = (menu: MenuItem) => {
    return getPreparingOrders(menu).reduce((sum, order) => sum + order.quantity, 0);
  };

  const selectedPreparingOrders = selectedMenu ? getPreparingOrders(selectedMenu) : [];
  const selectedCompletedOrders = selectedMenu ? getCompletedOrders(selectedMenu) : [];
  const selectedPreparingQuantity = selectedPreparingOrders.reduce((sum, order) => sum + order.quantity, 0);

  if (selectedMenu) {
    return (
      <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white overflow-y-auto">
        <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#020617]/95 backdrop-blur px-4 md:px-6 py-3">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
            <button
              onClick={() => setSelectedMenu(null)}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-300 hover:bg-orange-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} /> 메뉴 목록으로 돌아가기
            </button>
            <p className="hidden sm:block text-sm font-bold text-slate-500 truncate">{selectedMenu.name}</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
          <section className="rounded-[2rem] border border-slate-800 bg-[#1e293b] overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 p-5 md:p-8 border-b border-white/5 bg-slate-800/40">
              <img
                src={selectedMenu.image}
                alt={selectedMenu.name}
                className="w-full md:w-44 h-40 md:h-44 rounded-3xl object-cover bg-slate-900"
              />

              <div className="flex-1 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black uppercase tracking-widest">
                      {selectedMenu.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-400 text-xs font-bold">
                      {selectedMenu.price.toLocaleString()}원
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                    {selectedMenu.name}
                  </h1>
                  <p className="mt-3 text-slate-400 font-medium">메뉴별 주문 상태를 확인합니다.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                      <ListOrdered size={14} /> 준비중 큐
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">{selectedPreparingQuantity}개</p>
                  </div>
                  <div className="rounded-2xl bg-slate-900/70 border border-slate-700 p-4">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Layers size={14} /> 완료 스택
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-300">{selectedCompletedOrders.length}건</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Clock size={22} className="text-orange-500" /> 준비중 주문
                  </h2>
                  <span className="hidden sm:inline text-xs font-bold text-slate-500">먼저 들어온 주문이 위에 표시됩니다.</span>
                </div>

                {selectedPreparingOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                    현재 준비중인 주문이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPreparingOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className="flex flex-col gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 md:p-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-black shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="text-2xl font-black text-white">{order.tableId}번 테이블</p>
                            <p className="text-sm text-orange-200/70 font-bold truncate">주문번호 {order.orderId}</p>
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-950/30 px-4 py-3 text-sm md:text-base font-black text-white whitespace-nowrap overflow-x-auto">
                          <span className="text-slate-400">주문시간</span>
                          <span className="mx-2 text-slate-600">|</span>
                          <span>{formatClock(order.orderedAt, order.time)}</span>
                          <span className="mx-3 text-slate-600">|</span>
                          <span className="text-slate-400">수량</span>
                          <span className="mx-2 text-slate-600">|</span>
                          <span>{order.quantity}개</span>
                          <span className="mx-3 text-slate-600">|</span>
                          <span className="text-slate-400">상태</span>
                          <span className="mx-2 text-slate-600">|</span>
                          <span className="text-orange-400">준비 중</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-slate-300 flex items-center gap-2">
                    <PackageCheck size={22} className="text-slate-500" /> 제공 완료 주문
                  </h2>
                  <span className="hidden sm:inline text-xs font-bold text-slate-500">방금 완료된 주문이 위에 표시됩니다.</span>
                </div>

                {selectedCompletedOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                    아직 제공 완료된 주문이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCompletedOrders.map((order, index) => (
                      <div
                        key={order.id}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-5 opacity-70"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-700 text-slate-400 flex items-center justify-center font-black">
                            {index === 0 ? "TOP" : index + 1}
                          </div>
                          <div>
                            <p className="text-2xl font-black text-slate-300 line-through decoration-slate-600">
                              {order.tableId}번 테이블
                            </p>
                            <p className="text-sm text-slate-500 font-bold">주문번호 {order.orderId}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-bold">
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">주문시간</p>
                            <p className="text-slate-400">{formatClock(order.orderedAt, order.time)}</p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">수량</p>
                            <p className="text-slate-400">{order.quantity}개</p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">완료자</p>
                            <p className="text-slate-400">{order.completedBy || "-"}</p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">완료시간</p>
                            <p className="text-slate-400">{formatClock(order.completedAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white overflow-y-auto">
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#020617]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4">
          <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/95 backdrop-blur p-3 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-black transition-all whitespace-nowrap ${
                      activeCategory === category
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="메뉴 검색"
                  className="w-full rounded-2xl bg-slate-900 border border-slate-700 py-3 pl-11 pr-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
          {filteredMenus.map((menu) => {
            const preparingQuantity = getPreparingQuantity(menu);
            const completedCount = getCompletedOrders(menu).length;
            const menuOrderCount = getOrdersByMenu(menu).length;

            return (
              <button
                key={menu.id}
                onClick={() => setSelectedMenu(menu)}
                className="group text-left rounded-[1.25rem] md:rounded-[1.75rem] border border-slate-800 bg-[#1e293b] overflow-hidden hover:border-orange-500/60 hover:-translate-y-1 transition-all shadow-xl aspect-[1/1.08] min-h-[210px] md:min-h-[260px]"
              >
                <div className="relative h-[40%] overflow-hidden bg-slate-900">
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="h-full w-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b]/70 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] md:text-xs font-black text-white">
                    {menu.category}
                  </div>
                </div>

                <div className="h-[60%] p-3 md:p-5 flex flex-col justify-between gap-2">
                  <div className="min-h-[2.4rem] flex items-center">
                    <h2 className="text-base md:text-2xl font-black tracking-tight text-white leading-tight line-clamp-2">
                      {menu.name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 md:gap-2 text-center">
                    <div className="rounded-xl md:rounded-2xl bg-slate-900/70 p-2 md:p-3 flex flex-col items-center justify-center">
                      <p className="text-[10px] md:text-xs text-slate-500 font-black">가격</p>
                      <p className="mt-1 text-[12px] md:text-lg font-black text-slate-200 leading-tight">
                        {menu.price.toLocaleString()}원
                      </p>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-orange-500/10 p-2 md:p-3 flex flex-col items-center justify-center">
                      <p className="text-[10px] md:text-xs text-orange-500 font-black">준비중</p>
                      <p className="mt-1 text-sm md:text-xl font-black text-white leading-tight">{preparingQuantity}개</p>
                    </div>
                    <div className="rounded-xl md:rounded-2xl bg-slate-900/70 p-2 md:p-3 flex flex-col items-center justify-center">
                      <p className="text-[10px] md:text-xs text-slate-500 font-black">완료</p>
                      <p className="mt-1 text-sm md:text-xl font-black text-slate-300 leading-tight">{completedCount}건</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] md:text-sm font-black">
                    <span className="text-slate-500 flex items-center gap-1 md:gap-2">
                      <ShoppingBag size={14} /> 총 {menuOrderCount}건
                    </span>
                    <span className="text-orange-500 group-hover:translate-x-1 transition-transform">보기 →</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {filteredMenus.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center text-slate-500 font-bold">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

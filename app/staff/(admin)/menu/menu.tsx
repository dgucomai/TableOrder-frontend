"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock,
  PackageCheck,
  ShoppingBag,
  ImageOff,
} from "lucide-react";
import { staffFetch } from "@/lib/staffFetch";

interface MenuItem {
  menuId: number;
  categoryId: number;
  categoryName: string;
  menuName: string;
  price: number;
  description: string;
  imageUrl: string | null;
  isSoldOut: boolean;
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
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingSoldOut, setIsTogglingSoldOut] = useState(false);

  // 메뉴 데이터 API 호출
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/menus");
        const result = await response.json();

        if (result.success && result.data?.menus) {
          const fetchedMenus = result.data.menus;
          setMenus(fetchedMenus);

          const uniqueCategories = Array.from(
            new Set(fetchedMenus.map((m: MenuItem) => m.categoryName))
          ) as string[];
          setCategories(["All", ...uniqueCategories]);
        }
      } catch (error) {
        console.error("메뉴 API 호출 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, []);

  // 브라우저 뒤로가기(History API) 처리용 useEffect
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.menuId) {
        const menu = menus.find((m) => m.menuId === event.state.menuId);
        if (menu) setSelectedMenu(menu);
      } else {
        setSelectedMenu(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [menus]);

  // 주문 데이터 갱신 및 로컬스토리지 동기화
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

  // 상세 메뉴 클릭 처리 (히스토리 스택 추가)
  const handleMenuClick = (menu: MenuItem) => {
    setSelectedMenu(menu);
    window.history.pushState(
      { menuId: menu.menuId },
      "",
      `?menuId=${menu.menuId}`
    );
  };

  // 상세 메뉴 내 뒤로가기 버튼 클릭 처리
  const handleBackClick = () => {
    if (window.history.state?.menuId) {
      window.history.back(); // popstate 이벤트 발생시켜 상태 초기화
    } else {
      setSelectedMenu(null);
    }
  };

  // 품절 상태 변경 API 호출 로직
  const toggleSoldOutStatus = async () => {
    if (!selectedMenu) return;

    try {
      setIsTogglingSoldOut(true);
      const newSoldOutStatus = !selectedMenu.isSoldOut;
      
      const response = await staffFetch(`/api/admin/menu-items/${selectedMenu.menuId}/sold-out`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isSoldOut: newSoldOutStatus }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const updatedMenu = result.data;
        
        // 현재 열려있는 상세 메뉴 상태 업데이트
        setSelectedMenu(updatedMenu);
        
        // 전체 메뉴 목록의 해당 메뉴 상태도 업데이트
        setMenus((prevMenus) =>
          prevMenus.map((m) =>
            m.menuId === updatedMenu.menuId ? updatedMenu : m
          )
        );
      } else {
        alert(result.message || "품절 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("품절 상태 통신 오류:", error);
      alert("통신 오류가 발생했습니다.");
    } finally {
      setIsTogglingSoldOut(false);
    }
  };

  // 필터링 로직 (검색 삭제, 카테고리만 유지)
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      return activeCategory === "All" || menu.categoryName === activeCategory;
    });
  }, [menus, activeCategory]);

  const getOrdersByMenu = (menu: MenuItem) => {
    return orders.filter(
      (order) => order.menuId === menu.menuId || order.menuName === menu.menuName
    );
  };

  const getPreparingOrders = (menu: MenuItem) => {
    return getOrdersByMenu(menu)
      .filter((order) => order.status === "준비 중")
      .sort((a, b) => parseOrderTime(a.orderedAt) - parseOrderTime(b.orderedAt));
  };

  const getCompletedOrders = (menu: MenuItem) => {
    return getOrdersByMenu(menu)
      .filter((order) => order.status === "제공 완료")
      .sort(
        (a, b) => parseOrderTime(b.completedAt) - parseOrderTime(a.completedAt)
      );
  };

  const getPreparingQuantity = (menu: MenuItem) => {
    return getPreparingOrders(menu).reduce(
      (sum, order) => sum + order.quantity,
      0
    );
  };

  const selectedPreparingOrders = selectedMenu
    ? getPreparingOrders(selectedMenu)
    : [];
  const selectedCompletedOrders = selectedMenu
    ? getCompletedOrders(selectedMenu)
    : [];

  // [상세 보기 페이지 모드]
  if (selectedMenu) {
    return (
      <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white overflow-y-auto">
        <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#020617]/95 backdrop-blur px-4 md:px-6 py-3">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-300 hover:bg-orange-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} /> 메뉴 목록으로 돌아가기
            </button>
            <p className="hidden sm:block text-sm font-bold text-slate-500 truncate">
              {selectedMenu.menuName}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
          <section className="rounded-[2rem] border border-slate-800 bg-[#1e293b] overflow-hidden shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6 p-5 md:p-8 border-b border-white/5 bg-slate-800/40">
              {/* 이미지 및 우측 하단 가격 배지 */}
              <div className="relative w-full md:w-56 h-48 md:h-56 shrink-0">
                {selectedMenu.imageUrl ? (
                  <img
                    src={selectedMenu.imageUrl}
                    alt={selectedMenu.menuName}
                    className="w-full h-full rounded-3xl object-cover bg-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-3xl bg-slate-800 flex flex-col items-center justify-center text-slate-500">
                    <ImageOff size={32} className="mb-2" />
                    <span className="text-xs font-bold">이미지 없음</span>
                  </div>
                )}
                <div className="absolute bottom-3 right-3 px-4 py-1.5 rounded-full bg-slate-900/90 text-slate-200 text-sm font-black shadow-lg backdrop-blur border border-white/10">
                  {selectedMenu.price.toLocaleString()}원
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight">
                    {selectedMenu.menuName}
                  </h1>
                  
                  {/* 품절 토글 버튼 및 상태 표시 배지 */}
                  <div className="mt-5 flex items-center gap-3">
                    {selectedMenu.isSoldOut && (
                      <div className="inline-flex items-center px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-sm font-black border border-red-500/20">
                        현재 품절 상태
                      </div>
                    )}
                    <button
                      onClick={toggleSoldOutStatus}
                      disabled={isTogglingSoldOut}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                        selectedMenu.isSoldOut
                          ? "bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600"
                          : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                      }`}
                    >
                      {isTogglingSoldOut ? "처리 중..." : selectedMenu.isSoldOut ? "품절 취소하기" : "이 메뉴 품절 처리"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 space-y-8">
              {/* 준비중 주문 리스트 */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Clock size={22} className="text-orange-500" /> 준비중 주문
                  </h2>
                </div>

                {selectedPreparingOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                    현재 대기 중인 주문이 없습니다.
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
                            <p className="text-2xl font-black text-white">
                              {order.tableId}번 테이블
                            </p>
                            <p className="text-sm text-orange-200/70 font-bold truncate">
                              주문번호 {order.orderId}
                            </p>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 제공 완료 주문 리스트 */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-slate-300 flex items-center gap-2">
                    <PackageCheck size={22} className="text-slate-500" /> 제공 완료
                    주문
                  </h2>
                </div>

                {selectedCompletedOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                    제공 완료 처리된 주문 내역이 없습니다.
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
                            <p className="text-sm text-slate-500 font-bold">
                              주문번호 {order.orderId}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-bold">
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">
                              주문시간
                            </p>
                            <p className="text-slate-400">
                              {formatClock(order.orderedAt, order.time)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">수량</p>
                            <p className="text-slate-400">{order.quantity}개</p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">완료자</p>
                            <p className="text-slate-400">
                              {order.completedBy || "-"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-black/20 px-4 py-3">
                            <p className="text-slate-600 text-xs mb-1">
                              완료시간
                            </p>
                            <p className="text-slate-400">
                              {formatClock(order.completedAt)}
                            </p>
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

  // [전체 메뉴 목록 화면 모드]
  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white overflow-y-auto">
      {/* 상단 네비게이션 & 필터 섹션 */}
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#020617]/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 md:px-6 py-4">
          <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/95 backdrop-blur p-3 shadow-xl">
            {/* 카테고리 탭 */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
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
          </section>
        </div>
      </div>

      {/* 메인 메뉴 영역 */}
      <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-slate-500 font-bold">
            메뉴 목록을 불러오는 중입니다...
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3 md:gap-4">
              {filteredMenus.map((menu) => {
                const preparingQuantity = getPreparingQuantity(menu);
                const menuOrderCount = getOrdersByMenu(menu).length;

                return (
                  <button
                    key={menu.menuId}
                    onClick={() => handleMenuClick(menu)}
                    className={`group flex items-center gap-4 text-left rounded-[1.25rem] md:rounded-[1.75rem] border border-slate-800 bg-[#1e293b] p-3 md:p-4 hover:border-orange-500/60 hover:-translate-y-0.5 transition-all shadow-xl w-full ${
                      menu.isSoldOut
                        ? "opacity-60 grayscale hover:grayscale-0"
                        : ""
                    }`}
                  >
                    {/* 좌측: 메뉴 이미지 */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl md:rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                      {menu.imageUrl ? (
                        <img
                          src={menu.imageUrl}
                          alt={menu.menuName}
                          className="h-full w-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-600">
                          <ImageOff size={24} />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <span className="px-2 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] md:text-xs font-black text-white">
                          {menu.categoryName}
                        </span>
                        {menu.isSoldOut && (
                          <span className="px-2 py-1 rounded-full bg-red-500/80 backdrop-blur text-[10px] md:text-xs font-black text-white">
                            품절
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 중앙: 메뉴 텍스트 및 기본 정보 */}
                    <div className="flex-1 min-w-0 py-2 flex flex-col justify-center h-full">
                      <h2 className="text-base md:text-xl font-black tracking-tight text-white leading-tight truncate">
                        {menu.menuName}
                      </h2>
                      <p className="text-sm md:text-base font-bold text-slate-400 mt-1">
                        {menu.price.toLocaleString()}원
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] md:text-xs font-black text-slate-500">
                        <ShoppingBag size={12} /> 총 {menuOrderCount}건
                      </div>
                    </div>

                    {/* 우측: 준비중 수량 배지 */}
                    <div className="shrink-0 flex items-center justify-center pr-2">
                      <div
                        className={`rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center min-w-[4.5rem] md:min-w-[5.5rem] ${
                          preparingQuantity >= 1
                            ? "bg-orange-500/10"
                            : "bg-slate-900/70"
                        }`}
                      >
                        <p
                          className={`text-[10px] md:text-xs font-black ${
                            preparingQuantity >= 1
                              ? "text-orange-500"
                              : "text-slate-500"
                          }`}
                        >
                          준비중
                        </p>
                        <p
                          className={`mt-1 text-sm md:text-xl font-black leading-tight ${
                            preparingQuantity >= 1
                              ? "text-white"
                              : "text-slate-200"
                          }`}
                        >
                          {preparingQuantity}개
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>

            {filteredMenus.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center text-slate-500 font-bold">
                일치하는 메뉴가 존재하지 않습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
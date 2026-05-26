"use client";

import React, { useEffect } from "react";
import { ArrowLeft, Clock, ImageOff, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { MenuItem } from "./types";
import { staffFetch } from "@/lib/staffFetch";

interface MenuDetailViewProps {
  menu: MenuItem;
  isTogglingSoldOut: boolean;
  onBackClick: () => void;
  onToggleSoldOut: () => void;
}

interface OrderData {
  orderItemId: number;
  orderId: number;
  tableId: number;
  tableNumber: number;
  menuId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemStatus: string;
  createdAt: string;
}

interface MenuDetailApiResponse {
  menuItemId: number;
  name: string;
  isSoldOut: boolean;
  preparingItems: OrderData[];
  servedItems: {
    data: OrderData[];
    nextCursor: number | null;
    hasNext: boolean;
  };
}

// 무한 스크롤 및 데이터 패칭을 위한 API 호출 함수
const fetchMenuDetail = async (menuId: number, cursor?: number): Promise<MenuDetailApiResponse> => {
  const url = cursor
    ? `/api/staff/menus/${menuId}?cursor=${cursor}`
    : `/api/staff/menus/${menuId}`;
  
  const response = await staffFetch(url);
  if (!response.ok) throw new Error("네트워크 응답이 올바르지 않습니다.");
  
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "데이터를 불러오는 중 오류가 발생했습니다.");
  
  return result.data;
};

export default function MenuDetailView({
  menu,
  isTogglingSoldOut,
  onBackClick,
  onToggleSoldOut,
}: MenuDetailViewProps) {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["menuDetail", menu.menuId],
    queryFn: ({ pageParam }) => fetchMenuDetail(menu.menuId, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.servedItems.hasNext ? lastPage.servedItems.nextCursor : undefined;
    },
    refetchOnWindowFocus: false,
  });

  // 무한 스크롤 제어 Effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // [API 연동] 개별 메뉴 상태 변경 및 리프레시
  const updateItemStatus = async (orderItemId: number, currentItemStatus: string) => {
    if (currentItemStatus === "입금 확인 대기" || currentItemStatus === "거절됨" || currentItemStatus === "취소됨") return;

    const nextStatus = currentItemStatus === "PREPARING" ? "SERVED" : "PREPARING";

    try {
      const response = await staffFetch(`/api/staff/items/${orderItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      
      if (response.ok) {
        // 성공 시 해당 메뉴의 쿼리를 무효화하여 즉시 최신 상태로 재호출(Refresh)
        queryClient.invalidateQueries({ queryKey: ["menuDetail", menu.menuId] });
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 시간 포맷팅 및 경과 시간(분) 계산 함수
  const formatOrderTime = (createdAt?: string) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    
    const timeStr = date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    return `${timeStr} (${diffMins}분 경과)`;
  };

  // 데이터 분리 추출 (첫 페이지의 준비중 주문 데이터와 누적된 제공완료 주문 데이터)
  const preparingOrders = data?.pages[0]?.preparingItems || [];
  const servedOrders = data?.pages.flatMap((page) => page.servedItems.data) || [];

  return (
    <div className="h-full min-h-[calc(100vh-4rem)] bg-[#020617] text-white overflow-y-auto">
      <div className="sticky top-0 z-40 border-b border-slate-800 bg-[#020617]/95 backdrop-blur px-4 md:px-6 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <button
            onClick={onBackClick}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-slate-300 hover:bg-orange-500 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} /> 메뉴 목록으로 돌아가기
          </button>
          <p className="hidden sm:block text-sm font-bold text-slate-500 truncate">
            {menu.menuName}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        <section className="rounded-[2rem] border border-slate-800 bg-[#1e293b] overflow-hidden shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 p-5 md:p-8 border-b border-white/5 bg-slate-800/40">
            {/* 이미지 섹션 */}
            <div className="relative w-full md:w-56 h-48 md:h-56 shrink-0">
              {menu.imageUrl ? (
                <img
                  src={menu.imageUrl}
                  alt={menu.menuName}
                  className={`w-full h-full rounded-3xl object-cover bg-slate-900 transition-all ${
                    menu.isSoldOut ? "blur-[2px] brightness-75" : ""
                  }`}
                />
              ) : (
                <div className="w-full h-full rounded-3xl bg-slate-800 flex flex-col items-center justify-center text-slate-500">
                  <ImageOff size={32} className="mb-2" />
                  <span className="text-xs font-bold">이미지 없음</span>
                </div>
              )}

              {/* 품절 상태 오버레이 */}
              {menu.isSoldOut && (
                <div className="absolute inset-0 flex items-center justify-center rounded-3xl z-10 pointer-events-none">
                  <span className="px-6 py-2.5 rounded-2xl bg-black/60 text-white text-lg md:text-xl font-black shadow-xl backdrop-blur-sm border border-white/10">
                    품절
                  </span>
                </div>
              )}

              <div className="absolute bottom-3 right-3 px-4 py-1.5 rounded-full bg-slate-900/90 text-slate-200 text-sm font-black shadow-lg backdrop-blur border border-white/10 z-20">
                {menu.price?.toLocaleString()}원
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight">
                  {menu.menuName}
                </h1>

                {/* 버튼 컨트롤 그룹 */}
                <div className="mt-5 flex items-center gap-3">
                  {/* 품절 토글 버튼 */}
                  <button
                    onClick={onToggleSoldOut}
                    disabled={isTogglingSoldOut}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                      menu.isSoldOut
                        ? "bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600"
                        : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                    }`}
                  >
                    {isTogglingSoldOut
                      ? "처리 중..."
                      : menu.isSoldOut
                      ? "품절 취소"
                      : "품절 처리"}
                  </button>

                  {/* 수동 새로고침 버튼 */}
                  <button
                    onClick={() => {
                      queryClient.resetQueries({ queryKey: ["menuDetail", menu.menuId] });
                    }}
                    disabled={isFetching}
                    className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50 border border-slate-700"
                    title="최신 주문 내역 불러오기"
                  >
                    <RefreshCw size={16} className={isFetching ? "animate-spin text-orange-500" : ""} />
                    새로고침
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8 space-y-8">
            
            {/* 1. 준비중 주문 섹션 */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Clock size={22} className="text-orange-500" /> 준비중 주문
                </h2>
              </div>

              {status === "pending" ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-5">
                  <Loader2 className="mb-2 animate-spin text-orange-500" size={24} />
                  <p className="text-sm font-black text-slate-400">데이터를 불러오는 중입니다...</p>
                </div>
              ) : preparingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                  현재 대기 중인 주문이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {preparingOrders.map((order) => (
                    <div
                      key={order.orderItemId}
                      className="flex flex-col gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 py-4 px-4 md:px-5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-orange-200/60 font-bold">
                          #{order.orderId}
                        </div>
                        {order.createdAt && (
                          <div className="text-xs text-orange-200/60 font-medium tracking-wide">
                            {formatOrderTime(order.createdAt)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex items-center justify-center min-w-[4rem] px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/50 shadow-sm">
                            <span className="text-xl md:text-2xl font-black text-white whitespace-nowrap">
                              {order.tableNumber !== undefined ? `${order.tableNumber}번` : `${order.tableId}번`}
                            </span>
                          </div>
                          <span className="hidden md:inline-block text-sm font-bold text-slate-400">
                            테이블
                          </span>
                        </div>

                        <div className="flex items-center gap-3 md:gap-6">
                          <div
                            className={`flex items-center justify-center px-4 py-1.5 rounded-xl border shadow-sm ${
                              order.quantity !== 1
                                ? "bg-red-500/10 border-red-500/30"
                                : "bg-slate-800/80 border-slate-700/50"
                            }`}
                          >
                            <span
                              className={`text-lg md:text-xl font-black whitespace-nowrap ${
                                order.quantity !== 1 ? "text-red-400" : "text-white"
                              }`}
                            >
                              {order.quantity}개
                            </span>
                          </div>

                          <button
                            onClick={() => updateItemStatus(order.orderItemId, order.itemStatus)}
                            className="bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-900/20 px-5 py-2.5 sm:px-6 rounded-xl font-black text-sm transition-all whitespace-nowrap"
                          >
                            준비 중
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 2. 제공 완료 섹션 (무한 스크롤) */}
            <section className="pt-4 border-t border-slate-700/50 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-green-500" /> 제공 완료
                </h2>
              </div>

              {servedOrders.length === 0 && status !== "pending" ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                  제공 완료된 주문이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {servedOrders.map((order) => (
                    <div
                      key={order.orderItemId}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/40 py-4 px-4 md:px-5 transition-colors hover:bg-slate-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500 font-bold">
                          #{order.orderId}
                        </div>
                        {order.createdAt && (
                          <div className="text-xs text-slate-400 font-medium tracking-wide">
                            {formatOrderTime(order.createdAt)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex items-center justify-center min-w-[4rem] px-3 py-1.5 rounded-xl bg-slate-900/50 border border-slate-700/50 shadow-sm opacity-80">
                            <span className="text-xl md:text-2xl font-black text-slate-300 whitespace-nowrap">
                              {order.tableNumber !== undefined ? `${order.tableNumber}번` : `${order.tableId}번`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-6">
                          <div
                            className={`flex items-center justify-center px-4 py-1.5 rounded-xl border shadow-sm opacity-80 ${
                              order.quantity !== 1
                                ? "bg-red-500/5 border-red-500/20"
                                : "bg-slate-900/50 border-slate-700/50"
                            }`}
                          >
                            <span
                              className={`text-lg md:text-xl font-black whitespace-nowrap ${
                                order.quantity !== 1 ? "text-red-400" : "text-slate-300"
                              }`}
                            >
                              {order.quantity}개
                            </span>
                          </div>

                          <button
                            onClick={() => updateItemStatus(order.orderItemId, order.itemStatus)}
                            className="bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95 shadow-inner px-5 py-2.5 sm:px-6 rounded-xl font-black text-sm transition-all whitespace-nowrap"
                          >
                            제공 완료
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 무한 스크롤 트리거 영역 */}
              <div ref={ref} className="flex h-10 items-center justify-center py-4 mt-2">
                {isFetchingNextPage ? (
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                ) : hasNextPage ? (
                  <span className="text-xs text-slate-500">스크롤하여 더 보기</span>
                ) : servedOrders.length > 0 ? (
                  <span className="text-xs text-slate-500">모든 제공 완료 기록을 불러왔습니다.</span>
                ) : null}
              </div>
            </section>
            
          </div>
        </section>
      </div>
    </div>
  );
}
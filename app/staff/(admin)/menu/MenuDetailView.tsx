"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, ImageOff } from "lucide-react";
import { MenuItem } from "./types";
import { staffFetch } from "@/lib/staffFetch";

interface MenuDetailViewProps {
  menu: MenuItem;
  isTogglingSoldOut: boolean;
  onBackClick: () => void;
  onToggleSoldOut: () => void;
}

// API 응답 구조에 맞춘 내부 인터페이스
interface PreparingOrderData {
  orderItemId: number;
  orderId: number;
  tableId: number;
  tableNumber: number;
  menuId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemStatus: string;
  createdAt: string; // 시간 표시를 위해 필드 추가
}

export default function MenuDetailView({
  menu,
  isTogglingSoldOut,
  onBackClick,
  onToggleSoldOut,
}: MenuDetailViewProps) {
  const [preparingOrders, setPreparingOrders] = useState<PreparingOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 단일 메뉴 상세 데이터 호출 (준비 중인 주문 데이터)
  useEffect(() => {
    const fetchMenuDetail = async () => {
      try {
        setIsLoading(true);
        const response = await staffFetch(`/api/staff/menus/${menu.menuId}`);
        const result = await response.json();

        if (result.success && result.data) {
          // servedItems는 제외하고 preparingItems만 세팅
          setPreparingOrders(result.data.preparingItems || []);
        }
      } catch (error) {
        console.error("메뉴 상세 정보를 불러오는데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuDetail();
  }, [menu.menuId]);

  // [API 연동] 개별 메뉴 상태 변경 (TableDetailPopup 기능 이식)
  const updateItemStatus = async (orderItemId: number, currentItemStatus: string) => {
    if (currentItemStatus === "입금 확인 대기" || currentItemStatus === "거절됨" || currentItemStatus === "취소됨") return;

    // 메뉴 상세 뷰의 '준비중 주문' 리스트이므로, SERVED로 변경
    const nextStatus = currentItemStatus === "PREPARING" ? "SERVED" : "PREPARING";

    try {
      const response = await staffFetch(`/api/staff/items/${orderItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      
      if (response.ok) {
        // 성공 시 리스트에서 즉각 제거 (제공 완료 상태가 되므로 준비중 리스트에서 제외)
        if (nextStatus === "SERVED") {
          setPreparingOrders(prev => prev.filter(order => order.orderItemId !== orderItemId));
        } else {
          setPreparingOrders(prev => prev.map(order => 
            order.orderItemId === orderItemId 
              ? { ...order, itemStatus: nextStatus } 
              : order
          ));
        }
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  // 시간 포맷팅 함수 (오전/오후 시:분:초)
  const formatOrderTime = (createdAt?: string) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

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

                {/* 품절 토글 버튼 */}
                <div className="mt-5 flex items-center gap-3">
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
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-500 font-bold">
                  상세 주문 내역을 불러오는 중입니다...
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
                      {/* 좌측 상단 주문번호 및 시간 표시 */}
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-orange-200/60 font-bold">
                          #{order.orderId}
                        </div>
                        {order.createdAt && (
                          <div className="text-xs text-orange-200/60 font-medium tracking-wide">
                            ({formatOrderTime(order.createdAt)})
                          </div>
                        )}
                      </div>

                      {/* 하단 내용 (테이블, 수량, 버튼) 가로 정렬 */}
                      <div className="flex items-center justify-between gap-4 mt-1">
                        
                        {/* 테이블 번호 영역: 박스 형태로 감싸서 돋보이게 처리 */}
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
                          {/* 수량 영역: 1개일 땐 기본 스타일, 2개 이상일 땐 붉은색 강조 스타일 박스 적용 */}
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

                          {/* 상태 변경 버튼 */}
                          <button
                            onClick={() => updateItemStatus(order.orderItemId, order.itemStatus)}
                            className={`px-5 py-2.5 sm:px-6 rounded-xl font-black text-sm transition-all whitespace-nowrap ${
                              order.itemStatus === "SERVED"
                                ? "bg-slate-700 text-slate-400 hover:bg-slate-600 active:scale-95 shadow-inner"
                                : "bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-900/20"
                            }`}
                          >
                            {order.itemStatus === "PREPARING" ? "준비 중" : "제공 완료"}
                          </button>
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
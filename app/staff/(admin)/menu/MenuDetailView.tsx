"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Clock, ImageOff } from "lucide-react";
import { MenuItem, PreparingOrderItem } from "./types";
import { formatClock } from "./utils";
import { staffFetch } from "@/lib/staffFetch";

interface MenuDetailViewProps {
  menu: MenuItem;
  isTogglingSoldOut: boolean;
  onBackClick: () => void;
  onToggleSoldOut: () => void;
}

export default function MenuDetailView({
  menu,
  isTogglingSoldOut,
  onBackClick,
  onToggleSoldOut,
}: MenuDetailViewProps) {
  const [preparingOrders, setPreparingOrders] = useState<PreparingOrderItem[]>([]);
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
                {(menu.price ?? 0).toLocaleString()}원
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
                      ? "품절 취소하기"
                      : "이 메뉴 품절 처리"}
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
                  {preparingOrders.map((order, index) => (
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
          </div>
        </section>
      </div>
    </div>
  );
}
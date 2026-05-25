"use client";

import React, { useMemo } from "react";
import { ImageOff, ShoppingBag } from "lucide-react";
import { MenuItem } from "./types";

interface MenuListViewProps {
  menus: MenuItem[];
  categories: string[];
  activeCategory: string;
  isLoading: boolean;
  onCategoryChange: (category: string) => void;
  onMenuClick: (menu: MenuItem) => void;
}

export default function MenuListView({
  menus,
  categories,
  activeCategory,
  isLoading,
  onCategoryChange,
  onMenuClick,
}: MenuListViewProps) {
  // 필터링 로직
  const filteredMenus = useMemo(() => {
    return menus.filter((menu) => {
      return activeCategory === "All" || menu.categoryName === activeCategory;
    });
  }, [menus, activeCategory]);

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
                  onClick={() => onCategoryChange(category)}
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
                const preparingQuantity = menu.countPreparing;
                const menuOrderCount = menu.totalItemCount;

                return (
                  <button
                    key={menu.menuId}
                    onClick={() => onMenuClick(menu)}
                    className={`group flex items-center gap-4 text-left rounded-[1.25rem] md:rounded-[1.75rem] border border-slate-800 bg-[#1e293b] p-3 md:p-4 hover:border-orange-500/60 hover:-translate-y-0.5 transition-all shadow-xl w-full ${
                      menu.isSoldOut ? "opacity-60 grayscale hover:grayscale-0" : ""
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
                        {(menu.price ?? 0).toLocaleString()}원
                      </p>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] md:text-xs font-black text-slate-500">
                        <ShoppingBag size={12} /> 누적 주문 개수 {menuOrderCount}개
                      </div>
                    </div>

                    {/* 우측: 준비중 수량 배지 */}
                    <div className="shrink-0 flex items-center justify-center pr-2">
                      <div
                        className={`rounded-xl md:rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center min-w-[4.5rem] md:min-w-[5.5rem] ${
                          preparingQuantity >= 1 ? "bg-orange-500/10" : "bg-slate-900/70"
                        }`}
                      >
                        <p
                          className={`text-[10px] md:text-xs font-black ${
                            preparingQuantity >= 1 ? "text-orange-500" : "text-slate-500"
                          }`}
                        >
                          준비중
                        </p>
                        <p
                          className={`mt-1 text-sm md:text-xl font-black leading-tight ${
                            preparingQuantity >= 1 ? "text-white" : "text-slate-200"
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
"use client";

import React, { useState, useEffect } from 'react';
import { staffFetch } from "@/lib/staffFetch";
import { TrendingUp, Target, CheckCircle2, AlertCircle, Utensils, Receipt } from 'lucide-react';

// API에서 받아올 메뉴 데이터의 타입 정의
interface MenuItem {
  menuItemId: number;
  name: string;
  countPreparing: number;
  countServed: number;
  subtotal: number;
  totalItemCount: number;
}

export default function SalesReport() {
  const [sales, setSales] = useState<number | null>(null);
  const [menuStats, setMenuStats] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GOAL_AMOUNT = 5000000; // 목표 금액: 500만원

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // 매출 데이터와 메뉴 데이터를 동시에 가져오기
        const [salesResponse, menusResponse] = await Promise.all([
          staffFetch('/api/admin/sales'),
          staffFetch('/api/staff/menus')
        ]);
        
        const salesResult = await salesResponse.json();
        const menusResult = await menusResponse.json();

        if (salesResult.success) {
          setSales(salesResult.data.totalSales);
        } else {
          setError(salesResult.message);
        }

        if (menusResult.success) {
          setMenuStats(menusResult.data);
        }
      } catch (err) {
        console.error("통신 에러:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 매출액 기반 계산값들
  const currentSales = sales || 0;
  const progressPercent = Math.min((currentSales / GOAL_AMOUNT) * 100, 100);
  const remainingAmount = Math.max(GOAL_AMOUNT - currentSales, 0);
  const isGoalAchieved = currentSales >= GOAL_AMOUNT;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="font-black text-slate-400">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] p-6 text-white">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <p className="text-xl font-black text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* 헤더 섹션 */}
        <header>
          <h1 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-orange-500">
            <TrendingUp size={18} /> Sales Report
          </h1>
          <p className="mt-1 text-3xl md:text-5xl font-black text-white">매출 현황</p>
        </header>

        <main className="grid gap-6">
          {/* 메인 매출 카드 (남은 금액, 달성률 통합) */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-[#1e293b] p-8 md:p-12 shadow-2xl">
            <div className="relative z-10">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                {/* 누적 매출 금액 */}
                <div>
                  <p className="text-slate-400 font-bold mb-2">누적 매출</p>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight">
                    {currentSales.toLocaleString()}<span className="ml-2 text-2xl md:text-3xl text-slate-500 font-bold tracking-normal">원</span>
                  </h2>
                </div>

                {/* 상세 지표 배지 (달성률, 남은 금액) */}
                <div className="flex flex-col gap-3 min-w-[240px]">
                  {/* 달성률 배지 */}
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 size={20} />
                      <span className="text-sm font-bold">목표 달성률</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">
                      {progressPercent.toFixed(1)}%
                    </span>
                  </div>

                  {/* 남은 금액 배지 */}
                  <div className={`flex items-center justify-between border rounded-2xl p-4 backdrop-blur-sm ${isGoalAchieved ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    <div className={`flex items-center gap-2 ${isGoalAchieved ? 'text-blue-400' : 'text-orange-400'}`}>
                      <Target size={20} />
                      <span className="text-sm font-bold">
                        {isGoalAchieved ? '목표 초과 달성' : '남은 금액'}
                      </span>
                    </div>
                    <span className={`text-xl font-black ${isGoalAchieved ? 'text-blue-400' : 'text-orange-400'}`}>
                      {isGoalAchieved ? '완료!' : `${remainingAmount.toLocaleString()}원`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 게이지 바 섹션 */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-black text-slate-400 px-1">
                  <span>시작</span>
                  <div className="flex gap-1 items-center">
                    <Target size={16} className="text-orange-500" />
                    <span>목표 {GOAL_AMOUNT.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* 메인 게이지 레일 (눈금 및 숫자 제거) */}
                <div className="relative h-8 w-full rounded-2xl bg-slate-900/80 p-1.5 shadow-inner">
                  {/* 실제 차오르는 게이지 */}
                  <div 
                    className="h-full rounded-xl transition-all duration-1000 ease-out shadow-lg bg-gradient-to-r from-orange-500 to-amber-400 relative overflow-hidden"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 w-full h-full animate-pulse bg-white/20 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* 배경 데코레이션 */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
          </div>

          {/* 메뉴별 판매 현황 섹션 */}
          <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/50 overflow-hidden shadow-xl">
            <div className="p-6 md:p-8 border-b border-slate-800/80 bg-slate-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2.5 rounded-xl">
                  <Utensils className="text-orange-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">메뉴별 판매 현황</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">각 메뉴별 판매 수량 및 매출 금액</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              <div className="grid gap-3">
                {menuStats.length > 0 ? (
                  menuStats.map((item) => (
                    <div 
                      key={item.menuItemId} 
                      className="group flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/50 hover:border-slate-700 transition-all gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500/70 group-hover:bg-orange-400 transition-colors" />
                        <span className="font-bold text-slate-200 text-lg">{item.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 ml-5 md:ml-0">
                        <div className="flex flex-col md:items-end">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Items</span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-300">
                            <span className="text-lg">{item.totalItemCount}</span>
                            <span className="text-sm">개</span>
                          </div>
                        </div>
                        
                        <div className="w-px h-8 bg-slate-800 hidden md:block"></div>
                        
                        <div className="flex flex-col md:items-end min-w-[120px]">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subtotal</span>
                          <div className="flex items-center gap-1.5 font-black text-orange-400">
                            <Receipt size={16} className="text-orange-500/70 hidden md:block" />
                            <span className="text-xl">{item.subtotal.toLocaleString()}</span>
                            <span className="text-sm">원</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 font-bold">
                    판매된 메뉴 데이터가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
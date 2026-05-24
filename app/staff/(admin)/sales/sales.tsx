"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { staffFetch } from "@/lib/staffFetch";
import { TrendingUp, Target, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SalesReport() {
  const [sales, setSales] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GOAL_AMOUNT = 5000000; // 목표 금액: 500만원
  const STEP_UNIT = 1000000;  // 단위: 100만원

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true);
        const response = await staffFetch('/api/admin/sales');
        const result = await response.json();

        if (result.success) {
          setSales(result.data.totalSales);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error("통신 에러:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // 매출액 기반 계산값들
  const currentSales = sales || 0;
  const progressPercent = Math.min((currentSales / GOAL_AMOUNT) * 100, 100);
  const currentLevel = Math.min(Math.floor(currentSales / STEP_UNIT) + 1, 5);
  const remainingAmount = Math.max(GOAL_AMOUNT - currentSales, 0);

  // 단계별 텍스트 및 색상
  const levelInfo = useMemo(() => {
    if (currentSales >= GOAL_AMOUNT) return { name: "마스터", color: "text-emerald-400", bg: "bg-emerald-500" };
    if (currentSales >= 4000000) return { name: "다이아", color: "text-purple-400", bg: "bg-purple-500" };
    if (currentSales >= 3000000) return { name: "골드", color: "text-blue-400", bg: "bg-blue-500" };
    if (currentSales >= 2000000) return { name: "실버", color: "text-amber-400", bg: "bg-amber-500" };
    return { name: "브론즈", color: "text-slate-400", bg: "bg-slate-500" };
  }, [currentSales]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="font-black text-slate-400">총 매출을 불러오는 중입니다...</p>
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
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-orange-500">
              <TrendingUp size={18} /> Sales Report
            </h1>
            <p className="mt-1 text-3xl md:text-5xl font-black text-white">매출 현황</p>
          </div>
          <div className="text-right">
            <span className={`text-lg font-black ${levelInfo.color} px-4 py-1 rounded-full bg-white/5 border border-white/10`}>
              {levelInfo.name} (Lv.{currentLevel})
            </span>
          </div>
        </header>

        {/* 메인 매출 카드 */}
        <main className="grid gap-6">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-[#1e293b] p-8 md:p-12 shadow-2xl">
            <div className="relative z-10">
              <p className="text-slate-400 font-bold">누적 매출</p>
              <h2 className="mt-2 text-5xl md:text-7xl font-black text-white">
                {currentSales.toLocaleString()}<span className="ml-2 text-2xl md:text-3xl text-slate-500">원</span>
              </h2>

              {/* 게이지 바 섹션 */}
              <div className="mt-12 space-y-4">
                <div className="flex justify-between text-sm font-black text-slate-400 px-1">
                  <span>시작</span>
                  <div className="flex gap-1">
                    <Target size={16} className="text-orange-500" />
                    <span>목표 {GOAL_AMOUNT.toLocaleString()}원</span>
                  </div>
                </div>
                
                {/* 메인 게이지 레일 */}
                <div className="relative h-8 w-full rounded-2xl bg-slate-900 p-1.5 shadow-inner">
                  {/* 실제 차오르는 게이지 */}
                  <div 
                    className={`h-full rounded-xl transition-all duration-1000 ease-out shadow-lg ${levelInfo.bg}`}
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="h-full w-full animate-pulse bg-white/20 rounded-xl" />
                  </div>

                  {/* 백만원 단위 구분선 (업그레이드 포인트) */}
                  {[1, 2, 3, 4].map((step) => (
                    <div 
                      key={step}
                      className="absolute top-0 bottom-0 w-1 bg-[#020617] transition-opacity"
                      style={{ left: `${step * 20}%` }}
                    />
                  ))}
                </div>

                {/* 구간 표시 텍스트 */}
                <div className="grid grid-cols-5 text-[10px] md:text-xs font-black text-slate-600 px-1">
                  <div className="text-left">0</div>
                  <div className="text-center">{(STEP_UNIT * 1).toLocaleString()}</div>
                  <div className="text-center">{(STEP_UNIT * 2).toLocaleString()}</div>
                  <div className="text-center">{(STEP_UNIT * 3).toLocaleString()}</div>
                  <div className="text-center">{(STEP_UNIT * 4).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 배경 데코레이션 */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
          </div>

          {/* 하단 상세 정보 그리드 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 남은 금액 카드 */}
            <div className="rounded-3xl border border-slate-800 bg-[#1e293b]/50 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">목표까지 남은 금액</p>
                <p className="mt-1 text-2xl font-black text-orange-200">
                  {currentSales >= GOAL_AMOUNT ? "목표를 달성했습니다!" : `${remainingAmount.toLocaleString()}원`}
                </p>
              </div>
              <div className="rounded-2xl bg-orange-500/20 p-3 text-orange-500">
                <TrendingUp size={28} />
              </div>
            </div>

            {/* 달성률 카드 */}
            <div className="rounded-3xl border border-slate-800 bg-[#1e293b]/50 p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">현재 목표 달성률</p>
                <p className="mt-1 text-3xl font-black text-emerald-400">
                  {progressPercent.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-500">
                <CheckCircle2 size={28} />
              </div>
            </div>
          </section>

          {/* 단계 가이드 */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-400">
              <Award size={16} /> 100만 원 단위 업그레이드 구간
            </h3>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const levelAmount = lvl * STEP_UNIT;
                return (
                  <div 
                    key={lvl}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold border transition-all ${
                      currentLevel >= lvl 
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-400" 
                        : "border-slate-800 bg-slate-800/20 text-slate-600"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${currentLevel >= lvl ? "bg-orange-500" : "bg-slate-700"}`} />
                    Level {lvl}: {levelAmount.toLocaleString()}원 달성
                    {currentLevel >= lvl && <CheckCircle2 size={12} />}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
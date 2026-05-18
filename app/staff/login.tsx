"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);
  const [isPwValid, setIsPwValid] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedName = localStorage.getItem("rememberedStaffName");
      if (savedName) {
        setName(savedName);
        setRememberMe(true);
      }
      const sessionActive = localStorage.getItem("staffSessionActive");
      if (sessionActive === "true") {
        router.replace("/staff/home");
      }
    } catch (error) {
      console.warn("로컬 스토리지를 사용할 수 없는 환경입니다.", error);
    }
  }, [router]);

  useEffect(() => {
    setIsNameValid(/^[가-힣]{3}$/.test(name));
    setIsPwValid(/^\d{6}$/.test(password));
  }, [name, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameValid && isPwValid) {
      try {
        if (rememberMe) {
          localStorage.setItem("rememberedStaffName", name);
        } else {
          localStorage.removeItem("rememberedStaffName");
        }
        localStorage.setItem("staffSessionActive", "true");
        localStorage.setItem("currentStaffName", name);
      } catch (error) {
        console.warn("로그인 정보 저장 실패", error);
      }
      router.push("/staff/home"); 
    }
  };

  if (!isMounted) {
    return <div className="bg-[#0f172a]" style={{ minHeight: '100vh' }}></div>;
  }

  return (
    // 1. 전체 영역을 flex flex-col 구조로 변경하여 상단바와 본문을 정렬합니다.
    <div className="flex flex-col min-h-[100dvh] bg-[#0f172a] text-white">
      
      {/* 2. 로그인 페이지 전용 심플 네비게이션 바 (로고만 포함) */}
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center px-4 md:px-6 sticky top-0 z-[100] w-full">
        <span className="text-xl font-black text-orange-500 tracking-tighter cursor-default">
          CAISINO
        </span>
      </nav>

      {/* 3. 기존 로그인 폼 (flex-1을 주어 상단 바를 제외한 나머지 화면 중앙에 정렬) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-[#1e293b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-700">
          
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block p-3 sm:p-4 bg-orange-500/10 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
              <span className="text-3xl sm:text-4xl">👨‍🍳</span>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-orange-500 tracking-widest uppercase mb-1">CAISINO</h2>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">STAFF LOGIN</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2 ml-1">이름</label>
              <input
                type="text"
                placeholder="한글 3자"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
                className={`w-full bg-[#0f172a] border ${name && !isNameValid ? 'border-red-500/50' : 'border-slate-600'} rounded-lg sm:rounded-xl py-3 px-4 sm:py-4 sm:px-5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2 ml-1">비밀번호 (6자리)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="● ● ● ● ● ●"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className={`w-full bg-[#0f172a] border ${password && !isPwValid ? 'border-red-500/50' : 'border-slate-600'} rounded-lg sm:rounded-xl py-3 pl-4 pr-12 sm:py-4 sm:pl-5 sm:pr-14 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all tracking-[0.2em] sm:tracking-[0.3em] text-center text-base sm:text-lg`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 text-slate-500 hover:text-slate-300 transition-colors text-sm sm:text-base flex items-center justify-center cursor-pointer"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500 accent-orange-500"
                />
                <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-200 transition-colors">이름 기억하기</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!isNameValid || !isPwValid}
              className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all mt-2 ${
                isNameValid && isPwValid 
                  ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20 text-white' 
                  : 'bg-slate-700 cursor-not-allowed opacity-50 text-slate-300'
              }`}
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function LoginErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 sm:p-8 w-[90%] max-w-sm shadow-2xl text-center">
        <div className="text-3xl mb-4">⚠️</div>
        <p className="text-slate-100 font-semibold text-base sm:text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function StaffLoginPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isNameValid, setIsNameValid] = useState(false);
  const [isPwValid, setIsPwValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedName = localStorage.getItem("rememberedStaffName");
      if (savedName) {
        setName(savedName);
        setRememberMe(true);
      }
      if (localStorage.getItem("accessToken")) {
        router.replace("/staff/home");
      }
    } catch (error) {
      console.warn("로컬 스토리지를 사용할 수 없는 환경입니다.", error);
    }
  }, [router]);

  useEffect(() => {
    setIsNameValid(name.trim().length > 0);
    setIsPwValid(/^\d{6}$/.test(password));
  }, [name, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid || !isPwValid) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffName: name, password }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setErrorMessage(data.message || "로그인에 실패했습니다.");
        return;
      }

      const { accessToken, refreshToken, staffId, staffName } = data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("staffId", String(staffId));
      localStorage.setItem("currentStaffName", staffName);

      if (rememberMe) {
        localStorage.setItem("rememberedStaffName", name);
      } else {
        localStorage.removeItem("rememberedStaffName");
      }

      router.push("/staff/home");
    } catch {
      setErrorMessage("서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return <div className="bg-[#0f172a]" style={{ minHeight: '100vh' }}></div>;
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0f172a] text-white">
      
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center px-4 md:px-6 sticky top-0 z-[100] w-full">
        <span className="text-xl font-black text-orange-500 tracking-tighter cursor-default">
          CAISINO
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-[#1e293b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-700">
          
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block p-3 sm:p-4 bg-orange-500/10 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
              {/* 💡 변경점 2: 이모지 아이콘을 favicon.ico 이미지로 교체 */}
              <img 
                src="/favicon.ico" 
                alt="CAI Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" 
              />
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-orange-500 tracking-widest uppercase mb-1">CAISINO</h2>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">STAFF LOGIN</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              {/* 💡 변경점 3: 라벨과 placeholder를 ID/이름 입력에 맞게 수정 */}
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2 ml-1">이름</label>
              <input
                type="text"
                placeholder="이름을 입력하세요"
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
                {/* 💡 변경점 4: '이름 기억하기' -> '아이디 기억하기'로 자연스럽게 텍스트 수정 */}
                <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-200 transition-colors">아이디 기억하기</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!isNameValid || !isPwValid || isLoading}
              className={`w-full py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg transition-all mt-2 ${
                isNameValid && isPwValid && !isLoading
                  ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20 text-white'
                  : 'bg-slate-700 cursor-not-allowed opacity-50 text-slate-300'
              }`}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>

      <LoginErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />
    </div>
  );
}
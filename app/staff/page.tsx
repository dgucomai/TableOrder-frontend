"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  
  // 상태 관리
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [isNameValid, setIsNameValid] = useState(false);
  const [isPwValid, setIsPwValid] = useState(false);

  // 1. 초기 로드 시: 저장된 이름 불러오기 및 자동 로그인 체크
  useEffect(() => {
    const savedName = localStorage.getItem("rememberedStaffName");
    if (savedName) {
      setName(savedName);
      setRememberMe(true);
    }

    // 세션 유지 체크 (쿠키나 로컬스토리지에 토큰이 있다면 바로 홈으로)
    const sessionActive = localStorage.getItem("staffSessionActive");
    if (sessionActive === "true") {
      router.replace("/staff/home");
    }
  }, [router]);

  // 2. 유효성 검사
  useEffect(() => {
    setIsNameValid(/^[가-힣]{3}$/.test(name));
    setIsPwValid(/^\d{6}$/.test(password));
  }, [name, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameValid && isPwValid) {
      // 아이디 기억하기 설정
      if (rememberMe) {
        localStorage.setItem("rememberedStaffName", name);
      } else {
        localStorage.removeItem("rememberedStaffName");
      }

      // 세션 유지 설정 (실제로는 백엔드에서 쿠키를 구워주겠지만, 우선 시뮬레이션)
      localStorage.setItem("staffSessionActive", "true");
      localStorage.setItem("currentStaffName", name);

      router.push("/staff/home"); 
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[320px] sm:max-w-sm md:max-w-md bg-[#1e293b] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-700">
        
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-block p-3 sm:p-4 bg-orange-500/10 rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl">👨‍🍳</span>
          </div>
          <h2 className="text-xs sm:text-sm font-semibold text-orange-500 tracking-widest uppercase mb-1">CAISINO</h2>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">STAFF LOGIN</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {/* 성함 입력 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1 sm:mb-2 ml-1">이름</label>
            <input
              type="text"
              placeholder="한글 3자"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-[#0f172a] border ${name && !isNameValid ? 'border-red-500/50' : 'border-slate-600'} rounded-lg sm:rounded-xl py-3 px-4 sm:py-4 sm:px-5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
            />
          </div>

          {/* 비밀번호 입력 (숨기기/보이기 기능 추가) */}
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
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-[#0f172a] border ${password && !isPwValid ? 'border-red-500/50' : 'border-slate-600'} rounded-lg sm:rounded-xl py-3 px-4 sm:py-4 sm:px-5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all tracking-[0.2em] sm:tracking-[0.3em] text-center text-base sm:text-lg`}
              />
              {/* 눈 모양 버튼 - 중앙 정렬로 변경 */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm sm:text-base flex items-center justify-center h-full"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* 아이디 기억하기 체크박스 */}
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
  );
}
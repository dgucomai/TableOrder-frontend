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
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-md bg-[#1e293b] rounded-3xl p-8 shadow-2xl border border-slate-700">
        
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-orange-500/10 rounded-2xl mb-4">
            <span className="text-4xl">👨‍🍳</span>
          </div>
          <h2 className="text-sm font-semibold text-orange-500 tracking-widest uppercase mb-1">Staff Access</h2>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">DONGGUK COMAI</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* 성함 입력 */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">성함</label>
            <input
              type="text"
              placeholder="한글 3자"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-[#0f172a] border ${name && !isNameValid ? 'border-red-500/50' : 'border-slate-600'} rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all`}
            />
          </div>

          {/* 비밀번호 입력 (숨기기/보이기 기능 추가) */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">비밀번호 (6자리)</label>
            <input
              type={showPassword ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-[#0f172a] border ${password && !isPwValid ? 'border-red-500/50' : 'border-slate-600'} rounded-xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all tracking-[0.3em] text-center text-lg`}
            />
            {/* 눈 모양 버튼 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[46px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* 아이디 기억하기 체크박스 */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500 accent-orange-500"
              />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">이름 기억하기</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!isNameValid || !isPwValid}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              isNameValid && isPwValid 
                ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20' 
                : 'bg-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
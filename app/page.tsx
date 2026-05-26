"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { X, Beer, Gamepad2, AlertCircle, ChevronRight } from "lucide-react";

// 로고 이미지 불러오기 (코드와 같은 위치)
import logoImage from "./CAISINO.png";

function CaisinoHome() {
  const searchParams = useSearchParams();
  const token = searchParams.get("qt") || "";

  // 렌더링 상태 관리: 로딩중 / 성공 / 실패
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');

  useEffect(() => {
    // 토큰이 아예 없는 경우 즉각 차단
    if (!token) {
      setStatus('ERROR');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/qtnum?qt=${token}`);
        const result = await response.json();

        // 성공 여부와 테이블 넘버가 확실히 존재하는지 교차 검증
        if (result.success && result.data && result.data.tableNumber) {
          setStatus('SUCCESS');
        } else {
          setStatus('ERROR');
        }
      } catch (error) {
        console.error("토큰 검증 에러:", error);
        setStatus('ERROR'); // 네트워크 오류나 서버 문제 시에도 접근 차단
      }
    };

    validateToken();
  }, [token]);

  // 1. 로딩 화면
  if (status === 'LOADING') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
        <div className="w-12 h-12 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-6 z-10"></div>
        <p className="text-orange-400/80 font-medium text-sm tracking-wider z-10">
          테이블 정보를 확인하고 있습니다...
        </p>
      </div>
    );
  }

  // 2. 접근 거부 화면 (토큰 무효/만료)
  if (status === 'ERROR') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-500/10 rounded-full blur-[80px]"></div>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] z-10">
          <AlertCircle className="text-red-500" size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 text-center tracking-tight z-10">
          유효하지 않은 테이블입니다
        </h2>
        <p className="text-slate-400 text-center mb-8 text-sm sm:text-base leading-relaxed z-10">
          토큰 정보가 일치하지 않거나 만료되었습니다.<br />
          매장 직원에게 문의하거나 QR 코드를 다시 스캔해주세요.
        </p>
      </div>
    );
  }

  // 3. 정상 접근 화면
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 sm:p-8 relative overflow-hidden">
      {/* 백그라운드 네온 효과 */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>

      <div className="text-center mb-12 sm:mb-16 z-10">
        {/* 이미지 로고 영역 */}
        <div className="inline-flex items-center justify-center mb-6 drop-shadow-[0_0_40px_rgba(249,115,22,0.3)]">
          <Image
            src={logoImage}
            alt="CAISINO Logo"
            width={110}
            height={110}
            className="object-contain"
            priority // 초기 화면에서 렌더링되므로 우선순위 부여
          />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-500 tracking-tighter mb-2">
          CAISINO
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-medium tracking-widest uppercase">
          카이지노에 오신 것을 환영합니다.
        </p>
      </div>

      <div className="w-full max-w-[320px] sm:max-w-sm flex flex-col gap-5 z-10">
        <Link href={`/customer?qt=${token}`} className="w-full group">
          <button className="w-full flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-300 active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Beer size={24} />
              </div>
              <span className="text-xl tracking-tight">주문 하러 가기</span>
            </div>
            <ChevronRight className="text-white/70 group-hover:text-white transition-colors" size={24} />
          </button>
        </Link>
        
        <Link href={`https://game.donggukcomai.shop?qt=${token}`} className="w-full group">
          <button className="w-full flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-5 px-6 rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300 active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Gamepad2 size={24} />
              </div>
              <span className="text-xl tracking-tight">게임 하러 가기</span>
            </div>
            <ChevronRight className="text-white/70 group-hover:text-white transition-colors" size={24} />
          </button>
        </Link>
      </div>

      <div className="mt-16 z-10 flex flex-col items-center gap-2">
        <div className="w-12 h-1 bg-slate-800 rounded-full mb-2"></div>
        <p className="text-xs sm:text-sm text-slate-500 font-semibold tracking-wider">
          동국대학교 컴퓨터AI학부 학생회 CAI
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
        <div className="w-12 h-12 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin z-10"></div>
      </div>
    }>
      <CaisinoHome />
    </Suspense>
  );
}
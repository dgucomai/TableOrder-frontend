"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { X } from "lucide-react"; // customer.tsx와 동일한 아이콘 사용

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
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold text-sm">테이블 정보를 확인하고 있습니다...</p>
      </div>
    );
  }

  // 2. 접근 거부 화면 (토큰 무효/만료)
  if (status === 'ERROR') {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100 p-6 sm:p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <X className="text-red-600" size={32} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">유효하지 않은 테이블입니다</h2>
        <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
          토큰 정보가 일치하지 않거나 만료되었습니다.<br />
          매장 직원에게 문의하거나 QR 코드를 다시 스캔해주세요.
        </p>
      </div>
    );
  }

  // 3. 정상 접근 화면
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 sm:p-8">
      <div className="text-center mb-8 sm:mb-12">
        <span className="text-6xl sm:text-7xl mb-4 sm:mb-6 block drop-shadow-sm">🍺</span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 tracking-tight">
          환영합니다!
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">
          CAISINO
        </p>
      </div>

      <Link href={`/customer?qt=${token}`} className="w-full max-w-[280px] sm:max-w-xs">
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg sm:text-xl">
          주문 하러 가기
        </button>
      </Link>
      
      <br />
      
      <Link href={`https://game.donggukcomai.shop?qt=${token}`} className="w-full max-w-[280px] sm:max-w-xs">
        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg sm:text-xl">
          게임 하러 가기
        </button>
      </Link>

      <br />
      
      <Link href="/staff" className="w-full max-w-[280px] sm:max-w-xs">
        <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg sm:text-xl">
          STAFF(배포시 없어질 버튼)
        </button>
      </Link>

      <p className="mt-10 sm:mt-12 text-xs sm:text-sm text-gray-400 font-medium">
        동국대학교 컴퓨터AI학부 학생회 CAI
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    }>
      <CaisinoHome />
    </Suspense>
  );
}
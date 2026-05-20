"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CaisinoHome() {
  const searchParams = useSearchParams();
  
  // Nginx가 이미 검증을 끝냈으므로, 있는 값을 그대로 가져오기만 하면 됨
  const token = searchParams.get("qtnum") || searchParams.get("qt") || searchParams.get("qrToken") || "";

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
        <span className="text-xl font-bold text-gray-500">로딩 중...</span>
      </div>
    }>
      <CaisinoHome />
    </Suspense>
  );
}
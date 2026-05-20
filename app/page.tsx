"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function CaisinoHome() {
  const searchParams = useSearchParams();
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  // 1. 토큰 값을 관리할 상태 추가
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const qtnum = searchParams.get("qtnum");

    if (qtnum) {
      sessionStorage.setItem("caisino_qtnum", qtnum);
      setToken(qtnum); // 상태에 토큰 저장
      setIsValidToken(true);
    } else {
      const savedQtnum = sessionStorage.getItem("caisino_qtnum");
      if (savedQtnum) {
        setToken(savedQtnum); // 스토리지에 있던 토큰을 상태에 저장
        setIsValidToken(true);
      } else {
        alert("유효하지 않은 접근입니다. QR 코드를 다시 스캔해주세요.");
        setIsValidToken(false);
      }
    }
  }, [searchParams]);

  if (isValidToken === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <span className="text-xl font-bold text-gray-500">확인 중...</span>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 text-center">
        <span className="text-6xl mb-6 block">🚫</span>
        <h1 className="text-2xl font-black text-gray-800 mb-4">
          잘못된 접근입니다
        </h1>
        <p className="text-gray-600 mb-8 font-medium">
          테이블에 비치된 QR 코드를 통해 다시 접속해주세요.
        </p>
      </div>
    );
  }

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

      <Link href={`/customer?qtnum=${token}`} className="w-full max-w-[280px] sm:max-w-xs">
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-lg sm:text-xl">
          주문 하러 가기
        </button>
      </Link>
      
      <br />
      
      {/* 만약 외부 게임 페이지에도 넘겨줘야 한다면 동일하게 적용 가능 */}
      <Link href={`https://game.donggukcomai.shop?qtnum=${token}`} className="w-full max-w-[280px] sm:max-w-xs">
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
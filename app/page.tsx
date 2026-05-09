"use client";

// 1. 페이지 이동을 위한 'Link' 도구를 불러옵니다.
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* 주점 로고나 환영 메시지 */}
      <div className="text-center mb-10">
        <span className="text-6xl mb-4 block">🍺</span>
        <h1 className="text-3xl font-bold text-gray-800">환영합니다!</h1>
        <p className="text-gray-500 mt-2">CAISINO</p>
      </div>

      {/* 2. Link 태그로 버튼을 감싸줍니다. href="/menu"는 /menu 폴더로 가라는 뜻입니다. */}
      <Link href="/customer" className="w-full max-w-xs">
        <button 
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 px-8 rounded-2xl shadow-xl transition-all active:scale-95 text-xl"
        >
          주문하기 시작
        </button>
      </Link>

      <p className="mt-8 text-sm text-gray-400">동국대학교 컴퓨터AI학부 학생회 CAI</p>
    </div>
  );
}
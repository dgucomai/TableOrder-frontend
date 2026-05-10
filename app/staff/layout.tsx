"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [adminName, setAdminName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/staff";

  const updateAdminInfo = () => {
    const savedName = localStorage.getItem("currentStaffName");
    const sessionActive = localStorage.getItem("staffSessionActive");
    
    if (sessionActive === "true" && savedName) {
      setAdminName(savedName);
    } else {
      setAdminName("");
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // [핵심 변경 사항] 인증 상태와 경로를 감시하여 무단 접근 차단
  useEffect(() => {
    if (isMounted) {
      const sessionActive = localStorage.getItem("staffSessionActive");
      
      // 세션이 없고(로그인 안 됨), 현재 위치가 로그인 페이지가 아니라면
      if (sessionActive !== "true" && !isLoginPage) {
        alert("로그인이 필요한 서비스입니다."); // 알림 띄우기
        router.replace("/staff"); // 뒤로 가기 기록을 남기지 않고 강제 이동
        return; // 아래의 정보 업데이트 로직을 실행하지 않음
      }

      // 무단 접근이 아니면 정상적으로 관리자 정보를 업데이트
      updateAdminInfo();
    }
  }, [pathname, isMounted, isLoginPage, router]);

  const handleLogout = () => {
    if (window.confirm("로그아웃하시겠습니까?")) {
      localStorage.removeItem("staffSessionActive");
      localStorage.removeItem("currentStaffName");
      setAdminName("");
      router.push("/staff");
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[#0f172a]" />;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center space-x-8">
          {isLoginPage ? (
            <span className="text-xl font-black text-orange-500 tracking-tighter cursor-default">
              CAISINO
            </span>
          ) : (
            <Link href="/staff/home" className="text-xl font-black text-orange-500 tracking-tighter hover:opacity-80 transition-opacity">
              CAISINO
            </Link>
          )}
          
          {!isLoginPage && (
            <div className="flex space-x-6 text-sm font-medium">
              <Link href="/staff/home" className="hover:text-orange-500 transition-colors">홈 (포스)</Link>
              <Link href="/staff/menu" className="hover:text-orange-500 transition-colors">메뉴</Link>
              <Link href="/staff/calls" className="hover:text-orange-500 transition-colors">호출</Link>
              <Link href="/staff/log" className="hover:text-orange-500 transition-colors">기록</Link>
            </div>
          )}
        </div>
        
        {!isLoginPage && (
          <div className="flex flex-col items-end text-sm text-slate-400">
            <div>
              관리자 <span className="text-white font-bold">{adminName || "확인 중..."}</span> 님
            </div>
            {adminName && (
              <button 
                onClick={handleLogout} 
                className="text-xs text-slate-500 hover:text-red-400 transition-colors mt-1"
              >
                로그아웃
              </button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
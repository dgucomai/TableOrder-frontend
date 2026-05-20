"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [adminName, setAdminName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: "/staff/home", label: "홈" },
    { href: "/staff/menu", label: "메뉴" },
    { href: "/staff/calls", label: "호출" },
    { href: "/staff/log", label: "기록" },
  ];

  useEffect(() => {
    setIsMounted(true);

    try {
      const sessionActive = localStorage.getItem("staffSessionActive");
      const savedName = localStorage.getItem("currentStaffName");
      
      // 관리자 그룹 내부이므로 세션이 없으면 즉시 로그인 페이지로 튕겨냅니다.
      if (sessionActive !== "true") {
        alert("로그인이 필요한 서비스입니다.");
        router.replace("/staff");
        return;
      }
      
      if (savedName) {
        setAdminName(savedName);
      }
    } catch (error) {
      console.warn("로컬 스토리지에 접근할 수 없습니다.", error);
    }
  }, [pathname, router]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (window.confirm("로그아웃하시겠습니까?")) {
      localStorage.removeItem("staffSessionActive");
      localStorage.removeItem("currentStaffName");
      setAdminName("");
      router.replace("/staff");
    }
  };

  // 마운트 전 서버-클라이언트 불일치(Hydration) 방지 구조 유지
  if (!isMounted) return <div className="min-h-screen bg-[#0f172a]" />;

  return (
    <div className="min-h-[100dvh] bg-[#0f172a] text-white flex flex-col">
      {/* 네비게이션 바 */}
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-4 md:px-6 sticky top-0 z-[100]">
        <div className="flex items-center space-x-4 md:space-x-8">
          {/* 모바일 햄버거 버튼 (언제나 노출) */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
            type="button"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* 로고 링크 */}
          <Link href="/staff/home" replace={pathname !== '/staff/home'} className="text-xl font-black text-orange-500 tracking-tighter hover:opacity-80 transition-opacity">
            CAISINO STAFF
          </Link>
          
          {/* 데스크탑 네비게이션 메뉴 */}
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                replace={pathname !== '/staff/home'} // 조건부 replace 적용
                className={`transition-colors ${pathname === link.href ? 'text-orange-500' : 'hover:text-orange-500'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* 우측 관리자 정보 및 로그아웃 */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-[12px] md:text-sm text-slate-400">
            <div>
              관리자 <span className="text-white font-bold">{adminName || "확인 중..."}</span> 님
            </div>
          </div>
          {adminName && (
            <button 
              onClick={handleLogout} 
              className="p-2 md:p-0 md:text-xs text-slate-500 hover:text-red-400 transition-colors"
              title="로그아웃"
              type="button"
            >
              <LogOut size={18} className="md:hidden" />
              <span className="hidden md:inline">로그아웃</span>
            </button>
          )}
        </div>
      </nav>

      {/* 모바일 사이드 메뉴 */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80] md:hidden" onClick={() => setIsMenuOpen(false)} />
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#1e293b] border-r border-slate-800 z-[90] md:hidden p-6 flex flex-col">
            <div className="mb-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <User size={16} />
                <span className="text-sm font-medium">현재 접속자</span>
              </div>
              <div className="text-lg font-bold text-white">{adminName} 관리자님</div>
            </div>
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  replace={pathname !== '/staff/home'} // 조건부 replace 적용
                  className={`text-lg font-semibold py-2 ${pathname === link.href ? 'text-orange-500' : 'text-slate-300'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button 
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-4 rounded-xl font-bold"
              type="button"
            >
              <LogOut size={18} /> 로그아웃
            </button>
          </aside>
        </>
      )}

      {/* 본문 콘텐츠 */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
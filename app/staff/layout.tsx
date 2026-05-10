"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react"; // 아이콘 라이브러리 권장

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [adminName, setAdminName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 모바일 메뉴 상태
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

  useEffect(() => {
    if (isMounted) {
      const sessionActive = localStorage.getItem("staffSessionActive");
      if (sessionActive !== "true" && !isLoginPage) {
        alert("로그인이 필요한 서비스입니다.");
        router.replace("/staff");
        return;
      }
      updateAdminInfo();
    }
    setIsMenuOpen(false); // 페이지 이동 시 메뉴 닫기
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

  const navLinks = [
    { href: "/staff/home", label: "홈 (포스)" },
    { href: "/staff/menu", label: "메뉴" },
    { href: "/staff/calls", label: "호출" },
    { href: "/staff/log", label: "기록" },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col">
      {/* 네비게이션 바 */}
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-4 md:px-6 sticky top-0 z-[100]">
        <div className="flex items-center space-x-4 md:space-x-8">
          {/* 모바일 햄버거 버튼 */}
          {!isLoginPage && (
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {isLoginPage ? (
            <span className="text-xl font-black text-orange-500 tracking-tighter cursor-default">
              CAISINO
            </span>
          ) : (
            <Link href="/staff/home" className="text-xl font-black text-orange-500 tracking-tighter hover:opacity-80 transition-opacity">
              CAISINO
            </Link>
          )}
          
          {/* 데스크탑 메뉴 */}
          {!isLoginPage && (
            <div className="hidden md:flex space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`transition-colors ${pathname === link.href ? 'text-orange-500' : 'hover:text-orange-500'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* 관리자 정보 영역 */}
        {!isLoginPage && (
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
              >
                <LogOut size={18} className="md:hidden" />
                <span className="hidden md:inline">로그아웃</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* 모바일 사이드 메뉴 (오버레이) */}
      {!isLoginPage && isMenuOpen && (
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
                  className={`text-lg font-semibold py-2 ${pathname === link.href ? 'text-orange-500' : 'text-slate-300'}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button 
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-4 rounded-xl font-bold"
            >
              <LogOut size={18} /> 로그아웃
            </button>
          </aside>
        </>
      )}

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, User } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [adminName, setAdminName] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/staff";

  const navLinks = [
    { href: "/staff/home", label: "홈 (포스)" },
    { href: "/staff/menu", label: "메뉴" },
    { href: "/staff/call", label: "호출" },
    { href: "/staff/log", label: "기록" },
  ];

  useEffect(() => {
    setIsMounted(true); // 마운트 상태 업데이트

    try {
      const sessionActive = localStorage.getItem("staffSessionActive");
      const savedName = localStorage.getItem("currentStaffName");
      
      if (sessionActive !== "true" && !isLoginPage) {
        alert("로그인이 필요한 서비스입니다.");
        router.replace("/staff");
        return;
      }
      
      if (sessionActive === "true" && savedName) {
        setAdminName(savedName);
      } else {
        setAdminName("");
      }
    } catch (error) {
      console.warn("로컬 스토리지에 접근할 수 없습니다.", error);
    }
  }, [pathname, isLoginPage, router]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (window.confirm("로그아웃하시겠습니까?")) {
      localStorage.removeItem("staffSessionActive");
      localStorage.removeItem("currentStaffName");
      setAdminName("");
      router.push("/staff");
    }
  };

  // 🚨 가장 큰 원인이었던 전체 렌더링 블로킹 코드를 삭제했습니다!
  // if (!isMounted) return <div className="min-h-screen bg-[#0f172a]" />;

  return (
    // 모바일 브라우저 뷰포트 고려를 위해 100dvh로 변경
    <div className="min-h-[100dvh] bg-[#0f172a] text-white flex flex-col">
      {/* 네비게이션 바 */}
      <nav className="h-16 border-b border-slate-800 bg-[#1e293b] flex items-center justify-between px-4 md:px-6 sticky top-0 z-[100]">
        <div className="flex items-center space-x-4 md:space-x-8">
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
        
        {!isLoginPage && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-[12px] md:text-sm text-slate-400">
              <div>
                {/* 텍스트 단위에서만 안전하게 Hydration 처리 */}
                관리자 <span className="text-white font-bold">{isMounted ? (adminName || "확인 중...") : "..."}</span> 님
              </div>
            </div>
            {isMounted && adminName && (
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

      {/* 모바일 사이드 메뉴 */}
      {!isLoginPage && isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80] md:hidden" onClick={() => setIsMenuOpen(false)} />
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[#1e293b] border-r border-slate-800 z-[90] md:hidden p-6 flex flex-col">
            <div className="mb-8 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3 text-slate-400 mb-2">
                <User size={16} />
                <span className="text-sm font-medium">현재 접속자</span>
              </div>
              <div className="text-lg font-bold text-white">{isMounted ? adminName : "..."} 관리자님</div>
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

      {/* 본문 콘텐츠 (여기서 로그인 폼이 정상적으로 그려질 것입니다) */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
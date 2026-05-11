"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight, ReceiptText, Bell } from 'lucide-react';
import Link from 'next/link';

// --- API 명세에 맞춘 타입 정의 ---
interface MenuItem {
  menuId: number;
  categoryId: number;
  categoryName: string;
  menuName: string;
  price: number;
  description: string;
  imageUrl: string | null;
  soldOut: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// 📌 [Mock Data] 백엔드가 줄 메뉴 데이터 흉내내기
const MOCK_MENUS: MenuItem[] = [
  { menuId: 1, categoryId: 1, categoryName: "안주", menuName: "바삭 김치전", price: 8000, description: "오징어가 듬뿍 들어간 바삭한 김치전", imageUrl: null, soldOut: false },
  { menuId: 2, categoryId: 1, categoryName: "안주", menuName: "얼큰 오뎅탕", price: 12000, description: "소주 안주로 제격인 뜨끈한 국물", imageUrl: null, soldOut: false },
  { menuId: 3, categoryId: 1, categoryName: "안주", menuName: "모듬 튀김", price: 15000, description: "새우, 고구마, 오징어 튀김 세트", imageUrl: null, soldOut: true }, // 품절 테스트용
  { menuId: 4, categoryId: 2, categoryName: "주류", menuName: "참이슬 후레쉬", price: 5000, description: "국민 소주", imageUrl: null, soldOut: false },
  { menuId: 5, categoryId: 2, categoryName: "주류", menuName: "생맥주 500cc", price: 4500, description: "시원한 얼음장 생맥주", imageUrl: null, soldOut: false },
  { menuId: 6, categoryId: 3, categoryName: "음료", menuName: "코카콜라", price: 2000, description: "얼음컵과 함께 제공됩니다", imageUrl: null, soldOut: false },
];

export default function OrderPage() {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [displayTableNum, setDisplayTableNum] = useState<string | null>(null);
  
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [step, setStep] = useState<'MENU' | 'PAYMENT' | 'CALL_SENT'>('MENU');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("qrToken");
    const tableNum = params.get("table");
    
    // 💡 개발 테스트 편의를 위해 파라미터가 없어도 임시 토큰을 부여합니다.
    setQrToken(token || "test_token_123");
    setDisplayTableNum(tableNum || "3"); 

    fetchMenusMock();
  }, []);

  // --- 1. [Mock] 메뉴 불러오기 API 흉내 ---
  const fetchMenusMock = async () => {
    try {
      // 0.5초 동안 로딩 (네트워크 지연 흉내)
      await new Promise(resolve => setTimeout(resolve, 500));

      // PDF 5-2. 성공 응답 예시 포맷 적용 
      const mockResponse = {
        success: true,
        code: "OK",
        message: "메뉴 목록 조회 성공",
        data: {
          menus: MOCK_MENUS
        }
      };

      if (mockResponse.success) {
        const fetchedMenus = mockResponse.data.menus;
        setMenuList(fetchedMenus);
        
        const uniqueCategories = Array.from(new Set(fetchedMenus.map(m => m.categoryName)));
        setCategories(["All", ...uniqueCategories]);
      }
    } catch (error) {
      console.error("메뉴 조회 에러:", error);
    }
  };

  const filteredMenu = activeCategory === "All" 
    ? menuList 
    : menuList.filter(item => item.categoryName === activeCategory);
  
  const addToCart = (item: MenuItem) => {
    if (item.soldOut) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuId === item.menuId);
      if (existing) return prev.map(i => i.menuId === item.menuId ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (menuId: number) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.menuId === menuId) {
        if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1 });
      } else acc.push(item);
      return acc;
    }, [] as CartItem[]));
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckoutReady = () => {
    if (!qrToken) {
      alert("유효하지 않은 QR 코드입니다.");
      return;
    }
    setIsCartOpen(false); 
    setStep('PAYMENT');   
  };

  // --- 2. [Mock] 주문 요청 API 흉내 ---
  const submitOrderMock = async () => {
    if (!qrToken || cart.length === 0) return;
    setIsLoading(true);

    try {
      console.log("서버로 전송될 페이로드:", {
        qrToken: qrToken,
        items: cart.map(item => ({ menuId: item.menuId, quantity: item.quantity }))
      });

      // 1.5초 동안 로딩 (결제/주문 처리 지연 흉내)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // PDF 6-3. 성공 응답 예시 포맷 적용 
      const mockResponse = {
        success: true,
        code: "ORDER_CREATED",
        message: "주문 대기 등록이 완료되었습니다."
      };
      
      if (mockResponse.success) {
        setStep('CALL_SENT');
      }
    } catch (error) {
      console.error(error);
      alert("주문 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      {/* 1. MENU 단계 */}
      {step === 'MENU' && (
        <>
          <header className="sticky top-0 z-10 bg-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div>
              <h1 className="text-lg font-extrabold text-orange-600 tracking-tight">CAISINO ORDER</h1>
              <p className={`text-xs font-bold ${qrToken ? "text-gray-500" : "text-red-500"}`}>
                {displayTableNum ? `${displayTableNum}번 테이블` : (qrToken ? "테이블 확인 완료" : "잘못된 접근")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/customer/orders" className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <ReceiptText className="w-6 h-6" />
              </Link>
              <button onClick={() => cart.length > 0 && setIsCartOpen(true)} className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalQuantity > 0 && <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{totalQuantity}</span>}
              </button>
            </div>
          </header>

          <div className="sticky top-[52px] z-10 flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{cat}</button>
            ))}
          </div>

          <main className="bg-white">
            {filteredMenu.map(item => {
              const cartItem = cart.find(i => i.menuId === item.menuId);
              return (
                <div key={item.menuId} className={`flex gap-4 p-4 border-b border-gray-100 ${item.soldOut ? "opacity-50" : ""}`}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.menuName} className="w-24 h-24 rounded-xl object-cover shrink-0 bg-gray-100" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl shrink-0 bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Image</div>
                  )}
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 leading-tight">{item.menuName}</h3>
                        {item.soldOut && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">품절</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-bold text-gray-900">{item.price.toLocaleString()}원</span>
                      
                      {!item.soldOut && (
                        cartItem ? (
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                            <button onClick={() => removeFromCart(item.menuId)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Minus size={16} strokeWidth={3} /></button>
                            <span className="w-6 text-center text-sm font-bold text-gray-800">{cartItem.quantity}</span>
                            <button onClick={() => addToCart(item)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Plus size={16} strokeWidth={3} /></button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100">담기</button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        </>
      )}

      {/* 2. PAYMENT 단계 */}
      {step === 'PAYMENT' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-8 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black mb-6">입금 정보를 확인해주세요</h2>
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <p className="text-gray-500 text-sm mb-1">총 입금액</p>
                <p className="text-3xl font-black text-orange-600">{totalPrice.toLocaleString()}원</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <p className="text-gray-500 text-sm mb-1">입금 계좌</p>
                <p className="text-lg font-bold">신한 110-123-456789</p>
                <p className="text-sm text-gray-400">예금주: 강이안(CAI)</p>
              </div>
            </div>
            
            {/* 💡 서버 통신 흉내내는 함수 연결 */}
            <button 
              onClick={submitOrderMock}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-lg disabled:bg-gray-400 flex justify-center items-center"
            >
              {isLoading ? "요청 중..." : "입금 완료 (직원 호출)"}
            </button>
            <button disabled={isLoading} onClick={() => setStep('MENU')} className="w-full mt-4 text-gray-400 font-medium py-2">취소하고 돌아가기</button>
          </div>
        </div>
      )}

      {/* 3. CALL_SENT 단계 */}
      {step === 'CALL_SENT' && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <Bell className="text-green-600 animate-bounce" size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 text-center">주문 접수(입금 확인) 요청 완료!</h2>
          <p className="text-gray-500 text-center mb-12">
            직원이 입금을 확인하면<br />
            자동으로 주문 접수가 완료됩니다.
          </p>
          <button 
            onClick={() => { setCart([]); setStep('MENU'); }}
            className="w-full max-w-[240px] bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold"
          >
            메뉴판으로 돌아가기
          </button>
        </div>
      )}

      {/* 하단 플로팅 바 & 장바구니 모달 */}
      {step === 'MENU' && cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-orange-500 text-white shadow-xl rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white text-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">{totalQuantity}</div>
              <span className="font-semibold text-lg">{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="flex items-center font-bold text-lg">장바구니 보기 <ChevronRight size={20} className="ml-1" /></div>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">장바구니</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto space-y-5 mb-5">
              {cart.map(item => (
                <div key={item.menuId} className="flex justify-between items-center">
                  <div className="flex-1"><h4 className="font-bold">{item.menuName}</h4><p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p></div>
                  <div className="flex items-center bg-gray-50 rounded-lg border ml-4">
                    <button onClick={() => removeFromCart(item.menuId)} className="p-2"><Minus size={16} /></button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="p-2"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-5 pb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">총 결제금액</span>
                <span className="text-2xl font-bold">{totalPrice.toLocaleString()}원</span>
              </div>
              <button onClick={handleCheckoutReady} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg">결제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight, ReceiptText, Bell, BellRing } from 'lucide-react';
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

// 📌 직원 호출 추천 문구 리스트
const CALL_PRESETS = [
  "문제가 생겼어요",
  "앞접시 주세요",
  "젓가락 주세요",
  "테이블 정리 부탁드려요",
  "기타(직접 입력)"
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

  // 🔔 직원 호출 관련 상태
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<string>(CALL_PRESETS[0]);
  const [customCallText, setCustomCallText] = useState("");
  const [isCallLoading, setIsCallLoading] = useState(false);

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
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockResponse = {
        success: true,
        code: "OK",
        message: "메뉴 목록 조회 성공",
        data: { menus: MOCK_MENUS }
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

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText('98215102201013');
      setIsCopied(true);
      // 2초 후 다시 '복사하기'로 변경
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('계좌번호 복사 실패:', err);
      alert('계좌번호 복사에 실패했습니다.');
    }
  };

  // --- 2. [Mock] 주문 요청 API 흉내 ---
  const submitOrderMock = async () => {
    if (!qrToken || cart.length === 0) return;
    setIsLoading(true);

    try {
      console.log("서버로 전송될 주문 페이로드:", {
        qrToken: qrToken,
        items: cart.map(item => ({ menuId: item.menuId, quantity: item.quantity }))
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep('CALL_SENT');
    } catch (error) {
      console.error(error);
      alert("주문 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. [Mock] 직원 호출 API 흉내 ---
  const submitCallMock = async () => {
    // 전송할 메시지 결정 (기타를 선택했으면 직접 입력한 텍스트 사용)
    const messageToSend = selectedCall === "기타 (직접 입력)" ? customCallText : selectedCall;
    
    if (selectedCall === "기타 (직접 입력)" && !customCallText.trim()) {
      alert("호출 내용을 입력해주세요.");
      return;
    }

    setIsCallLoading(true);

    try {
      console.log("서버로 전송될 직원 호출 페이로드:", {
        qrToken: qrToken,
        tableNum: displayTableNum,
        message: messageToSend
      });

      // 1초 동안 로딩 (서버 통신 지연 흉내)
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert("직원 호출이 완료되었습니다. 잠시만 기다려주세요!");
      
      // 상태 초기화 및 모달 닫기
      setIsCallModalOpen(false);
      setSelectedCall(CALL_PRESETS[0]);
      setCustomCallText("");

    } catch (error) {
      console.error(error);
      alert("호출 중 오류가 발생했습니다.");
    } finally {
      setIsCallLoading(false);
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
              <p className={`text-xs font-bold ${qrToken ? "text-gray-700" : "text-red-500"}`}>
                {displayTableNum ? `${displayTableNum}번 테이블` : (qrToken ? "테이블 확인 완료" : "잘못된 접근")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* 🔔 직원 호출 버튼 추가 */}
              <button onClick={() => setIsCallModalOpen(true)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex flex-col items-center justify-center">
                <BellRing className="w-6 h-6" />
                <span className="text-[10px] font-bold mt-0.5">호출</span>
              </button>
              <Link href="/customer/orders" className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <ReceiptText className="w-6 h-6" />
              </Link>
              <button onClick={() => cart.length > 0 && setIsCartOpen(true)} className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalQuantity > 0 && <span className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">{totalQuantity}</span>}
              </button>
            </div>
          </header>

          <div className="sticky top-[60px] z-10 flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b scrollbar-hide">
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
                        {item.soldOut && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold">품절</span>}
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
                          <button onClick={() => addToCart(item)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-100">담기</button>
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
            <h2 className="text-2xl text-black font-black mb-6">입금 정보를 확인해주세요</h2>
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <p className="text-gray-500 text-sm mb-1">총 입금액</p>
                <p className="text-3xl font-black text-orange-600">{totalPrice.toLocaleString()}원</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <p className="text-gray-500 text-sm mb-1">입금 계좌</p>
                {/* 계좌정보와 복사 버튼을 가로로 배치 */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg text-gray-800 font-bold">IBK기업은행 98215102201013</p>
                    <p className="text-sm text-gray-500">예금주: 손승현</p>
                  </div>
                  <button
                    onClick={handleCopyAccount}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
                  >
                    {isCopied ? "복사완료✓" : "복사하기"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center font-extrabold text-orange-600 tracking-tight mb-2">입금 완료 후 직원을 호출 해주세요.</div>
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

      {/* 장바구니 모달 */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl text-gray-900 font-bold">장바구니</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-orange-500 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto space-y-5 mb-5">
              {cart.map(item => (
                <div key={item.menuId} className="flex justify-between items-center">
                  <div className="flex-1"><h4 className="text-black font-bold">{item.menuName}</h4><p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p></div>
                  <div className="flex items-center bg-gray-50 rounded-lg border ml-4">
                    <button onClick={() => removeFromCart(item.menuId)} className="p-2 text-gray-700"><Minus size={16} /></button>
                    <span className="w-8 text-center text-gray-900 font-bold">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="p-2 text-gray-700"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-5 pb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">총 결제금액</span>
                <span className="text-2xl text-black font-bold">{totalPrice.toLocaleString()}원</span>
              </div>
              <button onClick={handleCheckoutReady} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg">결제하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 직원 호출 모달 */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black flex items-center gap-2">
                <BellRing className="text-orange-600" size={24} />
                직원 호출
              </h2>
              <button onClick={() => setIsCallModalOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-bold text-gray-600">어떤 도움이 필요하신가요?</p>
              
              <div className="flex flex-wrap gap-2">
                {CALL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedCall(preset)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                      selectedCall === preset 
                        ? "bg-orange-50 border-orange-500 text-orange-600" 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* '기타' 선택 시 나타나는 직접 입력 창 */}
              {selectedCall === "기타 (직접 입력)" && (
                <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    value={customCallText}
                    onChange={(e) => setCustomCallText(e.target.value)}
                    placeholder="필요한 사항을 적어주세요 (예: 젓가락 떨어뜨렸어요)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <button
              onClick={submitCallMock}
              disabled={isCallLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg disabled:bg-gray-400 transition-colors flex justify-center items-center"
            >
              {isCallLoading ? "호출 중..." : "직원 부르기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
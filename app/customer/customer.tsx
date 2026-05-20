"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight, ReceiptText, Bell, BellRing, User } from 'lucide-react';
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

const CALL_PRESETS = [
  "문제가 생겼어요",
  "앞접시 주세요",
  "젓가락 주세요",
  "테이블 정리 부탁드려요",
  "기타(직접 입력)"
];

const API_BASE_URL = "/api";

export default function OrderPage() {
  // 상태 변수는 'qrToken'으로 통일하여 사용합니다.
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [displayTableNum, setDisplayTableNum] = useState<string | null>(null);
  
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [activeCategory, setActiveCategory] = useState("All");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [step, setStep] = useState<'LOADING' | 'MENU' | 'PAYMENT' | 'CALL_SENT' | 'ACCESS_DENIED'>('LOADING');
  const [isLoading, setIsLoading] = useState(false);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<string>(CALL_PRESETS[0]);
  const [customCallText, setCustomCallText] = useState("");
  const [isCallLoading, setIsCallLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Nginx를 통과한 토큰 가져오기 (초기 로딩 시 파싱되는 값)
    const initialToken = params.get("qt") || "";
    setQrToken(initialToken);

    // --- [GET] DB와 통신하여 유효한 토큰인지 확인하고 테이블 번호 로딩 ---
    const loadTableAndMenus = async (tokenString: string) => {
      if (!tokenString) {
        setStep('ACCESS_DENIED');
        return;
      }

      try {
        // 백엔드 API 명세(?qt=)에 맞춰 통신
        const response = await fetch(`${API_BASE_URL}/qtnum?qt=${tokenString}`);
        const result = await response.json();

        if (result.success && result.data && result.data.tableNumber) {
          setDisplayTableNum(result.data.tableNumber.toString());
          await fetchMenus();
          setStep('MENU'); 
        } else {
          // DB에 없는 가짜 토큰이거나 만료된 토큰일 경우 튕겨냄
          setStep('ACCESS_DENIED');
        }
      } catch (error) {
        console.error("테이블 데이터 로딩 에러:", error);
        setStep('ACCESS_DENIED');
      }
    };

    loadTableAndMenus(initialToken);
  }, []);

  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus`);
      const result = await response.json();

      if (result.success) {
        const fetchedMenus = result.data.menus;
        setMenuList(fetchedMenus);
        const uniqueCategories = Array.from(new Set(fetchedMenus.map((m: MenuItem) => m.categoryName))) as string[];
        setCategories(["All", ...uniqueCategories]);
      } else {
        alert(result.message || "메뉴를 불러오지 못했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 에러가 발생했습니다.");
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
      alert("유효하지 않은 주문입니다.");
      return;
    }
    setIsCartOpen(false); 
    setStep('PAYMENT');   
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText('IBK기업은행 98215102201013');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      alert('계좌번호 복사에 실패했습니다.');
    }
  };

  const submitOrder = async () => {
    if (!qrToken || cart.length === 0) return;
    setIsLoading(true);

    try {
      const payload = {
        qrToken: qrToken,
        items: cart.map(item => ({ menuId: item.menuId, quantity: item.quantity }))
      };

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setStep('CALL_SENT');
        setCart([]);
      } else {
        alert(result.message || "주문 처리 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const submitStaffCall = async () => {
    const messageToSend = selectedCall === "기타(직접 입력)" ? customCallText : selectedCall;
    
    if (selectedCall === "기타(직접 입력)" && !customCallText.trim()) {
      alert("호출 내용을 입력해주세요.");
      return;
    }

    setIsCallLoading(true);

    try {
      const payload = { qrToken: qrToken, message: messageToSend };
      const response = await fetch(`${API_BASE_URL}/staff-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        alert("직원 호출이 완료되었습니다. 잠시만 기다려주세요!");
        setIsCallModalOpen(false);
        setSelectedCall(CALL_PRESETS[0]);
        setCustomCallText("");
      } else {
        alert(result.message || "호출 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 에러가 발생했습니다.");
    } finally {
      setIsCallLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      {/* 🔄 로딩 화면 */}
      {step === 'LOADING' && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-bold text-sm">테이블 정보를 확인하고 있습니다...</p>
        </div>
      )}

      {/* 🚫 접근 거부 화면 */}
      {step === 'ACCESS_DENIED' && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">유효하지 않은 테이블입니다</h2>
          <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed">
            토큰 정보가 일치하지 않거나 만료되었습니다.<br />
            매장 직원에게 문의하거나 QR 코드를 다시 스캔해주세요.
          </p>
        </div>
      )}

      {/* 1. MENU 단계 */}
      {step === 'MENU' && (
        <>
          <div className="sticky top-0 z-30 flex flex-col bg-white">
            <header className="px-4 py-3 flex justify-between items-center shadow-sm">
              <div>
                <h1 className="text-lg font-extrabold text-orange-600 tracking-tight">CAISINO ORDER</h1>
                <p className="text-xs font-bold text-gray-700">
                  {displayTableNum}번 테이블
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsCallModalOpen(true)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex flex-col items-center justify-center">
                  <BellRing className="w-6 h-6" />
                  <span className="text-[10px] font-bold mt-0.5">호출</span>
                </button>
                {/* 🚨 기존 에러 수정됨: token -> qrToken */}
                <Link href={`/customer/orders?qt=${qrToken || ""}`} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                  <ReceiptText className="w-6 h-6" />
                  <span className="text-[10px] font-bold mt-0.5"> 내역</span>
                </Link>
              </div>
            </header>
            <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100 scrollbar-hide">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)} 
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <main className="bg-white">
            {filteredMenu.length === 0 ? (
              <div className="flex justify-center items-center h-40 text-gray-400">
                메뉴를 불러오는 중이거나 메뉴가 없습니다.
              </div>
            ) : (
              <>
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
                <div className="py-8 pb-12 flex justify-center items-center">
                  <p className="text-xs text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-lg">
                    ✨ 모든 메뉴 이미지는 AI로 만든 참고용 사진 입니다.
                  </p>
                </div>
              </>
            )}
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
              onClick={submitOrder}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-lg disabled:bg-gray-400 flex justify-center items-center"
            >
              {isLoading ? "요청 중..." : "입금 완료 (주문 등록)"}
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
            onClick={() => setStep('MENU')}
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
              <h2 className="text-xl text-black font-bold flex items-center gap-3">
                <BellRing className="text-orange-600" size={24} />
                직원 호출
              </h2>
              <button onClick={() => setIsCallModalOpen(false)} className="p-2 bg-orange-500 hover:bg-gray-200 rounded-full transition-colors">
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

              {selectedCall === "기타(직접 입력)" && (
                <div className="mt-4 animate-in fade-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    value={customCallText}
                    onChange={(e) => setCustomCallText(e.target.value)}
                    maxLength={20}
                    placeholder="필요한 사항을 적어주세요. (20자 이내)"
                    className="text-black w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <button
              onClick={submitStaffCall}
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
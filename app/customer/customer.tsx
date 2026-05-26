"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Minus, X, ChevronRight, ArrowLeft, ReceiptText, Bell, BellRing } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MenuItem, CartItem } from '@/components/types';

// 🌟 지연 로딩(Lazy Loading)으로 모달 스플리팅
const CartModal = dynamic(() => import('@/components/CartModal'), { ssr: false });
const PaymentModal = dynamic(() => import('@/components/PaymentModal'), { ssr: false });
const CallModal = dynamic(() => import('@/components/CallModal'), { ssr: false });
const MenuDetailModal = dynamic(() => import('@/components/MenuDetailModal'), { ssr: false });

const API_BASE_URL = "/api";

export default function OrderPage() {
  const router = useRouter();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [displayTableNum, setDisplayTableNum] = useState<string | null>(null);
  const [tableId, setTableId] = useState<number | null>(null); 
  const [currentTokenCount, setCurrentTokenCount] = useState<number>(0); 
  
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [step, setStep] = useState<'LOADING' | 'MENU' | 'PAYMENT' | 'CALL_SENT' | 'ACCESS_DENIED'>('LOADING');
  const [isLoading, setIsLoading] = useState(false);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const calculateTokens = (price: number) => {
    return Math.round(price / 1000);
  };

  const fetchTokenCount = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tokens/${id}`);
      const result = await response.json();
      if (result.success && result.data) {
        setCurrentTokenCount(result.data.tokenCount);
      }
    } catch (error) {
      console.error("토큰 수량 로딩 에러:", error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialToken = params.get("qt") || "";
    setQrToken(initialToken);

    const loadTableAndMenus = async (tokenString: string) => {
      if (!tokenString) {
        setStep('ACCESS_DENIED');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/qtnum?qt=${tokenString}`);
        const result = await response.json();

        if (result.success && result.data && result.data.tableNumber) {
          setDisplayTableNum(result.data.tableNumber.toString());
          const fetchedTableId = result.data.tableId || result.data.tableNumber;
          setTableId(fetchedTableId);

          await Promise.all([
            fetchMenus(),
            fetchTokenCount(fetchedTableId)
          ]);
          setStep('MENU'); 
        } else {
          setStep('ACCESS_DENIED');
        }
      } catch (error) {
        setStep('ACCESS_DENIED');
      }
    };
    loadTableAndMenus(initialToken);
  }, []);

  useEffect(() => {
    if (cart.length === 0 && isCartOpen) {
      setIsCartOpen(false);
    }
  }, [cart, isCartOpen]);

  const fetchMenus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus`);
      const result = await response.json();

      if (result.success) {
        const fetchedMenus = result.data.menus.map((m: any) => ({
          ...m,
          soldOut: m.isSoldOut !== undefined ? m.isSoldOut : m.soldOut
        }));
        setMenuList(fetchedMenus);
        
        const uniqueCategories = Array.from(new Set(fetchedMenus.map((m: MenuItem) => m.categoryName))) as string[];
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          setActiveCategory(uniqueCategories[0]);
        }
      } else {
        alert(result.message || "메뉴를 불러오지 못했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 에러가 발생했습니다.");
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedMenu) setSelectedMenu(null); 
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedMenu]);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const el = categoryRefs.current[category];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100; 
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const addToCart = (item: MenuItem, qty: number = 1) => {
    if (item.soldOut) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuId === item.menuId);
      if (existing) {
        const newQuantity = Math.min(9, existing.quantity + qty);
        return prev.map(i => i.menuId === item.menuId ? { ...i, quantity: newQuantity } : i);
      }
      return [...prev, { ...item, quantity: Math.min(9, qty) }];
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

  const openMenuDetail = (item: MenuItem) => {
    if (item.soldOut) return;
    setSelectedMenu(item);
    window.history.pushState({ modal: 'detail' }, ''); 
  };

  const closeMenuDetail = () => {
    if (window.history.state?.modal === 'detail') {
      window.history.back();
    } else {
      setSelectedMenu(null);
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTokens = cart.reduce((sum, item) => sum + (calculateTokens(item.price) * item.quantity), 0);

  const handleCheckoutReady = async () => {
    if (!qrToken) return alert("유효하지 않은 주문입니다.");
    try {
      const response = await fetch(`${API_BASE_URL}/menus`);
      const result = await response.json();
      if (result.success) {
        const latestMenus = result.data.menus;
        const soldOutItemsInCart = cart.filter(cartItem => {
          const latestMenu = latestMenus.find((m: any) => m.menuId === cartItem.menuId);
          return !latestMenu || latestMenu.isSoldOut === true || latestMenu.soldOut === true;
        });
        if (soldOutItemsInCart.length > 0) {
          const soldOutNames = soldOutItemsInCart.map(item => item.menuName).join(', ');
          alert(`죄송합니다. 담으신 메뉴 중 방금 품절된 상품이 있습니다:\n[${soldOutNames}]\n장바구니를 다시 확인해 주세요.`);
          setMenuList(latestMenus.map((m: any) => ({ ...m, soldOut: m.isSoldOut !== undefined ? m.isSoldOut : m.soldOut })));
          return; 
        }
      }
    } catch (error) {
      return alert("서버와 통신하는 중 에러가 발생했습니다.");
    }
    setIsCartOpen(false); 
    setStep('PAYMENT');   
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
        if (!response.ok && result.message === '400 MENU_SOLD_OUT') {
          alert("죄송합니다. 방금 품절된 상품이 있습니다.\n장바구니를 확인해 주세요.");
          setStep('MENU');
          setIsCartOpen(true);
        } else {
          alert(result.message || "주문 처리 중 오류가 발생했습니다.");
        }
      }
    } catch (error) {
      alert("서버와 통신 에러가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      {step === 'LOADING' && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 shrink-0"></div>
          <p className="text-gray-500 font-bold text-sm whitespace-nowrap">테이블 정보를 확인하고 있습니다...</p>
        </div>
      )}

      {step === 'ACCESS_DENIED' && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 shrink-0">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center whitespace-nowrap truncate max-w-full">유효하지 않은 테이블입니다</h2>
          <p className="text-gray-500 text-center mb-8 text-sm leading-relaxed whitespace-nowrap truncate max-w-full">
            토큰 정보가 일치하지 않거나 만료되었습니다. 매장 직원에게 문의해주세요.
          </p>
        </div>
      )}

      {step === 'MENU' && (
        <>
          <div className="sticky top-0 z-30 flex flex-col bg-white">
            <header className="px-4 pt-3 pb-2 flex justify-between items-center">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {/* 🌟 수정된 뒤로가기 버튼: ArrowLeft 적용 및 스타일 개선 */}
                <button 
                  onClick={() => router.replace(`/?qt=${qrToken || ""}`)}
                  className="p-2 -ml-2 text-gray-800 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors shrink-0 flex items-center justify-center"
                  aria-label="메인 페이지로 뒤로가기"
                >
                  <ArrowLeft className="w-6 h-6 shrink-0" strokeWidth={2.5} />
                </button>
                
                <div className="min-w-0 flex-1 mr-2 pl-1">
                  <h1 className="text-lg font-extrabold text-orange-600 tracking-tight whitespace-nowrap truncate">CAISINO ORDER</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs font-bold text-gray-700 whitespace-nowrap shrink-0">
                      {displayTableNum}번 테이블
                    </p>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold whitespace-nowrap shrink-0">
                      보유 🪙 {currentTokenCount}개
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setIsCallModalOpen(true)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors flex flex-col items-center justify-center whitespace-nowrap shrink-0">
                  <BellRing className="w-6 h-6 shrink-0" />
                  <span className="text-[10px] font-bold mt-0.5">호출</span>
                </button>
                <Link href={`/customer/orders?qt=${qrToken || ""}`} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex flex-col items-center justify-center whitespace-nowrap shrink-0">
                  <ReceiptText className="w-6 h-6 shrink-0" />
                  <span className="text-[10px] font-bold mt-0.5">내역</span>
                </Link>
              </div>
            </header>
            
            <div className="flex gap-2 overflow-x-auto px-4 pt-1 pb-3 border-b border-gray-100 scrollbar-hide bg-white shadow-sm">
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => scrollToCategory(cat)} 
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${activeCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <main className="bg-white pb-10">
            {menuList.length === 0 ? (
              <div className="flex justify-center items-center h-40 text-gray-400 whitespace-nowrap">
                메뉴를 불러오는 중이거나 메뉴가 없습니다.
              </div>
            ) : (
              <>
                {categories.map((category, index) => {
                  const categoryMenus = menuList.filter(item => item.categoryName === category);
                  if (categoryMenus.length === 0) return null;

                  return (
                    <div key={category} ref={el => { categoryRefs.current[category] = el; }}>
                      {index > 0 && <div className="h-3 w-full bg-gray-100 border-y border-gray-200/60" />}
                      
                      <div className="pt-6">
                        <h2 className="px-4 text-2xl font-extrabold text-gray-900 mb-2">{category}</h2>
                        <div className="flex flex-col">
                          {categoryMenus.map((item, itemIndex) => {
                            const cartItem = cart.find(i => i.menuId === item.menuId);
                            // 🌟 첫 번째 카테고리의 4번째 항목까지만 우선 렌더링 부여
                            const isPriorityImage = index === 0 && itemIndex < 4;

                            return (
                              <div 
                                key={item.menuId} 
                                onClick={() => openMenuDetail(item)}
                                className={`flex gap-4 p-4 border-b cursor-pointer transition-colors ${
                                  item.soldOut ? "opacity-60 pointer-events-none" : ""
                                } ${
                                  cartItem ? "bg-orange-50/50 border-orange-100" : "bg-white border-gray-100 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex-1 flex flex-col py-0.5 min-w-0">
                                  <div className="min-w-0 mb-1">
                                    <h3 className="font-bold text-[17px] text-gray-900 leading-tight truncate">{item.menuName}</h3>
                                    <p className="text-sm text-gray-400 mt-1 truncate">{item.description}</p>
                                  </div>
                                  
                                  <div className="flex justify-between items-end mt-auto min-h-[32px]">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap pb-1">
                                      <span className="font-bold text-gray-900 text-base">{item.price.toLocaleString()}원</span>
                                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold">
                                        🪙 +{calculateTokens(item.price)}
                                      </span>
                                    </div>

                                    {cartItem && !item.soldOut && (
                                      <div className="flex items-center bg-white rounded-lg border border-orange-200 shadow-sm shrink-0 h-8" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => removeFromCart(item.menuId)} className="w-8 h-full flex items-center justify-center text-gray-700 hover:bg-orange-50 rounded-l-lg"><Minus size={14} strokeWidth={3} /></button>
                                        <span className="w-6 text-center text-sm font-bold text-gray-900">{cartItem.quantity}</span>
                                        <button onClick={() => addToCart(item, 1)} disabled={cartItem.quantity >= 9} className="w-8 h-full flex items-center justify-center text-gray-700 hover:bg-orange-50 rounded-r-lg disabled:opacity-30"><Plus size={14} strokeWidth={3} /></button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="relative w-24 h-24 shrink-0">
                                  <div className="w-full h-full rounded-xl overflow-hidden bg-gray-100 border border-black/5 relative">
                                    {item.imageUrl360 ? (
                                      <Image 
                                        src={item.imageUrl360} 
                                        alt={item.menuName} 
                                        fill
                                        sizes="96px"
                                        priority={isPriorityImage}
                                        className="object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 whitespace-nowrap">No Image</div>
                                    )}
                                    
                                    {item.soldOut && (
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                        <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-sm tracking-widest">품절</span>
                                      </div>
                                    )}
                                  </div>

                                  {!cartItem && !item.soldOut && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); addToCart(item, 1); }}
                                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-orange-500 rounded-full flex items-center justify-center shadow-md border border-gray-100 hover:bg-orange-50 active:scale-95 z-10"
                                    >
                                      <Plus size={20} strokeWidth={3} />
                                    </button>
                                  )}
                                </div>
                                
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="py-8 pb-12 flex justify-center items-center">
                  <p className="text-[10px] text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-lg whitespace-nowrap truncate max-w-[90%]">
                    ✨ 모든 메뉴 이미지는 AI로 제작한 참고용 이미지 입니다.
                  </p>
                </div>
              </>
            )}
          </main>
        </>
      )}

      {step === 'CALL_SENT' && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 shrink-0">
            <Bell className="text-green-600 animate-bounce shrink-0" size={48} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-4 text-center whitespace-nowrap truncate max-w-full">주문 접수(입금 확인) 요청 완료!</h2>
          <p className="text-gray-500 text-center mb-12 text-sm whitespace-nowrap truncate max-w-full">
            직원이 입금을 확인하면 자동으로 접수됩니다.
          </p>
          <button 
            onClick={() => setStep('MENU')}
            className="w-full max-w-[240px] bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold whitespace-nowrap shrink-0"
          >
            메뉴판으로 돌아가기
          </button>
        </div>
      )}

      {step === 'MENU' && cart.length > 0 && !isCartOpen && !selectedMenu && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-orange-500 text-white shadow-xl rounded-2xl p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white text-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">{totalQuantity}</div>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-semibold text-lg leading-tight whitespace-nowrap truncate">{totalPrice.toLocaleString()}원</span>
                <span className="text-[11px] font-medium text-orange-100 opacity-90 whitespace-nowrap truncate">토큰 획득: 🪙 {totalTokens}개</span>
              </div>
            </div>
            <div className="flex items-center font-bold text-base whitespace-nowrap shrink-0">장바구니 <ChevronRight size={20} className="ml-0.5 shrink-0" /></div>
          </button>
        </div>
      )}

      {/* 🌟 렌더링 분리된 팝업 컴포넌트 호출 */}
      {selectedMenu && (
        <MenuDetailModal 
          selectedMenu={selectedMenu} 
          closeMenuDetail={closeMenuDetail} 
          addToCart={addToCart}
          calculateTokens={calculateTokens}
        />
      )}

      {step === 'PAYMENT' && (
        <PaymentModal 
          totalPrice={totalPrice} 
          totalTokens={totalTokens} 
          submitOrder={submitOrder} 
          cancelPayment={() => setStep('MENU')} 
          isLoading={isLoading} 
        />
      )}

      {isCartOpen && (
        <CartModal 
          cart={cart} 
          setIsCartOpen={setIsCartOpen} 
          removeFromCart={removeFromCart} 
          addToCart={addToCart} 
          handleCheckoutReady={handleCheckoutReady} 
          totalPrice={totalPrice}
          totalTokens={totalTokens}
          calculateTokens={calculateTokens}
        />
      )}

      {isCallModalOpen && (
        <CallModal 
          setIsCallModalOpen={setIsCallModalOpen} 
          qrToken={qrToken}
        />
      )}
    </div>
  );
}
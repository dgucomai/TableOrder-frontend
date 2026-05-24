"use client";

import React, { useEffect, useState, useRef } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight, ReceiptText, Bell, BellRing, User, ChevronLeft } from 'lucide-react';
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
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [displayTableNum, setDisplayTableNum] = useState<string | null>(null);
  const [tableId, setTableId] = useState<number | null>(null); 
  const [currentTokenCount, setCurrentTokenCount] = useState<number>(0); 
  
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // ALL 삭제
  const [activeCategory, setActiveCategory] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [step, setStep] = useState<'LOADING' | 'MENU' | 'PAYMENT' | 'CALL_SENT' | 'ACCESS_DENIED'>('LOADING');
  const [isLoading, setIsLoading] = useState(false);

  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<string>(CALL_PRESETS[0]);
  const [customCallText, setCustomCallText] = useState("");
  const [isCallLoading, setIsCallLoading] = useState(false);

  // --- 상세 메뉴 모달용 상태 ---
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
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
        const fetchedMenus = result.data.menus.map((m: any) => ({
          ...m,
          soldOut: m.isSoldOut !== undefined ? m.isSoldOut : m.soldOut
        }));
        
        setMenuList(fetchedMenus);
        
        // ALL 제거 후 실제 카테고리만 저장
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

  // --- 카테고리 스크롤 함수 ---
  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    const el = categoryRefs.current[category];
    if (el) {
      // 상단 헤더와 탭 높이를 고려한 여백 적용
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // --- 장바구니 로직 (최대 9개 제한) ---
  const addToCart = (item: MenuItem, qty: number = 1) => {
    if (item.soldOut) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuId === item.menuId);
      if (existing) {
        // 기존 담긴 수량과 추가하려는 수량 합산 시 9개를 넘지 못하도록 제한
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
    
    // 모달 열 때, 장바구니에 이미 있다면 그 수량에서부터 시작하고 없으면 1로 초기화 (선택사항이나, UX상 보통 1로 둡니다)
    setDetailQuantity(1); 
  };

  const handleDetailAddToCart = () => {
    if (!selectedMenu) return;
    addToCart(selectedMenu, detailQuantity);
    setSelectedMenu(null); 
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTokens = cart.reduce((sum, item) => sum + (calculateTokens(item.price) * item.quantity), 0);

  const handleCheckoutReady = async () => {
    if (!qrToken) {
      alert("유효하지 않은 주문입니다.");
      return;
    }

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
          
          const fetchedMenus = latestMenus.map((m: any) => ({
            ...m,
            soldOut: m.isSoldOut !== undefined ? m.isSoldOut : m.soldOut
          }));
          setMenuList(fetchedMenus);
          
          return; 
        }
      } else {
        alert("최신 메뉴 정보를 확인하지 못했습니다. 다시 시도해주세요.");
        return;
      }
    } catch (error) {
      console.error("최신 메뉴 정보 확인 에러:", error);
      alert("서버와 통신하는 중 에러가 발생했습니다.");
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
        if (!response.ok && result.message === '400 MENU_SOLD_OUT') {
          alert("죄송합니다. 담으신 메뉴 중 방금 품절된 상품이 있습니다.\n장바구니를 다시 확인해 주세요.");
          setStep('MENU');
          setIsCartOpen(true);
        } else {
          alert(result.message || "주문 처리 중 오류가 발생했습니다.");
        }
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
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 shrink-0"></div>
          <p className="text-gray-500 font-bold text-sm whitespace-nowrap">테이블 정보를 확인하고 있습니다...</p>
        </div>
      )}

      {/* 🚫 접근 거부 화면 */}
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

      {/* 1. MENU 단계 */}
      {step === 'MENU' && (
        <>
          <div className="sticky top-0 z-30 flex flex-col bg-white">
            <header className="px-4 py-3 flex justify-between items-center shadow-sm">
              <div className="min-w-0 flex-1 mr-2">
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
            
            {/* 카테고리 탭 (스크롤 네비게이션 역할) */}
            <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100 scrollbar-hide bg-white">
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
                    <div 
                      key={category} 
                      ref={el => { categoryRefs.current[category] = el; }} 
                    >
                      {/* 카테고리 사이 굵은 회색 갭 라인 추가 */}
                      {index > 0 && <div className="h-3 w-full bg-gray-100 border-y border-gray-200/60" />}
                      
                      <div className="pt-6">
                        <h2 className="px-4 text-xl font-extrabold text-gray-900 mb-2">{category}</h2>
                        <div className="flex flex-col">
                          {categoryMenus.map(item => {
                            const cartItem = cart.find(i => i.menuId === item.menuId);

                            return (
                              <div 
                                key={item.menuId} 
                                onClick={() => openMenuDetail(item)}
                                className={`flex gap-4 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${item.soldOut ? "opacity-50 pointer-events-none" : ""}`}
                              >
                                <div className="flex-1 flex flex-col py-0.5 min-w-0">
                                  <div className="min-w-0 mb-1">
                                    <div className="flex items-start gap-2">
                                      <h3 className="font-bold text-[17px] text-gray-900 leading-tight truncate">{item.menuName}</h3>
                                      {item.soldOut && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold whitespace-nowrap shrink-0 mt-0.5">품절</span>}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1 truncate">{item.description}</p>
                                  </div>
                                  
                                  {/* 가격 & 카트 컨트롤 영역 */}
                                  <div className="flex justify-between items-end mt-auto min-h-[32px]">
                                    <div className="flex items-center gap-1.5 whitespace-nowrap pb-1">
                                      <span className="font-bold text-gray-900 text-base">{item.price.toLocaleString()}원</span>
                                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold">
                                        🪙 +{calculateTokens(item.price)}
                                      </span>
                                    </div>

                                    {/* 장바구니에 담긴 아이템일 때만 우측에 수량 조절 버튼 노출 */}
                                    {cartItem && !item.soldOut && (
                                      <div 
                                        className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm shrink-0 h-8" 
                                        onClick={(e) => e.stopPropagation()} // 모달 오픈 방지
                                      >
                                        <button 
                                          onClick={() => removeFromCart(item.menuId)} 
                                          className="w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors"
                                        >
                                          <Minus size={14} strokeWidth={3} />
                                        </button>
                                        <span className="w-6 text-center text-sm font-bold text-gray-900">
                                          {cartItem.quantity}
                                        </span>
                                        <button 
                                          onClick={() => addToCart(item, 1)} 
                                          disabled={cartItem.quantity >= 9}
                                          className="w-8 h-full flex items-center justify-center text-gray-700 hover:bg-gray-50 rounded-r-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                        >
                                          <Plus size={14} strokeWidth={3} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.menuName} className="w-24 h-24 rounded-xl object-cover shrink-0 bg-gray-100 border border-black/5" />
                                ) : (
                                  <div className="w-24 h-24 rounded-xl shrink-0 bg-gray-200 flex items-center justify-center text-xs text-gray-400 whitespace-nowrap">No Image</div>
                                )}
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
                    ✨ 모든 메뉴 이미지는 참고용 사진 입니다.
                  </p>
                </div>
              </>
            )}
          </main>
        </>
      )}

      {/* 4. 상세 메뉴 모달 */}
      {selectedMenu && (
        <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
          <button 
            onClick={() => setSelectedMenu(null)} 
            className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-gray-900 hover:bg-white"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 overflow-y-auto pb-32">
            {/* 큰 이미지: 4:3 비율(가로로 살짝 긴 형태)로 크롭하여 렌더링 */}
            {selectedMenu.imageUrl ? (
              <img src={selectedMenu.imageUrl} alt={selectedMenu.menuName} className="w-full aspect-[4/3] object-cover bg-gray-100" />
            ) : (
              <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-400">이미지 준비중</div>
            )}
            
            <div className="p-5">
              <h1 className="text-2xl font-black text-gray-900 mb-2">{selectedMenu.menuName}</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{selectedMenu.description}</p>
              
              <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                <span className="text-lg font-bold text-gray-900">가격</span>
                <span className="text-xl font-bold text-gray-900">{selectedMenu.price.toLocaleString()}원</span>
              </div>
              <div className="flex justify-end mt-2">
                 <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold">
                    주문 시 🪙 {calculateTokens(selectedMenu.price * detailQuantity)}개 획득
                  </span>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="font-bold text-gray-700">수량 (최대 9개)</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                  className="p-2 text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-30"
                  disabled={detailQuantity <= 1}
                >
                  <Minus size={20} />
                </button>
                <span className="text-lg font-bold w-6 text-center">{detailQuantity}</span>
                <button 
                  onClick={() => setDetailQuantity(Math.min(9, detailQuantity + 1))}
                  className="p-2 text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-30"
                  disabled={detailQuantity >= 9}
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <button 
              onClick={handleDetailAddToCart}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 active:scale-[0.98] transition-all flex justify-center items-center"
            >
              {(selectedMenu.price * detailQuantity).toLocaleString()}원 담기
            </button>
          </div>
        </div>
      )}

      {/* 2. PAYMENT 단계 */}
      {step === 'PAYMENT' && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-8 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl text-black font-black mb-6 whitespace-nowrap truncate">입금 정보를 확인해주세요</h2>
            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <div className="flex justify-between items-end mb-1 gap-2">
                  <p className="text-gray-500 text-sm whitespace-nowrap shrink-0">총 입금액</p>
                  <p className="text-orange-600 text-xs font-bold bg-orange-100 px-2 py-0.5 rounded-lg whitespace-nowrap truncate">
                    주문 완료시 🪙 {totalTokens}개 획득
                  </p>
                </div>
                <p className="text-3xl font-black text-orange-600 whitespace-nowrap truncate">{totalPrice.toLocaleString()}원</p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border">
                <p className="text-gray-500 text-sm mb-1 whitespace-nowrap">입금 계좌</p>
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="text-base text-gray-800 font-bold truncate">IBK기업은행 98215102201013</p>
                    <p className="text-sm text-gray-500 whitespace-nowrap">예금주: 손승현</p>
                  </div>
                  <button
                    onClick={handleCopyAccount}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm whitespace-nowrap shrink-0"
                  >
                    {isCopied ? "복사완료✓" : "복사하기"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-center items-center font-bold text-orange-600 tracking-tight mb-2 text-sm whitespace-nowrap truncate">입금 완료 후 직원을 호출 해주세요.</div>
            <button 
              onClick={submitOrder}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform shadow-lg disabled:bg-gray-400 flex justify-center items-center whitespace-nowrap shrink-0"
            >
              {isLoading ? "요청 중..." : "입금 완료 (주문 등록)"}
            </button>
            <button disabled={isLoading} onClick={() => setStep('MENU')} className="w-full mt-4 text-gray-400 font-medium py-2 whitespace-nowrap">취소하고 돌아가기</button>
          </div>
        </div>
      )}

      {/* 3. CALL_SENT 단계 */}
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

      {/* 하단 플로팅 장바구니 바 (상세 모달이 꺼져있을 때만 표시) */}
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

      {/* 장바구니 모달 (장바구니 내부에서도 최대 9개 제한) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <h2 className="text-xl text-gray-900 font-bold whitespace-nowrap">장바구니</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-orange-500 rounded-full text-white shrink-0"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto space-y-5 mb-5 pr-1">
              {cart.map(item => (
                <div key={item.menuId} className="flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-black font-bold truncate">{item.menuName}</h4>
                    <div className="flex items-center gap-2 mt-1 whitespace-nowrap">
                      <p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p>
                      <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md font-bold">
                        🪙 {calculateTokens(item.price * item.quantity)}개
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-50 rounded-lg border ml-2 shrink-0">
                    <button onClick={() => removeFromCart(item.menuId)} className="p-2 text-gray-700 shrink-0"><Minus size={16} /></button>
                    <span className="w-8 text-center text-gray-900 font-bold whitespace-nowrap shrink-0">{item.quantity}</span>
                    <button 
                      onClick={() => addToCart(item, 1)} 
                      disabled={item.quantity >= 9}
                      className="p-2 text-gray-700 shrink-0 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-5 pb-8 shrink-0">
              <div className="flex justify-between items-end mb-4 gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-gray-500 font-medium whitespace-nowrap">총 결제금액</span>
                  <span className="text-xs text-orange-600 font-bold mt-1 whitespace-nowrap truncate">🪙 총 {totalTokens}개 획득 예정</span>
                </div>
                <span className="text-2xl text-black font-bold whitespace-nowrap shrink-0">{totalPrice.toLocaleString()}원</span>
              </div>
              <button onClick={handleCheckoutReady} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg whitespace-nowrap shrink-0">결제하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 직원 호출 모달 */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-xl text-black font-bold flex items-center gap-3 whitespace-nowrap">
                <BellRing className="text-orange-600 shrink-0" size={24} />
                직원 호출
              </h2>
              <button onClick={() => setIsCallModalOpen(false)} className="p-2 bg-orange-500 text-white hover:bg-orange-600 rounded-full transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-bold text-gray-600 whitespace-nowrap truncate">어떤 도움이 필요하신가요?</p>
              
              <div className="flex flex-wrap gap-2">
                {CALL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSelectedCall(preset)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors border whitespace-nowrap shrink-0 ${
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
                    className="text-black w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm whitespace-nowrap"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <button
              onClick={submitStaffCall}
              disabled={isCallLoading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg disabled:bg-gray-400 transition-colors flex justify-center items-center whitespace-nowrap shrink-0"
            >
              {isCallLoading ? "호출 중..." : "직원 부르기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
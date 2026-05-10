"use client";

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight, ReceiptText, Bell, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { FESTIVAL_MENU } from './MenuData';

// --- Types ---
interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function OrderPage() {
  const [tableId, setTableId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // [추가] SPA 단계 관리: 메뉴판 -> 입금안내 -> 호출완료
  const [step, setStep] = useState<'MENU' | 'PAYMENT' | 'CALL_SENT'>('MENU');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get("table");
    const parsedTableId = Number(tableParam);
    if (Number.isInteger(parsedTableId) && parsedTableId >= 1 && parsedTableId <= 90) {
      setTableId(parsedTableId);
    }
  }, []);

  const CATEGORIES = ["All", "Main", "Sides", "Drinks"];
  const filteredMenu = activeCategory === "All" ? FESTIVAL_MENU : FESTIVAL_MENU.filter(item => item.category === activeCategory);
  
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === id) {
        if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1 });
      } else acc.push(item);
      return acc;
    }, [] as CartItem[]));
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // [수정] 결제하기 클릭 시 바로 완료가 아니라 '입금 안내(PAYMENT)' 단계로 이동
  const handleCheckout = () => {
    if (!tableId) {
      alert("테이블 번호가 없습니다.");
      return;
    }
    setIsCartOpen(false); // 장바구니 모달 닫고
    setStep('PAYMENT');   // 입금 안내창 띄우기
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 relative">
      {/* 1. 기존 헤더 & 카테고리 (MENU 단계에서만 표시) */}
      {step === 'MENU' && (
        <>
          <header className="sticky top-0 z-10 bg-white px-4 py-3 flex justify-between items-center shadow-sm">
            <div>
              <h1 className="text-lg font-extrabold text-orange-600 tracking-tight">CAISINO ORDER</h1>
              <p className={`text-xs font-bold ${tableId ? "text-gray-500" : "text-red-500"}`}>
                {tableId ? `${tableId}번 테이블` : "테이블 번호 없음"}
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
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{cat}</button>
            ))}
          </div>

          {/* 메뉴 리스트 */}
          <main className="bg-white">
            {filteredMenu.map(item => {
              const cartItem = cart.find(i => i.id === item.id);
              return (
                <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover shrink-0 bg-gray-100" />
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-bold text-gray-900">{item.price.toLocaleString()}원</span>
                      {cartItem ? (
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                          <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Minus size={16} strokeWidth={3} /></button>
                          <span className="w-6 text-center text-sm font-bold text-gray-800">{cartItem.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"><Plus size={16} strokeWidth={3} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100">담기</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        </>
      )}

      {/* 2. [PAYMENT] 단계: 입금 안내 모달 */}
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
            <button 
              onClick={() => setStep('CALL_SENT')}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-xl active:scale-[0.98] transition-transform shadow-lg"
            >
              입금 완료 (직원 호출)
            </button>
            <button onClick={() => setStep('MENU')} className="w-full mt-4 text-gray-400 font-medium py-2">취소하고 돌아가기</button>
          </div>
        </div>
      )}

      {/* 3. [CALL_SENT] 단계: 호출 완료 메시지 */}
      {step === 'CALL_SENT' && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
            <Bell className="text-green-600 animate-bounce" size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 text-center">직원이 호출되었습니다!</h2>
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

      {/* 기존 하단 플로팅 바 & 장바구니 모달은 유지하되 step이 MENU일 때만 작동하게 함 */}
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

      {/* Cart Modal UI는 기존과 동일하게 유지 (handleCheckout 호출) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">장바구니</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto space-y-5 mb-5">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1"><h4 className="font-bold">{item.name}</h4><p className="text-sm text-gray-500">{item.price.toLocaleString()}원</p></div>
                  <div className="flex items-center bg-gray-50 rounded-lg border ml-4">
                    <button onClick={() => removeFromCart(item.id)} className="p-2"><Minus size={16} /></button>
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
              <button onClick={handleCheckout} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg">결제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
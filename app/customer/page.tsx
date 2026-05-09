"use client";

import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, X, ChevronRight } from 'lucide-react';

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

// --- Mock Data ---
const MENU_DATA: MenuItem[] = [
  { id: 1, name: "시그니처 비프 버거", price: 12000, category: "Main", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500", description: "육즙 가득한 100% 소고기 패티와 특제 소스" },
  { id: 2, name: "크리스피 치킨 버거", price: 10500, category: "Main", image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500", description: "겉바속촉의 정석, 매콤달콤 치킨 패티" },
  { id: 3, name: "트러플 프라이", price: 6500, category: "Sides", image: "https://images.unsplash.com/photo-1573082891205-f495f90cbca5?w=500", description: "풍미 넘치는 트러플 오일과 바삭한 감자" },
  { id: 4, name: "코울슬로", price: 3000, category: "Sides", image: "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=500", description: "아삭아삭 상큼한 양배추 샐러드" },
  { id: 5, name: "제로 콜라", price: 2500, category: "Drinks", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500", description: "양심의 가책을 덜어주는 제로 칼로리" },
  { id: 6, name: "바닐라 쉐이크", price: 5500, category: "Drinks", image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500", description: "달콤하고 부드러운 우유 본연의 맛" },
];

const CATEGORIES = ["All", "Main", "Sides", "Drinks"];

export default function OrderPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); // 장바구니 모달 상태

  // 필터링된 메뉴
  const filteredMenu = activeCategory === "All" 
    ? MENU_DATA 
    : MENU_DATA.filter(item => item.category === activeCategory);

  // 장바구니 추가
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // 장바구니 감소/제거
  const removeFromCart = (id: number) => {
    setCart(prev => prev.reduce((acc, item) => {
      if (item.id === id) {
        if (item.quantity > 1) acc.push({ ...item, quantity: item.quantity - 1 });
      } else {
        acc.push(item);
      }
      return acc;
    }, [] as CartItem[]));
    
    // 장바구니가 비워지면 모달 닫기
    if (cart.length === 1 && cart[0].id === id && cart[0].quantity === 1) {
      setIsCartOpen(false);
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-extrabold text-orange-600 tracking-tight">DELICIOUS BUGER</h1>
        <button 
          onClick={() => cart.length > 0 && setIsCartOpen(true)}
          className="relative p-2"
        >
          <ShoppingCart className="w-6 h-6 text-gray-800" />
          {totalQuantity > 0 && (
            <span className="absolute top-1 right-0 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
              {totalQuantity}
            </span>
          )}
        </button>
      </header>

      {/* Category Tabs */}
      <div className="sticky top-[52px] z-10 flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat 
                ? "bg-gray-800 text-white" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu List (컴팩트 가로형 UI) */}
      <main className="bg-white">
        {filteredMenu.map(item => {
          const cartItem = cart.find(i => i.id === item.id);
          return (
            <div key={item.id} className="flex gap-4 p-4 border-b border-gray-100">
              {/* 썸네일 크기 축소 (w-24 h-24) */}
              <img src={item.image} alt={item.name} className="w-24 h-24 rounded-xl object-cover shrink-0 bg-gray-100" />
              
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <span className="font-bold text-gray-900">{item.price.toLocaleString()}원</span>
                  
                  {/* 컴팩트한 수량 조절 버튼 */}
                  {cartItem ? (
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-gray-500 hover:text-gray-900 active:bg-gray-200 rounded-l-lg transition-colors">
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">{cartItem.quantity}</span>
                      <button onClick={() => addToCart(item)} className="p-1.5 text-gray-500 hover:text-gray-900 active:bg-gray-200 rounded-r-lg transition-colors">
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors"
                    >
                      담기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Floating Bar (장바구니 요약) */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-orange-500 text-white shadow-xl rounded-2xl p-4 flex items-center justify-between hover:bg-orange-600 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-orange-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                {totalQuantity}
              </div>
              <span className="font-semibold text-lg">{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="flex items-center font-bold text-lg">
              장바구니 보기 <ChevronRight size={20} className="ml-1" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal (장바구니 상세) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-900">장바구니</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="overflow-y-auto p-5 space-y-5">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{item.price.toLocaleString()}원</p>
                  </div>
                  
                  {/* 수량 조절 in Modal */}
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 ml-4">
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-600 active:bg-gray-200 rounded-l-lg">
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="p-2 text-gray-600 active:bg-gray-200 rounded-r-lg">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer (Checkout) */}
            <div className="p-5 border-t bg-gray-50 pb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">총 결제금액</span>
                <span className="text-2xl font-bold text-gray-900">{totalPrice.toLocaleString()}원</span>
              </div>
              <button 
                onClick={() => alert('주문이 완료되었습니다!')}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 active:scale-[0.98] transition-transform"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { CartItem, MenuItem } from './types';

interface Props {
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  removeFromCart: (menuId: number) => void;
  addToCart: (item: MenuItem, qty: number) => void;
  handleCheckoutReady: () => void;
  totalPrice: number;
  totalTokens: number;
  calculateTokens: (price: number) => number;
}

export default function CartModal({ 
  cart, setIsCartOpen, removeFromCart, addToCart, handleCheckoutReady, totalPrice, totalTokens, calculateTokens 
}: Props) {
  return (
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
                    🪙 +{calculateTokens(item.price) * item.quantity}개
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
  );
}
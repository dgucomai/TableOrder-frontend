import React, { useState } from 'react';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { MenuItem } from './types';

interface Props {
  selectedMenu: MenuItem;
  closeMenuDetail: () => void;
  addToCart: (item: MenuItem, qty: number) => void;
  calculateTokens: (price: number) => number;
}

export default function MenuDetailModal({ selectedMenu, closeMenuDetail, addToCart, calculateTokens }: Props) {
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  const handleDetailAddToCart = () => {
    addToCart(selectedMenu, detailQuantity);
    closeMenuDetail(); 
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-200">
      <button 
        onClick={closeMenuDetail} 
        className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-gray-900 hover:bg-white"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="relative w-full aspect-[4/3] bg-gray-100">
          {selectedMenu.imageUrl1024 ? (
            <Image 
              src={selectedMenu.imageUrl1024} 
              alt={selectedMenu.menuName} 
              fill
              sizes="100vw"
              className="object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">이미지 준비중</div>
          )}
        </div>
        
        <div className="p-5">
          <h1 className="text-2xl font-black text-gray-900 mb-2">{selectedMenu.menuName}</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{selectedMenu.description}</p>
          
          <div className="flex justify-between items-center border-t border-gray-100 pt-6">
            <span className="text-lg font-bold text-gray-900">가격</span>
            <span className="text-xl font-bold text-gray-900">{selectedMenu.price.toLocaleString()}원</span>
          </div>
          <div className="flex justify-end mt-2">
             <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md font-bold">
                주문 시 🪙 {calculateTokens(selectedMenu.price)}개 획득
              </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-6 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col gap-0.5 justify-center">
            <span className="text-xs font-bold text-gray-400">수량</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-30"
                disabled={detailQuantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="text-lg font-bold w-6 text-center">{detailQuantity}</span>
              <button 
                onClick={() => setDetailQuantity(Math.min(9, detailQuantity + 1))}
                className="w-8 h-8 flex items-center justify-center text-gray-900 bg-gray-100 rounded-full hover:bg-gray-200 disabled:opacity-30"
                disabled={detailQuantity >= 9}
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-[10px] font-bold text-orange-600 mt-1">
              🪙 {calculateTokens(selectedMenu.price) * detailQuantity}개 획득 예정
            </span>
          </div>

          <button 
            onClick={handleDetailAddToCart}
            className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 active:scale-[0.98] transition-all flex flex-col justify-center items-center"
          >
            <span>{(selectedMenu.price * detailQuantity).toLocaleString()}원</span>
            <span className="text-xs opacity-90 font-medium">장바구니 담기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
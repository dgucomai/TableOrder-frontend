import React, { useState } from 'react';

interface Props {
  totalPrice: number;
  totalTokens: number;
  submitOrder: () => void;
  cancelPayment: () => void;
  isLoading: boolean;
}

export default function PaymentModal({ totalPrice, totalTokens, submitOrder, cancelPayment, isLoading }: Props) {
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

  return (
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
        <button disabled={isLoading} onClick={cancelPayment} className="w-full mt-4 text-gray-400 font-medium py-2 whitespace-nowrap">취소하고 돌아가기</button>
      </div>
    </div>
  );
}
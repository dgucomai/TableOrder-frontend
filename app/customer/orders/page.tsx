"use client";

import React from 'react';
import { ChevronLeft, Package, Clock, CheckCircle2, AlertCircle, Receipt } from 'lucide-react';
import Link from 'next/link';

// --- Types ---
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface OrderInfo {
  orderId: string;
  date: string;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: OrderStatus;
  accountInfo?: string; // 무통장 입금일 경우
}

// --- Mock Data (실제로는 서버/로컬스토리지에서 가져옴) ---
const MOCK_ORDERS: OrderInfo[] = [
  {
    orderId: "ORD-9X8A7B",
    date: "2026.05.09 21:15",
    items: [
      { name: "시그니처 비프 버거", quantity: 2 },
      { name: "제로 콜라", quantity: 1 }
    ],
    totalPrice: 26500,
    status: 'PENDING',
    accountInfo: "신한 110-123-456789 (김식당)"
  },
  {
    orderId: "ORD-1A2B3C",
    date: "2026.05.09 19:30",
    items: [
      { name: "크리스피 치킨 버거 세트", quantity: 1 }
    ],
    totalPrice: 15500,
    status: 'PREPARING',
  },
  {
    orderId: "ORD-X9Y8Z7",
    date: "2026.05.08 12:00",
    items: [
      { name: "트러플 프라이", quantity: 1 },
      { name: "바닐라 쉐이크", quantity: 2 }
    ],
    totalPrice: 17500,
    status: 'COMPLETED',
  }
];

// --- 상태별 UI 설정 헬퍼 함수 ---
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return { text: "입금 대기중", color: "text-red-500", bg: "bg-red-50", icon: <AlertCircle size={16} /> };
    case 'PAID':
      return { text: "결제 완료", color: "text-blue-500", bg: "bg-blue-50", icon: <CheckCircle2 size={16} /> };
    case 'PREPARING':
      return { text: "조리 중", color: "text-orange-500", bg: "bg-orange-50", icon: <Clock size={16} /> };
    case 'READY':
      return { text: "픽업 대기", color: "text-green-500", bg: "bg-green-50", icon: <Package size={16} /> };
    case 'COMPLETED':
      return { text: "수령 완료", color: "text-gray-500", bg: "bg-gray-100", icon: <CheckCircle2 size={16} /> };
    case 'CANCELLED':
      return { text: "주문 취소", color: "text-gray-400", bg: "bg-gray-100", icon: <AlertCircle size={16} /> };
    default:
      return { text: "알 수 없음", color: "text-gray-500", bg: "bg-gray-100", icon: null };
  }
};

export default function OrderHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center shadow-sm">
        {/* Next.js의 Link 컴포넌트를 사용하여 이전 페이지(메인)로 이동 */}
        <Link href="/customer" className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-8">주문 내역</h1>
      </header>

      <main className="p-4 space-y-4">
        {MOCK_ORDERS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Receipt size={48} className="mb-4 opacity-50" />
            <p>주문 내역이 없습니다.</p>
          </div>
        ) : (
          MOCK_ORDERS.map((order) => {
            const config = getStatusConfig(order.status);
            // 아이템 요약 텍스트 생성 (예: "비프 버거 외 1건")
            const itemNameSummary = order.items.length > 1 
              ? `${order.items[0].name} 외 ${order.items.length - 1}건`
              : order.items[0].name;

            return (
              <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                
                {/* 주문 카드 헤더 (날짜 & 상태) */}
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="text-sm text-gray-500 font-medium">{order.date}</div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${config.color} ${config.bg}`}>
                    {config.icon}
                    {config.text}
                  </div>
                </div>

                {/* 주문 내역 본문 */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{itemNameSummary}</h3>
                  
                  {/* 상세 아이템 리스트 (접어두거나 작게 표시) */}
                  <div className="text-sm text-gray-500 mb-4 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>{item.quantity}개</span>
                      </div>
                    ))}
                  </div>

                  {/* 결제 금액 */}
                  <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">총 결제금액</span>
                    <span className="text-lg font-extrabold text-gray-900">{order.totalPrice.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 계좌이체 대기 상태일 때만 보이는 액션 영역 */}
                {order.status === 'PENDING' && order.accountInfo && (
                  <div className="bg-red-50 p-4 border-t border-red-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-600 font-bold">입금 계좌</span>
                      <span className="text-sm font-bold text-gray-800">{order.accountInfo}</span>
                    </div>
                    <button 
                      onClick={() => {
                         navigator.clipboard.writeText(order.accountInfo?.split(' ')[1] || "");
                         alert("계좌번호가 복사되었습니다.");
                      }}
                      className="w-full bg-white border border-red-200 text-red-600 text-sm py-2 rounded-lg font-bold hover:bg-red-50"
                    >
                      계좌번호 복사하기
                    </button>
                    <p className="text-[10px] text-red-400 text-center mt-1">
                      오늘 자정까지 미입금 시 자동 취소됩니다.
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
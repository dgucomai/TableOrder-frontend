"use client";

import React from 'react';
import { ChevronLeft, CheckCircle2, Clock, AlertCircle, Receipt } from 'lucide-react';
import Link from 'next/link';
import { FESTIVAL_MENU } from '../MenuData';
// --- Types ---
type OrderStatus = 'PENDING' | 'PREPARING' | 'COMPLETED';

interface OrderInfo {
  orderId: string;
  date: string;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: OrderStatus;
  accountInfo?: string;
}

// --- 최신 메뉴가 반영된 Mock Data (기획안 source: 30, 31 반영) ---
const MOCK_ORDERS: OrderInfo[] = [
  {
    orderId: "ORD-2026-001",
    date: "2026.05.11 21:15",
    items: [
      { name: "돼지고기 두부김치", quantity: 1 },
      { name: "메론소다 시럽", quantity: 2 }
    ],
    totalPrice: 23800,
    status: 'PENDING',
    accountInfo: "신한 110-123-456789 (강이안)"
  },
  {
    orderId: "ORD-2026-002",
    date: "2026.05.11 19:30",
    items: [
      { name: "꼬치류 세트", quantity: 1 }
    ],
    totalPrice: 18000,
    status: 'PREPARING',
  }
];

const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return { text: "입금 확인 중", color: "text-red-500", bg: "bg-red-50", icon: <AlertCircle size={16} /> };
    case 'PREPARING':
      return { text: "주방 조리 중", color: "text-orange-500", bg: "bg-orange-50", icon: <Clock size={16} /> };
    case 'COMPLETED':
      return { text: "제공 완료", color: "text-gray-500", bg: "bg-gray-100", icon: <CheckCircle2 size={16} /> };
    default:
      return { text: "확인 불가", color: "text-gray-500", bg: "bg-gray-100", icon: null };
  }
};

export default function OrderHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 flex items-center shadow-sm">
        <Link href="/customer" className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-8">주문 내역</h1>
      </header>

      <main className="p-4 space-y-4">
        {MOCK_ORDERS.map((order) => {
          const config = getStatusConfig(order.status);
          const itemNameSummary = order.items.length > 1 
            ? `${order.items[0].name} 외 ${order.items.length - 1}건`
            : order.items[0].name;

          return (
            <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="text-sm text-gray-500 font-medium">{order.date}</div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${config.color} ${config.bg}`}>
                  {config.icon}
                  {config.text}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{itemNameSummary}</h3>
                <div className="text-sm text-gray-500 mb-4 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>{item.quantity}개</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-gray-600">총 결제금액</span>
                  <span className="text-xl font-extrabold text-gray-900">{order.totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              {order.status === 'PENDING' && order.accountInfo && (
                <div className="bg-red-50 p-4 border-t border-red-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-600 font-bold">입금 계좌</span>
                    <span className="text-sm font-bold text-gray-800">{order.accountInfo}</span>
                  </div>
                  <button 
                    onClick={() => {
                       navigator.clipboard.writeText("110-123-456789");
                       alert("계좌번호가 복사되었습니다.");
                    }}
                    className="w-full bg-white border border-red-200 text-red-600 text-sm py-2 rounded-lg font-bold"
                  >
                    계좌번호 복사하기
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
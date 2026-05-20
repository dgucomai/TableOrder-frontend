"use client";

import React, {useEffect, useState} from 'react';
import { ChevronLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// [기능: 타입 정의] 주문 상태 및 주문 정보에 대한 타입을 정의합니다.
type OrderStatus = 'PENDING' | 'PREPARING' | 'COMPLETED';

interface OrderInfo {
  orderId: string;
  date: string;
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: OrderStatus;
  accountInfo?: string;
}

// [기능: 모의 데이터(Mock Data)] 화면에 보여줄 가짜 주문 데이터 목록입니다.
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
    accountInfo: "IBK기업은행 98215102201013 (손승현)"
  },
  {
    orderId: "ORD-2026-002",
    date: "2026.05.11 19:30",
    items: [
      { name: "꼬치류 세트", quantity: 1 }
    ],
    totalPrice: 18000,
    status: 'PREPARING',
  },
  {
    orderId: "ORD-2026-003",
    date: "2026.05.11 18:20",
    items: [
      { name: "파인애플 샤베트", quantity: 1 },
      { name: "생맥주 500cc", quantity: 2 }
    ],
    totalPrice: 17000,
    status: 'COMPLETED', // 제공 완료 상태 테스트용 데이터
  }
];

// [기능: 상태별 UI 설정값 반환 함수] 상태(status)에 따라 텍스트, 색상, 아이콘 등을 다르게 보여주기 위한 함수입니다.
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return { 
        text: "입금 확인 대기 중", 
        subText: "(직원 호출 완료)", // 별도로 표시될 서브 텍스트
        color: "text-red-500", 
        bg: "bg-red-50", 
        icon: <AlertCircle size={16} /> 
      };
    case 'PREPARING':
      return { text: "준비 중", color: "text-orange-500", bg: "bg-orange-50", icon: <Clock size={16} /> };
    case 'COMPLETED':
      return { text: "제공 완료", color: "text-green-500", bg: "bg-green-100", icon: <CheckCircle2 size={16} /> };
    default:
      return { text: "확인 불가", color: "text-gray-500", bg: "bg-gray-100", icon: null };
  }
};

export default function OrderHistoryPage() {
  return (
    // [기능: 전체 페이지 레이아웃] 배경색 지정 및 여백 설정
    <div className="min-h-screen bg-gray-50 pb-10">
      
      {/* [기능: 상단 헤더 (Header)] 뒤로가기 버튼과 페이지 제목 표시 */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 flex items-center shadow-sm">
        <Link href="/customer" replace className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-8">주문 내역</h1>
      </header>

      {/* [기능: 주문 목록 렌더링 (Main Content)] */}
      <main className="p-4 space-y-4">
        {MOCK_ORDERS.map((order) => {
          const config = getStatusConfig(order.status);
            
          // [기능: 시간 포맷팅] 날짜는 제외하고 '시간:분' 형식만 추출
          const timeOnly = order.date.includes(' ') ? order.date.split(' ')[1] : order.date;

          return (
            // [기능: 개별 주문 카드 레이아웃]
            <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              {/* [기능: 카드 상단 (주문 시간 및 상태 표시)] */}
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                {/* 왼쪽 영역: 주문 시간과 서브 텍스트(직원 호출 완료)를 인라인으로 배치하여 칸이 커지는 것을 방지 */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-gray-500 font-medium">주문 시간: {timeOnly}</div>
                  {config.subText && (
                    <span className={`text-[12px] font-bold ${config.color}`}>
                      {config.subText}
                    </span>
                  )}
                </div>
                
                {/* 오른쪽 영역: 상태 배지 (높이가 늘어나지 않도록 고정된 레이아웃 유지) */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold h-fit ${config.color} ${config.bg}`}>
                  {config.icon}
                  <span>{config.text}</span>
                </div>
              </div>

              {/* [기능: 메인 주문 상세 내역] 기존 '~~외 n건' 제목을 삭제하고 상세 메뉴들만 리스트로 나열 */}
              <div className="p-4">
                <div className="space-y-2 text-base text-gray-800 font-medium">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{item.name}</span>
                      <span>{item.quantity}개</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* [기능: 하단 결제/입금 정보] 입금 대기(PENDING) 상태일 때만 보이는 빨간색 박스 영역 */}
              {order.status === 'PENDING' && order.accountInfo && (
                <div className="bg-red-50 p-4 border-t border-red-100 flex flex-col gap-3">
                  <p className="text-xs text-red-600">
                    아직 입금하지 않았다면 입금을 완료해주세요.
                  </p>
                  
                  {/* [기능: 계좌 정보 및 복사 버튼] */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black font-bold whitespace-nowrap">입금 계좌:</span>
                      <span className="text-sm font-bold text-gray-800 tracking-tight">{order.accountInfo}</span>
                    </div>
                    <button 
                      onClick={() => {
                         navigator.clipboard.writeText("IBK기업은행 98215102201013");
                         alert("계좌번호가 복사되었습니다.");
                      }}
                      className="shrink-0 bg-white border border-red-200 text-red-600 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-red-50 active:bg-red-100 transition-colors"
                    >
                      복사하기
                    </button>
                  </div>

                  {/* [기능: 총 결제금액 안내] 계좌 정보 하단에 배치된 가격 정보 */}
                  <div className="flex justify-between items-center pt-2 border-t border-red-100/50">
                    <span className="text-sm font-bold text-gray-700">총 결제금액:</span>
                    <span className="text-lg font-extrabold text-black">{order.totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
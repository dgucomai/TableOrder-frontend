"use client";

import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// [기능: 타입 정의] API 응답 및 UI에 맞춘 주문 상태 타입
type OrderStatus = 'PENDING' | 'PAYMENT_PENDING' | 'PREPARING' | 'COMPLETED';

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderInfo {
  orderId: string;
  date: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  accountInfo?: string;
}

// [기능: 날짜 포맷 변환 함수] ISO 문자열을 YYYY.MM.DD HH:mm 형태로 변환
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

// [기능: 상태별 UI 설정값 반환 함수] 상태(status)에 따라 텍스트, 색상, 아이콘 등을 다르게 보여주기 위한 함수
const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
    case 'PAYMENT_PENDING': // API 응답에 맞춰 PAYMENT_PENDING 추가
      return { 
        text: "입금 확인 대기 중", 
        subText: "(직원 호출 완료)", 
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
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // [기능: API 호출] 마운트 시 주문 내역 데이터 Fetch
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // 실제 운영 시 qt 파라미터는 라우터나 전역 상태에서 동적으로 받아오도록 수정 필요
        const response = await fetch('https://donggukcomai.shop/api/billing?qt=Nrhuz54L');
        
        if (!response.ok) {
          throw new Error('API 호출에 실패했습니다.');
        }

        const json = await response.json();

        if (json.success && json.data?.orders) {
          // API 응답 데이터를 UI 구조에 맞게 매핑
          const mappedOrders: OrderInfo[] = json.data.orders.map((order: any) => {
            // 전체 금액 계산 (개별 아이템 subtotal의 합)
            const totalPrice = order.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

            return {
              orderId: `ORD-${order.orderId}`,
              date: formatDateTime(order.createdAt),
              items: order.items.map((item: any) => ({
                name: `메뉴 ID: ${item.orderItemId}`, // TODO: API에 메뉴 이름이 없으므로 임시 출력. 추후 메뉴명 매핑 필요
                quantity: item.quantity
              })),
              totalPrice,
              status: order.orderStatus as OrderStatus,
              // PAYMENT_PENDING 상태일 때만 계좌번호 하드코딩 표출 (필요시 API 데이터로 대체)
              accountInfo: order.orderStatus === 'PAYMENT_PENDING' ? "IBK기업은행 98215102201013 (손승현)" : undefined
            };
          });

          setOrders(mappedOrders);
        }
      } catch (err: any) {
        setError(err.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 flex items-center shadow-sm">
        <Link href="/customer" replace className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold text-gray-900 pr-8">주문 내역</h1>
      </header>

      <main className="p-4 space-y-4">
        {isLoading && <p className="text-center text-gray-500 py-10">주문 내역을 불러오는 중입니다...</p>}
        {error && <p className="text-center text-red-500 py-10">{error}</p>}
        
        {!isLoading && !error && orders.length === 0 && (
          <p className="text-center text-gray-500 py-10">주문 내역이 없습니다.</p>
        )}

        {!isLoading && !error && orders.map((order) => {
          const config = getStatusConfig(order.status);
          const timeOnly = order.date.includes(' ') ? order.date.split(' ')[1] : order.date;

          return (
            <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2 mt-1">
                  <div className="text-sm text-gray-500 font-medium">주문 시간: {timeOnly}</div>
                  {config.subText && (
                    <span className={`text-[12px] font-bold ${config.color}`}>
                      {config.subText}
                    </span>
                  )}
                </div>
                
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold h-fit ${config.color} ${config.bg}`}>
                  {config.icon}
                  <span>{config.text}</span>
                </div>
              </div>

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

              {/* PAYMENT_PENDING 상태일 때 입금 안내 영역 노출 */}
              {(order.status === 'PENDING' || order.status === 'PAYMENT_PENDING') && order.accountInfo && (
                <div className="bg-red-50 p-4 border-t border-red-100 flex flex-col gap-3">
                  <p className="text-xs text-red-600">
                    아직 입금하지 않았다면 입금을 완료해주세요.
                  </p>
                  
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
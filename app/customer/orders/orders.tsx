"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { ChevronLeft, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type OrderStatus = string;

interface OrderItem {
  name: string;
  quantity: number;
  itemStatus?: string | null;
}

interface OrderInfo {
  orderId: string;
  date: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  accountInfo?: string;
}

const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

const getStatusConfig = (status: OrderStatus) => {
  const normalizedStatus = status ? String(status).trim().toUpperCase() : 'UNKNOWN';

  switch (normalizedStatus) {
    case 'PAYMENT_PENDING':
      return { 
        text: "입금 확인 대기 중", 
        subText: "(직원 호출 완료)", 
        color: "text-red-500", 
        bg: "bg-red-50", 
        icon: <AlertCircle size={16} /> 
      };
    case 'COOKING':
      return { 
        text: "조리 중", 
        color: "text-orange-500", 
        bg: "bg-orange-50", 
        icon: <Clock size={16} /> 
      };
    case 'COMPLETED':
      return { 
        text: "제공 완료", 
        color: "text-green-500", 
        bg: "bg-green-100", 
        icon: <CheckCircle2 size={16} /> 
      };
    case 'REJECTED':
      return { 
        text: "승인 거절", 
        color: "text-pink-500", 
        bg: "bg-pink-100", 
        icon: <AlertCircle size={16} /> 
      };
    case 'CANCELLED':
      return { 
        text: "주문 취소", 
        color: "text-pink-500", 
        bg: "bg-pink-100", 
        icon: <AlertCircle size={16} /> 
      };
    default:
      return { 
        text: `상태 오류 (${normalizedStatus})`, 
        color: "text-gray-600", 
        bg: "bg-gray-200", 
        icon: <AlertCircle size={16} /> 
      };
  }
};

function OrderHistoryContent() {
  const searchParams = useSearchParams();
  const qt = searchParams.get('qt'); 

  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0); // 새로고침 트리거 상태

  // 공통 헤더 컴포넌트 (에러, 로딩 중에도 헤더를 보여주기 위함)
  const Header = () => (
    <header className="sticky top-0 z-10 bg-white border-b px-4 py-4 flex items-center shadow-sm">
      <div className="flex-1 flex justify-start">
        <Link href="/customer" replace className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </Link>
      </div>
      <h1 className="text-lg font-bold text-gray-900 text-center flex-1">주문 내역</h1>
      <div className="flex-1 flex justify-end">
        <button 
          onClick={() => setRefreshCount(prev => prev + 1)}
          className="p-2 -mr-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="새로고침"
        >
          <RefreshCw size={22} className={isLoading ? "animate-spin text-gray-400" : ""} />
        </button>
      </div>
    </header>
  );

  useEffect(() => {
    if (!qt) {
      setError('주문 테이블 정보(qt 파라미터)가 없습니다.');
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://donggukcomai.shop/api/billing?qt=${qt}`);
        
        if (!response.ok) {
          throw new Error(`API 호출 실패: 상태 코드 ${response.status}`);
        }

        const json = await response.json();
        console.log("API 원본 응답 데이터:", json);

        if (json.success && json.data && Array.isArray(json.data.orders)) {
          
          // 1. 최신순 정렬 (createdAt 기준 내림차순)
          const sortedOrders = [...json.data.orders].sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // 2. 데이터 매핑
          const mappedOrders: OrderInfo[] = sortedOrders.map((order: any) => {
            const totalPrice = order.items?.reduce((sum: number, item: any) => sum + item.subtotal, 0) || 0;
            
            return {
              orderId: `ORD-${order.orderId}`,
              date: formatDateTime(order.createdAt),
              items: order.items?.map((item: any) => ({
                name: item.menuName || '알 수 없는 메뉴',
                quantity: item.quantity,
                itemStatus: item.itemStatus // itemStatus 매핑 추가
              })) || [],
              totalPrice,
              status: order.orderStatus,
              accountInfo: order.orderStatus === 'PAYMENT_PENDING' ? "IBK기업은행 98215102201013 (손승현)" : undefined
            };
          });
          
          setOrders(mappedOrders);
        } else {
          throw new Error('API 응답에 주문 데이터(orders 배열)가 존재하지 않습니다.');
        }
      } catch (err: any) {
        console.error("Fetch 에러:", err);
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [qt, refreshCount]); // refreshCount가 변경될 때마다 재호출

  if (error) {
    return (
      <>
        <Header />
        <div className="text-center text-red-500 py-10 font-bold">{error}</div>
      </>
    );
  }

  if (isLoading && orders.length === 0) {
    return (
      <>
        <Header />
        <div className="text-center text-gray-500 py-10 font-bold">주문 내역을 불러오는 중입니다...</div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center text-gray-500 py-10 font-bold">주문 내역이 없습니다.</div>
        ) : (
          orders.map((order) => {
            const config = getStatusConfig(order.status);
            const timeOnly = order.date ? (order.date.includes(' ') ? order.date.split(' ')[1] : order.date) : '';

            return (
              <div key={order.orderId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 상단 타이틀 바: 상태 배지 */}
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-sm text-gray-500 font-medium">주문 시간: {timeOnly}</div>
                    {config.subText && (
                      <span className={`text-[12px] font-bold ${config.color}`}>
                        {config.subText}
                      </span>
                    )}
                  </div>
                  
                  {/* 상태 아이콘 및 텍스트 영역 */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold h-fit ${config.color} ${config.bg}`}>
                    {config.icon}
                    <span>{config.text}</span>
                  </div>
                </div>

                {/* 주문 메뉴 리스트 */}
                <div className="p-4">
                  <div className="space-y-3 text-base text-gray-800 font-medium">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <div className="flex items-center gap-3">
                          {/* 조리 중(COOKING)일 때만 아이템 상태 렌더링 */}
                          {order.status === 'COOKING' && item.itemStatus && (
                            <span className={`text-sm font-bold ${item.itemStatus === 'SERVED' ? 'text-green-500' : 'text-orange-500'}`}>
                              {item.itemStatus === 'PREPARING' ? '준비중' : item.itemStatus === 'SERVED' ? '제공 완료' : item.itemStatus}
                            </span>
                          )}
                          <span>{item.quantity}개</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAYMENT_PENDING 상태일 때만 보이는 입금 안내 계좌 영역 */}
                {order.status === 'PAYMENT_PENDING' && order.accountInfo && (
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
          })
        )}
      </main>
    </>
  );
}

export default function OrderHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* 헤더를 Content 컴포넌트 내부로 이동시켜 새로고침 상태를 공유하도록 변경 */}
      <Suspense fallback={<div className="text-center text-gray-500 py-10 font-bold">로딩중...</div>}>
        <OrderHistoryContent />
      </Suspense>
    </div>
  );
}
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { staffFetch } from "@/lib/staffFetch";
import { useSseEvent } from "@/lib/SseContext";
import { X, Coins, Clock, Check, AlertTriangle, Timer, CreditCard, RotateCcw, Trash2, MessageSquare, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  orderId: number;
  orderItemId: number;
  name: string;
  quantity: number;
  price: number;
  time: string;
  createdAt: string;
  orderStatus: "입금 확인 대기" | "준비 중" | "제공 완료" | "거절됨" | "취소됨";
  itemStatus: "입금 확인 대기" | "준비 중" | "제공 완료" | "거절됨" | "취소됨";
  isTokenPayment?: boolean;
}

interface CallInfo {
  id: string;
  callId?: number;
  type: "직원 호출" | "딜러 호출" | "입금 확인";
  time: string;
  message?: string;
}

export default function TableDetailPopup({ tableId, onClose }: { tableId: number; onClose: () => void }) {
  const [tableNumber, setTableNumber] = useState<number | null>(null); 
  const [tokens, setTokens] = useState(0);
  const [isEditTokenOpen, setIsEditTokenOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [tokenDelta, setTokenDelta] = useState<string>(""); 

  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isDeleteOrderOpen, setIsDeleteOrderOpen] = useState(false);
  const [orderIdToDelete, setOrderIdToDelete] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [isCancelOrderOpen, setIsCancelOrderOpen] = useState(false);
  const [orderIdToCancel, setOrderIdToCancel] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [activeCalls, setActiveCalls] = useState<CallInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isApiLoading, setIsApiLoading] = useState(false);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "오후" : "오전";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${ampm} ${hours}:${minutes}`;
  };

  const mapOrderStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case "PAYMENT_PENDING": return "입금 확인 대기";
      case "PREPARING": 
      case "COOKING": return "준비 중";
      case "COMPLETED": return "제공 완료";
      case "REJECTED": return "거절됨";
      case "CANCELLED": return "취소됨";
      default: return "준비 중";
    }
  };

  const mapItemStatus = (itemStatus: string | null, orderStatus: string) => {
    if (orderStatus === "REJECTED") return "거절됨";
    if (orderStatus === "CANCELLED") return "취소됨";
    if (orderStatus === "PAYMENT_PENDING" && !itemStatus) return "입금 확인 대기";
    switch (itemStatus) {
      case "SERVED": return "제공 완료";
      case "PREPARING": return "준비 중";
      case "REJECTED": return "거절됨";
      case "CANCELLED": return "취소됨";
      default: return orderStatus === "PAYMENT_PENDING" ? "입금 확인 대기" : "준비 중";
    }
  };

  const fetchTableDetail = useCallback(async () => {
    try {
      const response = await staffFetch(`/api/staff/tables/${tableId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 403) {
        alert("권한이 없습니다. 다시 로그인해 주세요.");
        window.location.href = "/staff";
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        const tableData = result.data;
        setTableNumber(tableData.tableNumber); 
        setTokens(tableData.tokenCount || 0);
        setStartedAt(tableData.startedAt || null);

        const mappedCalls: CallInfo[] = [];
        if (tableData.calls && Array.isArray(tableData.calls)) {
          tableData.calls.forEach((c: any) => {
            if (c.status === "REQUESTED") { 
              mappedCalls.push({ 
                id: `call-${c.callId}`, 
                callId: c.callId,
                type: c.callType === "DEALER" ? "딜러 호출" : "직원 호출", 
                time: formatTime(c.createdAt),
                message: c.message || ""
              });
            }
          });
        }
        if (tableData.paymentRequests && Array.isArray(tableData.paymentRequests)) {
          tableData.paymentRequests.forEach((pr: any) => {
            if (pr.paymentStatus === "PENDING") {
              mappedCalls.push({ 
                id: `pr-${pr.paymentRequestId}`, 
                type: "입금 확인", 
                time: formatTime(pr.requestedAt) 
              });
            }
          });
        }
        mappedCalls.sort((a, b) => a.time.localeCompare(b.time));
        setActiveCalls(mappedCalls);

        const mappedOrders: Order[] = [];
        if (tableData.orders && Array.isArray(tableData.orders)) {
          tableData.orders.forEach((order: any) => {
            const timeStr = formatTime(order.createdAt);
            const oStatusStr = mapOrderStatus(order.orderStatus);
            
            if (order.items && Array.isArray(order.items)) {
              order.items.forEach((item: any) => {
                mappedOrders.push({
                  id: `${order.orderId}-${item.orderItemId}`,
                  orderId: order.orderId,
                  orderItemId: item.orderItemId,
                  name: item.menuName,
                  quantity: item.quantity,
                  price: item.unitPrice,
                  time: timeStr,
                  createdAt: order.createdAt,
                  orderStatus: oStatusStr as Order["orderStatus"],
                  itemStatus: mapItemStatus(item.itemStatus, order.orderStatus) as Order["itemStatus"],
                  isTokenPayment: false
                });
              });
            }
          });
        }
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error("테이블 상세 정보 조회 실패:", error);
    }
  }, [tableId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    if (tableId) fetchTableDetail();
    return () => clearInterval(timer);
  }, [tableId, refreshKey, fetchTableDetail]);

  const triggerRefresh = ({ tableId: id }: any) => { if (id === tableId) setRefreshKey((k) => k + 1); };

  useSseEvent("PAYMENT_REQUEST_CREATED", triggerRefresh);
  useSseEvent("STAFF_CALL_CREATED",      triggerRefresh);
  useSseEvent("ORDER_APPROVED",          triggerRefresh);
  useSseEvent("CALL_RESOLVED",           triggerRefresh);
  useSseEvent("TOKEN_UPDATED",           triggerRefresh);
  useSseEvent("TABLE_STATUS_CHANGED",    triggerRefresh);
  useSseEvent("ORDER_REJECTED", ({ tableId: id, orderId }: any) => {
    if (id !== tableId) return;
    setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, orderStatus: "거절됨", itemStatus: "거절됨" } : o));
  });
  useSseEvent("ORDER_CANCELLED", ({ tableId: id, orderId }: any) => {
    if (id !== tableId) return;
    setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, orderStatus: "취소됨", itemStatus: "취소됨" } : o));
  });
  useSseEvent("ORDER_STATUS_CHANGED", ({ tableId: id, orderId, status }: any) => {
    if (id !== tableId) return;
    const mapped = mapOrderStatus(status) as Order["orderStatus"];
    setOrders((prev) => prev.map((o) => 
      o.orderId === orderId 
        ? { ...o, orderStatus: mapped, ...((mapped === '거절됨' || mapped === '취소됨') ? { itemStatus: mapped } : {}) } 
        : o
    ));
  });
  useSseEvent("ITEM_STATUS_CHANGED", ({ orderId, itemId, status }: any) => {
    let itemStatus = status === "SERVED" ? "제공 완료" : "준비 중";
    if (status === "REJECTED") itemStatus = "거절됨";
    if (status === "CANCELLED") itemStatus = "취소됨";
    
    setOrders((prev) => {
      const hasItem = prev.some((o) => o.orderId === orderId && o.orderItemId === itemId);
      if (!hasItem) return prev;
      return prev.map((o) =>
        o.orderId === orderId && o.orderItemId === itemId ? { ...o, itemStatus: itemStatus as Order["itemStatus"] } : o
      );
    });
  });

  const totalAmount = useMemo(() =>
    orders
      .filter((o) => o.orderStatus !== "입금 확인 대기" && o.orderStatus !== "거절됨" && o.orderStatus !== "취소됨")
      .reduce((sum, o) => sum + o.price * o.quantity, 0),
    [orders]
  );

  const usageTime = useMemo(() => {
    if (!startedAt) return "0분";
    const start = new Date(startedAt);
    const diffMs = currentTime.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return "0분";
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }, [startedAt, currentTime]);

  const isEmptyTable = !startedAt;

  const handleAcceptCall = async (call: CallInfo) => {
    if (call.id.startsWith("pr-")) {
      alert("하단 주문 리스트에서 '입금 확인'을 진행해 주세요.");
      return;
    }

    if (!call.callId) {
      alert("유효하지 않은 호출입니다.");
      return;
    }

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/calls/${call.callId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok || result.success) {
        setActiveCalls(prev => prev.filter(c => c.id !== call.id));
      } else {
        alert(result.message || "호출 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error("호출 수락 에러:", e);
      alert("서버와 통신하는 중 통신 오류가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const confirmGroupDeposit = async (orderId: number) => {
    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/orders/${orderId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      
      const result = await response.json().catch(() => ({}));

      if (response.ok || result.success) {
        setOrders(prev => prev.map(order => 
          order.orderId === orderId && order.orderStatus === "입금 확인 대기" 
            ? { ...order, orderStatus: "준비 중", itemStatus: "준비 중" } 
            : order
        ));
        
        const orderTime = groupedOrders[orderId]?.[0]?.time;
        if (orderTime) {
          setActiveCalls(prev => prev.filter(call => !(call.time === orderTime && call.type === "입금 확인")));
        }
        
        alert("입금 확인이 완료되었습니다.");
      } else {
        alert("입금 승인 처리에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("입금 승인 처리 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const updateItemStatus = async (orderItemId: number, currentItemStatus: string) => {
    if (currentItemStatus === "입금 확인 대기" || currentItemStatus === "거절됨" || currentItemStatus === "취소됨") return;

    const nextStatus = currentItemStatus === "준비 중" ? "SERVED" : "PREPARING";
    const nextStatusKr = currentItemStatus === "준비 중" ? "제공 완료" : "준비 중";

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/items/${orderItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order =>
          order.orderItemId === orderItemId
            ? { ...order, itemStatus: nextStatusKr as Order["itemStatus"] }
            : order
        ));
      } else {
        alert("상태 변경에 실패했습니다.");
      }
    } catch (e) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleDeleteGroupClick = (orderId: number) => { 
    setIsEditTokenOpen(false); 
    setIsResetOpen(false); 
    setIsCancelOrderOpen(false);
    setOrderIdToDelete(orderId); 
    setDeleteReason(""); 
    setIsDeleteOrderOpen(true); 
  };

  const handleCancelGroupClick = (orderId: number) => {
    setIsEditTokenOpen(false);
    setIsResetOpen(false);
    setIsDeleteOrderOpen(false);
    setOrderIdToCancel(orderId);
    setCancelReason("");
    setIsCancelOrderOpen(true);
  };

  const executeDeleteGroup = async () => {
    if (orderIdToDelete === null) return;

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/orders/${orderIdToDelete}/reject`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (!response.ok) throw new Error("서버 응답 오류");
      
      setOrders(prev => prev.map(order => 
        order.orderId === orderIdToDelete 
          ? { ...order, orderStatus: "거절됨", itemStatus: "거절됨" } 
          : order
      ));
      
      setIsDeleteOrderOpen(false); 
      setOrderIdToDelete(null); 
      setDeleteReason(""); 
      
      alert("해당 주문이 성공적으로 거절되었습니다.");

    } catch (e) {
      console.error(e);
      alert("주문 거절 실패: 서버와 통신 중 문제가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const executeCancelGroup = async () => {
    if (orderIdToCancel === null) return;

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/orders/${orderIdToCancel}/cancel`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) throw new Error("서버 응답 오류");
      
      setOrders(prev => prev.map(order => 
        order.orderId === orderIdToCancel 
          ? { ...order, orderStatus: "취소됨", itemStatus: "취소됨" } 
          : order
      ));
      
      setIsCancelOrderOpen(false); 
      setOrderIdToCancel(null); 
      setCancelReason(""); 
      
      alert("해당 주문이 성공적으로 취소되었습니다.");

    } catch (e) {
      console.error(e);
      alert("주문 취소 실패: 서버와 통신 중 문제가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleResetTable = async () => {
    if (!tableId) return;

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/staff/tables/${tableId}/clear`, {
        method: "PATCH",
      });

      if (response.status === 401 || response.status === 403) {
        alert("직원 권한이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      const result = await response.json();
      if (result.success) {
        alert("테이블 정리가 완료되었습니다.");
        onClose(); 
      } else {
        alert(result.message || "테이블 정리에 실패했습니다.");
      }
    } catch (error) {
      alert("서버와 통신하는 중 오류가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleUpdateTokens = async () => {
    const deltaValue = Number(tokenDelta);
    if (isNaN(deltaValue) || deltaValue === 0) return;

    try {
      setIsApiLoading(true);
      const response = await staffFetch(`/api/tokens/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: deltaValue }),
      });

      const result = await response.json();
      if (response.ok || result.success) {
        setTokens((prev) => prev + deltaValue);
        setIsEditTokenOpen(false);
        setTokenDelta("");
      } else {
        alert(result.message || "토큰 증감 처리에 실패했습니다.");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const adjustToken = (amount: number) => {
    setTokenDelta(prev => {
      const current = Number(prev) || 0;
      return (current + amount).toString();
    });
  };

  const getCallStyle = (type: string) => {
    switch (type) {
      case "입금 확인": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      case "딜러 호출": return "bg-purple-500/10 border-purple-500/30 text-purple-500";
      default: return "bg-cyan-500/10 border-cyan-500/30 text-cyan-500";
    }
  };

  const groupedOrders = orders.reduce((acc: Record<number, Order[]>, order) => {
    if (!acc[order.orderId]) acc[order.orderId] = [];
    acc[order.orderId].push(order);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedOrders)
    .map(Number)
    .sort((a, b) => {
      const dateA = new Date(groupedOrders[a][0].createdAt).getTime();
      const dateB = new Date(groupedOrders[b][0].createdAt).getTime();
      return dateB - dateA;
    });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div className={`relative flex flex-col md:flex-row transition-all duration-500 w-full h-full sm:h-[90vh] max-w-[1400px] ${(isEditTokenOpen || isResetOpen || isDeleteOrderOpen || isCancelOrderOpen) ? "md:-translate-x-[5vw]" : ""}`} onClick={(e) => e.stopPropagation()}>
        {isApiLoading && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-[2rem] pointer-events-none">
            <div className="flex flex-col items-center gap-4 bg-slate-800 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-black text-sm tracking-widest uppercase">처리 중...</p>
            </div>
          </div>
        )}
        
        <motion.div className="relative flex-1 bg-[#1e293b] sm:rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden z-10">
          <div className="px-5 py-4 sm:px-10 sm:py-6 border-b border-white/5 flex justify-between items-start sm:items-center bg-slate-800/40 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-12 w-full overflow-hidden">
              <h2 className="text-4xl sm:text-6xl font-black text-orange-500 italic tracking-tighter shrink-0">
                {tableNumber !== null ? tableNumber : tableId}
              </h2>
              <div className="flex items-center gap-4 sm:gap-8 sm:border-l border-white/10 sm:pl-10 w-full overflow-x-auto whitespace-nowrap pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Receipt size={10} /> 총 금액
                  </span>
                  <span className="text-base sm:text-3xl font-black text-white">{totalAmount.toLocaleString()}원</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-4 sm:pl-8">
                  <span className="text-[10px] sm:text-[12px] text-yellow-500/80 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Coins size={10} /> 보유 토큰
                  </span>
                  <span className="text-base sm:text-3xl font-black text-yellow-500">{tokens} T</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-4 sm:pl-8">
                  <span className="text-[10px] sm:text-[12px] text-cyan-600 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Timer size={10} /> 이용 시간
                  </span>
                  <span className="text-base sm:text-3xl font-black text-cyan-500">{usageTime}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1 sm:p-2 hover:bg-white/10 rounded-xl transition-all shrink-0">
              <X className="w-7 h-7 sm:w-8 sm:h-8 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {activeCalls.slice(0, 3).map((call) => (
                  <motion.div key={call.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} 
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${getCallStyle(call.type)}`}>
                    <div className="flex flex-col mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-lg font-black">{call.type}</span>
                        <span className="opacity-70 font-mono text-xs">{call.time}</span>
                      </div>
                      {call.message && (
                        <div className="flex items-start gap-2 mt-2 p-2.5 bg-black/20 rounded-xl border border-white/5 text-sm font-medium break-keep">
                          <MessageSquare size={14} className="mt-0.5 opacity-70 shrink-0" />
                          <span className="opacity-90">{call.message}</span>
                        </div>
                      )}
                    </div>
                    <button onClick={() => handleAcceptCall(call)} className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all">
                      <Check size={16} strokeWidth={3} /> <span>호출 수락</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest"><Clock size={12} /> 주문 타임라인</p>
              {sortedGroupKeys.map((orderId) => {
                const groupOrders = groupedOrders[orderId];
                const orderTime = groupOrders[0].time;
                const orderStatus = groupOrders[0].orderStatus;
                
                const isWaitingDeposit = groupOrders.some((o: Order) => o.orderStatus === "입금 확인 대기");
                const isRejected = groupOrders.some((o: Order) => o.orderStatus === "거절됨");
                const isCancelled = groupOrders.some((o: Order) => o.orderStatus === "취소됨");
                
                const canCancel = ["입금 확인 대기", "준비 중", "제공 완료"].includes(orderStatus);
                
                return (
                  <div key={orderId} className="bg-[#0f172a]/40 rounded-2xl p-4 sm:p-5 border border-white/5 relative">
                    
                    {/* 우측 상단으로 따로 뺀 입금 대기 액션 버튼 영역 */}
                    {isWaitingDeposit && (
                      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 flex items-center gap-2 z-10">
                        <button onClick={() => handleDeleteGroupClick(orderId)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95">
                          <Trash2 size={14} /> 거절
                        </button>
                        <button onClick={() => confirmGroupDeposit(orderId)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
                          <CreditCard size={14} /> 입금 확인
                        </button>
                      </div>
                    )}

                    {/* 기존 헤더 영역: 액션 버튼과 겹치지 않도록 조건부 pt/pr 적용 */}
                    <div className={`flex flex-wrap items-center mb-4 border-b border-white/5 pb-3 gap-3 ${isWaitingDeposit ? 'pt-10 sm:pt-0 sm:pr-48' : ''}`}>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {canCancel && (
                          <button 
                            onClick={() => handleCancelGroupClick(orderId)}
                            className="bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <X size={14} strokeWidth={2.5} /> 취소
                          </button>
                        )}
                        
                        <span className="text-s font-small text-slate-400">#{orderId}</span>
                        <span className="text-[13px] text-slate-500 font-medium">{orderTime}</span>
                        
                        <div className="flex items-center gap-2 ml-auto sm:ml-0">
                          {isRejected && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md text-[10px] font-bold">
                              승인 거절
                            </span>
                          )}
                          {isCancelled && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md text-[10px] font-bold">
                              취소됨
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {groupOrders.map((order: Order) => (
                        <div key={order.id} className="flex justify-between items-center bg-white/5 p-3 sm:p-4 rounded-xl border border-transparent">
                          <div className="flex flex-col">
                            <span className="text-base sm:text-xl font-bold text-slate-200">{order.name}</span>
                            <span className="text-xs text-slate-500">{order.price.toLocaleString()}{order.isTokenPayment ? 'T' : '원'} · {order.quantity}개</span>
                          </div>
                          
                          {order.itemStatus === "입금 확인 대기" ? (
                            <div className="flex items-center gap-2 text-emerald-500/50 font-black text-xs uppercase bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              입금 대기 중
                            </div>
                          ) : order.itemStatus === "거절됨" ? (
                            <button 
                              disabled 
                              className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-sm bg-red-900/50 text-red-500 border border-red-500/20 cursor-not-allowed">
                              거절됨
                            </button>
                          ) : order.itemStatus === "취소됨" ? (
                            <button 
                              disabled 
                              className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-sm bg-red-900/50 text-red-500 border border-red-500/20 cursor-not-allowed">
                              취소됨
                            </button>
                          ) : (
                            <button 
                              onClick={() => updateItemStatus(order.orderItemId, order.itemStatus)} 
                              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                                order.itemStatus === "제공 완료" 
                                ? "bg-slate-700 text-slate-400 hover:bg-slate-600 active:scale-95 shadow-inner" 
                                : "bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-900/20"
                              }`}>
                              {order.itemStatus}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {isWaitingDeposit && (
                      <div className="mt-4 pt-4 border-t border-dashed border-emerald-500/20 flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl">
                        <span className="text-sm font-bold text-emerald-500/80">입금 확인 대기 총액</span>
                        <span className="text-xl font-black text-emerald-400">
                          {groupOrders
                            .filter((o: Order) => o.orderStatus === "입금 확인 대기")
                            .reduce((sum: number, o: Order) => sum + (o.price * o.quantity), 0)
                            .toLocaleString()
                          }원
                        </span>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 sm:p-8 bg-slate-900/40 border-t border-white/5 flex flex-row gap-2 sm:gap-3">
            <button 
              disabled={isEmptyTable}
              onClick={() => { setIsResetOpen(false); setIsDeleteOrderOpen(false); setIsCancelOrderOpen(false); setIsEditTokenOpen(!isEditTokenOpen); setTokenDelta(""); }} 
              className={`flex-1 py-3 sm:py-6 rounded-2xl font-black text-[15px] sm:text-xl flex items-center justify-center gap-1.5 sm:gap-3 transition-all ${
                isEmptyTable 
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50" 
                  : "bg-slate-700 hover:bg-slate-600 text-white active:scale-95"
              }`}
            >
              <Coins size={18} className={`sm:w-5 sm:h-5 ${isEmptyTable ? "text-slate-600" : "text-yellow-500"}`} /> 
              <span className="whitespace-nowrap">토큰 수정</span>
            </button>
            
            <button 
              disabled={isEmptyTable}
              onClick={() => { setIsEditTokenOpen(false); setIsDeleteOrderOpen(false); setIsCancelOrderOpen(false); setIsResetOpen(!isResetOpen); }} 
              className={`flex-1 py-3 sm:py-6 rounded-2xl font-black text-[15px] sm:text-xl flex items-center justify-center gap-1.5 sm:gap-3 transition-all ${
                isEmptyTable 
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50" 
                  : "bg-orange-600 hover:bg-orange-500 text-white active:scale-95 shadow-lg shadow-orange-900/20"
              }`}
            >
              <RotateCcw size={18} className="sm:w-5 sm:h-5" /> 
              <span className="whitespace-nowrap">테이블 초기화</span>
            </button>
          </div>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {/* 토큰 증감 팝업 */}
          {isEditTokenOpen && (
            <motion.div key="token-edit" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsEditTokenOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-yellow-500 italic flex items-center gap-2 uppercase tracking-tighter"><Coins size={28} /> 토큰 수량 수정</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">현재 보유 토큰</label>
                    <div className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl p-4 text-center">
                      <span className="text-2xl font-black text-white">{tokens} T</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">증감할 수량</label>
                    <input 
                      type="number" 
                      placeholder="증감할 수량 입력" 
                      value={tokenDelta} 
                      onChange={(e) => setTokenDelta(e.target.value)} 
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-2xl font-black text-center outline-none focus:ring-1 focus:ring-yellow-500 text-yellow-500" 
                    />
                    
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => adjustToken(-10)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg font-bold text-slate-400 transition-colors">-10</button>
                      <button onClick={() => adjustToken(-1)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg font-bold text-slate-400 transition-colors">-1</button>
                      <button onClick={() => adjustToken(1)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg font-bold text-slate-400 transition-colors">+1</button>
                      <button onClick={() => adjustToken(10)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg font-bold text-slate-400 transition-colors">+10</button>
                    </div>
                    
                    <div className="h-6 mt-5 flex items-center justify-center">
                      <p className={`text-center text-sm font-bold text-slate-400 transition-opacity duration-200 ${
                        tokenDelta && !isNaN(Number(tokenDelta)) ? "opacity-100" : "opacity-0"
                      }`}>
                        수정 후 예상 토큰: <span className="text-white">{tokens + (Number(tokenDelta) || 0)} T</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  disabled={!tokenDelta || isNaN(Number(tokenDelta)) || Number(tokenDelta) === 0} 
                  onClick={handleUpdateTokens}
                  className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${(!tokenDelta || isNaN(Number(tokenDelta)) || Number(tokenDelta) === 0) ? "bg-slate-700 cursor-not-allowed opacity-50" : "bg-yellow-600 hover:bg-yellow-500 shadow-xl shadow-yellow-900/20"}`}
                >적용하기</button>
              </div>
            </motion.div>
          )}

          {/* 테이블 초기화 팝업 */}
          {isResetOpen && (
            <motion.div key="table-reset" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsResetOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 flex flex-col items-center text-center space-y-10">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center"><AlertTriangle size={40} className="text-orange-500 animate-pulse" /></div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">테이블 초기화</h3>
                <p className="text-sm text-slate-400 text-center">현재 테이블의 세션을 종료하고 새 테이블 세션으로 초기화합니다.</p>
                <div className="w-full space-y-4">
                  <button onClick={handleResetTable} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-orange-900/20 transition-all">초기화 하기</button>
                  <button onClick={() => setIsResetOpen(false)} className="w-full bg-slate-700 text-slate-300 hover:bg-slate-600 py-4 rounded-2xl font-bold transition-all">취소</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 주문 전체 거절 팝업 */}
          {isDeleteOrderOpen && (
            <motion.div key="order-delete" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsDeleteOrderOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-red-500 italic flex items-center gap-2 uppercase tracking-tighter"><Trash2 size={28} /> 주문 거절</h3>
                
                {orderIdToDelete !== null && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">주문 번호 : #{orderIdToDelete}</p>
                    <p className="text-red-500/60 text-xs mt-1">해당 주문 전체를 정말 거절 하시겠습니까?</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">거절 사유</label>
                    <input type="text" placeholder="사유 입력 (필수)" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-slate-200" />
                  </div>
                </div>
                <div className="space-y-3">
                  <button disabled={!deleteReason.trim()} onClick={executeDeleteGroup}
                    className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${!deleteReason.trim() ? "bg-slate-700 cursor-not-allowed opacity-50" : "bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/20"}`}
                  >주문 거절하기</button>
                  <button onClick={() => setIsDeleteOrderOpen(false)} className="w-full bg-slate-700 text-slate-300 hover:bg-slate-600 py-4 rounded-xl font-bold transition-all">돌아가기</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 주문 취소 팝업 */}
          {isCancelOrderOpen && (
            <motion.div key="order-cancel" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsCancelOrderOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-red-500 italic flex items-center gap-2 uppercase tracking-tighter"><X size={28} strokeWidth={3} /> 주문 취소</h3>
                
                {orderIdToCancel !== null && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">주문 번호 : #{orderIdToCancel}</p>
                    <p className="text-red-500/60 text-xs mt-1">해당 주문을 정말 취소 하시겠습니까?</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">취소 사유</label>
                    <input type="text" placeholder="사유 입력 (필수)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-slate-200" />
                  </div>
                </div>
                <div className="space-y-3">
                  <button disabled={!cancelReason.trim()} onClick={executeCancelGroup}
                    className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${!cancelReason.trim() ? "bg-slate-700 cursor-not-allowed opacity-50" : "bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/20"}`}
                  >주문 취소하기</button>
                  <button onClick={() => setIsCancelOrderOpen(false)} className="w-full bg-slate-700 text-slate-300 hover:bg-slate-600 py-4 rounded-xl font-bold transition-all">돌아가기</button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}ㄹ
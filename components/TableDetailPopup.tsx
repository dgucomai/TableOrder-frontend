"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Coins, Clock, Check, AlertTriangle, Timer, CreditCard, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  name: string;
  quantity: number;
  price: number;
  time: string;
  status: "입금 확인 대기" | "준비 중" | "제공 완료";
  isTokenPayment?: boolean;
}

interface CallInfo {
  id: string;
  type: "직원 호출" | "딜러 호출" | "입금 확인";
  time: string;
}

export default function TableDetailPopup({ tableId, onClose }: { tableId: number; onClose: () => void }) {
  const [tokens, setTokens] = useState(7);
  const [isEditTokenOpen, setIsEditTokenOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editBalance, setEditBalance] = useState(tokens.toString());
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- 추가/수정된 상태: 주문 그룹 전체 삭제 관련 ---
  const [isDeleteOrderOpen, setIsDeleteOrderOpen] = useState(false);
  const [timeToDelete, setTimeToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [activeCalls, setActiveCalls] = useState<CallInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchTableDetail = async () => {
      try {
        const token = localStorage.getItem("staffAccessToken") || "";
        
        // 상세 조회 API 호출 (명세서에 맞게 URL 조정 필요)
        const response = await fetch(`/api/staff/tables/${tableId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.status === 401 || response.status === 403) {
          alert(response.status === 401 ? "로그인이 필요합니다." : "직원 권한이 필요합니다.");
          window.location.href = "/staff";
          return;
        }

        const result = await response.json();

        // 핵심 반영 부분: result.data 안에 실제 정보가 있다고 가정하고 처리합니다.
        if (result.success && result.data) {
          // 백엔드 API 명세에 따라 아래 필드명(orders, calls 등)은 다를 수 있습니다.
          // 백엔드 응답 구조에 맞게 매핑해주세요.
          if (result.data.orders) setOrders(result.data.orders);
          if (result.data.activeCalls) setActiveCalls(result.data.activeCalls);
          if (result.data.tokens !== undefined) setTokens(result.data.tokens);
        }
      } catch (error) {
        console.error("테이블 상세 정보 조회 실패:", error);
      }
    };

    if (tableId) {
      fetchTableDetail();
    }
  }, [tableId]);

  const usageTime = useMemo(() => {
    if (orders.length === 0) return "0분";
    const times = orders.map(o => o.time);
    const firstOrderTimeStr = times.reduce((prev, curr) => (prev < curr ? prev : curr));
    const [hours, minutes] = firstOrderTimeStr.split(':').map(Number);
    const firstOrderDate = new Date();
    firstOrderDate.setHours(hours, minutes, 0);
    const diffMs = currentTime.getTime() - firstOrderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return "0분";
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  }, [orders, currentTime]);

  const handleAcceptCall = (id: string) => setActiveCalls(prev => prev.filter(call => call.id !== id));

  // --- 상태 업데이트 핸들러 ---
  
  // 1. 그룹 단위 입금 확인 처리
  const confirmGroupDeposit = (time: string) => {
    setOrders(prev => prev.map(order => 
      order.time === time && order.status === "입금 확인 대기" 
        ? { ...order, status: "준비 중" } 
        : order
    ));
  };

  // 2. 개별 메뉴 준비 중/제공 완료 토글
  const toggleOrderStatus = (id: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== id || order.status === "입금 확인 대기") return order;
      return { ...order, status: order.status === "준비 중" ? "제공 완료" : "준비 중" };
    }));
  };

  // 3. 주문 그룹 전체 취소 클릭 핸들러
  const handleDeleteGroupClick = (time: string) => {
    setIsEditTokenOpen(false);
    setIsResetOpen(false);
    setTimeToDelete(time);
    setDeleteReason("");
    setIsDeleteOrderOpen(true);
  };

  // 4. 주문 그룹 전체 취소 실행 (해당 시간대의 주문 일괄 삭제)
  const executeDeleteGroup = () => {
    if (!timeToDelete) return;
    setOrders(prev => prev.filter(order => order.time !== timeToDelete));
    setIsDeleteOrderOpen(false);
    setTimeToDelete(null);
    setDeleteReason("");
  };

  const handleResetTable = () => { alert("테이블 초기화 완료"); onClose(); };

  const getCallStyle = (type: string) => {
    switch (type) {
      case "입금 확인": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      case "딜러 호출": return "bg-purple-500/10 border-purple-500/30 text-purple-500";
      default: return "bg-cyan-500/10 border-cyan-500/30 text-cyan-500";
    }
  };

  const groupedOrders = orders.reduce((acc: any, order) => {
    if (!acc[order.time]) acc[order.time] = [];
    acc[order.time].push(order);
    return acc;
  }, {});

  const totalPrice = orders.filter(o => !o.isTokenPayment).reduce((sum, o) => sum + (o.price * o.quantity), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div className={`flex flex-col md:flex-row transition-all duration-500 w-full h-full sm:h-[90vh] max-w-[1400px] ${(isEditTokenOpen || isResetOpen || isDeleteOrderOpen) ? "md:-translate-x-[5vw]" : ""}`} onClick={(e) => e.stopPropagation()}>
        
        <motion.div className="relative flex-1 bg-[#1e293b] sm:rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden z-10">
          {/* Header */}
          <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
            <div className="flex items-center gap-4 sm:gap-12">
              <h2 className="text-4xl sm:text-6xl font-black text-orange-500 italic tracking-tighter">{tableId}</h2>
              <div className="flex items-center gap-4 sm:gap-10 border-l border-white/10 pl-4 sm:pl-10">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold uppercase tracking-widest">총 금액</span>
                  <span className="text-lg sm:text-3xl font-black text-white">{totalPrice.toLocaleString()}원</span>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-4 sm:pl-10">
                  <span className="text-[10px] sm:text-[12px] text-cyan-600 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Timer size={10} /> 이용 시간
                  </span>
                  <span className="text-lg sm:text-3xl font-black text-cyan-500">{usageTime}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={28} className="text-slate-500" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 custom-scrollbar">
            {/* 호출 리스트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {activeCalls.slice(0, 3).map((call) => (
                  <motion.div key={call.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} 
                    className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${getCallStyle(call.type)}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-black">{call.type}</span>
                      <span className="opacity-70 font-mono text-xs">{call.time}</span>
                    </div>
                    <button onClick={() => handleAcceptCall(call.id)} className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/10 active:scale-95">
                      <Check size={16} strokeWidth={3} /> <span>호출 수락</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 주문 타임라인 */}
            <div className="space-y-6">
              <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest"><Clock size={12} /> 주문 타임라인</p>
              {Object.keys(groupedOrders).map((time) => {
                const isWaitingDeposit = groupedOrders[time].some((o: Order) => o.status === "입금 확인 대기");
                
                return (
                  <div key={time} className="bg-[#0f172a]/40 rounded-2xl p-4 border border-white/5 relative">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                      <div className="text-[13px] text-slate-500 font-mono">주문시간: {time}</div>
                      
                      {/* 그룹 단위 액션 버튼들 */}
                      {isWaitingDeposit && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDeleteGroupClick(time)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Trash2 size={14} /> 주문 취소
                          </button>
                          <button 
                            onClick={() => confirmGroupDeposit(time)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                          >
                            <CreditCard size={14} /> 입금 확인
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {groupedOrders[time].map((order: Order) => (
                        <div key={order.id} className="flex justify-between items-center bg-white/5 p-3 sm:p-4 rounded-xl border border-transparent">
                          <div className="flex flex-col">
                            <span className="text-base sm:text-xl font-bold text-slate-200">{order.name}</span>
                            <span className="text-xs text-slate-500">{order.price.toLocaleString()}{order.isTokenPayment ? 'T' : '원'} · {order.quantity}개</span>
                          </div>
                          
                          {/* 개별 상태 버튼 (취소 버튼 제거됨) */}
                          {order.status === "입금 확인 대기" ? (
                            <div className="flex items-center gap-2 text-emerald-500/50 font-black text-xs uppercase bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              입금 대기 중
                            </div>
                          ) : (
                            <button 
                              onClick={() => toggleOrderStatus(order.id)} 
                              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
                                order.status === "제공 완료" ? "bg-slate-700 text-slate-500" : "bg-orange-500 text-white"
                              }`}
                            >
                              {order.status}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 sm:p-8 bg-slate-900/40 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <button onClick={() => { setIsResetOpen(false); setIsDeleteOrderOpen(false); setIsEditTokenOpen(!isEditTokenOpen); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 active:scale-95">
              <Coins size={20} className="text-yellow-500" /> 토큰 수량 수정
            </button>
            <button onClick={() => { setIsEditTokenOpen(false); setIsDeleteOrderOpen(false); setIsResetOpen(!isResetOpen); }} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 active:scale-95">
              <RotateCcw size={20} /> 테이블 초기화
            </button>
          </div>
        </motion.div>
        
        {/* 사이드 팝업 영역 */}
        <AnimatePresence mode="wait">
          {/* 토큰 수정 팝업 */}
          {isEditTokenOpen && (
            <motion.div key="token-edit" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsEditTokenOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-yellow-500 italic flex items-center gap-2 uppercase tracking-tighter"><Coins size={28} /> 토큰 수정</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">수정 사유</label>
                    <input type="text" placeholder="사유 입력 (필수)" value={editReason} onChange={(e) => setEditReason(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-yellow-500 text-slate-200" />
                  </div>
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">수정 후 수량</label>
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-5 text-4xl font-black text-center outline-none focus:ring-1 focus:ring-yellow-500 text-yellow-500" />
                  </div>
                </div>
                <button disabled={!editReason.trim() || editBalance === "" || Number(editBalance) === tokens} onClick={() => { setTokens(Number(editBalance)); setIsEditTokenOpen(false); setEditReason(""); }}
                  className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${!editReason.trim() || editBalance === "" || Number(editBalance) === tokens ? "bg-slate-700 cursor-not-allowed opacity-50" : "bg-yellow-600 hover:bg-yellow-500 shadow-xl shadow-yellow-900/20"}`}
                >저장하기</button>
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
                <div className="w-full space-y-4">
                  <button onClick={handleResetTable} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-orange-900/20">초기화 하기</button>
                  <button onClick={() => setIsResetOpen(false)} className="w-full bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold">취소</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 주문 전체 취소 팝업 */}
          {isDeleteOrderOpen && (
            <motion.div key="order-delete" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsDeleteOrderOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-red-500 italic flex items-center gap-2 uppercase tracking-tighter"><Trash2 size={28} /> 주문 전체 취소</h3>
                
                {timeToDelete && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 font-bold text-sm">
                      주문 시간 : {timeToDelete}
                    </p>
                    <p className="text-red-500/60 text-xs mt-1">해당 시간에 접수된 주문 전체를 정말 삭제하시겠습니까?</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">취소 사유</label>
                    <input type="text" placeholder="사유 입력 (필수)" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-red-500 text-slate-200" />
                  </div>
                </div>
                <div className="space-y-3">
                  <button disabled={!deleteReason.trim()} onClick={executeDeleteGroup}
                    className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${!deleteReason.trim() ? "bg-slate-700 cursor-not-allowed opacity-50" : "bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/20"}`}
                  >전체 취소하기</button>
                  <button onClick={() => setIsDeleteOrderOpen(false)} className="w-full bg-slate-700 text-slate-300 py-4 rounded-xl font-bold">돌아가기</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
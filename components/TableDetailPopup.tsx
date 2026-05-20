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
  const [tableNumber, setTableNumber] = useState<number | null>(null); 
  const [tokens, setTokens] = useState(0);
  const [isEditTokenOpen, setIsEditTokenOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [tokenDelta, setTokenDelta] = useState<string>(""); // 증감값 입력 상태

  const [totalAmount, setTotalAmount] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const [isDeleteOrderOpen, setIsDeleteOrderOpen] = useState(false);
  const [timeToDelete, setTimeToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [activeCalls, setActiveCalls] = useState<CallInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const mapOrderStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case "PAYMENT_PENDING": return "입금 확인 대기";
      case "PREPARING": return "준비 중";
      case "COMPLETED": return "제공 완료";
      default: return "준비 중";
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 기존 테이블 상세 정보 조회 API (GET) ---
  useEffect(() => {
    const fetchTableDetail = async () => {
      try {
        const token = localStorage.getItem("staffAccessToken") || "";
        const response = await fetch(`/api/staff/tables/${tableId}`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });

        if (response.status === 401 || response.status === 403) {
          alert("권한이 없습니다. 다시 로그인해 주세요.");
          window.location.href = "/staff";
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          const tableData = result.data;
          setTableNumber(tableData.tableNumber); 
          setTokens(tableData.tokenCount || 0); 
          setTotalAmount(tableData.totalAmount ?? tableData.tokenAmount ?? 0); 
          setStartedAt(tableData.startedAt || null);

          const mappedCalls: CallInfo[] = [];
          if (tableData.calls && Array.isArray(tableData.calls)) {
            tableData.calls.forEach((c: any) => {
              if (c.status === "REQUESTED") { 
                mappedCalls.push({ id: `call-${c.callId}`, type: c.callType === "DEALER" ? "딜러 호출" : "직원 호출", time: formatTime(c.createdAt) });
              }
            });
          }
          if (tableData.paymentRequests && Array.isArray(tableData.paymentRequests)) {
            tableData.paymentRequests.forEach((pr: any) => {
              if (pr.paymentStatus === "PENDING") {
                mappedCalls.push({ id: `pr-${pr.paymentRequestId}`, type: "입금 확인", time: formatTime(pr.requestedAt) });
              }
            });
          }
          mappedCalls.sort((a, b) => a.time.localeCompare(b.time));
          setActiveCalls(mappedCalls);

          const mappedOrders: Order[] = [];
          if (tableData.orders && Array.isArray(tableData.orders)) {
            tableData.orders.forEach((order: any) => {
              const timeStr = formatTime(order.createdAt);
              const statusStr = mapOrderStatus(order.orderStatus);
              if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                  mappedOrders.push({
                    id: `${order.orderId}-${item.orderItemId}`,
                    name: item.menuName,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    time: timeStr,
                    status: statusStr as Order["status"],
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
    };
    if (tableId) fetchTableDetail();
  }, [tableId]);

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

  const handleAcceptCall = (id: string) => setActiveCalls(prev => prev.filter(call => call.id !== id));
  const confirmGroupDeposit = (time: string) => setOrders(prev => prev.map(order => order.time === time && order.status === "입금 확인 대기" ? { ...order, status: "준비 중" } : order));
  const toggleOrderStatus = (id: string) => setOrders(prev => prev.map(order => { if (order.id !== id || order.status === "입금 확인 대기") return order; return { ...order, status: order.status === "준비 중" ? "제공 완료" : "준비 중" }; }));

  const handleDeleteGroupClick = (time: string) => { setIsEditTokenOpen(false); setIsResetOpen(false); setTimeToDelete(time); setDeleteReason(""); setIsDeleteOrderOpen(true); };
  const executeDeleteGroup = () => { if (!timeToDelete) return; setOrders(prev => prev.filter(order => order.time !== timeToDelete)); setIsDeleteOrderOpen(false); setTimeToDelete(null); setDeleteReason(""); };

  // ==========================================
  // [API 연동 1] 테이블 정리/초기화 (PATCH)
  // ==========================================
  const handleResetTable = async () => {
    try {
      const tokenStr = localStorage.getItem("staffAccessToken") || "";
      const response = await fetch(`/api/staff/tables/${tableId}/clear`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${tokenStr}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        alert("직원 권한이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        alert("테이블 정리가 완료되었습니다.");
        onClose(); // 팝업 닫기 (이후 SSE 이벤트를 통해 메인 화면 자동 갱신됨)
      } else {
        alert(result.message || "테이블 정리에 실패했습니다.");
      }
    } catch (error) {
      console.error("테이블 초기화 API 호출 오류:", error);
      alert("오류가 발생했습니다.");
    }
  };

  // ==========================================
  // [API 연동 2] 토큰 수량 증감 수정 (PATCH)
  // ==========================================
  const handleUpdateTokens = async () => {
    const deltaValue = Number(tokenDelta);
    if (isNaN(deltaValue) || deltaValue === 0) return;

    try {
      const tokenStr = localStorage.getItem("staffAccessToken") || "";
      const response = await fetch(`/api/tokens/${tableId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${tokenStr}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ delta: deltaValue })
      });

      if (response.status === 401 || response.status === 403) {
        alert("권한이 없습니다.");
        return;
      }

      const result = await response.json();
      
      // 통신 성공 시 (별도 응답 포맷이 없다면 status ok 기준)
      if (response.ok || result.success) {
        setTokens((prev) => prev + deltaValue);
        setIsEditTokenOpen(false);
        setTokenDelta("");
      } else {
        alert(result.message || "토큰 증감 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("토큰 수정 API 호출 오류:", error);
      alert("오류가 발생했습니다.");
    }
  };

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <div className={`flex flex-col md:flex-row transition-all duration-500 w-full h-full sm:h-[90vh] max-w-[1400px] ${(isEditTokenOpen || isResetOpen || isDeleteOrderOpen) ? "md:-translate-x-[5vw]" : ""}`} onClick={(e) => e.stopPropagation()}>
        
        <motion.div className="relative flex-1 bg-[#1e293b] sm:rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden z-10">
          <div className="px-6 py-4 sm:px-10 sm:py-6 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
            <div className="flex items-center gap-4 sm:gap-12">
              <h2 className="text-4xl sm:text-6xl font-black text-orange-500 italic tracking-tighter">
                {tableNumber !== null ? tableNumber : tableId}
              </h2>
              <div className="flex items-center gap-4 sm:gap-10 border-l border-white/10 pl-4 sm:pl-10">
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-[12px] text-slate-500 font-bold uppercase tracking-widest">총 금액</span>
                  <span className="text-lg sm:text-3xl font-black text-white">{totalAmount.toLocaleString()}원</span>
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
                      
                      {isWaitingDeposit && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDeleteGroupClick(time)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 transition-all active:scale-95">
                            <Trash2 size={14} /> 주문 취소
                          </button>
                          <button onClick={() => confirmGroupDeposit(time)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95">
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
                          
                          {order.status === "입금 확인 대기" ? (
                            <div className="flex items-center gap-2 text-emerald-500/50 font-black text-xs uppercase bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              입금 대기 중
                            </div>
                          ) : (
                            <button onClick={() => toggleOrderStatus(order.id)} className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-black text-xs sm:text-sm transition-all ${order.status === "제공 완료" ? "bg-slate-700 text-slate-500" : "bg-orange-500 text-white"}`}>
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
            <button onClick={() => { setIsResetOpen(false); setIsDeleteOrderOpen(false); setIsEditTokenOpen(!isEditTokenOpen); setTokenDelta(""); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 active:scale-95">
              <Coins size={20} className="text-yellow-500" /> 토큰 수량 증감
            </button>
            <button onClick={() => { setIsEditTokenOpen(false); setIsDeleteOrderOpen(false); setIsResetOpen(!isResetOpen); }} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-4 sm:py-6 rounded-2xl font-black text-lg sm:text-xl flex items-center justify-center gap-3 active:scale-95">
              <RotateCcw size={20} /> 테이블 초기화
            </button>
          </div>
        </motion.div>
        
        {/* 사이드 팝업 영역 */}
        <AnimatePresence mode="wait">
          
          {/* 토큰 증감 팝업 */}
          {isEditTokenOpen && (
            <motion.div key="token-edit" initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              className="fixed inset-0 md:relative md:inset-auto z-20 md:z-0 bg-slate-900/95 md:bg-slate-800 border-l border-white/10 md:rounded-r-[2rem] w-full md:w-[350px] flex flex-col justify-center shadow-2xl">
              <button onClick={() => setIsEditTokenOpen(false)} className="md:hidden absolute top-6 right-6 p-4 bg-white/10 rounded-full"><X size={32} /></button>
              <div className="p-10 space-y-8">
                <h3 className="text-2xl font-black text-yellow-500 italic flex items-center gap-2 uppercase tracking-tighter"><Coins size={28} /> 토큰 증감</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">현재 보유 토큰</label>
                    <div className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl p-4 text-center">
                      <span className="text-2xl font-black text-white">{tokens} T</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">증감할 수량 (Delta)</label>
                    <input 
                      type="number" 
                      placeholder="예: 2 (추가), -1 (차감)" 
                      value={tokenDelta} 
                      onChange={(e) => setTokenDelta(e.target.value)} 
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-2xl font-black text-center outline-none focus:ring-1 focus:ring-yellow-500 text-yellow-500" 
                    />
                    {tokenDelta && !isNaN(Number(tokenDelta)) && (
                      <p className="mt-4 text-center text-sm font-bold text-slate-400">
                        수정 후 예상 토큰: <span className="text-white">{tokens + Number(tokenDelta)} T</span>
                      </p>
                    )}
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
                    <p className="text-red-400 font-bold text-sm">주문 시간 : {timeToDelete}</p>
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
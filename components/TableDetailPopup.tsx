"use client";

import { useState } from "react";
import { X, Coins, Bell, RotateCcw, Clock, Check, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  name: string;
  quantity: number;
  price: number;
  time: string;
  status: "준비 중" | "제공 완료";
  isTokenPayment?: boolean;
}

interface CallInfo {
  id: string;
  type: "직원 호출" | "딜러 호출" | "입금 확인";
  time: string;
}

export default function TableDetailPopup({ tableId, onClose }: { tableId: number; onClose: () => void }) {
  // --- 상태 관리 ---
  const [tokens, setTokens] = useState(7);
  const [isEditTokenOpen, setIsEditTokenOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false); // 초기화 팝업 상태 추가
  
  const [editReason, setEditReason] = useState("");
  const [editBalance, setEditBalance] = useState(tokens.toString());
  
  const [activeCalls, setActiveCalls] = useState<CallInfo[]>([
    { id: "c1", type: "입금 확인", time: "21:05" },
    { id: "c2", type: "딜러 호출", time: "21:12" },
    { id: "c3", type: "직원 호출", time: "21:15" },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { id: "1", name: "토마토 브뤨레", quantity: 2, price: 16000, time: "20:30", status: "제공 완료", isTokenPayment: false },
    { id: "2", name: "나초 치즈", quantity: 1, price: 12, time: "21:10", status: "준비 중", isTokenPayment: true },
    { id: "3", name: "어묵탕", quantity: 1, price: 9000, time: "21:10", status: "준비 중", isTokenPayment: false },
  ]);

  // --- 핸들러 로직 ---
  const handleAcceptCall = (id: string) => {
    setActiveCalls(prev => prev.filter(call => call.id !== id));
  };

  const toggleOrderStatus = (id: string) => {
    setOrders(prev => prev.map(order => 
      order.id === id 
        ? { ...order, status: order.status === "준비 중" ? "제공 완료" : "준비 중" } 
        : order
    ));
  };

  const handleResetTable = () => {
    alert("테이블 초기화가 완료되었습니다.");
    onClose(); // 모든 팝업 닫고 포스 화면으로 복귀
  };

  const groupedOrders = orders.reduce((acc: any, order) => {
    if (!acc[order.time]) acc[order.time] = [];
    acc[order.time].push(order);
    return acc;
  }, {});

  const totalPrice = orders
    .filter(o => !o.isTokenPayment)
    .reduce((sum, o) => sum + (o.price * o.quantity), 0);

  const getCallStyle = (type: string) => {
    switch (type) {
      case "입금 확인": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500";
      case "딜러 호출": return "bg-purple-500/10 border-purple-500/30 text-purple-500";
      default: return "bg-cyan-500/10 border-cyan-500/30 text-cyan-500";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-[2vw]"
      onClick={onClose}
    >
      <div 
        className={`flex transition-all duration-500 ease-in-out h-[85vh] ${(isEditTokenOpen || isResetOpen) ? "-translate-x-[5vw]" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 메인 팝업 */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-[75vw] max-w-[1200px] bg-[#1e293b] rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
            <div className="flex items-center gap-12">
              <h2 className="text-6xl font-black text-orange-500 italic tracking-tighter">{tableId}</h2>
              <div className="flex items-center gap-10 border-l border-white/10 pl-10">
                <div className="flex flex-col">
                  <span className="text-[12px] text-slate-500 font-bold uppercase tracking-widest mb-1">총 금액</span>
                  <span className="text-3xl font-black text-white">{totalPrice.toLocaleString()}원</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] text-yellow-600 font-bold uppercase tracking-widest mb-1">토큰</span>
                  <span className="text-3xl font-black text-yellow-500">{tokens.toLocaleString()} T</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-all">
              <X size={36} className="text-slate-500" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {/* 호출 리스트 */}
            <div className="grid grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {activeCalls.slice(0, 3).map((call) => (
                  <motion.div 
                    key={call.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100, scale: 0.9 }}
                    className={`p-5 rounded-2xl border flex flex-col justify-between animate-pulse transition-colors ${getCallStyle(call.type)}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xl font-black leading-tight">{call.type}</span>
                      <span className="opacity-70 font-mono text-xs">{call.time}</span>
                    </div>
                    <button 
                    onClick={() => handleAcceptCall(call.id)}
                    className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95"
                    >
                    {/* shrink-0을 추가하여 아이콘이 압축되는 것을 방지합니다 */}
                    <Check size={18} className="flex-shrink-0 text-white" strokeWidth={3} /> 
                    <span>호출 수락</span>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 주문 타임라인 */}
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-tighter">
                <Clock size={14} /> 주문 타임라인
              </p>
              {Object.keys(groupedOrders).map((time) => (
                <div key={time} className="bg-[#0f172a]/40 rounded-2xl p-4 border border-white/5">
                  <div className="text-[15px] text-slate-600 font-mono mb-2 border-b border-white/5 pb-2">주문시간: {time}</div>
                  <div className="space-y-2">
                    {groupedOrders[time].map((order: Order) => (
                      <div key={order.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-transparent hover:border-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-slate-200">{order.name}</span>
                            <span className="text-sm text-slate-500">{order.price.toLocaleString()}{order.isTokenPayment ? 'T' : '원'} · {order.quantity}개</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleOrderStatus(order.id)}
                          className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${
                            order.status === "제공 완료" ? "bg-slate-700 text-slate-500 opacity-60" : "bg-orange-500 text-white"
                          }`}
                        >
                          {order.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 bg-slate-900/20 border-t border-white/5 flex gap-4">
            <button 
              onClick={() => {
                setIsResetOpen(false); // 초기화창 닫기
                setIsEditTokenOpen(!isEditTokenOpen);
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
            >
              <Coins size={24} className="text-yellow-500" />
              토큰 수량 수정
            </button>
            <button 
              onClick={() => {
                setIsEditTokenOpen(false); // 토큰창 닫기
                setIsResetOpen(!isResetOpen);
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
            >
              <RotateCcw size={24} /> 테이블 초기화
            </button>
          </div>
        </motion.div>

        {/* 사이드 팝업 영역 (AnimatePresence로 관리) */}
        <AnimatePresence mode="wait">
          {/* 1. 토큰 수정창 */}
          {isEditTokenOpen && (
            <motion.div 
              key="token-edit"
              initial={{ width: 0, opacity: 0, x: -20 }}
              animate={{ width: 350, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -20 }}
              className="bg-slate-800 border-y border-r border-white/10 rounded-r-[2rem] shadow-2xl overflow-hidden flex flex-col justify-center"
            >
              <div className="w-[350px] p-10 space-y-8">
                <h3 className="text-2xl font-black text-yellow-500 italic flex items-center gap-2 uppercase tracking-tighter">
                  <Coins size={28} /> 토큰 수정
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">수정 사유</label>
                    <input 
                        type="text"
                        placeholder="사유 입력"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:ring-1 focus:ring-yellow-500 text-slate-200"
                        />
                  </div>
                  <div>
                    <label className="text-[12px] text-slate-500 font-bold block mb-2 uppercase tracking-widest">수정 후 수량</label>
                    <input 
                        type="number" 
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-5 text-4xl font-black text-center outline-none focus:ring-1 focus:ring-yellow-500 text-yellow-500"
                    />
                  </div>
                </div>
                <button 
                    disabled={!editReason.trim() || editBalance === "" || Number(editBalance) === tokens}
                    onClick={() => {
                        setTokens(Number(editBalance));
                        setIsEditTokenOpen(false);
                    }}
                    className={`w-full py-5 rounded-xl font-black text-lg text-white transition-all active:scale-95 ${
                        !editReason.trim() || editBalance === "" || Number(editBalance) === tokens
                        ? "bg-slate-700 cursor-not-allowed opacity-50"
                        : "bg-yellow-600 hover:bg-yellow-500 shadow-xl shadow-yellow-900/20"
                    }`}
                    >
                    저장
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. 테이블 초기화 확인창 */}
          {isResetOpen && (
            <motion.div 
              key="table-reset"
              initial={{ width: 0, opacity: 0, x: -20 }}
              animate={{ width: 350, opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -20 }}
              className="bg-slate-800 border-y border-r border-white/10 rounded-r-[2rem] shadow-2xl overflow-hidden flex flex-col justify-center"
            >
              <div className="w-[350px] p-10 flex flex-col items-center text-center space-y-10">
                <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle size={48} className="text-orange-500 animate-bounce" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">테이블 초기화</h3>
                  <p className="text-slate-400 font-bold leading-relaxed">
                    정말 초기화 하시겠습니까?<br/>
                    <span className="text-orange-500/80 text-sm">모든 주문 및 호출이 삭제됩니다.</span>
                  </p>
                </div>

                <div className="w-full space-y-4">
                  <button 
                    onClick={handleResetTable}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white py-5 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-xl shadow-orange-900/20"
                  >
                    초기화 하기
                  </button>
                  <button 
                    onClick={() => setIsResetOpen(false)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-4 rounded-2xl font-bold transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
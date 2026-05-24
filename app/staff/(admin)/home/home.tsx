"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { staffFetch } from "@/lib/staffFetch";
import { useSseEvent } from "@/lib/SseContext";
// TableDetailPopup 내부에서 상세 조회(GET /api/staff/tables/{tableId}) API를 호출하도록 구현되어야 합니다.
import TableDetailPopup from "@/components/TableDetailPopup";

// 백엔드 API에서 내려주는 상태 타입 정의
type BackendTableStatus = "EMPTY" | "IN_USE" | "PAYMENT_PENDING" | "STAFF_CALL" | "DEALER_CALL";

// 프론트엔드 테이블 데이터 구조
interface TableData {
  id: number; //API에서 내려주는 고유 테이블 ID
  number: number; // 테이블 번호 화면표시용
  status: string; // 매핑된 프론트엔드용 상태값 (empty, active, deposit, staff, dealer)
}

function mapBackendStatusToFrontend(backendStatus: BackendTableStatus): string {
  switch (backendStatus) {
    case "EMPTY": return "empty";
    case "IN_USE": return "active";
    case "PAYMENT_PENDING": return "deposit";
    case "STAFF_CALL": return "staff";
    case "DEALER_CALL": return "dealer";
    default: return "empty";
  }
}

export default function AdminHomePage() {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  const touchState = useRef({ isPanning: false, isPinching: false, lastX: 0, lastY: 0, lastDist: 0 });

  // [API 연동 1] 상태 환경 설정 유지 (디자인)
  const statusConfig = {
    empty: { color: "bg-slate-800/40 border-slate-700 text-slate-600", label: "빈 테이블", icon: "" },
    active: { color: "bg-orange-500/20 border-orange-500 text-white", label: "이용 중", icon: "" },
    deposit: { color: "bg-yellow-500/30 border-yellow-500 text-white animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)]", label: "입금 확인", icon: "💰" },
    staff: { color: "bg-cyan-500/30 border-cyan-500 text-white animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.5)]", label: "직원 호출", icon: "🙋" },
    dealer: { color: "bg-purple-500/30 border-purple-500 text-white animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]", label: "딜러 호출", icon: "🃏" },
  };

  // [API 연동 2] 초기 상태는 빈 배열로 시작 (로딩 중 표시를 추가해도 좋습니다)
  const [tables, setTables] = useState<TableData[]>([]);

  // [API 연동 3] 테이블 목록 조회
  const fetchInitialTables = useCallback(async () => {
    try {
      const response = await staffFetch("/api/staff/tables", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.status === 403) {
        alert("직원 권한이 필요합니다.");
        window.location.href = "/staff";
        return;
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setTables(result.data.map((t: any) => ({
          id: t.tableId,
          number: t.tableNumber,
          status: mapBackendStatusToFrontend(t.status),
        })));
      }
    } catch (error) {
      console.error("초기 테이블 현황 조회 실패:", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialTables();
  }, [fetchInitialTables]);

  // [API 연동 4] SSE 이벤트 구독 (연결은 SseProvider가 layout에서 관리)
  useSseEvent("PAYMENT_REQUEST_CREATED", ({ tableId }: any) =>
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: "deposit" } : t))
  );
  useSseEvent("STAFF_CALL_CREATED", ({ tableId }: any) =>
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: "staff" } : t))
  );
  useSseEvent("DEALER_CALL_CREATED", ({ tableId }: any) =>
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, status: "dealer" } : t))
  );
  useSseEvent("ORDER_APPROVED", fetchInitialTables);
  useSseEvent("ORDER_REJECTED", fetchInitialTables);
  useSseEvent("CALL_RESOLVED", fetchInitialTables);
  useSseEvent("TABLE_STATUS_CHANGED", fetchInitialTables);

  // --- 기존의 데스크탑 전용 휠/터치 마우스 이벤트 핸들러 ---
  useEffect(() => {
    const area = desktopContainerRef.current;
    if (!area) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        setZoom((prev) => Math.min(Math.max(0.3, prev + delta), 2.5));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchState.current.isPanning = true;
        touchState.current.isPinching = false;
        touchState.current.lastX = e.touches[0].clientX;
        touchState.current.lastY = e.touches[0].clientY;
        setHasMoved(false);
      } else if (e.touches.length === 2) {
        touchState.current.isPanning = false;
        touchState.current.isPinching = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchState.current.lastDist = Math.hypot(dx, dy);
        setHasMoved(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchState.current.isPinching && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const zoomDelta = (dist - touchState.current.lastDist) * 0.005;
        setZoom(prev => Math.min(Math.max(0.3, prev + zoomDelta), 2.5));
        touchState.current.lastDist = dist;
      } else if (touchState.current.isPanning && e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchState.current.lastX;
        const dy = e.touches[0].clientY - touchState.current.lastY;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasMoved(true);
        const LIMIT_X = 1000; 
        const LIMIT_Y = 800;
        setPosition((prev) => ({
          x: Math.max(-LIMIT_X, Math.min(LIMIT_X, prev.x + dx)),
          y: Math.max(-LIMIT_Y, Math.min(LIMIT_Y, prev.y + dy))
        }));
        touchState.current.lastX = e.touches[0].clientX;
        touchState.current.lastY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      touchState.current.isPanning = false;
      touchState.current.isPinching = false;
    };

    area.addEventListener("wheel", handleWheel, { passive: false });
    area.addEventListener("touchstart", handleTouchStart, { passive: false });
    area.addEventListener("touchmove", handleTouchMove, { passive: false });
    area.addEventListener("touchend", handleTouchEnd);
    area.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      area.removeEventListener("wheel", handleWheel);
      area.removeEventListener("touchstart", handleTouchStart);
      area.removeEventListener("touchmove", handleTouchMove);
      area.removeEventListener("touchend", handleTouchEnd);
      area.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    startMousePos.current = { x: e.clientX, y: e.clientY };
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const totalDistanceX = Math.abs(e.clientX - startMousePos.current.x);
    const totalDistanceY = Math.abs(e.clientY - startMousePos.current.y);
    if (totalDistanceX > 5 || totalDistanceY > 5) setHasMoved(true);
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    const LIMIT_X = 1000; 
    const LIMIT_Y = 800;
    setPosition((prev) => ({
      x: Math.max(-LIMIT_X, Math.min(LIMIT_X, prev.x + deltaX)),
      y: Math.max(-LIMIT_Y, Math.min(LIMIT_Y, prev.y + deltaY))
    }));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#020617] overflow-hidden select-none relative font-sans">      
      
      {/* 모바일 뷰 */}
      <div className="flex md:hidden flex-col h-full w-full">
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 pb-3 flex flex-col gap-3 shadow-lg">
          <div className="flex gap-3 overflow-x-auto whitespace-nowrap pb-1 [&::-webkit-scrollbar]:hidden">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={`mob-legend-${key}`} className="flex items-center gap-1.5 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${config.color.split(' ')[1]}`} />
                <span className="text-[11px] font-bold text-slate-400">{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {tables.map((table) => {
              const config = statusConfig[table.status as keyof typeof statusConfig] || statusConfig.empty;

              return (
                <button
                  key={`mob-tbl-${table.id}`}
                  onClick={() => setSelectedTable(table.id)}
                  className={`
                    relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all active:scale-90 active:border-white/50
                    ${config.color} 
                  `}
                >
                  <span className="font-black text-slate-100 text-xl">{table.number}</span>
                  {config.icon && <span className="absolute top-1 right-1.5 text-[10px]">{config.icon}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 데스크탑 뷰 */}
      <div className="hidden md:flex flex-1 relative overflow-hidden w-full h-full">
        <div className="absolute bottom-6 left-6 z-30 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-[11px] text-slate-400 shadow-lg">
          <span className="text-orange-500 font-bold">Ctrl + 휠</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
        </div>

        <div 
          ref={desktopContainerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className={`relative flex-1 flex items-center justify-center overflow-hidden w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          <div 
            className="relative transition-transform duration-75 ease-out"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              width: '1200px',
              transformOrigin: 'center center'
            }}
          >
            <div className="absolute -top-20 left-0 right-0 flex justify-center gap-6 py-4 px-6 bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700 shadow-xl w-max mx-auto">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div key={`desk-legend-${key}`} className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border-4 ${config.color.split(' ')[1]}`} />
                  <span className="text-[14px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                    {config.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-10 gap-4 mt-0">
              {tables.map((table) => {
                const config = statusConfig[table.status as keyof typeof statusConfig] || statusConfig.empty;

                return (
                  <button
                    key={`desk-tbl-${table.id}`}
                    onClick={() => !hasMoved && setSelectedTable(table.id)}
                    className={`
                      relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 hover:border-white/40 hover:scale-105 hover:shadow-lg active:scale-95
                      ${config.color} text-2xl
                    `}
                  >
                    <span className="font-black text-slate-100">{table.number}</span>
                    {config.icon && <span className="absolute top-2 right-2 text-sm drop-shadow-md">{config.icon}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 액션 처리 팝업 */}
      {selectedTable && (
        <TableDetailPopup 
          tableId={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </div>
  );
}
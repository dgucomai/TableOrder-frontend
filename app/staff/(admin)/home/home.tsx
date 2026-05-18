"use client";

import React, { useState, useRef, useEffect } from "react";
import TableDetailPopup from "@/components/TableDetailPopup";

export default function AdminHomePage() {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  // 테이블 범위 필터 상태
  const [startTable, setStartTable] = useState<number | "">("");
  const [endTable, setEndTable] = useState<number | "">("");
  
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  
  // 마우스 및 터치 상태 관리 Ref (데스크탑 맵 뷰 전용)
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  
  const touchState = useRef({
    isPanning: false,
    isPinching: false,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
  });

  const statusConfig = {
    empty: { 
      color: "bg-slate-800/40 border-slate-700 text-slate-600", 
      label: "빈 테이블", 
      icon: "" 
    },
    active: { 
      color: "bg-orange-500/20 border-orange-500 text-white", 
      label: "이용 중", 
      icon: "" 
    },
    deposit: { 
      color: "bg-yellow-500/30 border-yellow-500 text-white animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)]", 
      label: "입금 확인", 
      icon: "💰" 
    },
    staff: { 
      color: "bg-cyan-500/30 border-cyan-500 text-white animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.5)]", 
      label: "직원 호출", 
      icon: "🙋" 
    },
    dealer: { 
      color: "bg-purple-500/30 border-purple-500 text-white animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)]", 
      label: "딜러 호출", 
      icon: "🃏" 
    },
  };

  const [tables] = useState(
    Array.from({ length: 90 }, (_, i) => ({
      id: i + 1,
      status: i === 4 ? "deposit" : i === 11 ? "staff" : i === 13 ? "dealer" : i % 8 === 0 ? "active" : "empty",
    }))
  );

  // 데스크탑 전용 휠/터치 이벤트 핸들러
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

  // 공통 필터링 판별 로직
  const checkIsFilteredOut = (id: number) => {
    if (startTable === "" && endTable === "") return false;
    if (startTable !== "" && id < startTable) return true;
    if (endTable !== "" && id > endTable) return true;
    return false;
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#020617] overflow-hidden select-none relative font-sans">      
      
      {/* =========================================
          모바일 전용 UI (md:hidden)
          ========================================= */}
      <div className="flex md:hidden flex-col h-full w-full">
        {/* 모바일 상단 고정 헤더 (상태 요약 & 필터) */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 pb-3 flex flex-col gap-3 shadow-lg">
          {/* 상태 범례 (가로 스크롤) */}
          <div className="flex gap-3 overflow-x-auto whitespace-nowrap pb-1 [&::-webkit-scrollbar]:hidden">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={`mob-legend-${key}`} className="flex items-center gap-1.5 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${config.color.split(' ')[1]}`} />
                <span className="text-[11px] font-bold text-slate-400">{config.label}</span>
              </div>
            ))}
          </div>

          {/* 모바일 번호 필터 */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-slate-300 text-xs font-bold whitespace-nowrap">테이블 검색</span>
            <div className="flex-1 flex gap-1 items-center bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
              <input
                type="number"
                value={startTable}
                onChange={(e) => setStartTable(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-transparent text-white px-2 py-1.5 text-sm outline-none text-center"
                placeholder="시작"
              />
              <span className="text-slate-500 text-xs">~</span>
              <input
                type="number"
                value={endTable}
                onChange={(e) => setEndTable(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-transparent text-white px-2 py-1.5 text-sm outline-none text-center"
                placeholder="끝"
              />
            </div>
            <button
              onClick={() => { setStartTable(""); setEndTable(""); }}
              className="px-3 py-2 bg-slate-700 active:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 모바일 네이티브 스크롤 그리드 (4열) */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {tables.map((table) => {
              const config = statusConfig[table.status as keyof typeof statusConfig];
              const isFilteredOut = checkIsFilteredOut(table.id);

              return (
                <button
                  key={`mob-tbl-${table.id}`}
                  onClick={() => setSelectedTable(table.id)}
                  className={`
                    relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all
                    ${config.color} 
                    ${isFilteredOut ? 'opacity-10 pointer-events-none grayscale' : 'active:scale-90 active:border-white/50'}
                  `}
                >
                  <span className="font-black text-slate-100 text-lg">{table.id}</span>
                  {config.icon && <span className="absolute top-1 right-1.5 text-[10px]">{config.icon}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================
          데스크탑 전용 UI (hidden md:flex)
          기존의 Pan/Zoom 드래그 맵 구조
          ========================================= */}
      <div className="hidden md:flex flex-1 relative overflow-hidden w-full h-full">
        {/* 데스크탑 헬퍼 안내창 */}
        <div className="absolute bottom-6 left-6 z-30 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-[11px] text-slate-400 shadow-lg">
          <span className="text-orange-500 font-bold">Ctrl + 휠</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
        </div>

        {/* 데스크탑 번호 필터 UI */}
        <div className="absolute top-6 right-6 z-40 bg-slate-900/80 backdrop-blur px-5 py-3 rounded-2xl border border-slate-700 flex items-center gap-3 shadow-xl">
          <span className="text-slate-300 text-sm font-bold">번호 필터</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={startTable}
              onChange={(e) => setStartTable(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-16 bg-slate-800 text-white px-2 py-1.5 rounded-lg border border-slate-600 text-sm outline-none focus:border-orange-500 text-center"
              placeholder="시작"
            />
            <span className="text-slate-400">~</span>
            <input
              type="number"
              value={endTable}
              onChange={(e) => setEndTable(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-16 bg-slate-800 text-white px-2 py-1.5 rounded-lg border border-slate-600 text-sm outline-none focus:border-orange-500 text-center"
              placeholder="끝"
            />
            <button
              onClick={() => { setStartTable(""); setEndTable(""); }}
              className="ml-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              초기화
            </button>
          </div>
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
            {/* 상태 표시 줄 */}
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

            {/* 테이블 맵 (10열) */}
            <div className="grid grid-cols-10 gap-4 mt-0">
              {tables.map((table) => {
                const config = statusConfig[table.status as keyof typeof statusConfig];
                const isFilteredOut = checkIsFilteredOut(table.id);

                return (
                  <button
                    key={`desk-tbl-${table.id}`}
                    onClick={() => !hasMoved && setSelectedTable(table.id)}
                    className={`
                      relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200
                      ${config.color} text-2xl
                      ${isFilteredOut ? 'opacity-10 pointer-events-none grayscale scale-95' : 'hover:border-white/40 hover:scale-105 hover:shadow-lg active:scale-95'}
                    `}
                  >
                    <span className="font-black text-slate-100">{table.id}</span>
                    {config.icon && <span className="absolute top-2 right-2 text-sm drop-shadow-md">{config.icon}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 팝업 모달 (모바일/데스크탑 공통) */}
      {selectedTable && (
        <TableDetailPopup 
          tableId={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </div>
  );
}
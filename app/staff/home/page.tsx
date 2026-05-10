"use client";

import { useState, useRef, useEffect } from "react";
import TableDetailPopup from "../../../components/TableDetailPopup";

export default function AdminHomePage() {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 마우스 및 터치 상태 관리 Ref
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });
  
  const touchState = useRef({
    isPanning: false,
    isPinching: false,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
  });

  const easteregg = 1;

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

  // 1. 마우스 휠 및 모바일 터치 이벤트 핸들러 등록
  useEffect(() => {
    const area = containerRef.current;
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
        // 원핑거: 이동(Panning) 시작
        touchState.current.isPanning = true;
        touchState.current.isPinching = false;
        touchState.current.lastX = e.touches[0].clientX;
        touchState.current.lastY = e.touches[0].clientY;
        setHasMoved(false);
      } else if (e.touches.length === 2) {
        // 투핑거: 줌(Pinching) 시작
        touchState.current.isPanning = false;
        touchState.current.isPinching = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchState.current.lastDist = Math.hypot(dx, dy);
        setHasMoved(true); // 줌 할 때는 클릭 방지
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 모바일 브라우저의 새로고침/스크롤 차단

      if (touchState.current.isPinching && e.touches.length === 2) {
        // 핀치 줌 로직
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        
        // 이전 거리와의 차이를 이용해 줌 비율 계산
        const zoomDelta = (dist - touchState.current.lastDist) * 0.005;
        setZoom(prev => Math.min(Math.max(0.3, prev + zoomDelta), 2.5));
        
        touchState.current.lastDist = dist;
      } else if (touchState.current.isPanning && e.touches.length === 1) {
        // 터치 드래그 로직
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

    // passive: false 옵션을 주어야 e.preventDefault()가 작동함
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

  // 2. 데스크탑 마우스 이벤트 (기존 유지)
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

    if (totalDistanceX > 5 || totalDistanceY > 5) {
      setHasMoved(true);
    }

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
    <div className="h-full min-h-screen w-full flex flex-col bg-[#020617] overflow-hidden select-none relative">      
      {/* 헬퍼 안내창 (반응형 텍스트) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 bg-slate-900/80 backdrop-blur px-3 py-2 sm:px-4 sm:py-2 rounded-full border border-slate-700 text-[9px] sm:text-[10px] text-slate-400">
        <span className="hidden sm:inline">
          <span className="text-orange-500 font-bold">Ctrl + 휠</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
        </span>
        <span className="sm:hidden">
          <span className="text-orange-500 font-bold">두 손가락</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
        </span>
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className={`relative flex-1 flex items-center justify-center overflow-hidden w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {/* 줌/이동이 적용되는 실제 맵 캔버스 */}
        <div 
          className="relative transition-transform duration-75 ease-out"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            width: '1200px', // 맵 크기는 고정하고 줌/드래그로 탐색
            transformOrigin: 'center center'
          }}
        >
          {/* 상태 표시 줄 (모바일에서 줄바꿈 되도록 flex-wrap 적용) */}
          <div className="absolute -top-16 sm:-top-20 left-0 right-0 flex flex-wrap justify-center gap-2 sm:gap-6 py-2 sm:py-4 px-4 bg-slate-900/60 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-800/50 w-max mx-auto max-w-full">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-1 sm:space-x-2">
                <div className={`w-3 h-3 sm:w-5 sm:h-5 rounded-full border-2 sm:border-4 ${config.color.split(' ')[1]}`} />
                <span className="text-[11px] sm:text-[16px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {config.label}
                </span>
              </div>
            ))}
          </div>

          {/* 테이블 그리드 (크기 유지) */}
          <div className="grid grid-cols-10 gap-3 sm:gap-4 mt-8 sm:mt-0">
            {tables.map((table) => {
              const config = statusConfig[table.status as keyof typeof statusConfig];
              return (
                <button
                  key={table.id}
                  onClick={() => !hasMoved && setSelectedTable(table.id)}
                  className={`
                    relative h-16 sm:h-24 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center justify-center transition-all
                    ${config.color} text-sm sm:text-2xl
                    hover:border-white/40 hover:scale-105 active:scale-95
                  `}
                >
                  <span className="font-black text-slate-100">{table.id}</span>
                  {config.icon && <span className="absolute top-1 sm:top-2 right-1 sm:right-2 text-[10px] sm:text-xs">{config.icon}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTable && (
        <TableDetailPopup 
          tableId={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </div>
  );
}
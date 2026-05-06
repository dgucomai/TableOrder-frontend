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
  const lastMousePos = useRef({ x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });

  const statusConfig = {
    empty: { 
      color: "bg-slate-800/40 border-slate-700 text-slate-600 text-xl", 
      label: "빈 테이블", 
      icon: "" 
    },
    active: { 
      color: "bg-orange-500/20 border-orange-500 text-white text-xl", 
      label: "이용 중", 
      icon: "" 
    },
    deposit: { 
      color: "bg-yellow-500/30 border-yellow-500 text-white animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.5)] text-xl", 
      label: "입금 확인", 
      icon: "💰" 
    },
    staff: { 
      color: "bg-cyan-500/30 border-cyan-500 text-white animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.5)] text-xl", 
      label: "직원 호출", 
      icon: "🙋" 
    },
    dealer: { 
      color: "bg-purple-500/30 border-purple-500 text-white animate-pulse shadow-[0_0_20px_rgba(168,85,247,0.5)] text-xl", 
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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        setZoom((prev) => Math.min(Math.max(0.4, prev + delta), 2));
      }
    };
    const area = containerRef.current;
    area?.addEventListener("wheel", handleWheel, { passive: false });
    return () => area?.removeEventListener("wheel", handleWheel);
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

    if (totalDistanceX > 5 || totalDistanceY > 5) {
      setHasMoved(true);
    }

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    const LIMIT_X = 800; 
    const LIMIT_Y = 600;

    setPosition((prev) => {
      const newX = prev.x + deltaX;
      const newY = prev.y + deltaY;
      return {
        x: Math.max(-LIMIT_X, Math.min(LIMIT_X, newX)),
        y: Math.max(-LIMIT_Y, Math.min(LIMIT_Y, newY))
      };
    });
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    setTimeout(() => setIsDragging(false), 0);
  };

  return (
      <div className="h-screen w-screen flex flex-col bg-[#020617] overflow-hidden select-none relative">      
      {/* 헬퍼 안내창 */}
      <div className="absolute bottom-6 left-6 z-30 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-[10px] text-slate-400">
        <span className="text-orange-500 font-bold">Ctrl + 휠</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
      </div>

      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className={`relative flex-1 flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div 
          className="relative transition-transform duration-75 ease-out"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            width: '1200px',
            transformOrigin: 'center center'
          }}
        >
          {/* 지도 부착형 힌트 (Legend) */}
          <div className="absolute -top-16 left-0 right-0 flex justify-center space-x-6 py-4 bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-800/50">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full border-4 ${config.color.split(' ')[1]}`} />
                <span className="text-[20px] font-black text-slate-400 uppercase tracking-widest">{config.label}</span>
              </div>
            ))}
          </div>

          {/* 테이블 그리드 */}
          <div className="grid grid-cols-10 gap-4">
            {tables.map((table) => {
              const config = statusConfig[table.status as keyof typeof statusConfig];
              return (
                <button
                  key={table.id}
                  onClick={() => !hasMoved && setSelectedTable(table.id)}
                  className={`
                    relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all
                    ${config.color}
                    hover:border-white/40 hover:scale-105 active:scale-95
                  `}
                >
                  <span className="text-2xl font-black text-slate-100">{table.id}</span>
                  {config.icon && <span className="absolute top-2 right-2 text-xs">{config.icon}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* [수정] 테이블 상세 팝업 통합 */}
      {selectedTable && (
        <TableDetailPopup 
          tableId={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </div>
  );
}
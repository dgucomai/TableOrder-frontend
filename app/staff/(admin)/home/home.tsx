"use client";

import React, { useState, useRef, useEffect } from "react";
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

  // 백엔드 상태(tableStatus)를 프론트 UI(statusConfig 키)로 변환해주는 헬퍼 함수
  const mapBackendStatusToFrontend = (backendStatus: BackendTableStatus): string => {
    switch (backendStatus) {
      case "EMPTY": return "empty";
      case "IN_USE": return "active";
      case "PAYMENT_PENDING": return "deposit";
      case "STAFF_CALL": return "staff";
      case "DEALER_CALL": return "dealer";
      default: return "empty";
    }
  };

  // [API 연동 2] 초기 상태는 빈 배열로 시작 (로딩 중 표시를 추가해도 좋습니다)
  const [tables, setTables] = useState<TableData[]>([]);

  // [API 연동 3] 초기 데이터 Fetch 및 SSE 연결 (컴포넌트 마운트 시 1회 실행)
  useEffect(() => {
    // 임시: 로컬 스토리지 등에서 JWT 토큰을 가져온다고 가정
    const token = localStorage.getItem("staffAccessToken") || "";

    const fetchInitialTables = async () => {
      try {
        const response = await fetch("/api/staff/tables", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        // 명세서 기반 인증 예외 처리 (401, 403)
        if (response.status === 401 || response.status === 403) {
          alert(response.status === 401 ? "로그인이 필요합니다." : "직원 권한이 필요합니다.");
          window.location.href = "/staff";
          return;
        }

        const result = await response.json();
        // result 자체가 아닌 result.data가 배열인지 확인하도록 수정
        if (result.success && Array.isArray(result.data)) {
          const formattedTables = result.data.map((t: any) => ({
            id: t.tableId, 
            status: mapBackendStatusToFrontend(t.status) 
          }));
          setTables(formattedTables);
        }
      } catch (error) {
        console.error("초기 테이블 현황 조회 실패:", error);
      }
    };

    fetchInitialTables();

    // ==========================================
    // [API 연동 4] SSE (Server-Sent Events) 연결
    // ==========================================
    // 주의: EventSource는 기본적으로 Header를 지원하지 않으므로, 
    // 백엔드 설계에 따라 query 파라미터(?token=)로 토큰을 보내거나
    // fetch-event-source 라이브러리를 사용해 Header에 Bearer를 넣어야 합니다.
    const eventSource = new EventSource(`/api/staff/sse?token=${token}`);

    // 범용 메시지 수신 (혹은 eventSource.addEventListener('TABLE_STATUS_CHANGED', ...) 방식 사용 가능)
    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        
        // SSE 이벤트에 table 정보가 변경된 단일 데이터로 넘어온다고 명세에 정의됨
        if (parsedData && parsedData.table) {
          const { tableId, tableStatus } = parsedData.table;
          
          // 해당 tableId를 가진 테이블의 상태만 업데이트하여 리렌더링 유발
          setTables((prevTables) =>
            prevTables.map((t) =>
              t.id === tableId
                ? { ...t, status: mapBackendStatusToFrontend(tableStatus) }
                : t
            )
          );
        }
      } catch (error) {
        console.error("SSE 데이터 파싱 에러:", error);
      }
    };

    // 에러 발생 시 재동기화를 위해 다시 fetch 하도록 처리할 수 있습니다.
    eventSource.onerror = () => {
      console.warn("SSE 연결이 끊어졌거나 에러가 발생했습니다. 재동기화 시도 중...");
      // 연결이 닫혔다면 다시 fetchInitialTables()를 호출하는 로직 추가 가능
    };

    // 컴포넌트 언마운트 시 SSE 연결 종료 (단일 연결 유지 정책 준수)
    return () => {
      eventSource.close();
    };
  }, []);

  // --- 기존의 데스크탑 전용 휠/터치 마우스 이벤트 핸들러 (유지) ---
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

  const checkIsFilteredOut = (id: number) => {
    if (startTable === "" && endTable === "") return false;
    if (startTable !== "" && id < startTable) return true;
    if (endTable !== "" && id > endTable) return true;
    return false;
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#020617] overflow-hidden select-none relative font-sans">      
      
      {/* 모바일 뷰 유지 */}
      <div className="flex md:hidden flex-col h-full w-full">
        {/* 모바일 헤더 로직 생략 (기존과 완벽히 동일) */}
        <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 pb-3 flex flex-col gap-3 shadow-lg">
          <div className="flex gap-3 overflow-x-auto whitespace-nowrap pb-1 [&::-webkit-scrollbar]:hidden">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={`mob-legend-${key}`} className="flex items-center gap-1.5 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${config.color.split(' ')[1]}`} />
                <span className="text-[11px] font-bold text-slate-400">{config.label}</span>
              </div>
            ))}
          </div>

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

        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {tables.map((table) => {
              // 초기 로딩 시 status가 없을 수도 있으므로 fallback 방어 로직 추가
              const config = statusConfig[table.status as keyof typeof statusConfig] || statusConfig.empty;
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

      {/* 데스크탑 뷰 유지 */}
      <div className="hidden md:flex flex-1 relative overflow-hidden w-full h-full">
        <div className="absolute bottom-6 left-6 z-30 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-[11px] text-slate-400 shadow-lg">
          <span className="text-orange-500 font-bold">Ctrl + 휠</span> 줌 | <span className="text-orange-500 font-bold">드래그</span> 이동
        </div>

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

      {/* [API 연동 5] 액션 처리 (주문 승인, 호출 해결, 테이블 정리) 
        이 부분은 테이블 클릭 시 열리는 TableDetailPopup 컴포넌트 내부에서 
        명세서의 PATCH, DELETE API들을 호출하도록 구현되어야 합니다.
      */}
      {selectedTable && (
        <TableDetailPopup 
          tableId={selectedTable} 
          onClose={() => setSelectedTable(null)} 
        />
      )}
    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import { Clock, CreditCard, User } from "lucide-react";

type LogType =
  | "호출"
  | "상태변경"
  | "로그인"
  | "로그아웃"
  | "입금확인"
  | "토큰수정"
  | "테이블초기화"
  | "품절처리"
  | "주문취소"
  | "메뉴변경";

type FilterType = "전체" | LogType;

interface LogItem {
  id: string;
  type: LogType;
  title: string;
  description: string;
  time: string;
  staffName: string;
  tableNumber?: number;
  detail?: string;
}

export default function StaffLogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");

  const logs: LogItem[] = [
    {
      id: "log-1",
      type: "로그인",
      title: "직원 로그인",
      description: "김도윤 관리자가 로그인했습니다.",
      time: "20:30",
      staffName: "김도윤",
    },
    {
      id: "log-2",
      type: "호출",
      title: "직원 호출 수락",
      description: "12번 테이블의 직원 호출을 수락했습니다.",
      time: "20:41",
      staffName: "김도윤",
      tableNumber: 12,
      detail: "요청사항: 물 좀 주세요",
    },
    {
      id: "log-3",
      type: "호출",
      title: "딜러 호출 수락",
      description: "14번 테이블의 딜러 호출을 수락했습니다.",
      time: "20:45",
      staffName: "김도윤",
      tableNumber: 14,
    },
    {
      id: "log-4",
      type: "입금확인",
      title: "입금 확인 처리",
      description: "5번 테이블의 입금 확인을 처리했습니다.",
      time: "20:48",
      staffName: "김도윤",
      tableNumber: 5,
      detail: "처리 후 주문 상태: 준비 중",
    },
    {
      id: "log-5",
      type: "상태변경",
      title: "주문 상태 변경",
      description: "8번 테이블의 주문 상태를 제공 완료로 변경했습니다.",
      time: "20:52",
      staffName: "김도윤",
      tableNumber: 8,
      detail: "나초 치즈: 준비 중 → 제공 완료",
    },
    {
      id: "log-6",
      type: "토큰수정",
      title: "토큰 수량 변경",
      description: "3번 테이블의 토큰 수량을 수정했습니다.",
      time: "21:01",
      staffName: "김도윤",
      tableNumber: 3,
      detail: "7개 → 10개 / 사유: 현장 추가 구매",
    },
    {
      id: "log-7",
      type: "주문취소",
      title: "주문 취소",
      description: "9번 테이블의 주문을 취소했습니다.",
      time: "21:07",
      staffName: "김도윤",
      tableNumber: 9,
      detail: "취소 사유: 손님 요청",
    },
    {
      id: "log-8",
      type: "테이블초기화",
      title: "테이블 초기화",
      description: "11번 테이블을 초기화했습니다.",
      time: "21:15",
      staffName: "김도윤",
      tableNumber: 11,
      detail: "테이블 상태: 이용 중 → 빈 테이블",
    },
    {
      id: "log-9",
      type: "품절처리",
      title: "메뉴 품절 처리",
      description: "메뉴를 품절 상태로 변경했습니다.",
      time: "21:22",
      staffName: "김도윤",
      detail: "잭다니엘 허니: 판매 중 → 품절",
    },
    {
      id: "log-10",
      type: "메뉴변경",
      title: "메뉴 상태 변경",
      description: "메뉴 판매 상태를 변경했습니다.",
      time: "21:30",
      staffName: "김도윤",
      detail: "모듬 과일: 품절 → 판매 중",
    },
    {
      id: "log-11",
      type: "로그아웃",
      title: "직원 로그아웃",
      description: "김도윤 관리자가 로그아웃했습니다.",
      time: "22:10",
      staffName: "김도윤",
    },
  ];

  const filters: FilterType[] = [
    "전체",
    "호출",
    "상태변경",
    "로그인",
    "로그아웃",
    "입금확인",
    "토큰수정",
    "테이블초기화",
    "품절처리",
    "주문취소",
    "메뉴변경",
  ];

  const filteredLogs = useMemo(() => {
    const result =
      activeFilter === "전체"
        ? logs
        : logs.filter((log) => log.type === activeFilter);

    return result.slice().reverse();
  }, [activeFilter]);

  const getCountByType = (filter: FilterType) => {
    if (filter === "전체") return logs.length;
    return logs.filter((log) => log.type === filter).length;
  };

  const getLogStyle = (type: LogType) => {
    switch (type) {
      case "호출":
        return {
          card: "bg-cyan-500/10 border-cyan-500/30",
          badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          iconBox: "bg-cyan-500/20 text-cyan-400",
        };
      case "입금확인":
        return {
          card: "bg-yellow-500/10 border-yellow-500/30",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          iconBox: "bg-yellow-500/20 text-yellow-400",
        };
      case "상태변경":
      case "메뉴변경":
        return {
          card: "bg-orange-500/10 border-orange-500/30",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          iconBox: "bg-orange-500/20 text-orange-400",
        };
      case "로그인":
        return {
          card: "bg-emerald-500/10 border-emerald-500/30",
          badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          iconBox: "bg-emerald-500/20 text-emerald-400",
        };
      case "로그아웃":
        return {
          card: "bg-slate-500/10 border-slate-500/30",
          badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
          iconBox: "bg-slate-500/20 text-slate-300",
        };
      case "토큰수정":
        return {
          card: "bg-amber-500/10 border-amber-500/30",
          badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          iconBox: "bg-amber-500/20 text-amber-400",
        };
      case "테이블초기화":
        return {
          card: "bg-red-500/10 border-red-500/30",
          badge: "bg-red-500/20 text-red-400 border-red-500/30",
          iconBox: "bg-red-500/20 text-red-400",
        };
      case "품절처리":
      case "주문취소":
        return {
          card: "bg-purple-500/10 border-purple-500/30",
          badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          iconBox: "bg-purple-500/20 text-purple-400",
        };
    }
  };

  const getLogIcon = (type: LogType) => {
    switch (type) {
      case "호출":
        return <User size={18} />;
      case "입금확인":
        return <CreditCard size={18} />;
      case "상태변경":
        return <span className="text-base">🔄</span>;
      case "로그인":
        return <User size={18} />;
      case "로그아웃":
        return <span className="text-base">↪</span>;
      case "토큰수정":
        return <span className="text-base">🪙</span>;
      case "테이블초기화":
        return <span className="text-base">↻</span>;
      case "품절처리":
        return <span className="text-base">⚠</span>;
      case "주문취소":
        return <span className="text-base">✕</span>;
      case "메뉴변경":
        return <span className="text-base">☰</span>;
    }
  };

  return (
    <div className="min-h-full bg-[#0f172a] px-3 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-3 rounded-2xl border border-slate-800 bg-[#1e293b]/70 p-3">
          <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-slate-500">
            기록 유형 선택
          </label>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as FilterType)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-black text-white outline-none transition focus:border-orange-500"
          >
            {filters.map((filter) => (
              <option key={filter} value={filter}>
                {filter} {getCountByType(filter)}
              </option>
            ))}
          </select>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white sm:text-xl">
                {activeFilter === "전체" ? "전체 운영 기록" : `${activeFilter} 기록`}
              </h2>

              <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                최근 발생한 기록이 위에 표시됩니다.
              </p>
            </div>

            <div className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-400 sm:block">
              LOG
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center">
              <p className="text-sm font-black text-slate-400">
                표시할 기록이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const style = getLogStyle(log.type);

                return (
                  <article
                    key={log.id}
                    className={`rounded-2xl border p-3 transition-all hover:border-white/20 sm:p-4 ${style.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBox}`}
                      >
                        {getLogIcon(log.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black leading-tight text-white sm:text-lg">
                            {log.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${style.badge}`}
                          >
                            {log.type}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-bold leading-relaxed text-slate-200 sm:text-sm">
                          {log.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400 sm:text-xs">
                          <Clock size={13} />
                          <span>{log.time}</span>
                          <span className="text-slate-600">|</span>
                          <span>담당자 {log.staffName}</span>

                          {log.tableNumber && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span>{log.tableNumber}번 테이블</span>
                            </>
                          )}
                        </div>

                        {log.detail && (
                          <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-2.5">
                            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                              상세 내용
                            </p>
                            <p className="text-xs font-bold leading-relaxed text-slate-100 sm:text-sm">
                              {log.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 
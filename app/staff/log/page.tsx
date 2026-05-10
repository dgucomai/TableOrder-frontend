"use client";

import { useMemo, useState } from "react";
import { Check, Clock, CreditCard, User } from "lucide-react";

type CallType = "입금 확인" | "직원 호출" | "딜러 호출";
type FilterType = "전체" | CallType;

interface LogItem {
  id: string;
  tableId: number;
  type: CallType;
  requestedAt: string;
  acceptedAt: string;
  acceptedBy: string;
  requestText?: string;
}

export default function StaffLogPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");

  const logs: LogItem[] = [
    {
      id: "log-1",
      tableId: 8,
      type: "직원 호출",
      requestedAt: "20:58",
      acceptedAt: "21:00",
      acceptedBy: "김도윤",
      requestText: "휴지 필요합니다",
    },
    {
      id: "log-2",
      tableId: 5,
      type: "입금 확인",
      requestedAt: "21:05",
      acceptedAt: "21:08",
      acceptedBy: "김도윤",
    },
    {
      id: "log-3",
      tableId: 12,
      type: "직원 호출",
      requestedAt: "21:10",
      acceptedAt: "21:13",
      acceptedBy: "김도윤",
      requestText: "물 좀 주세요",
    },
    {
      id: "log-4",
      tableId: 14,
      type: "딜러 호출",
      requestedAt: "21:12",
      acceptedAt: "21:15",
      acceptedBy: "김도윤",
    },
    {
      id: "log-5",
      tableId: 3,
      type: "입금 확인",
      requestedAt: "21:18",
      acceptedAt: "21:20",
      acceptedBy: "김도윤",
    },
  ];

  const filteredLogs = useMemo(() => {
    const result =
      activeFilter === "전체"
        ? logs
        : logs.filter((log) => log.type === activeFilter);

    return result.slice().reverse();
  }, [activeFilter]);

  const getCountByType = (type: FilterType) => {
    if (type === "전체") return logs.length;
    return logs.filter((log) => log.type === type).length;
  };

  const getLogStyle = (type: CallType) => {
    switch (type) {
      case "입금 확인":
        return {
          card: "bg-yellow-500/10 border-yellow-500/30",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          iconBox: "bg-yellow-500/20 text-yellow-400",
        };
      case "직원 호출":
        return {
          card: "bg-cyan-500/10 border-cyan-500/30",
          badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          iconBox: "bg-cyan-500/20 text-cyan-400",
        };
      case "딜러 호출":
        return {
          card: "bg-purple-500/10 border-purple-500/30",
          badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          iconBox: "bg-purple-500/20 text-purple-400",
        };
    }
  };

  const getLogIcon = (type: CallType) => {
    switch (type) {
      case "입금 확인":
        return <CreditCard size={20} />;
      case "직원 호출":
        return <User size={20} />;
      case "딜러 호출":
        return <span className="text-lg">🃏</span>;
    }
  };

  const filters: FilterType[] = ["전체", "입금 확인", "직원 호출", "딜러 호출"];

  return (
    <div className="min-h-full bg-[#0f172a] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <section className="mb-5 rounded-3xl border border-slate-800 bg-[#1e293b] p-5 shadow-xl sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
                Staff Log
              </p>

              <h1 className="text-2xl font-black text-white sm:text-4xl">
                호출 기록
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-400">
                수락 완료된 입금 확인, 직원 호출, 딜러 호출 기록을 확인합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-bold text-slate-500">전체 기록</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {logs.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                <p className="text-xs font-bold text-slate-500">담당자</p>
                <p className="mt-2 text-xl font-black text-white">김도윤</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-4 sm:p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
            기록 필터
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-2xl border px-3 py-3 text-sm font-black transition-all active:scale-95 ${
                  activeFilter === filter
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-500 hover:text-white"
                }`}
              >
                {filter} {getCountByType(filter)}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white sm:text-xl">
                {activeFilter === "전체" ? "전체 호출 기록" : `${activeFilter} 기록`}
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                최근 처리된 호출이 위에 표시됩니다.
              </p>
            </div>

            <div className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-400 sm:block">
              LOG
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-400">
                표시할 기록이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => {
                const style = getLogStyle(log.type);

                return (
                  <article
                    key={log.id}
                    className={`rounded-2xl border p-4 transition-all hover:border-white/20 sm:p-5 ${style.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBox}`}
                      >
                        {getLogIcon(log.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-white">
                              {log.tableId}번 테이블
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${style.badge}`}
                            >
                              {log.type}
                            </span>
                          </div>

                          <span className="w-fit rounded-full bg-black/20 px-3 py-1 text-xs font-bold text-slate-300">
                            기록 {index + 1}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock size={14} />
                          <span>요청 {log.requestedAt}</span>
                          <span className="text-slate-600">|</span>
                          <span>수락 {log.acceptedAt}</span>
                          <span className="text-slate-600">|</span>
                          <span>담당자 {log.acceptedBy}</span>
                        </div>

                        {log.requestText && (
                          <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
                            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
                              요청사항
                            </p>
                            <p className="text-sm font-bold text-slate-100">
                              {log.requestText}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 py-3 text-sm font-black text-emerald-400 sm:w-fit sm:px-6">
                          <Check size={18} strokeWidth={3} />
                          처리 완료
                        </div>
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
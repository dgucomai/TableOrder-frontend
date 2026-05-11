"use client";

import { useMemo, useState } from "react";
import { Check, Clock, CreditCard, User } from "lucide-react";

type CallType = "입금 확인" | "직원 호출" | "딜러 호출";
type CallStatus = "WAITING" | "ACCEPTED";
type ActiveTab = "WAITING" | "ACCEPTED";
type FilterType = "전체" | CallType;

interface CallItem {
  id: string;
  tableId: number;
  type: CallType;
  requestedAt: string;
  status: CallStatus;
  requestText?: string;
  acceptedAt?: string;
  acceptedBy?: string;
}

export default function StaffCallsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("WAITING");
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");

  const [calls, setCalls] = useState<CallItem[]>([
    {
      id: "call-1",
      tableId: 5,
      type: "입금 확인",
      requestedAt: "21:05",
      status: "WAITING",
    },
    {
      id: "call-2",
      tableId: 12,
      type: "직원 호출",
      requestedAt: "21:10",
      status: "WAITING",
      requestText: "물 좀 주세요",
    },
    {
      id: "call-3",
      tableId: 14,
      type: "딜러 호출",
      requestedAt: "21:12",
      status: "WAITING",
    },
    {
      id: "call-4",
      tableId: 8,
      type: "직원 호출",
      requestedAt: "20:58",
      status: "ACCEPTED",
      requestText: "휴지 필요합니다",
      acceptedAt: "21:00",
      acceptedBy: "김도윤",
    },
  ]);

  const waitingCalls = useMemo(() => {
    return calls.filter((call) => call.status === "WAITING");
  }, [calls]);

  const acceptedCalls = useMemo(() => {
    return calls
      .filter((call) => call.status === "ACCEPTED")
      .slice()
      .reverse();
  }, [calls]);

  const baseCalls = activeTab === "WAITING" ? waitingCalls : acceptedCalls;

  const visibleCalls = useMemo(() => {
    if (activeFilter === "전체") {
      return baseCalls;
    }

    return baseCalls.filter((call) => call.type === activeFilter);
  }, [baseCalls, activeFilter]);

  const handleAcceptCall = (id: string) => {
    const now = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setCalls((prev) =>
      prev.map((call) =>
        call.id === id
          ? {
              ...call,
              status: "ACCEPTED",
              acceptedAt: now,
              acceptedBy: "김도윤",
            }
          : call
      )
    );
  };

  const getFilterCount = (filter: FilterType) => {
    if (filter === "전체") {
      return baseCalls.length;
    }

    return baseCalls.filter((call) => call.type === filter).length;
  };

  const getCallStyle = (type: CallType) => {
    switch (type) {
      case "입금 확인":
        return {
          card: "bg-yellow-500/10 border-yellow-500/30",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          iconBox: "bg-yellow-500/20 text-yellow-400",
          button: "bg-yellow-500 hover:bg-yellow-400 text-slate-950",
        };
      case "직원 호출":
        return {
          card: "bg-cyan-500/10 border-cyan-500/30",
          badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
          iconBox: "bg-cyan-500/20 text-cyan-400",
          button: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
        };
      case "딜러 호출":
        return {
          card: "bg-purple-500/10 border-purple-500/30",
          badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
          iconBox: "bg-purple-500/20 text-purple-400",
          button: "bg-purple-500 hover:bg-purple-400 text-white",
        };
    }
  };

  const getCallIcon = (type: CallType) => {
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
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              Staff Calls
            </p>

            <h1 className="text-2xl font-black text-white sm:text-4xl">
              호출 관리
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-400">
              현재 들어온 호출은 큐 방식으로, 수락 완료 호출은 스택 방식으로 관리합니다.
            </p>
          </div>
        </section>

        <div className="sticky top-20 z-20 mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-1 backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setActiveTab("WAITING");
              setActiveFilter("전체");
            }}
            className={`rounded-xl py-3 text-sm font-black transition-all active:scale-95 ${
              activeTab === "WAITING"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-950/30"
                : "text-slate-500 hover:bg-slate-800 hover:text-white"
            }`}
          >
            현재 호출
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("ACCEPTED");
              setActiveFilter("전체");
            }}
            className={`rounded-xl py-3 text-sm font-black transition-all active:scale-95 ${
              activeTab === "ACCEPTED"
                ? "bg-orange-500 text-white shadow-lg shadow-orange-950/30"
                : "text-slate-500 hover:bg-slate-800 hover:text-white"
            }`}
          >
            완료된 호출
          </button>
        </div>

        <section className="mb-5 rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-4 sm:p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-500">
            호출 유형
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
                {filter} {getFilterCount(filter)}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white sm:text-xl">
                {activeTab === "WAITING" ? "현재 들어온 호출" : "수락 완료한 호출"}
              </h2>

              <p className="mt-1 text-xs font-medium text-slate-500">
                {activeFilter === "전체"
                  ? "전체 호출을 표시합니다."
                  : `${activeFilter} 호출만 표시합니다.`}
              </p>
            </div>

            <div className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-400 sm:block">
              {activeTab === "WAITING" ? "QUEUE" : "STACK"}
            </div>
          </div>

          {visibleCalls.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
              <p className="text-sm font-black text-slate-400">
                표시할 호출이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleCalls.map((call, index) => {
                const style = getCallStyle(call.type);

                return (
                  <article
                    key={call.id}
                    className={`rounded-2xl border p-4 transition-all hover:border-white/20 sm:p-5 ${style.card}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.iconBox}`}
                      >
                        {getCallIcon(call.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-white">
                              {call.tableId}번 테이블
                            </h3>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${style.badge}`}
                            >
                              {call.type}
                            </span>
                          </div>

                          <span className="w-fit rounded-full bg-black/20 px-3 py-1 text-xs font-bold text-slate-300">
                            {activeTab === "WAITING"
                              ? `대기 순서 ${index + 1}`
                              : `완료 순서 ${index + 1}`}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock size={14} />
                          <span>요청 시간 {call.requestedAt}</span>

                          {call.status === "ACCEPTED" && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span>{call.acceptedAt} 수락 완료</span>
                              <span className="text-slate-600">|</span>
                              <span>담당자 {call.acceptedBy}</span>
                            </>
                          )}
                        </div>

                        {call.requestText && (
                          <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3">
                            <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
                              요청사항
                            </p>
                            <p className="text-sm font-bold text-slate-100">
                              {call.requestText}
                            </p>
                          </div>
                        )}

                        {call.status === "WAITING" && (
                          <button
                            type="button"
                            onClick={() => handleAcceptCall(call.id)}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-all active:scale-95 sm:w-auto sm:px-8 ${style.button}`}
                          >
                            <Check size={18} strokeWidth={3} />
                            호출 수락
                          </button>
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
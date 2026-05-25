"use client";

import React, { useMemo, useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { staffFetch } from "@/lib/staffFetch";

interface LogItem {
  logId: number;
  category: string;
  action: string;
  message: string;
  createdAt: string;
}

interface LogApiResponse {
  logs: LogItem[];
  cursor: {
    nextCursor: number | null;
    hasNext: boolean;
  };
}

const fetchLogs = async (cursor?: number): Promise<LogApiResponse> => {
  const url = cursor ? `/api/admin/logs?cursor=${cursor}` : "/api/admin/logs";
  const res = await staffFetch(url);
  
  if (!res.ok) throw new Error("네트워크 응답이 올바르지 않습니다.");
  const result = await res.json();
  
  if (!result.success) throw new Error(result.message || "데이터를 불러오는 중 오류가 발생했습니다.");
  
  return result.data;
};

// 날짜 없이 [오전/오후 시:분:초.소수점1자리] 로 변환하는 유틸 함수
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const ampm = date.getHours() >= 12 ? '오후' : '오전';
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const deciseconds = Math.floor(date.getMilliseconds() / 100);
  
  return `${ampm} ${hours}:${minutes}:${seconds}.${deciseconds}`;
};

export default function StaffLogPage() {
  const queryClient = useQueryClient();

  // 자동 새로고침 상태 관리
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(2);

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ["adminLogs"], 
    queryFn: ({ pageParam }) => fetchLogs(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.cursor.hasNext ? lastPage.cursor.nextCursor : undefined;
    },
    refetchOnWindowFocus: false, 
    gcTime: 0, 
  });

  // 1. 자동 새로고침 타이머 Effect
  useEffect(() => {
    if (!isAutoRefresh) {
      setCountdown(2);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refetch();
          return 2;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refetch]);

  // 2. 무한 스크롤 제어 Effect
  useEffect(() => {
    if (!isAutoRefresh && inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isAutoRefresh, inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const logs = useMemo(() => {
    return data?.pages.flatMap((page) => page.logs) || [];
  }, [data]);

  return (
    <div className="min-h-full bg-[#0f172a] px-3 py-4 sm:px-6 lg:px-10">
      
      {/* 부드러운 데이터 추가 애니메이션을 위한 컴포넌트 전용 스타일 */}
      <style>{`
        @keyframes logSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-log-entry {
          animation: logSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-3 sm:p-5">
          <div className="mb-3">
            <div className="flex w-full items-end justify-between">
              <div>
                <h2 className="text-base font-black text-white sm:text-xl">
                  전체 운영 기록
                </h2>
                <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                  최근 발생한 기록이 위에 표시됩니다.
                </p>
              </div>
              
              {/* 우측 컨트롤 영역 */}
              <div className="ml-auto flex items-end gap-3 sm:gap-4">
                
                {/* 자동 새로고침 토글 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider">자동</span>
                  
                  <div className="flex items-center gap-1.5 h-6">
                    {isAutoRefresh && (
                      <div className="flex w-6 justify-center text-xs font-bold text-orange-500">
                        {isFetching ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <span>{countdown}s</span>
                        )}
                      </div>
                    )}
                    
                    <label className="flex cursor-pointer items-center" title="2초마다 자동으로 최신 기록을 불러옵니다">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isAutoRefresh}
                          onChange={(e) => setIsAutoRefresh(e.target.checked)}
                        />
                        <div className={`block h-5 w-9 rounded-full transition-colors ${isAutoRefresh ? 'bg-orange-500' : 'bg-slate-700'}`}></div>
                        <div className={`absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-transform ${isAutoRefresh ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="h-4 mb-1 w-px bg-slate-700"></div>

                {/* 수동 새로고침 버튼 */}
                <button
                  onClick={() => {
                    queryClient.resetQueries({ queryKey: ["adminLogs"] });
                    if (isAutoRefresh) setCountdown(2);
                  }}
                  disabled={isFetching}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
                  title="초기상태로 새로고침"
                >
                  <RefreshCw size={16} className={isFetching && !isAutoRefresh ? "animate-spin text-orange-500" : ""} />
                  <span className="hidden text-xs font-bold sm:inline">새로고침</span>
                </button>
              </div>
            </div>
          </div>

          {status === "pending" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5">
              <Loader2 className="mb-2 animate-spin text-orange-500" size={24} />
              <p className="text-sm font-black text-slate-400">데이터를 불러오는 중입니다...</p>
            </div>
          ) : status === "error" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-500/30 bg-red-500/10 p-5 text-center">
              <p className="text-sm font-black text-red-400">기록을 불러오는 중 오류가 발생했습니다.</p>
              <button 
                onClick={() => queryClient.resetQueries({ queryKey: ["adminLogs"] })} 
                className="mt-3 rounded-lg bg-red-500/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30"
              >
                다시 시도
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center">
              <p className="text-sm font-black text-slate-400">표시할 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
                return (
                  /* 여기에 새로운 최신 로그 전용 애니메이션 클래스 'animate-log-entry'를 추가했습니다 */
                  <article 
                    key={log.logId} 
                    className="animate-log-entry flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-[#1e293b]/40 p-3 transition-colors hover:bg-[#1e293b]/80 sm:p-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold tracking-wider text-slate-400">
                          {log.category}
                        </span>
                        <span className="font-mono text-[10px] tracking-tight text-slate-500">
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">
                        #{log.logId}
                      </span>
                    </div>

                    <div>
                      <p className="break-keep text-sm font-normal leading-relaxed text-slate-200">
                        {log.message}
                      </p>
                    </div>
                  </article>
                );
              })}
              
              <div ref={ref} className="flex h-10 items-center justify-center py-4">
                {isFetchingNextPage ? (
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                ) : hasNextPage ? (
                  <span className="text-xs text-slate-500">
                    {isAutoRefresh ? "자동 갱신 중에는 스크롤 기능이 일시 중지됩니다." : "스크롤하여 더 보기"}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">모든 기록을 불러왔습니다.</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
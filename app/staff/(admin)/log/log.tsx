"use client";

import React, { useMemo, useEffect } from "react";
import { Clock, CreditCard, User, RefreshCw, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { staffFetch } from "@/lib/staffFetch"; // JWT가 포함된 공통 Fetch 함수

// API 응답 데이터 타입 정의 (log응답.txt 기준)
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

// 실제 API를 호출할 Fetch 함수 (staffFetch 적용)
const fetchLogs = async (cursor?: number): Promise<LogApiResponse> => {
  const url = cursor ? `/api/admin/logs?cursor=${cursor}` : "/api/admin/logs";
  const res = await staffFetch(url);
  
  if (!res.ok) throw new Error("네트워크 응답이 올바르지 않습니다.");
  const result = await res.json();
  
  if (!result.success) throw new Error(result.message || "데이터를 불러오는 중 오류가 발생했습니다.");
  
  return result.data;
};

export default function StaffLogPage() {
  // TanStack Query: 커서 기반 무한 스크롤 훅 적용
  const { ref, inView } = useInView({
    // 옵션: 요소가 화면에 나타나자마자가 아니라 10% 정도 보였을 때 호출 (중복 호출 방지에 도움)
    threshold: 0.1, 
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching, // 👈 추가: 전체 로딩 상태 가져오기
    refetch,
    status
  } = useInfiniteQuery({
    queryKey: ["adminLogs"],
    queryFn: ({ pageParam }) => fetchLogs(pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.cursor.hasNext ? lastPage.cursor.nextCursor : undefined;
    },
    // ✅ 1. 다른 탭이나 창을 다녀왔을 때 백그라운드 전체 재호출 방지
    refetchOnWindowFocus: false, 
    
    // ✅ 2. 다른 페이지로 이동 시 캐시를 즉시 삭제하여, 다시 들어오면 무조건 처음 10개만 로드하게 설정
    // (참고: TanStack Query v4 이하를 사용 중이라면 gcTime 대신 cacheTime: 0 을 사용하세요)
    gcTime: 0, 
  });

  // ✅ 3. 중복 호출 완벽 차단 로직
  useEffect(() => {
    // 다음 페이지가 있고, 화면에 트리거가 보이며, "아무런 로딩도 진행 중이 아닐 때만" 호출
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // pages 배열(2차원)을 하나의 배열(1차원)로 평탄화(flatMap)하여 통합
  const logs = useMemo(() => {
    return data?.pages.flatMap((page) => page.logs) || [];
  }, [data]);

  // 기존에 사용하시던 로직 유지 (데이터의 action 또는 category를 기준으로 스타일링 변경 필요 시 수정)
  const getLogStyle = (action: string) => { return { card: "" }; /* 기존 로직 동일하게 적용 */ };
  const getLogIcon = (action: string) => { /* 기존 로직 동일하게 적용 */ };

  return (
    <div className="min-h-full bg-[#0f172a] px-3 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        
        {/* 로그 목록 섹션 */}
        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-3 sm:p-5">
          <div className="mb-3">
            <div className="flex w-full items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white sm:text-xl">
                  전체 운영 기록
                </h2>
                <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                  최근 발생한 기록이 위에 표시됩니다.
                </p>
              </div>
              
              {/* 🔄 맨 우측에 배치된 새로고침 버튼 */}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
                title="새로고침"
              >
                <RefreshCw size={16} className={isFetching ? "animate-spin text-orange-500" : ""} />
                <span className="hidden text-xs font-bold sm:inline">새로고침</span>
              </button>
            </div>
          </div>

          {/* 로딩/결과 렌더링 */}
          {status === "pending" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5">
              <Loader2 className="mb-2 animate-spin text-orange-500" size={24} />
              <p className="text-sm font-black text-slate-400">데이터를 불러오는 중입니다...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center">
              <p className="text-sm font-black text-slate-400">표시할 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
                const style = getLogStyle(log.action); // 기존 로직을 action이나 category에 맞게 수정
                return (
                  <article key={log.logId} className={`rounded-2xl border p-3 transition-all hover:border-white/20 sm:p-4 ${style?.card}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        {/* API 응답 메세지 및 생성일 바인딩 */}
                        <p className="text-sm font-bold text-white">{log.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(log.createdAt).toLocaleString("ko-KR", { 
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
                          })}
                        </p>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-400">
                        {log.category}
                      </span>
                    </div>
                  </article>
                );
              })}
              
              {/* 무한 스크롤 트리거 요소 (여기에 도달하면 다음 커서 호출) */}
              <div ref={ref} className="flex h-10 items-center justify-center py-4">
                {isFetchingNextPage ? (
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                ) : hasNextPage ? (
                  <span className="text-xs text-slate-500">스크롤하여 더 보기</span>
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
"use client";

import React, { useMemo, useEffect } from "react";
import { Clock, CreditCard, User, RefreshCw, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { staffFetch } from "@/lib/staffFetch"; // JWT가 적용된 fetch 유틸리티

// API 응답에 맞춘 로그 아이템 타입 정의
interface ApiLogItem {
  logId: number;
  category: string;
  action: string;
  message: string;
  createdAt: string;
}

// API 응답 전체 구조 타입
interface LogApiResponse {
  success: boolean;
  data: {
    logs: ApiLogItem[];
    cursor: {
      nextCursor: number | null;
      hasNext: boolean;
    };
  };
  message: string | null;
}

type FilterType = "전체" | "호출" | "상태변경" | "로그인" | "로그아웃" | "입금확인" | "토큰수정" | "테이블초기화" | "품절처리" | "주문취소" | "메뉴변경";

// 실제 API를 호출할 Fetch 함수 (staffFetch 적용)
const fetchLogs = async (
  cursor: number | undefined,
  filter: FilterType
): Promise<LogApiResponse> => {
  const queryParams = new URLSearchParams();
  
  // cursor가 존재하면 파라미터에 추가 (첫 요청 시에는 undefined)
  if (cursor !== undefined) {
    queryParams.append("cursor", cursor.toString());
  }
  
  // 필터가 적용된 경우 type 파라미터 추가 (API 설계에 따라 생략/수정 가능)
  if (filter !== "전체") {
    queryParams.append("type", filter);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const res = await staffFetch(`/api/admin/logs${queryString}`);
  
  const result = await res.json();
  
  if (!result.success) {
    throw new Error(result.message || "네트워크 응답이 올바르지 않습니다.");
  }
  
  return result;
};

export default function StaffLogPage() {
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("전체");
  
  // 무한 스크롤 감지를 위한 옵저버 훅
  const { ref, inView } = useInView();

  const filters: FilterType[] = [
    "전체", "호출", "상태변경", "로그인", "로그아웃", "입금확인",
    "토큰수정", "테이블초기화", "품절처리", "주문취소", "메뉴변경",
  ];

  // TanStack Query: 커서 기반 무한 스크롤 적용
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
    status
  } = useInfiniteQuery({
    queryKey: ["adminLogs", activeFilter],
    // pageParam이 바로 cursor 값 역할을 합니다.
    queryFn: ({ pageParam }) => fetchLogs(pageParam as number | undefined, activeFilter),
    initialPageParam: undefined as number | undefined, // 첫 요청 시 cursor는 없음
    getNextPageParam: (lastPage) => {
      // API 응답의 hasNext가 true일 때만 nextCursor를 반환
      if (lastPage.data.cursor.hasNext) {
        return lastPage.data.cursor.nextCursor;
      }
      return undefined; // undefined를 반환하면 더 이상 데이터를 불러오지 않음
    },
  });

  // 스크롤이 맨 아래(ref)에 닿았고, 다음 페이지가 존재하며, 로딩 중이 아닐 때 다음 데이터 호출
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 각 페이지(pages) 안에 있는 logs 배열을 1차원 배열로 펼침(flatMap)
  const logs = useMemo(() => {
    return data?.pages.flatMap((page) => page.data.logs) || [];
  }, [data]);

  // UI용 임시 스타일 함수 (응답 action 기반으로 수정 필요)
  const getLogStyle = (action: string) => { return { card: "" }; };

  return (
    <div className="min-h-full bg-[#0f172a] px-3 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        
        {/* 필터 섹션 */}
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
                {filter}
              </option>
            ))}
          </select>
        </section>

        {/* 로그 목록 섹션 */}
        <section className="rounded-3xl border border-slate-800 bg-[#1e293b]/70 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white sm:text-xl flex items-center gap-2">
                {activeFilter === "전체" ? "전체 운영 기록" : `${activeFilter} 기록`}
                
                {/* 🔄 새로고침 버튼 (클릭 시 refetch 호출) */}
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                  title="새로고침"
                >
                  <RefreshCw size={16} className={isFetching ? "animate-spin text-orange-500" : ""} />
                </button>
              </h2>
              <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">
                최근 발생한 기록이 위에 표시됩니다.
              </p>
            </div>
          </div>

          {/* 로딩/결과 렌더링 */}
          {status === "pending" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5">
              <Loader2 className="animate-spin text-orange-500 mb-2" size={24} />
              <p className="text-sm font-black text-slate-400">데이터를 불러오는 중입니다...</p>
            </div>
          ) : status === "error" ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-900/50 bg-red-900/20 p-5">
              <p className="text-sm font-black text-red-400">데이터를 불러오는 중 오류가 발생했습니다.</p>
              <button onClick={() => refetch()} className="mt-3 text-xs text-red-300 underline">다시 시도</button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-5 text-center">
              <p className="text-sm font-black text-slate-400">표시할 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log) => {
                const style = getLogStyle(log.action);
                return (
                  // logId를 key로 사용
                  <article key={log.logId} className={`rounded-2xl border border-slate-700 bg-slate-800 p-3 transition-all hover:border-white/20 sm:p-4 ${style?.card}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-900 rounded-md">
                        {log.category} | {log.action}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium break-keep">
                      {log.message}
                    </p>
                  </article>
                );
              })}
              
              {/* 무한 스크롤 트리거 요소 */}
              <div ref={ref} className="h-10 flex items-center justify-center py-4">
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
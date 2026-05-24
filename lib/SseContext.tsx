"use client";

import { createContext, useCallback, useContext, useEffect, useRef, ReactNode } from "react";

type SseHandler = (data: any) => void;

interface SseContextValue {
  subscribe: (eventType: string, handler: SseHandler) => () => void;
}

const SseContext = createContext<SseContextValue>({ subscribe: () => () => {} });

export function SseProvider({ children }: { children: ReactNode }) {
  const subscribersRef = useRef<Map<string, Set<SseHandler>>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connectSse = (token: string) => {
      eventSourceRef.current?.close();
      const es = new EventSource(`/api/sse/connect?token=${token}`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const { type, ...data } = JSON.parse(event.data);
          subscribersRef.current.get(type)?.forEach((handler) => handler(data));
        } catch (e) {
          console.error("SSE 파싱 에러:", e);
        }
      };

      es.onerror = async () => {
        es.close();
        try {
          const refreshToken = localStorage.getItem("refreshToken") || "";
          const res = await fetch("/api/staff/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });
          const data = await res.json();
          if (data.success && data.data?.accessToken) {
            localStorage.setItem("accessToken", data.data.accessToken);
            if (data.data.refreshToken) {
              localStorage.setItem("refreshToken", data.data.refreshToken);
            }
            connectSse(data.data.accessToken);
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("staffId");
            localStorage.removeItem("currentStaffName");
            window.location.replace("/staff");
          }
        } catch {
          window.location.replace("/staff");
        }
      };
    };

    connectSse(localStorage.getItem("accessToken") || "");
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const subscribe = useCallback((eventType: string, handler: SseHandler) => {
    const subs = subscribersRef.current;
    if (!subs.has(eventType)) subs.set(eventType, new Set());
    subs.get(eventType)!.add(handler);
    return () => { subs.get(eventType)?.delete(handler); };
  }, []);

  return <SseContext.Provider value={{ subscribe }}>{children}</SseContext.Provider>;
}

export function useSseEvent(eventType: string, handler: SseHandler) {
  const { subscribe } = useContext(SseContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const stableHandler: SseHandler = (data) => handlerRef.current(data);
    return subscribe(eventType, stableHandler);
  }, [eventType, subscribe]);
}

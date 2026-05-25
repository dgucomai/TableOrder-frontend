export const formatClock = (iso?: string, fallback?: string) => {
  if (!iso) return fallback || "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback || "-";

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
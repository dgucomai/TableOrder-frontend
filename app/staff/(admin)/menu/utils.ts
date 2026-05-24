import { StaffOrderItem, MenuItem } from "./types";

export const parseOrderTime = (value?: string) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

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

export const getOrdersFromStorage = (): StaffOrderItem[] => {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(localStorage.getItem("staffOrders") || "[]");
    if (!Array.isArray(saved)) return [];

    return saved.map((order: any) => ({
      id: String(order.id),
      orderId: String(order.orderId || ""),
      tableId: Number(order.tableId),
      menuId: Number(order.menuId),
      menuName: String(order.menuName || order.name || ""),
      quantity: Number(order.quantity || 0),
      price: Number(order.price || 0),
      orderedAt: String(order.orderedAt || ""),
      time: String(order.time || ""),
      status: order.status === "제공 완료" ? "제공 완료" : "준비 중",
      completedBy: order.completedBy,
      completedAt: order.completedAt,
    }));
  } catch {
    return [];
  }
};

export const getOrdersByMenu = (orders: StaffOrderItem[], menu: MenuItem) => {
  return orders.filter(
    (order) => order.menuId === menu.menuId || order.menuName === menu.menuName
  );
};

export const getPreparingOrders = (orders: StaffOrderItem[], menu: MenuItem) => {
  return getOrdersByMenu(orders, menu)
    .filter((order) => order.status === "준비 중")
    .sort((a, b) => parseOrderTime(a.orderedAt) - parseOrderTime(b.orderedAt));
};

export const getCompletedOrders = (orders: StaffOrderItem[], menu: MenuItem) => {
  return getOrdersByMenu(orders, menu)
    .filter((order) => order.status === "제공 완료")
    .sort((a, b) => parseOrderTime(b.completedAt) - parseOrderTime(a.completedAt));
};

export const getPreparingQuantity = (orders: StaffOrderItem[], menu: MenuItem) => {
  return getPreparingOrders(orders, menu).reduce(
    (sum, order) => sum + order.quantity,
    0
  );
};
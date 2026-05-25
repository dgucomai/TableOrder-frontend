export interface MenuItem {
  menuId: number; // API의 menuItemId와 매핑
  menuName: string; // API의 name과 매핑
  countPreparing: number;
  countServed: number;
  subtotal: number;
  // UI 렌더링용 확장 속성 (API에서 내려오지 않을 경우 기본값 처리)
  categoryId?: number;
  categoryName?: string;
  price?: number;
  description?: string;
  imageUrl?: string | null;
  isSoldOut?: boolean;
}

export interface PreparingOrderItem {
  id: string | number;
  orderId: string;
  tableId: number;
  quantity: number;
  orderedAt: string;
  time?: string;
}
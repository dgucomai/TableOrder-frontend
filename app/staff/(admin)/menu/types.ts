export interface MenuItem {
  // 기본 메뉴 정보 (from /api/menus)
  menuId: number;
  categoryId: number;
  categoryName: string;
  menuName: string;
  price: number;
  description: string;
  imageUrl: string | null;
  isSoldOut: boolean;
  
  // 스태프용 현황 정보 (from /api/staff/menus)
  countPreparing: number;
  countServed: number;
  subtotal: number;
  totalItemCount: number;
}
  
export interface PreparingOrderItem {
  id: string | number;
  orderId: string;
  tableId: number;
  quantity: number;
  orderedAt: string;
  time?: string;
}
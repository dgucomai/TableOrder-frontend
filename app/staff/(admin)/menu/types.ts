export interface MenuItem {
    menuId: number;
    categoryId: number;
    categoryName: string;
    menuName: string;
    price: number;
    description: string;
    imageUrl: string | null;
    isSoldOut: boolean;
  }
  
  export interface StaffOrderItem {
    id: string;
    orderId: string;
    tableId: number;
    menuId: number;
    menuName: string;
    quantity: number;
    price: number;
    orderedAt: string;
    time: string;
    status: "준비 중" | "제공 완료";
    completedBy?: string;
    completedAt?: string;
  }
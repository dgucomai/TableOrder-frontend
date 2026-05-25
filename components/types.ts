export interface MenuItem {
    menuId: number;
    categoryId: number;
    categoryName: string;
    menuName: string;
    price: number;
    description: string;
    imageUrl360: string | null;
    imageUrl1024: string | null;
    soldOut: boolean;
  }
  
  export interface CartItem extends MenuItem {
    quantity: number;
  }
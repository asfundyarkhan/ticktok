export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category?: string;
  image: string;
  description?: string;
  sellerId: string;
  sellerName?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
  productCode?: string;
  listed?: boolean;
  isSale?: boolean;
  salePercentage?: number;
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  color?: string;
  savedForLater?: boolean;
  rating: number; // Make rating required for cart items
  productId: string; // Add productId for cart tracking
}

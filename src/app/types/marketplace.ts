// Define types for inventory and store products
export interface InventoryProduct {
  id: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sellerId: string;
  listed: boolean;
  category: string;
}

export interface StoreProduct {
  id: number;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sellerName: string;
  sellerId: string;
  rating: number;
  reviews: number;
  category?: string;
}

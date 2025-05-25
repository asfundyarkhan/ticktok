import { Timestamp, DocumentSnapshot } from 'firebase/firestore';

export interface Product {
  id?: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StockItem {
  id?: string;
  productId: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  category?: string;
  sellerId?: string;
  sellerName?: string;
  listed: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  quantity: number;
  totalCost: number;
}

export interface PaginatedProducts {
  products: Product[];
  lastDoc: DocumentSnapshot | null;
}

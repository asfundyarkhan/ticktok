import { Timestamp } from 'firebase/firestore';

export interface StockItem {
  id?: string;
  productId: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  category: string;
  listed: boolean;
  sellerId?: string;
  sellerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  quantity: number;
  totalCost: number;
}

export interface StockListing {
  id: string;
  sellerId: string;
  productId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  quantity: number;
  price: number;
  rating?: number;
  reviews?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransaction {
  id: string;
  sellerId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  type: 'purchase' | 'sale';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

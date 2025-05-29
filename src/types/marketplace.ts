import { Timestamp } from "firebase/firestore";

export interface StockItem {
  id?: string;
  productId: string;
  productCode: string;
  name: string;
  description: string;
  features?: string; // Product features (optional)
  price: number;
  stock: number;
  images: string[]; // Now an array of image URLs
  mainImage: string; // Main display image
  category: string;
  listed: boolean;
  sellerId?: string;
  sellerName?: string;
  rating: number; // Rating out of 5
  reviews: Array<{
    id?: string | number;
    author?: string;
    userName?: string;
    rating: number;
    date?: string;
    timestamp?: number;
    content?: string;
    text?: string;
    comment?: string;
    verified?: boolean;
  }>; // Array of review objects
  reviewCount?: number; // Total number of reviews
  isSale: boolean; // Whether the item is on sale
  salePercentage: number; // Sale discount percentage
  salePrice?: number; // Calculated sale price
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
  image: string; // Legacy field for backward compatibility
  images?: string[]; // Array of image URLs
  mainImage?: string; // Main display image
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
  type: "purchase" | "sale";
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

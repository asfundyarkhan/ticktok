export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
}

export interface PendingProfit {
  id: string;
  sellerId: string;
  productId: string;
  productName: string;
  productImage?: string; // Add product image field
  saleAmount: number;
  profitAmount: number;
  baseCost: number;
  depositRequired: number;
  status: "pending" | "deposit_made" | "withdrawn";
  saleDate: Date;
  createdAt: Date;
  updatedAt: Date;
  quantitySold?: number; // Add quantity information
}

export interface SellerDeposit {
  id: string;
  sellerId: string;
  pendingProfitId: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  transactionId?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amount: number;
  pendingProfitIds: string[];
  status: "pending" | "approved" | "completed" | "rejected";
  createdAt: Date;
  processedAt?: Date;
  notes?: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  profitAmount: number;
  baseCost: number;
  status: "completed" | "processing" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

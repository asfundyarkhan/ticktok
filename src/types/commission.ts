import { Timestamp } from "firebase/firestore";

export interface CommissionBalance {
  id: string;
  adminId: string;
  adminEmail?: string;
  adminName?: string;
  totalCommissionBalance: number; // Only from deposits, not sales
  lastUpdated: Timestamp;
  createdAt: Timestamp;
}

export interface CommissionTransaction {
  id: string;
  adminId: string; // The admin who gets the commission
  sellerId: string; // The seller whose deposit triggered the commission
  sellerEmail?: string;
  sellerName?: string;
  type: "superadmin_deposit" | "receipt_approval"; // Only these two types
  originalAmount: number; // The amount deposited to the seller
  commissionAmount: number; // The commission earned by the admin
  depositedBy?: string; // SuperAdmin ID if it's a manual deposit
  receiptId?: string; // Receipt ID if it's from receipt approval
  description: string;
  status: "completed";
  createdAt: Timestamp;
}

export interface CommissionSummary {
  totalCommissionBalance: number;
  totalFromSuperadminDeposits: number;
  totalFromReceiptApprovals: number;
  transactionCount: number;
  lastTransaction?: Date;
}

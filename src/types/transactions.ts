import { Timestamp } from "firebase/firestore";

export interface CreditTransaction {
  id: string;
  userId: string;
  referrerId?: string; // Admin/referrer that gets the commission
  amount: number;
  commission: number;
  type: "top_up";
  status: "completed" | "pending" | "failed";
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

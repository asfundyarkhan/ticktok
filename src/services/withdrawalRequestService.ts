import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  Transaction,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { TransactionHelperService } from "./transactionHelperService";

export interface WithdrawalRequest {
  id?: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  usdtId?: string; // USDT wallet address/ID for withdrawal
  status: "pending" | "approved" | "rejected";
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string; // Admin ID who processed the request
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalRequestResult {
  success: boolean;
  message: string;
  withdrawalId?: string;
}

export class WithdrawalRequestService {
  private static COLLECTION = "withdrawal_requests";

  /**
   * Create a new withdrawal request
   */
  static async createWithdrawalRequest(
    sellerId: string,
    sellerName: string,
    sellerEmail: string,
    amount: number,
    usdtId?: string
  ): Promise<WithdrawalRequestResult> {
    try {
      // Validate amount
      if (amount <= 0) {
        return {
          success: false,
          message: "Withdrawal amount must be greater than 0",
        };
      }

      // Check seller's available balance
      const userDoc = await import("firebase/firestore").then(
        ({ doc, getDoc }) => getDoc(doc(firestore, "users", sellerId))
      );

      if (!userDoc.exists()) {
        return {
          success: false,
          message: "Seller not found",
        };
      }

      const userData = userDoc.data();
      const availableBalance = userData.balance || 0;

      if (amount > availableBalance) {
        return {
          success: false,
          message: `Insufficient balance. Available: $${availableBalance.toFixed(
            2
          )}`,
        };
      }

      // Check for pending withdrawal requests
      const pendingQuery = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("status", "==", "pending")
      );

      const pendingSnapshot = await getDocs(pendingQuery);
      if (!pendingSnapshot.empty) {
        return {
          success: false,
          message: "You already have a pending withdrawal request",
        };
      }

      // Create withdrawal request
      const withdrawalRequest: Omit<WithdrawalRequest, "id"> = {
        sellerId,
        sellerName,
        sellerEmail,
        amount,
        usdtId,
        status: "pending",
        requestDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(firestore, this.COLLECTION), {
        ...withdrawalRequest,
        requestDate: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Withdrawal request submitted successfully",
        withdrawalId: docRef.id,
      };
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      return {
        success: false,
        message: "Failed to create withdrawal request",
      };
    }
  }

  /**
   * Get withdrawal requests for a specific seller
   */
  static async getSellerWithdrawalRequests(
    sellerId: string
  ): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        processedDate: doc.data().processedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as WithdrawalRequest[];
    } catch (error) {
      console.error("Error getting seller withdrawal requests:", error);
      return [];
    }
  }

  /**
   * Get all withdrawal requests for admin
   */
  static async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        processedDate: doc.data().processedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as WithdrawalRequest[];
    } catch (error) {
      console.error("Error getting all withdrawal requests:", error);
      return [];
    }
  }

  /**
   * Subscribe to withdrawal requests (for real-time updates)
   */
  static subscribeToWithdrawalRequests(
    callback: (requests: WithdrawalRequest[]) => void,
    sellerId?: string
  ): () => void {
    const q = sellerId
      ? query(
          collection(firestore, this.COLLECTION),
          where("sellerId", "==", sellerId),
          orderBy("createdAt", "desc")
        )
      : query(
          collection(firestore, this.COLLECTION),
          orderBy("createdAt", "desc")
        );

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        processedDate: doc.data().processedDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as WithdrawalRequest[];

      callback(requests);
    });
  }

  /**
   * Process withdrawal request (approve/reject)
   */
  static async processWithdrawalRequest(
    withdrawalId: string,
    adminId: string,
    action: "approve" | "reject",
    adminNotes?: string
  ): Promise<WithdrawalRequestResult> {
    try {
      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
          // Get withdrawal request
          const withdrawalRef = doc(firestore, this.COLLECTION, withdrawalId);
          const withdrawalDoc = await transaction.get(withdrawalRef);

          if (!withdrawalDoc.exists()) {
            throw new Error("Withdrawal request not found");
          }

          const withdrawalData = withdrawalDoc.data() as WithdrawalRequest;

          if (withdrawalData.status !== "pending") {
            throw new Error("Withdrawal request already processed");
          }

          if (action === "approve") {
            // Get seller's current balance
            const userRef = doc(firestore, "users", withdrawalData.sellerId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
              throw new Error("Seller not found");
            }

            const userData = userDoc.data();
            const currentBalance = userData.balance || 0;

            if (currentBalance < withdrawalData.amount) {
              throw new Error("Insufficient seller balance");
            }

            // Deduct amount from seller's balance
            transaction.update(userRef, {
              balance: currentBalance - withdrawalData.amount,
              updatedAt: Timestamp.now(),
            });

            // Create transaction record
            const transactionRef = doc(collection(firestore, "transactions"));
            transaction.set(transactionRef, {
              type: "withdrawal",
              userId: withdrawalData.sellerId,
              amount: withdrawalData.amount,
              description: `Withdrawal approved by admin`,
              withdrawalRequestId: withdrawalId,
              processedBy: adminId,
              createdAt: Timestamp.now(),
            });
          }

          // Update withdrawal request status
          transaction.update(withdrawalRef, {
            status: action === "approve" ? "approved" : "rejected",
            processedDate: Timestamp.now(),
            processedBy: adminId,
            adminNotes: adminNotes || "",
            updatedAt: Timestamp.now(),
          });

          return {
            success: true,
            message: `Withdrawal request ${action}d successfully`,
          };
        },
        { maxRetries: 5, baseDelayMs: 200 } // More aggressive retry for financial operations
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        return {
          success: false,
          message: result.error || `Failed to ${action} withdrawal request`,
        };
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal request:`, error);
      return {
        success: false,
        message: `Failed to ${action} withdrawal request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Get withdrawal statistics
   */
  static async getWithdrawalStats(): Promise<{
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    pendingAmount: number;
    approvedAmount: number;
  }> {
    try {
      const snapshot = await getDocs(collection(firestore, this.COLLECTION));

      let totalPending = 0;
      let totalApproved = 0;
      let totalRejected = 0;
      let pendingAmount = 0;
      let approvedAmount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        switch (data.status) {
          case "pending":
            totalPending++;
            pendingAmount += data.amount || 0;
            break;
          case "approved":
            totalApproved++;
            approvedAmount += data.amount || 0;
            break;
          case "rejected":
            totalRejected++;
            break;
        }
      });

      return {
        totalPending,
        totalApproved,
        totalRejected,
        pendingAmount,
        approvedAmount,
      };
    } catch (error) {
      console.error("Error getting withdrawal stats:", error);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        pendingAmount: 0,
        approvedAmount: 0,
      };
    }
  }
}

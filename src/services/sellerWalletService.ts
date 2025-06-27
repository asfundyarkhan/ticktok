import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import {
  WalletBalance,
  PendingProfit,
  SellerDeposit,
  WithdrawalRequest,
  Sale,
} from "../types/wallet";

export class SellerWalletService {
  // Get seller's wallet balance
  static async getWalletBalance(sellerId: string): Promise<WalletBalance> {
    try {
      const pendingProfitsRef = collection(firestore, "pending_profits");
      const q = query(
        pendingProfitsRef,
        where("sellerId", "==", sellerId),
        where("status", "==", "pending")
      );

      const snapshot = await getDocs(q);
      const pending = snapshot.docs.reduce((total, doc) => {
        return total + doc.data().profitAmount;
      }, 0);

      // Get available balance (deposits made but not yet withdrawn)
      const availableQuery = query(
        pendingProfitsRef,
        where("sellerId", "==", sellerId),
        where("status", "==", "deposit_made")
      );

      const availableSnapshot = await getDocs(availableQuery);
      const available = availableSnapshot.docs.reduce((total, doc) => {
        return total + doc.data().profitAmount;
      }, 0);

      return {
        available,
        pending,
        total: available + pending,
      };
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return { available: 0, pending: 0, total: 0 };
    }
  }

  // Subscribe to wallet balance changes
  static subscribeToWalletBalance(
    sellerId: string,
    callback: (balance: WalletBalance) => void
  ): () => void {
    const pendingProfitsRef = collection(firestore, "pending_profits");
    const q = query(pendingProfitsRef, where("sellerId", "==", sellerId));

    return onSnapshot(q, async (snapshot: QuerySnapshot<DocumentData>) => {
      let pending = 0;
      let available = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status === "pending") {
          pending += data.profitAmount;
        } else if (data.status === "deposit_made") {
          available += data.profitAmount;
        }
      });

      callback({
        available,
        pending,
        total: available + pending,
      });
    });
  }

  // Record a sale and create pending profit
  static async recordSale(
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      return await runTransaction(firestore, async (transaction) => {
        // Create sale record
        const saleRef = doc(collection(firestore, "sales"));
        const saleData: Sale = {
          ...sale,
          id: saleRef.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        transaction.set(saleRef, {
          ...saleData,
          createdAt: Timestamp.fromDate(saleData.createdAt),
          updatedAt: Timestamp.fromDate(saleData.updatedAt),
        });

        // Create pending profit
        const pendingProfitRef = doc(collection(firestore, "pending_profits"));
        const pendingProfit: PendingProfit = {
          id: pendingProfitRef.id,
          sellerId: sale.sellerId,
          productId: sale.productId,
          productName: sale.productName,
          saleAmount: sale.totalAmount,
          profitAmount: sale.profitAmount,
          baseCost: sale.baseCost,
          depositRequired: sale.baseCost, // Seller must deposit the base cost
          status: "pending",
          saleDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transaction.set(pendingProfitRef, {
          ...pendingProfit,
          saleDate: Timestamp.fromDate(pendingProfit.saleDate),
          createdAt: Timestamp.fromDate(pendingProfit.createdAt),
          updatedAt: Timestamp.fromDate(pendingProfit.updatedAt),
        });

        return saleRef.id;
      });
    } catch (error) {
      console.error("Error recording sale:", error);
      throw error;
    }
  }

  // Get pending profits for a seller
  static async getPendingProfits(sellerId: string): Promise<PendingProfit[]> {
    try {
      const q = query(
        collection(firestore, "pending_profits"),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          saleDate: data.saleDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as PendingProfit;
      });
    } catch (error) {
      console.error("Error getting pending profits:", error);
      return [];
    }
  }

  // Submit deposit for pending profit
  static async submitDeposit(
    sellerId: string,
    pendingProfitId: string,
    amount: number
  ): Promise<string> {
    try {
      return await runTransaction(firestore, async (transaction) => {
        // Verify the pending profit exists and belongs to the seller
        const pendingProfitRef = doc(
          firestore,
          "pending_profits",
          pendingProfitId
        );
        const pendingProfitDoc = await transaction.get(pendingProfitRef);

        if (!pendingProfitDoc.exists()) {
          throw new Error("Pending profit not found");
        }

        const pendingProfitData = pendingProfitDoc.data();
        if (pendingProfitData.sellerId !== sellerId) {
          throw new Error("Unauthorized access to pending profit");
        }

        if (pendingProfitData.status !== "pending") {
          throw new Error("Pending profit is not in pending status");
        }

        if (amount < pendingProfitData.depositRequired) {
          throw new Error(
            `Insufficient deposit amount. Required: $${pendingProfitData.depositRequired}`
          );
        }

        // Create deposit record
        const depositRef = doc(collection(firestore, "seller_deposits"));
        const deposit: SellerDeposit = {
          id: depositRef.id,
          sellerId,
          pendingProfitId,
          amount,
          status: "confirmed", // In a real app, this would start as 'pending'
          createdAt: new Date(),
          confirmedAt: new Date(),
        };

        transaction.set(depositRef, {
          ...deposit,
          createdAt: Timestamp.fromDate(deposit.createdAt),
          confirmedAt: Timestamp.fromDate(deposit.confirmedAt!),
        });

        // Update pending profit status
        transaction.update(pendingProfitRef, {
          status: "deposit_made",
          updatedAt: Timestamp.fromDate(new Date()),
        });

        return depositRef.id;
      });
    } catch (error) {
      console.error("Error submitting deposit:", error);
      throw error;
    }
  }

  // Request withdrawal
  static async requestWithdrawal(
    sellerId: string,
    amount: number
  ): Promise<string> {
    try {
      return await runTransaction(firestore, async (transaction) => {
        // Get available profits that can be withdrawn
        const availableProfitsQuery = query(
          collection(firestore, "pending_profits"),
          where("sellerId", "==", sellerId),
          where("status", "==", "deposit_made")
        );

        const availableSnapshot = await getDocs(availableProfitsQuery);
        const availableProfits = availableSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as PendingProfit & { id: string })
        );

        const totalAvailable = availableProfits.reduce(
          (total, profit) => total + profit.profitAmount,
          0
        );

        if (amount > totalAvailable) {
          throw new Error(
            `Insufficient available balance. Available: $${totalAvailable}`
          );
        }

        // Create withdrawal request
        const withdrawalRef = doc(collection(firestore, "withdrawal_requests"));
        const withdrawal: WithdrawalRequest = {
          id: withdrawalRef.id,
          sellerId,
          amount,
          pendingProfitIds: availableProfits.map((p) => p.id),
          status: "approved", // In a real app, this would need admin approval
          createdAt: new Date(),
          processedAt: new Date(),
        };

        transaction.set(withdrawalRef, {
          ...withdrawal,
          createdAt: Timestamp.fromDate(withdrawal.createdAt),
          processedAt: Timestamp.fromDate(withdrawal.processedAt!),
        });

        // Update pending profits to withdrawn status
        let remainingAmount = amount;
        for (const profit of availableProfits) {
          if (remainingAmount <= 0) break;

          const profitRef = doc(firestore, "pending_profits", profit.id);
          transaction.update(profitRef, {
            status: "withdrawn",
            updatedAt: Timestamp.fromDate(new Date()),
          });

          remainingAmount -= profit.profitAmount;
        }

        return withdrawalRef.id;
      });
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      throw error;
    }
  }

  // Get seller's sales history
  static async getSalesHistory(sellerId: string): Promise<Sale[]> {
    try {
      const q = query(
        collection(firestore, "sales"),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Sale;
      });
    } catch (error) {
      console.error("Error getting sales history:", error);
      return [];
    }
  }

  // Get seller's deposits
  static async getDeposits(sellerId: string): Promise<SellerDeposit[]> {
    try {
      const q = query(
        collection(firestore, "seller_deposits"),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          confirmedAt: data.confirmedAt?.toDate(),
        } as SellerDeposit;
      });
    } catch (error) {
      console.error("Error getting deposits:", error);
      return [];
    }
  }

  // Get seller's withdrawal requests
  static async getWithdrawalRequests(
    sellerId: string
  ): Promise<WithdrawalRequest[]> {
    try {
      const q = query(
        collection(firestore, "withdrawal_requests"),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          processedAt: data.processedAt?.toDate(),
        } as WithdrawalRequest;
      });
    } catch (error) {
      console.error("Error getting withdrawal requests:", error);
      return [];
    }
  }
}

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  limit,
  Transaction,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { TransactionHelperService } from "./transactionHelperService";
import {
  CommissionBalance,
  CommissionTransaction,
  CommissionSummary,
} from "../types/commission";
import { UserService } from "./userService";

export class CommissionService {
  private static readonly COMMISSION_BALANCES_COLLECTION =
    "commission_balances";
  private static readonly COMMISSION_TRANSACTIONS_COLLECTION =
    "commission_transactions";
  private static readonly COMMISSION_RATE = 1.0; // 100% commission for admins

  /**
   * Record a commission transaction when a superadmin deposits funds to a seller
   * This is the only way commission should be earned - through deposits, not sales
   */
  static async recordSuperadminDeposit(
    adminId: string,
    sellerId: string,
    depositAmount: number,
    depositedBy: string,
    description: string = "Superadmin deposit commission"
  ): Promise<{ success: boolean; message: string; commissionAmount?: number }> {
    try {
      const commissionAmount = depositAmount * this.COMMISSION_RATE;

      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
          // ALL READS FIRST - Firestore requirement
          const adminRef = doc(firestore, "users", adminId);
          const sellerRef = doc(firestore, "users", sellerId);
          const balanceRef = doc(
            firestore,
            this.COMMISSION_BALANCES_COLLECTION,
            adminId
          );

          const [adminSnap, sellerSnap, balanceSnap] = await Promise.all([
            transaction.get(adminRef),
            transaction.get(sellerRef),
            transaction.get(balanceRef),
          ]);

          if (!adminSnap.exists() || !sellerSnap.exists()) {
            throw new Error("Admin or seller not found");
          }

          const adminData = adminSnap.data();
          const sellerData = sellerSnap.data();

          // ALL WRITES AFTER ALL READS

          // 1. Create commission transaction record
          const commissionTransactionRef = doc(
            collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION)
          );
          const commissionTransaction: Omit<CommissionTransaction, "id"> = {
            adminId,
            sellerId,
            sellerEmail: sellerData.email,
            sellerName: sellerData.displayName || sellerData.email,
            type: "superadmin_deposit",
            originalAmount: depositAmount,
            commissionAmount,
            depositedBy,
            description,
            status: "completed",
            createdAt: Timestamp.now(),
          };

          transaction.set(commissionTransactionRef, commissionTransaction);

          // 2. Update admin's commission balance
          if (balanceSnap.exists()) {
            const currentBalance =
              balanceSnap.data().totalCommissionBalance || 0;
            transaction.update(balanceRef, {
              totalCommissionBalance: currentBalance + commissionAmount,
              lastUpdated: Timestamp.now(),
            });
          } else {
            // First-time commission balance creation
            transaction.set(balanceRef, {
              adminId,
              adminEmail: adminData.email,
              adminName: adminData.displayName || adminData.email,
              totalCommissionBalance: commissionAmount,
              lastUpdated: Timestamp.now(),
              createdAt: Timestamp.now(),
            });
          }

          return {
            success: true,
            message: `Commission of $${commissionAmount.toFixed(
              2
            )} recorded for admin`,
            commissionAmount,
          };
        },
        { maxRetries: 3, baseDelayMs: 100 }
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        return {
          success: false,
          message: result.error || "Failed to record commission",
        };
      }
    } catch (error) {
      console.error("Error recording superadmin deposit commission:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to record commission",
      };
    }
  }

  /**
   * Record a commission transaction when a receipt is approved
   * Only receipt approvals generate commissions, not product sales
   */
  static async recordReceiptApprovalCommission(
    adminId: string,
    sellerId: string,
    receiptAmount: number,
    receiptId: string,
    description: string = "Receipt approval commission"
  ): Promise<{ success: boolean; message: string; commissionAmount?: number }> {
    try {
      const commissionAmount = receiptAmount * this.COMMISSION_RATE;

      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
          // ALL READS FIRST - Firestore requirement
          const adminRef = doc(firestore, "users", adminId);
          const sellerRef = doc(firestore, "users", sellerId);
          const balanceRef = doc(
            firestore,
            this.COMMISSION_BALANCES_COLLECTION,
            adminId
          );

          const [adminSnap, sellerSnap, balanceSnap] = await Promise.all([
            transaction.get(adminRef),
            transaction.get(sellerRef),
            transaction.get(balanceRef),
          ]);

          if (!adminSnap.exists() || !sellerSnap.exists()) {
            throw new Error("Admin or seller not found");
          }

          const adminData = adminSnap.data();
          const sellerData = sellerSnap.data();

          // ALL WRITES AFTER ALL READS

          // 1. Create commission transaction record
          const commissionTransactionRef = doc(
            collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION)
          );
          const commissionTransaction: Omit<CommissionTransaction, "id"> = {
            adminId,
            sellerId,
            sellerEmail: sellerData.email,
            sellerName: sellerData.displayName || sellerData.email,
            type: "receipt_approval",
            originalAmount: receiptAmount,
            commissionAmount,
            receiptId,
            description,
            status: "completed",
            createdAt: Timestamp.now(),
          };

          transaction.set(commissionTransactionRef, commissionTransaction);

          // 2. Update admin's commission balance
          if (balanceSnap.exists()) {
            const currentBalance =
              balanceSnap.data().totalCommissionBalance || 0;
            transaction.update(balanceRef, {
              totalCommissionBalance: currentBalance + commissionAmount,
              lastUpdated: Timestamp.now(),
            });
          } else {
            // First-time commission balance creation
            transaction.set(balanceRef, {
              adminId,
              adminEmail: adminData.email,
              adminName: adminData.displayName || adminData.email,
              totalCommissionBalance: commissionAmount,
              lastUpdated: Timestamp.now(),
              createdAt: Timestamp.now(),
            });
          }

          return {
            success: true,
            message: `Commission of $${commissionAmount.toFixed(
              2
            )} recorded for admin`,
            commissionAmount,
          };
        },
        { maxRetries: 3, baseDelayMs: 100 }
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        return {
          success: false,
          message: result.error || "Failed to record commission",
        };
      }
    } catch (error) {
      console.error("Error recording receipt approval commission:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to record commission",
      };
    }
  }

  /**
   * Update an admin's commission balance (internal helper)
   */ private static async updateAdminCommissionBalance(
    adminId: string,
    commissionAmount: number,
    transaction?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<void> {
    const balanceRef = doc(
      firestore,
      this.COMMISSION_BALANCES_COLLECTION,
      adminId
    );

    if (transaction) {
      // We're in a transaction
      const balanceSnap = await transaction.get(balanceRef);

      if (balanceSnap.exists()) {
        const currentBalance = balanceSnap.data().totalCommissionBalance || 0;
        transaction.update(balanceRef, {
          totalCommissionBalance: currentBalance + commissionAmount,
          lastUpdated: Timestamp.now(),
        });
      } else {
        // Get admin info for first-time creation
        const adminRef = doc(firestore, "users", adminId);
        const adminSnap = await transaction.get(adminRef);
        const adminData = adminSnap.exists() ? adminSnap.data() : {};

        transaction.set(balanceRef, {
          adminId,
          adminEmail: adminData.email,
          adminName: adminData.displayName || adminData.email,
          totalCommissionBalance: commissionAmount,
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now(),
        });
      }
    } else {
      // Not in a transaction, use regular update
      const balanceSnap = await getDoc(balanceRef);

      if (balanceSnap.exists()) {
        const currentBalance = balanceSnap.data().totalCommissionBalance || 0;
        await updateDoc(balanceRef, {
          totalCommissionBalance: currentBalance + commissionAmount,
          lastUpdated: Timestamp.now(),
        });
      } else {
        // Get admin info for first-time creation
        const adminData = await UserService.getUserById(adminId);

        await updateDoc(balanceRef, {
          adminId,
          adminEmail: adminData?.email,
          adminName: adminData?.displayName || adminData?.email,
          totalCommissionBalance: commissionAmount,
          lastUpdated: Timestamp.now(),
          createdAt: Timestamp.now(),
        });
      }
    }
  }

  /**
   * Get commission balance for a specific admin
   */
  static async getAdminCommissionBalance(adminId: string): Promise<number> {
    try {
      const balanceRef = doc(
        firestore,
        this.COMMISSION_BALANCES_COLLECTION,
        adminId
      );
      const balanceSnap = await getDoc(balanceRef);

      if (balanceSnap.exists()) {
        return balanceSnap.data().totalCommissionBalance || 0;
      }

      return 0;
    } catch (error) {
      console.error("Error getting admin commission balance:", error);
      return 0;
    }
  }

  /**
   * Get commission summary for a specific admin
   */
  static async getAdminCommissionSummary(
    adminId: string
  ): Promise<CommissionSummary> {
    try {
      const transactionsQuery = query(
        collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION),
        where("adminId", "==", adminId),
        orderBy("createdAt", "desc")
      );

      const transactionsSnap = await getDocs(transactionsQuery);

      let totalFromSuperadminDeposits = 0;
      let totalFromReceiptApprovals = 0;
      let lastTransaction: Date | undefined;

      transactionsSnap.forEach((doc) => {
        const data = doc.data() as CommissionTransaction;

        if (data.type === "superadmin_deposit") {
          totalFromSuperadminDeposits += data.commissionAmount;
        } else if (data.type === "receipt_approval") {
          totalFromReceiptApprovals += data.commissionAmount;
        }

        if (!lastTransaction || data.createdAt.toDate() > lastTransaction) {
          lastTransaction = data.createdAt.toDate();
        }
      });

      const totalCommissionBalance =
        totalFromSuperadminDeposits + totalFromReceiptApprovals;

      return {
        totalCommissionBalance,
        totalFromSuperadminDeposits,
        totalFromReceiptApprovals,
        transactionCount: transactionsSnap.size,
        lastTransaction,
      };
    } catch (error) {
      console.error("Error getting admin commission summary:", error);
      return {
        totalCommissionBalance: 0,
        totalFromSuperadminDeposits: 0,
        totalFromReceiptApprovals: 0,
        transactionCount: 0,
      };
    }
  }

  /**
   * Get all commission transactions for an admin
   */
  static async getAdminCommissionTransactions(
    adminId: string,
    limitCount: number = 50
  ): Promise<CommissionTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION),
        where("adminId", "==", adminId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const transactionsSnap = await getDocs(transactionsQuery);
      const transactions: CommissionTransaction[] = [];

      transactionsSnap.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        } as CommissionTransaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error getting admin commission transactions:", error);
      return [];
    }
  }

  /**
   * Get total commission balance across all admins (for superadmins)
   */
  static async getTotalCommissionBalance(): Promise<{
    totalBalance: number;
    adminsCount: number;
    totalFromSuperadminDeposits: number;
    totalFromReceiptApprovals: number;
  }> {
    try {
      const balancesQuery = query(
        collection(firestore, this.COMMISSION_BALANCES_COLLECTION)
      );
      const balancesSnap = await getDocs(balancesQuery);

      let totalBalance = 0;
      const adminsCount = balancesSnap.size;

      balancesSnap.forEach((doc) => {
        const data = doc.data() as CommissionBalance;
        totalBalance += data.totalCommissionBalance || 0;
      });

      // Get breakdown by transaction type
      const transactionsQuery = query(
        collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION)
      );
      const transactionsSnap = await getDocs(transactionsQuery);

      let totalFromSuperadminDeposits = 0;
      let totalFromReceiptApprovals = 0;

      transactionsSnap.forEach((doc) => {
        const data = doc.data() as CommissionTransaction;

        if (data.type === "superadmin_deposit") {
          totalFromSuperadminDeposits += data.commissionAmount;
        } else if (data.type === "receipt_approval") {
          totalFromReceiptApprovals += data.commissionAmount;
        }
      });

      return {
        totalBalance,
        adminsCount,
        totalFromSuperadminDeposits,
        totalFromReceiptApprovals,
      };
    } catch (error) {
      console.error("Error getting total commission balance:", error);
      return {
        totalBalance: 0,
        adminsCount: 0,
        totalFromSuperadminDeposits: 0,
        totalFromReceiptApprovals: 0,
      };
    }
  }

  /**
   * Subscribe to commission balance changes for an admin (real-time)
   */
  static subscribeToAdminCommissionBalance(
    adminId: string,
    callback: (balance: number) => void
  ): () => void {
    const balanceRef = doc(
      firestore,
      this.COMMISSION_BALANCES_COLLECTION,
      adminId
    );

    return onSnapshot(balanceRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CommissionBalance;
        callback(data.totalCommissionBalance || 0);
      } else {
        callback(0);
      }
    });
  }

  /**
   * Subscribe to commission transactions for an admin (real-time)
   */
  static subscribeToAdminCommissionTransactions(
    adminId: string,
    callback: (transactions: CommissionTransaction[]) => void,
    limitCount: number = 20
  ): () => void {
    const transactionsQuery = query(
      collection(firestore, this.COMMISSION_TRANSACTIONS_COLLECTION),
      where("adminId", "==", adminId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    return onSnapshot(transactionsQuery, (snapshot) => {
      const transactions: CommissionTransaction[] = [];

      snapshot.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
        } as CommissionTransaction);
      });

      callback(transactions);
    });
  }
}

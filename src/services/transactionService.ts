import {
  collection,
  doc,
  Timestamp,
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { CreditTransaction } from "../types/transactions";
import { UserService } from "./userService";

export class TransactionService {
  private static readonly COLLECTION = "credit_transactions";
  private static readonly COMMISSION_RATE = 1.0; // 100% commission for referrers

  /**
   * Get all transactions for a user (either as recipient or commission earner)
   */
  static async getUserTransactions(
    userId: string,
    asReferrer: boolean = false
  ): Promise<CreditTransaction[]> {
    try {
      const transactionsQuery = query(
        collection(firestore, this.COLLECTION),
        asReferrer
          ? where("referrerId", "==", userId)
          : where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(transactionsQuery);
      const transactions: CreditTransaction[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
        } as CreditTransaction);
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw error;
    }
  }

  /**
   * Process a top-up transaction with automatic commission calculation
   */

  static async processTopUp(
    userId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Start a Firestore transaction
      return await runTransaction(firestore, async (transaction) => {
        // Get the user document to check referrer
        const userRef = doc(firestore, "users", userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          return { success: false, message: "User not found" };
        }        const userData = userSnap.data();
        const referrerId = userData.referredBy;

        // Calculate commission if there's a referrer
        const commission = referrerId ? amount * this.COMMISSION_RATE : 0;
        const userAmount = amount;

        console.log("🏪 Processing top-up:");
        console.log("   User ID:", userId);
        console.log("   Amount:", amount);
        console.log("   Referrer ID:", referrerId);
        console.log("   Commission rate:", this.COMMISSION_RATE);
        console.log("   Commission amount:", commission);

        // Create the credit transaction
        const creditTransactionRef = doc(
          collection(firestore, this.COLLECTION)
        );// Build the credit transaction object with conditional referrerId
        // to avoid "undefined" values in Firestore
        const creditTransaction: Omit<CreditTransaction, "id"> = {
          userId,
          amount: userAmount,
          commission,
          type: "top_up",
          status: "completed",
          description,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Only add referrerId if it's actually defined
        if (referrerId) {
          creditTransaction.referrerId = referrerId;
        }

        // Create transaction record
        transaction.set(creditTransactionRef, creditTransaction);        // Update user's balance
        transaction.update(userRef, {
          balance: (userData.balance || 0) + userAmount,
          updatedAt: Timestamp.now(),
        });

        // If there's a referrer, update their balance with the commission
        if (referrerId && commission > 0) {
          const referrerRef = doc(firestore, "users", referrerId);
          const referrerSnap = await transaction.get(referrerRef);

          if (referrerSnap.exists()) {
            const referrerData = referrerSnap.data();
            transaction.update(referrerRef, {
              balance: (referrerData.balance || 0) + commission,
              updatedAt: Timestamp.now(),
            });
          }
        }        return {
          success: true,
          message: `Successfully processed top-up of $${amount}${
            commission > 0
              ? `. Commission of $${commission} paid to referrer`
              : ""
          }`,
        };
      });
    } catch (error) {
      console.error("Error processing top-up:", error);
      return {
        success: false,
        message: "Failed to process top-up. Please try again.",
      };
    } finally {      // Update peak referral balances after successful transaction
      try {
        const userRef = doc(firestore, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const referrerId = userData.referredBy;
          
          if (referrerId) {
            // Update peak balance for the referrer
            await UserService.updatePeakReferralBalance(referrerId);
          }
        }
      } catch (peakUpdateError) {
        console.error("Error updating peak referral balance:", peakUpdateError);
        // Don't fail the main transaction for this
      }
    }
  }
}

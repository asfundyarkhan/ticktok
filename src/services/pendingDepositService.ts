import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
  Transaction,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";

export interface PendingDeposit {
  id?: string;
  sellerId: string;
  productId: string;
  productName: string;
  listingId: string;
  quantityListed: number;
  originalCostPerUnit: number;
  totalDepositRequired: number;
  listingPrice: number;
  profitPerUnit: number;
  status: "pending" | "sold" | "deposit_paid" | "completed";
  salePrice?: number;
  saleDate?: Date;
  depositPaidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerWalletSummary {
  availableBalance: number;
  totalPendingDeposits: number;
  withdrawableAmount: number;
  totalProfit: number;
}

export class PendingDepositService {
  private static readonly COLLECTION = "pending_deposits";

  /**
   * Create a pending deposit entry when seller lists a product without payment
   */
  static async createPendingDeposit(
    sellerId: string,
    productId: string,
    productName: string,
    listingId: string,
    quantityListed: number,
    originalCostPerUnit: number,
    listingPrice: number
  ): Promise<{ success: boolean; message: string; depositId?: string }> {
    try {
      console.log(`Creating pending deposit - sellerId: ${sellerId}, productId: ${productId}, productName: ${productName}`);
      
      const profitPerUnit = listingPrice - originalCostPerUnit;
      const totalDepositRequired = originalCostPerUnit * quantityListed;

      const pendingDeposit: Omit<PendingDeposit, "id"> = {
        sellerId,
        productId,
        productName,
        listingId,
        quantityListed,
        originalCostPerUnit,
        totalDepositRequired,
        listingPrice,
        profitPerUnit,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(`Pending deposit data:`, pendingDeposit);

      const docRef = await addDoc(collection(firestore, this.COLLECTION), {
        ...pendingDeposit,
        createdAt: Timestamp.fromDate(pendingDeposit.createdAt),
        updatedAt: Timestamp.fromDate(pendingDeposit.updatedAt),
      });

      console.log(`Pending deposit created with ID: ${docRef.id}`);

      return {
        success: true,
        message: "Pending deposit created successfully",
        depositId: docRef.id,
      };
    } catch (error) {
      console.error("Error creating pending deposit:", error);
      return {
        success: false,
        message: "Failed to create pending deposit",
      };
    }
  }

  /**
   * Mark a pending deposit as sold and add profit to seller's wallet
   */
  static async markProductSold(
    depositId: string,
    sellerId: string,
    salePrice: number,
    actualQuantitySold: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await runTransaction(firestore, async (transaction: Transaction) => {
        // Get the pending deposit
        const depositRef = doc(firestore, this.COLLECTION, depositId);
        const depositDoc = await transaction.get(depositRef);

        if (!depositDoc.exists()) {
          return { success: false, message: "Pending deposit not found" };
        }

        const depositData = depositDoc.data() as PendingDeposit;

        if (depositData.sellerId !== sellerId) {
          return { success: false, message: "Unauthorized access" };
        }

        // Calculate profit
        const profitAmount = depositData.profitPerUnit * actualQuantitySold;

        // Update seller's balance with profit
        const userRef = doc(firestore, "users", sellerId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          return { success: false, message: "Seller not found" };
        }

        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;

        // Add profit to balance
        transaction.update(userRef, {
          balance: currentBalance + profitAmount,
          updatedAt: Timestamp.now(),
        });

        // Update pending deposit status
        transaction.update(depositRef, {
          status: "sold",
          salePrice,
          saleDate: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        return {
          success: true,
          message: `Profit of $${profitAmount.toFixed(2)} added to wallet. Deposit of $${depositData.totalDepositRequired.toFixed(2)} still required for withdrawal.`,
        };
      });
    } catch (error) {
      console.error("Error marking product as sold:", error);
      return { success: false, message: "Failed to process sale" };
    }
  }

  /**
   * Mark deposit as paid (when seller submits deposit receipt)
   */
  static async markDepositPaid(
    depositId: string,
    sellerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const depositRef = doc(firestore, this.COLLECTION, depositId);
      const depositDoc = await getDoc(depositRef);
      
      if (!depositDoc.exists()) {
        return { success: false, message: "Pending deposit not found" };
      }

      const depositData = depositDoc.data() as PendingDeposit;
      
      if (depositData.sellerId !== sellerId) {
        return { success: false, message: "Unauthorized access" };
      }
      
      await updateDoc(depositRef, {
        status: "deposit_paid",
        depositPaidDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Deposit marked as paid",
      };
    } catch (error) {
      console.error("Error marking deposit as paid:", error);
      return { success: false, message: "Failed to update deposit status" };
    }
  }

  /**
   * Get seller's wallet summary including pending deposits
   */
  static async getSellerWalletSummary(sellerId: string): Promise<SellerWalletSummary> {
    try {
      // Get user balance
      const userRef = doc(firestore, "users", sellerId);
      const userDoc = await getDoc(userRef);
      const availableBalance = userDoc.exists() ? (userDoc.data()?.balance || 0) : 0;

      // Get pending deposits
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("status", "in", ["sold", "pending"])
      );

      const querySnapshot = await getDocs(q);
      let totalPendingDeposits = 0;
      let totalProfit = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PendingDeposit;
        if (data.status === "sold") {
          totalPendingDeposits += data.totalDepositRequired;
          totalProfit += data.profitPerUnit * data.quantityListed;
        }
      });

      const withdrawableAmount = Math.max(0, availableBalance - totalPendingDeposits);

      return {
        availableBalance,
        totalPendingDeposits,
        withdrawableAmount,
        totalProfit,
      };
    } catch (error) {
      console.error("Error getting seller wallet summary:", error);
      return {
        availableBalance: 0,
        totalPendingDeposits: 0,
        withdrawableAmount: 0,
        totalProfit: 0,
      };
    }
  }

  /**
   * Get pending deposits for a seller
   */
  static async getSellerPendingDeposits(sellerId: string): Promise<PendingDeposit[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const deposits: PendingDeposit[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        deposits.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          saleDate: data.saleDate ? data.saleDate.toDate() : undefined,
          depositPaidDate: data.depositPaidDate ? data.depositPaidDate.toDate() : undefined,
        } as PendingDeposit);
      });

      return deposits;
    } catch (error) {
      console.error("Error getting pending deposits:", error);
      return [];
    }
  }

  /**
   * Subscribe to seller's pending deposits with real-time updates
   */
  static subscribeToSellerPendingDeposits(
    sellerId: string,
    callback: (deposits: PendingDeposit[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const deposits: PendingDeposit[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          deposits.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            saleDate: data.saleDate ? data.saleDate.toDate() : undefined,
            depositPaidDate: data.depositPaidDate ? data.depositPaidDate.toDate() : undefined,
          } as PendingDeposit);
        });
        callback(deposits);
      },
      (error) => {
        console.error("Error in pending deposits subscription:", error);
        if (errorCallback) errorCallback(error);
      }
    );
  }

  /**
   * Find pending deposit by productId and sellerId
   */
  static async findPendingDepositByProduct(
    sellerId: string,
    productId: string
  ): Promise<{ deposit: PendingDeposit | null; found: boolean }> {
    try {
      console.log(`Searching for pending deposit - sellerId: ${sellerId}, productId: ${productId}`);
      
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("productId", "==", productId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.docs.length} documents`);

      if (querySnapshot.empty) {
        console.log(`No pending deposits found for seller ${sellerId}, product ${productId}`);
        return { deposit: null, found: false };
      }

      // Return the first matching pending deposit
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      console.log(`Found pending deposit:`, data);
      
      const deposit: PendingDeposit = {
        id: doc.id,
        sellerId: data.sellerId,
        productId: data.productId,
        productName: data.productName,
        listingId: data.listingId,
        quantityListed: data.quantityListed,
        originalCostPerUnit: data.originalCostPerUnit,
        totalDepositRequired: data.totalDepositRequired,
        listingPrice: data.listingPrice,
        profitPerUnit: data.profitPerUnit,
        status: data.status,
        salePrice: data.salePrice,
        saleDate: data.saleDate ? data.saleDate.toDate() : undefined,
        depositPaidDate: data.depositPaidDate ? data.depositPaidDate.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };

      return { deposit, found: true };
    } catch (error) {
      console.error("Error finding pending deposit:", error);
      return { deposit: null, found: false };
    }
  }
}

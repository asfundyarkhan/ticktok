import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  runTransaction,
  Transaction,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";

export interface PendingDeposit {
  id?: string;
  sellerId: string;
  productId: string;
  productName: string;
  productImage?: string; // Main product image URL
  productImages?: string[]; // Array of product image URLs
  mainImage?: string; // Alternative main image field
  listingId: string;
  quantityListed: number;
  originalCostPerUnit: number;
  totalDepositRequired: number;
  listingPrice: number;
  profitPerUnit: number;
  status:
    | "pending"
    | "sold"
    | "receipt_submitted"
    | "deposit_paid"
    | "completed";
  salePrice?: number;
  saleDate?: Date;
  pendingProfitAmount?: number; // Profit waiting for deposit payment
  actualQuantitySold?: number; // Actual quantity sold
  depositPaidDate?: Date;
  receiptId?: string; // Associated receipt ID when deposit receipt is submitted
  receiptSubmittedAt?: Date; // When the deposit receipt was submitted
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerWalletSummary {
  availableBalance: number; // Current wallet balance (can be withdrawn)
  totalPendingDeposits: number; // Total deposits that need to be paid
  withdrawableAmount: number; // Amount that can be withdrawn right now
  totalProfit: number; // Total pending profit waiting for deposit payment
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
    listingPrice: number,
    productImage?: string,
    productImages?: string[]
  ): Promise<{ success: boolean; message: string; depositId?: string }> {
    try {
      console.log(
        `Creating pending deposit - sellerId: ${sellerId}, productId: ${productId}, productName: ${productName}, productImage: ${productImage}`
      );

      const profitPerUnit = listingPrice - originalCostPerUnit;
      const totalDepositRequired = originalCostPerUnit * quantityListed;

      // Fetch product images if not provided
      let finalProductImage = productImage;
      let finalProductImages = productImages;
      
      if (!finalProductImage || !finalProductImages) {
        try {
          const productRef = doc(firestore, "products", productId);
          const productDoc = await getDoc(productRef);
          if (productDoc.exists()) {
            const productData = productDoc.data();
            
            // Get the best available image
            if (!finalProductImage) {
              finalProductImage = productData.image || productData.mainImage || 
                                 (productData.images && productData.images[0]) || "";
            }
            
            // Get all images
            if (!finalProductImages) {
              finalProductImages = productData.images || 
                                 (productData.image ? [productData.image] : []) ||
                                 (productData.mainImage ? [productData.mainImage] : []);
            }
            
            console.log(`Fetched product images - main: ${finalProductImage}, all: ${finalProductImages}`);
          }
        } catch (error) {
          console.error("Error fetching product images:", error);
        }
      }

      const pendingDeposit: Omit<PendingDeposit, "id"> = {
        sellerId,
        productId,
        productName,
        productImage: finalProductImage,
        productImages: finalProductImages,
        mainImage: finalProductImage, // Set mainImage as alias
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
      return await runTransaction(
        firestore,
        async (transaction: Transaction) => {
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

          // Calculate profit based on actual sale price vs original cost
          const profitAmount = (salePrice - depositData.originalCostPerUnit) * actualQuantitySold;

          console.log(`Profit calculation: salePrice(${salePrice}) - originalCost(${depositData.originalCostPerUnit}) = ${salePrice - depositData.originalCostPerUnit} per unit`);
          console.log(`Total profit for ${actualQuantitySold} units: ${profitAmount}`);

          // DON'T add profit to balance yet - it stays pending until deposit is paid
          // The profit will be added when the deposit is marked as paid

          // Update pending deposit status with profit tracking
          transaction.update(depositRef, {
            status: "sold",
            salePrice,
            saleDate: Timestamp.now(),
            pendingProfitAmount: profitAmount, // Track profit amount pending deposit payment
            actualQuantitySold, // Track actual quantity sold
            updatedAt: Timestamp.now(),
          });

          return {
            success: true,
            message: `Product sold! Profit of $${profitAmount.toFixed(
              2
            )} will be added to your wallet after you pay the deposit of $${depositData.totalDepositRequired.toFixed(
              2
            )}.`,
          };
        }
      );
    } catch (error) {
      console.error("Error marking product as sold:", error);
      return { success: false, message: "Failed to process sale" };
    }
  }

  /**
   * Mark deposit as paid and release pending profit to seller's wallet
   */
  static async markDepositPaid(
    depositId: string,
    sellerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // First, find the corresponding pending product outside the transaction
      let pendingProductRef = null;

      const depositRef = doc(firestore, this.COLLECTION, depositId);
      const depositDoc = await getDoc(depositRef);

      if (!depositDoc.exists()) {
        return { success: false, message: "Pending deposit not found" };
      }

      const depositData = depositDoc.data() as PendingDeposit;

      if (depositData.sellerId !== sellerId) {
        return { success: false, message: "Unauthorized access" };
      }

      // Find pending product by sellerId and productId (outside transaction)
      try {
        const pendingProductsQuery = query(
          collection(firestore, "pendingProducts"),
          where("sellerId", "==", sellerId),
          where("productId", "==", depositData.productId)
        );

        const pendingProductsSnapshot = await getDocs(pendingProductsQuery);

        if (!pendingProductsSnapshot.empty) {
          pendingProductRef = pendingProductsSnapshot.docs[0].ref;
          console.log(
            `Found pending product ${pendingProductsSnapshot.docs[0].id} for product ${depositData.productId}`
          );
        } else {
          console.log(
            `No pending product found for sellerId: ${sellerId}, productId: ${depositData.productId}`
          );
        }
      } catch (pendingProductError) {
        console.error("Error finding pending product:", pendingProductError);
      }

      // Now run the transaction
      return await runTransaction(
        firestore,
        async (transaction: Transaction) => {
          // Re-read the deposit doc in transaction
          const depositDocTx = await transaction.get(depositRef);

          if (!depositDocTx.exists()) {
            return { success: false, message: "Pending deposit not found" };
          }

          const depositDataTx = depositDocTx.data() as PendingDeposit;

          // Check if there's pending profit to release
          const pendingProfit = depositDataTx.pendingProfitAmount || 0;

          console.log(
            `Processing deposit payment for ${depositId}, pending profit: ${pendingProfit}`
          );

          if (pendingProfit > 0) {
            // Add pending profit to seller's balance
            const userRef = doc(firestore, "users", sellerId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
              return { success: false, message: "Seller not found" };
            }

            const userData = userDoc.data();
            const currentBalance = userData.balance || 0;
            const newBalance = currentBalance + pendingProfit;

            console.log(
              `Updating seller balance from ${currentBalance} to ${newBalance} (adding profit: ${pendingProfit})`
            );

            // Add pending profit to balance
            transaction.update(userRef, {
              balance: newBalance,
              updatedAt: Timestamp.now(),
            });

            console.log(
              `Successfully transferred profit of $${pendingProfit} to seller's wallet`
            );
          } else {
            console.log(
              `No pending profit to transfer for deposit ${depositId}`
            );
          }

          // Update deposit status and clear pending profit amount
          transaction.update(depositRef, {
            status: "deposit_paid",
            depositPaidDate: Timestamp.now(),
            pendingProfitAmount: 0, // Clear pending profit since it's now added to wallet
            updatedAt: Timestamp.now(),
          });

          console.log(
            `Updated deposit ${depositId} status to 'deposit_paid' and cleared pending profit amount`
          );

          // Update the corresponding pending product status if found
          if (pendingProductRef) {
            transaction.update(pendingProductRef, {
              status: "deposit_approved",
              updatedAt: Timestamp.now(),
            });
            console.log(`Updated pending product status to deposit_approved`);
          }

          return {
            success: true,
            message:
              pendingProfit > 0
                ? `Deposit confirmed! Profit of $${pendingProfit.toFixed(
                    2
                  )} has been added to your wallet.`
                : "Deposit confirmed!",
          };
        }
      );
    } catch (error) {
      console.error("Error marking deposit as paid:", error);
      return { success: false, message: "Failed to update deposit status" };
    }
  }

  /**
   * Get seller's wallet summary including pending deposits and pending profits
   */
  static async getSellerWalletSummary(
    sellerId: string
  ): Promise<SellerWalletSummary> {
    try {
      // Get user balance
      const userRef = doc(firestore, "users", sellerId);
      const userDoc = await getDoc(userRef);
      const availableBalance = userDoc.exists()
        ? userDoc.data()?.balance || 0
        : 0;

      // Get pending deposits - only include those that still need deposit payment
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("status", "in", ["sold", "receipt_submitted", "pending"])
      );

      const querySnapshot = await getDocs(q);
      let totalPendingDeposits = 0;
      let totalPendingProfit = 0; // Profit waiting for deposit payment

      querySnapshot.forEach((doc) => {
        const data = doc.data() as PendingDeposit;
        if (data.status === "sold" || data.status === "receipt_submitted") {
          // Only count deposits that haven't been paid yet
          totalPendingDeposits += data.totalDepositRequired;
          // Add pending profit (profit that will be released when deposit is paid)
          totalPendingProfit += data.pendingProfitAmount || 0;
        } else if (data.status === "pending") {
          // For unsold items, still count as pending deposits
          totalPendingDeposits += data.totalDepositRequired;
        }
        // Note: deposits with status "deposit_paid" are excluded from this query
      });

      // Withdrawable amount is current balance minus any restrictions
      // (Note: pending profits are not in balance yet, so they don't affect withdrawable amount)
      const withdrawableAmount = Math.max(0, availableBalance);

      return {
        availableBalance,
        totalPendingDeposits,
        withdrawableAmount,
        totalProfit: totalPendingProfit, // This is now pending profit, not realized profit
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
  static async getSellerPendingDeposits(
    sellerId: string
  ): Promise<PendingDeposit[]> {
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
          depositPaidDate: data.depositPaidDate
            ? data.depositPaidDate.toDate()
            : undefined,
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
            depositPaidDate: data.depositPaidDate
              ? data.depositPaidDate.toDate()
              : undefined,
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
      console.log(
        `Searching for pending deposit - sellerId: ${sellerId}, productId: ${productId}`
      );

      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("productId", "==", productId),
        where("status", "==", "pending")
      );

      const querySnapshot = await getDocs(q);
      console.log(`Query returned ${querySnapshot.docs.length} documents`);

      if (querySnapshot.empty) {
        console.log(
          `No pending deposits found for seller ${sellerId}, product ${productId}`
        );
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
        depositPaidDate: data.depositPaidDate
          ? data.depositPaidDate.toDate()
          : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };

      return { deposit, found: true };
    } catch (error) {
      console.error("Error finding pending deposit:", error);
      return { deposit: null, found: false };
    }
  }

  /**
   * Update deposit status when receipt is submitted
   */
  static async updateDepositStatus(
    depositId: string,
    status: "receipt_submitted" | "deposit_paid" | "completed",
    receiptId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const depositRef = doc(firestore, this.COLLECTION, depositId);

      const updateData: {
        status: string;
        updatedAt: Timestamp;
        receiptId?: string;
        receiptSubmittedAt?: Timestamp;
      } = {
        status,
        updatedAt: Timestamp.now(),
      };

      if (receiptId) {
        updateData.receiptId = receiptId;
      }

      if (status === "receipt_submitted") {
        updateData.receiptSubmittedAt = Timestamp.now();
      }

      await updateDoc(depositRef, updateData);

      return {
        success: true,
        message: "Deposit status updated successfully",
      };
    } catch (error) {
      console.error("Error updating deposit status:", error);
      return {
        success: false,
        message: "Failed to update deposit status",
      };
    }
  }
}

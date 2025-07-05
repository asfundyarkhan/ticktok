import {
  collection,
  doc,
  getDoc,
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
import {
  WalletBalance,
  PendingProfit,
  SellerDeposit,
  WithdrawalRequest,
  Sale,
} from "../types/wallet";

// Simple cache to prevent repeated image fetches
const productImageCache = new Map<string, string>();
const MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

export class SellerWalletService {
  // Get seller's wallet balance
  static async getWalletBalance(sellerId: string): Promise<WalletBalance> {
    try {
      // Get actual balance from user document
      const userRef = doc(firestore, "users", sellerId);
      const userDoc = await getDoc(userRef);
      const available = userDoc.exists() ? userDoc.data()?.balance || 0 : 0;

      // Get pending amounts from pending deposits
      const pendingDepositsRef = collection(firestore, "pending_deposits");
      const q = query(
        pendingDepositsRef,
        where("sellerId", "==", sellerId),
        where("status", "==", "sold")
      );

      const snapshot = await getDocs(q);
      const pending = snapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        // Only count profit that hasn't been transferred yet
        const pendingProfit = data.pendingProfitAmount || 0;
        const transferredProfit = data.profitTransferredAmount || 0;
        const remainingPendingProfit = pendingProfit - transferredProfit;
        return total + Math.max(0, remainingPendingProfit);
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
    console.log(`🔄 Subscribing to wallet balance for seller: ${sellerId}`);

    let latestAvailable = 0;
    let latestPending = 0;
    let userUnsubscribe: (() => void) | null = null;
    let depositsUnsubscribe: (() => void) | null = null;

    const updateBalance = () => {
      const walletBalance = {
        available: latestAvailable,
        pending: latestPending,
        total: latestAvailable + latestPending,
      };
      console.log(`📈 Final wallet balance:`, walletBalance);
      callback(walletBalance);
    };

    // Subscribe to user document for actual balance
    const userRef = doc(firestore, "users", sellerId);
    userUnsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        latestAvailable = userData.balance || 0;
        console.log(`💳 User wallet balance updated: ${latestAvailable}`);
      } else {
        latestAvailable = 0;
        console.log(`💳 User document not found, balance: 0`);
      }
      updateBalance();
    });

    // Subscribe to pending deposits for pending amounts
    const pendingDepositsRef = collection(firestore, "pending_deposits");
    const q = query(pendingDepositsRef, where("sellerId", "==", sellerId));

    depositsUnsubscribe = onSnapshot(q, (snapshot) => {
      console.log(
        `📊 Pending deposits update: ${snapshot.docs.length} deposits found`
      );

      latestPending = 0;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(
          `💰 Deposit ${doc.id}: status=${data.status}, pendingProfit=${data.pendingProfitAmount}`
        );

        if (data.status === "sold" && data.pendingProfitAmount) {
          // Only count profit that hasn't been transferred yet
          const pendingProfit = data.pendingProfitAmount || 0;
          const transferredProfit = data.profitTransferredAmount || 0;
          const remainingPendingProfit = pendingProfit - transferredProfit;

          if (remainingPendingProfit > 0) {
            latestPending += remainingPendingProfit;
            console.log(
              `➕ Added ${remainingPendingProfit} to pending (total: ${latestPending})`
            );
          } else {
            console.log(`🔄 Profit already transferred for deposit ${doc.id}`);
          }
        }
      });

      updateBalance();
    });

    // Return cleanup function
    return () => {
      if (userUnsubscribe) userUnsubscribe();
      if (depositsUnsubscribe) depositsUnsubscribe();
    };
  }

  // Record a sale and create pending profit
  static async recordSale(
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
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
          const pendingProfitRef = doc(
            collection(firestore, "pending_profits")
          );
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
        },
        { maxRetries: 3, baseDelayMs: 100 }
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        throw new Error(result.error || "Failed to record sale");
      }
    } catch (error) {
      console.error("Error recording sale:", error);
      throw error;
    }
  }

  // Get pending profits for a seller (includes items purchased by admin)
  static async getPendingProfits(sellerId: string): Promise<PendingProfit[]> {
    try {
      // Get all deposits for this seller (including pending ones that have been purchased by admin)
      const depositsQuery = query(
        collection(firestore, "pending_deposits"),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const depositsSnapshot = await getDocs(depositsQuery);

      const pendingProfits = await Promise.all(
        depositsSnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          // Only include deposits that have been actually sold to customers
          // NOT just purchased by admin for inventory
          const isSold = ["sold", "receipt_submitted", "deposit_paid"].includes(
            data.status
          );

          if (!isSold) {
            return null; // Skip items that haven't been sold to actual customers
          }

          let productImage = "";

          // First, try to get image from the pending_deposits data itself
          if (data.productImage && typeof data.productImage === "string") {
            productImage = data.productImage;
            console.log(
              `Using productImage from pending_deposits: ${productImage}`
            );
          } else if (data.mainImage && typeof data.mainImage === "string") {
            productImage = data.mainImage;
            console.log(
              `Using mainImage from pending_deposits: ${productImage}`
            );
          } else if (
            data.productImages &&
            Array.isArray(data.productImages) &&
            data.productImages.length > 0
          ) {
            productImage = data.productImages[0];
            console.log(
              `Using first image from productImages array: ${productImage}`
            );
          }

          // If no image in pending_deposits, fallback to fetching from products collection
          if (!productImage && data.productId) {
            // Check cache first
            if (productImageCache.has(data.productId)) {
              productImage = productImageCache.get(data.productId) || "";
              console.log(
                `Using cached image for ${data.productId}: ${
                  productImage || "NO IMAGE"
                }`
              );
            } else {
              console.log(
                `No image in pending_deposits for ${data.productId}, fetching from products collection...`
              );
              try {
                const productRef = doc(firestore, "products", data.productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                  const productData = productDoc.data();

                  // Try various image field names
                  if (
                    productData.image &&
                    typeof productData.image === "string"
                  ) {
                    productImage = productData.image;
                    console.log(
                      `Found image field for ${data.productId}: ${productImage}`
                    );
                  } else if (
                    productData.mainImage &&
                    typeof productData.mainImage === "string"
                  ) {
                    productImage = productData.mainImage;
                    console.log(
                      `Found mainImage field for ${data.productId}: ${productImage}`
                    );
                  } else if (
                    productData.images &&
                    Array.isArray(productData.images) &&
                    productData.images.length > 0
                  ) {
                    productImage = productData.images[0];
                    console.log(
                      `Found image in images array for ${data.productId}: ${productImage}`
                    );
                  }
                }

                // Cache the image result (even if empty) to prevent repeated fetches
                if (productImageCache.size >= MAX_CACHE_SIZE) {
                  // Remove oldest entry to prevent memory issues
                  const firstKey = productImageCache.keys().next().value;
                  if (firstKey) {
                    productImageCache.delete(firstKey);
                  }
                }
                productImageCache.set(data.productId, productImage || "");
              } catch (err) {
                console.error(
                  `Error fetching product image for ${data.productId}:`,
                  err
                );
                // Cache empty result to prevent repeated failed fetches
                if (productImageCache.size >= MAX_CACHE_SIZE) {
                  // Remove oldest entry to prevent memory issues
                  const firstKey = productImageCache.keys().next().value;
                  if (firstKey) {
                    productImageCache.delete(firstKey);
                  }
                }
                productImageCache.set(data.productId, "");
              }
            }

            // Format Firebase Storage URLs if needed
            if (
              productImage &&
              !productImage.startsWith("http") &&
              !productImage.startsWith("data:")
            ) {
              try {
                if (!productImage.includes("/")) {
                  // It's likely just a filename - construct a path in the products folder
                  productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/products%2F${encodeURIComponent(
                    productImage
                  )}?alt=media`;
                } else if (productImage.startsWith("/")) {
                  // Remove the leading slash before encoding
                  const path = productImage.substring(1);
                  productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(
                    path
                  )}?alt=media`;
                } else {
                  productImage = `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(
                    productImage
                  )}?alt=media`;
                }
                console.log(
                  `Formatted image URL for ${data.productId}: ${productImage}`
                );
              } catch (err) {
                console.error(
                  `Error formatting image URL for ${data.productId}:`,
                  err
                );
                productImage = "";
              }
            }

            // Cache the image result (even if empty) to prevent repeated fetches
            if (data.productId) {
              if (productImageCache.size >= MAX_CACHE_SIZE) {
                // Remove oldest entry to prevent memory issues
                const firstKey = productImageCache.keys().next().value;
                if (firstKey) {
                  productImageCache.delete(firstKey);
                }
              }
              productImageCache.set(data.productId, productImage || "");
            }
          }

          console.log(
            `Final image URL for ${data.productName}: ${
              productImage || "NO IMAGE"
            }`
          );

          // Calculate profit amount based on actual sales only
          const profitAmount = data.pendingProfitAmount || 0;
          const saleAmount = data.salePrice || data.listingPrice;
          const quantitySold =
            data.actualQuantitySold || data.quantityListed || 1;

          // Map pending_deposits data to PendingProfit interface
          return {
            id: docSnapshot.id,
            sellerId: data.sellerId,
            productId: data.productId,
            productName: data.productName,
            productImage: productImage, // Include product image
            saleAmount: saleAmount,
            profitAmount: profitAmount,
            baseCost: data.originalCostPerUnit,
            depositRequired: data.totalDepositRequired,
            quantitySold: quantitySold, // Get actual quantity
            status:
              data.status === "sold"
                ? "pending"
                : data.status === "deposit_paid"
                ? "deposit_made"
                : data.status,
            saleDate:
              data.saleDate?.toDate() || data.createdAt?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as PendingProfit;
        })
      );

      return pendingProfits.filter(
        (profit) => profit !== null
      ) as PendingProfit[];
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
      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
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
        },
        { maxRetries: 3, baseDelayMs: 100 }
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        throw new Error(result.error || "Failed to submit deposit");
      }
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
      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
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
          const withdrawalRef = doc(
            collection(firestore, "withdrawal_requests")
          );
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
        },
        { maxRetries: 3, baseDelayMs: 100 }
      );

      if (result.success && result.result) {
        return result.result;
      } else {
        throw new Error(result.error || "Failed to request withdrawal");
      }
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

  // Get historical profit transfers for a seller (for record keeping)
  static async getTransferredProfits(
    sellerId: string
  ): Promise<PendingProfit[]> {
    try {
      // Get all deposits for this seller that have transferred profits
      const depositsQuery = query(
        collection(firestore, "pending_deposits"),
        where("sellerId", "==", sellerId),
        where("profitTransferredAmount", ">", 0)
      );

      const depositsSnapshot = await getDocs(depositsQuery);
      const transfers: PendingProfit[] = [];

      for (const doc of depositsSnapshot.docs) {
        const data = doc.data();

        transfers.push({
          id: doc.id,
          sellerId: data.sellerId,
          productId: data.productId,
          productName: data.productName || "Unknown Product",
          saleAmount: data.salePrice || data.listingPrice || 0,
          profitAmount: data.profitTransferredAmount || 0, // Show transferred amount
          baseCost: data.originalCostPerUnit || 0,
          depositRequired: data.totalDepositRequired || 0,
          status: "transferred" as const,
          saleDate: data.saleDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          quantitySold: data.actualQuantitySold || data.quantityListed || 1,
          transferredAt: data.profitTransferredDate?.toDate(),
          productImage: data.productImage || "",
        });
      }

      // Sort by transfer date (most recent first)
      transfers.sort((a, b) => {
        if (!a.transferredAt) return 1;
        if (!b.transferredAt) return -1;
        return b.transferredAt.getTime() - a.transferredAt.getTime();
      });

      return transfers;
    } catch (error) {
      console.error("Error fetching transferred profits:", error);
      return [];
    }
  }
}

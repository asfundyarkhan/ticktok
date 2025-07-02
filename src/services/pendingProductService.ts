import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";

export interface PendingProduct {
  id?: string;
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantitySold: number;
  pricePerUnit: number;
  totalAmount: number;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  saleDate: Date;
  status:
    | "pending_deposit"
    | "deposit_submitted"
    | "deposit_approved"
    | "completed";
  receiptId?: string; // Reference to the deposit receipt
  createdAt: Date;
  updatedAt: Date;
  // Enhanced fields for financial data
  actualProfit?: number;
  depositRequired?: number;
  depositId?: string;
  originalCostPerUnit?: number;
  depositStatus?: string;
}

export interface PendingProductResult {
  success: boolean;
  message: string;
  pendingProductId?: string;
}

export class PendingProductService {
  private static readonly COLLECTION = "pending_products";

  /**
   * Create a pending product entry when a product is sold
   */
  static async createPendingProduct(
    sellerId: string,
    productId: string,
    productName: string,
    quantitySold: number,
    pricePerUnit: number,
    buyerId: string,
    productImage?: string,
    sellerName?: string,
    sellerEmail?: string,
    buyerName?: string,
    buyerEmail?: string
  ): Promise<PendingProductResult> {
    try {
      const basePendingProduct = {
        sellerId,
        productId,
        productName,
        quantitySold,
        pricePerUnit,
        totalAmount: quantitySold * pricePerUnit,
        buyerId,
        saleDate: Timestamp.now(),
        status: "pending_deposit" as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Create the final object with optional fields
      const pendingProduct = {
        ...basePendingProduct,
        ...(sellerName && { sellerName }),
        ...(sellerEmail && { sellerEmail }),
        ...(productImage && { productImage }),
        ...(buyerName && { buyerName }),
        ...(buyerEmail && { buyerEmail }),
      };

      const docRef = await addDoc(
        collection(firestore, this.COLLECTION),
        pendingProduct
      );

      return {
        success: true,
        message: "Pending product created successfully",
        pendingProductId: docRef.id,
      };
    } catch (error) {
      console.error("Error creating pending product:", error);
      return {
        success: false,
        message: "Failed to create pending product",
      };
    }
  }

  /**
   * Get pending products for a specific seller
   */
  static async getSellerPendingProducts(
    sellerId: string
  ): Promise<PendingProduct[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const pendingProducts: PendingProduct[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pendingProducts.push({
          id: doc.id,
          ...data,
          saleDate: data.saleDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as PendingProduct);
      });

      return pendingProducts;
    } catch (error) {
      console.error("Error fetching seller pending products:", error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates for seller's pending products
   */
  static subscribeToSellerPendingProducts(
    sellerId: string,
    callback: (products: PendingProduct[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const pendingProducts: PendingProduct[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          pendingProducts.push({
            id: doc.id,
            ...data,
            saleDate: data.saleDate.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
          } as PendingProduct);
        });
        callback(pendingProducts);
      },
      (error) => {
        console.error("Error in pending products subscription:", error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Update pending product status when receipt is submitted
   */
  static async linkReceiptToPendingProduct(
    pendingProductId: string,
    receiptId: string
  ): Promise<PendingProductResult> {
    try {
      const docRef = doc(firestore, this.COLLECTION, pendingProductId);
      await updateDoc(docRef, {
        receiptId,
        status: "deposit_submitted",
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Receipt linked to pending product successfully",
      };
    } catch (error) {
      console.error("Error linking receipt to pending product:", error);
      return {
        success: false,
        message: "Failed to link receipt to pending product",
      };
    }
  }

  /**
   * Update pending product status when deposit is approved
   */
  static async markDepositApproved(
    pendingProductId: string
  ): Promise<PendingProductResult> {
    try {
      const docRef = doc(firestore, this.COLLECTION, pendingProductId);
      await updateDoc(docRef, {
        status: "deposit_approved",
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Pending product marked as deposit approved",
      };
    } catch (error) {
      console.error("Error marking deposit approved:", error);
      return {
        success: false,
        message: "Failed to mark deposit approved",
      };
    }
  }

  /**
   * Complete pending product (when funds are actually transferred)
   */
  static async completePendingProduct(
    pendingProductId: string
  ): Promise<PendingProductResult> {
    try {
      const docRef = doc(firestore, this.COLLECTION, pendingProductId);
      await updateDoc(docRef, {
        status: "completed",
        updatedAt: Timestamp.now(),
      });

      return {
        success: true,
        message: "Pending product completed successfully",
      };
    } catch (error) {
      console.error("Error completing pending product:", error);
      return {
        success: false,
        message: "Failed to complete pending product",
      };
    }
  }

  /**
   * Delete a pending product
   */
  static async deletePendingProduct(
    pendingProductId: string
  ): Promise<PendingProductResult> {
    try {
      const docRef = doc(firestore, this.COLLECTION, pendingProductId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: "Pending product deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting pending product:", error);
      return {
        success: false,
        message: "Failed to delete pending product",
      };
    }
  }

  /**
   * Get pending products for a seller with complete financial information
   * Combines data from pendingProducts and pending_deposits collections
   */
  static async getSellerPendingProductsWithDeposits(
    sellerId: string
  ): Promise<PendingProduct[]> {
    try {
      // Get pending products
      const pendingProducts = await this.getSellerPendingProducts(sellerId);

      // Get pending deposits to combine financial data
      const { PendingDepositService } = await import("./pendingDepositService");
      const pendingDeposits = await PendingDepositService.getSellerPendingDeposits(
        sellerId
      );

      // Create a map of deposits by productId for quick lookup
      const depositsByProduct = new Map();
      pendingDeposits.forEach((deposit) => {
        depositsByProduct.set(deposit.productId, deposit);
      });

      // Enhance pending products with financial data
      const enhancedProducts = pendingProducts.map((product) => {
        const relatedDeposit = depositsByProduct.get(product.productId);

        if (relatedDeposit) {
          // Calculate actual profit based on sale vs original cost
          const actualProfit =
            relatedDeposit.pendingProfitAmount ||
            (product.pricePerUnit - relatedDeposit.originalCostPerUnit) *
              product.quantitySold;

          return {
            ...product,
            // Add financial fields from deposit
            actualProfit,
            depositRequired: relatedDeposit.totalDepositRequired,
            depositId: relatedDeposit.id,
            originalCostPerUnit: relatedDeposit.originalCostPerUnit,
            // Sync status between collections
            depositStatus: relatedDeposit.status,
            // Enhanced status logic
            status: this.getSyncedStatus(product.status, relatedDeposit.status),
          };
        }

        return product;
      });

      return enhancedProducts;
    } catch (error) {
      console.error("Error fetching pending products with deposits:", error);
      throw error;
    }
  }

  /**
   * Enhanced status checking with receipt validation
   * Ensures deposit_approved status only shows when there's actually an approved receipt
   */
  static async getSellerPendingProductsWithValidatedDeposits(
    sellerId: string
  ): Promise<PendingProduct[]> {
    try {
      // Get the basic products with deposits
      const productsWithDeposits = await this.getSellerPendingProductsWithDeposits(sellerId);
      
      // For any products showing "deposit_approved", validate against actual receipts
      const { NewReceiptService } = await import("./newReceiptService");
      
      const validatedProducts = await Promise.all(
        productsWithDeposits.map(async (product) => {
          // If status is deposit_approved, validate it has an approved receipt
          if (product.status === "deposit_approved" && product.depositId) {
            try {
              // Check if there's an approved receipt for this deposit
              const receipts = await NewReceiptService.getUserReceipts(sellerId);
              const relatedReceipt = receipts.find(
                receipt => receipt.pendingDepositId === product.depositId && receipt.status === "approved"
              );
              
              if (!relatedReceipt) {
                // No approved receipt found - the status might be premature
                console.warn(`⚠️ Product ${product.productId} shows deposit_approved but no approved receipt found. Correcting status.`);
                
                // Check if there's a pending receipt
                const pendingReceipt = receipts.find(
                  receipt => receipt.pendingDepositId === product.depositId && receipt.status === "pending"
                );
                
                return {
                  ...product,
                  status: (pendingReceipt ? "deposit_submitted" : "pending_deposit") as "pending_deposit" | "deposit_submitted" | "deposit_approved" | "completed"
                };
              }
            } catch (error) {
              console.error(`Error validating receipt for product ${product.productId}:`, error);
              // Return the original status if validation fails
            }
          }
          
          return product;
        })
      );
      
      return validatedProducts;
    } catch (error) {
      console.error("Error getting validated pending products:", error);
      // Fallback to the basic method if validation fails
      return this.getSellerPendingProductsWithDeposits(sellerId);
    }
  }

  /**
   * Synchronize status between PendingProduct and PendingDeposit
   * Enhanced with validation to prevent premature "deposit_approved" status
   */
  private static getSyncedStatus(
    productStatus: string,
    depositStatus: string
  ): "pending_deposit" | "deposit_submitted" | "deposit_approved" | "completed" {
    // Priority logic: deposit status takes precedence for financial workflow
    switch (depositStatus) {
      case "pending":
        return "pending_deposit";
      case "sold":
        return productStatus === "deposit_submitted"
          ? "deposit_submitted"
          : "pending_deposit";
      case "receipt_submitted":
        return "deposit_submitted";
      case "deposit_paid":
        // Only return "deposit_approved" if the deposit is truly paid
        // This should only happen after admin approval of receipt
        return "deposit_approved";
      case "completed":
        return "completed";
      default:
        return productStatus as "pending_deposit" | "deposit_submitted" | "deposit_approved" | "completed";
    }
  }

  /**
   * Update status across both PendingProduct and PendingDeposit collections
   * This ensures synchronization across the entire system
   */
  static async updateStatusAcrossSystems(
    sellerId: string,
    productId: string,
    newStatus: "pending_deposit" | "deposit_submitted" | "deposit_approved" | "completed",
    receiptId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Update PendingProduct status
      const q = query(
        collection(firestore, this.COLLECTION),
        where("sellerId", "==", sellerId),
        where("productId", "==", productId)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return { success: false, message: "Pending product not found" };
      }

      const pendingProductDoc = querySnapshot.docs[0];
      
      // Update PendingProduct
      const updateData: {
        status: string;
        updatedAt: Timestamp;
        receiptId?: string;
      } = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };

      if (receiptId) {
        updateData.receiptId = receiptId;
      }

      await updateDoc(pendingProductDoc.ref, updateData);

      // Update corresponding PendingDeposit status
      const { PendingDepositService } = await import("./pendingDepositService");
      
      // Map PendingProduct status to PendingDeposit status
      let depositStatus: "receipt_submitted" | "deposit_paid" | "completed";
      switch (newStatus) {
        case "deposit_submitted":
          depositStatus = "receipt_submitted";
          break;
        case "deposit_approved":
          depositStatus = "deposit_paid";
          break;
        case "completed":
          depositStatus = "completed";
          break;
        default:
          // For "pending_deposit", don't update deposit status
          return { success: true, message: "Status updated successfully" };
      }

      // Find and update the corresponding deposit
      const { deposit, found } = await PendingDepositService.findPendingDepositByProductAnyStatus(sellerId, productId);
      
      if (found && deposit?.id) {
        const depositResult = await PendingDepositService.updateDepositStatus(
          deposit.id,
          depositStatus,
          receiptId
        );
        
        if (!depositResult.success) {
          console.warn("Failed to update deposit status:", depositResult.message);
        }

        // If status is deposit_approved, trigger the profit transfer
        if (newStatus === "deposit_approved" && depositStatus === "deposit_paid") {
          const paymentResult = await PendingDepositService.markDepositPaid(deposit.id, sellerId);
          if (!paymentResult.success) {
            console.warn("Failed to process deposit payment:", paymentResult.message);
          }
        }
      }

      return { success: true, message: "Status updated across all systems successfully" };
    } catch (error) {
      console.error("Error updating status across systems:", error);
      return { success: false, message: "Failed to update status" };
    }
  }
}

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
  status: "pending_deposit" | "deposit_submitted" | "deposit_approved" | "completed";
  receiptId?: string; // Reference to the deposit receipt
  createdAt: Date;
  updatedAt: Date;
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

      const docRef = await addDoc(collection(firestore, this.COLLECTION), pendingProduct);

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
  static async getSellerPendingProducts(sellerId: string): Promise<PendingProduct[]> {
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
  static async markDepositApproved(pendingProductId: string): Promise<PendingProductResult> {
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
  static async completePendingProduct(pendingProductId: string): Promise<PendingProductResult> {
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
  static async deletePendingProduct(pendingProductId: string): Promise<PendingProductResult> {
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
}

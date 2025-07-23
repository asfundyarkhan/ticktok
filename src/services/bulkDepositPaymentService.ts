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
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { PendingDeposit } from "./pendingDepositService";
import { NewReceiptService } from "./newReceiptService";

export interface BulkDepositPayment {
  id?: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  pendingDepositIds: string[]; // Array of pending deposit IDs being paid for
  totalDepositAmount: number; // Combined deposit amount for all orders
  totalProfitAmount: number; // Combined profit amount for all orders
  totalOrdersCount: number; // Number of orders in this bulk payment
  status: "pending" | "receipt_submitted" | "approved" | "rejected";
  receiptId?: string; // Associated receipt ID
  receiptSubmittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Details of each order for reference
  orderDetails: {
    pendingDepositId: string;
    productName: string;
    productId: string;
    listingId: string;
    quantityListed: number;
    depositAmount: number;
    profitAmount: number;
  }[];
}

export interface BulkPaymentCreationResult {
  success: boolean;
  message: string;
  bulkPaymentId?: string;
  totalAmount?: number;
  orderCount?: number;
}

export interface BulkPaymentReceiptResult {
  success: boolean;
  message: string;
  receiptId?: string;
}

export class BulkDepositPaymentService {
  private static COLLECTION_NAME = "bulk_deposit_payments";

  /**
   * Create a new bulk deposit payment for multiple orders
   */
  static async createBulkPayment(
    sellerId: string,
    sellerEmail: string,
    sellerName: string,
    pendingDepositIds: string[]
  ): Promise<BulkPaymentCreationResult> {
    try {
      if (!sellerId || pendingDepositIds.length === 0) {
        return {
          success: false,
          message: "Invalid seller ID or no orders selected"
        };
      }

      if (pendingDepositIds.length > 10) {
        return {
          success: false,
          message: "Maximum 10 orders can be paid in a single bulk payment"
        };
      }

      // Fetch all pending deposits to validate and calculate totals
      const pendingDeposits: PendingDeposit[] = [];
      let totalDepositAmount = 0;
      let totalProfitAmount = 0;

      for (const depositId of pendingDepositIds) {
        const depositRef = doc(firestore, "pending_deposits", depositId);
        const depositSnap = await getDoc(depositRef);
        
        if (!depositSnap.exists()) {
          return {
            success: false,
            message: `Order ${depositId} not found`
          };
        }

        const deposit = { id: depositSnap.id, ...depositSnap.data() } as PendingDeposit;
        
        // Validate that all deposits belong to the same seller
        if (deposit.sellerId !== sellerId) {
          return {
            success: false,
            message: "All orders must belong to the same seller"
          };
        }

        // Validate that deposits are in correct status
        if (deposit.status !== "sold") {
          return {
            success: false,
            message: `Order ${deposit.productName} is not in 'sold' status and cannot be paid for`
          };
        }

        pendingDeposits.push(deposit);
        totalDepositAmount += deposit.totalDepositRequired;
        totalProfitAmount += deposit.pendingProfitAmount || 0;
      }

      // Create order details array
      const orderDetails = pendingDeposits.map(deposit => ({
        pendingDepositId: deposit.id!,
        productName: deposit.productName,
        productId: deposit.productId,
        listingId: deposit.listingId,
        quantityListed: deposit.quantityListed,
        depositAmount: deposit.totalDepositRequired,
        profitAmount: deposit.pendingProfitAmount || 0
      }));

      // Create bulk payment record
      const bulkPaymentData: Omit<BulkDepositPayment, 'id'> = {
        sellerId,
        sellerEmail,
        sellerName,
        pendingDepositIds,
        totalDepositAmount,
        totalProfitAmount,
        totalOrdersCount: pendingDepositIds.length,
        status: "pending",
        orderDetails,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const bulkPaymentRef = await addDoc(
        collection(firestore, this.COLLECTION_NAME),
        {
          ...bulkPaymentData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );

      // Update all pending deposits to indicate they're part of a bulk payment
      const batch = writeBatch(firestore);
      
      for (const depositId of pendingDepositIds) {
        const depositRef = doc(firestore, "pending_deposits", depositId);
        batch.update(depositRef, {
          status: "receipt_submitted",
          bulkPaymentId: bulkPaymentRef.id,
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();

      return {
        success: true,
        message: `Bulk payment created for ${pendingDepositIds.length} orders`,
        bulkPaymentId: bulkPaymentRef.id,
        totalAmount: totalDepositAmount,
        orderCount: pendingDepositIds.length
      };

    } catch (error) {
      console.error("Error creating bulk payment:", error);
      return {
        success: false,
        message: "Failed to create bulk payment. Please try again."
      };
    }
  }

  /**
   * Submit receipt for bulk payment
   */
  static async submitBulkPaymentReceipt(
    bulkPaymentId: string,
    receiptFile: File,
    description?: string
  ): Promise<BulkPaymentReceiptResult> {
    try {
      // Get bulk payment details
      const bulkPaymentRef = doc(firestore, this.COLLECTION_NAME, bulkPaymentId);
      const bulkPaymentSnap = await getDoc(bulkPaymentRef);
      
      if (!bulkPaymentSnap.exists()) {
        return {
          success: false,
          message: "Bulk payment not found"
        };
      }

      const bulkPayment = bulkPaymentSnap.data() as BulkDepositPayment;

      // Submit receipt using the NewReceiptService with proper bulk payment data
      const receiptResult = await NewReceiptService.submitReceipt(
        bulkPayment.sellerId,
        bulkPayment.sellerEmail,
        bulkPayment.sellerName,
        bulkPayment.totalDepositAmount,
        receiptFile,
        description || `Bulk deposit payment for ${bulkPayment.totalOrdersCount} orders`,
        {
          // Pass the actual pending deposit IDs for bulk processing
          pendingDepositIds: bulkPayment.pendingDepositIds,
          isBulkPayment: true,
          productName: `Bulk payment for ${bulkPayment.totalOrdersCount} orders`
        }
      );

      if (!receiptResult.success) {
        return {
          success: false,
          message: receiptResult.message
        };
      }

      // Update bulk payment with receipt info
      await updateDoc(bulkPaymentRef, {
        status: "receipt_submitted",
        receiptId: receiptResult.receiptId,
        receiptSubmittedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        message: "Bulk payment receipt submitted successfully",
        receiptId: receiptResult.receiptId
      };

    } catch (error) {
      console.error("Error submitting bulk payment receipt:", error);
      return {
        success: false,
        message: "Failed to submit receipt. Please try again."
      };
    }
  }

  /**
   * Approve bulk payment and process all deposits
   */
  static async approveBulkPayment(
    bulkPaymentId: string,
    approvedBy: string,
    approvedByName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const bulkPaymentRef = doc(firestore, this.COLLECTION_NAME, bulkPaymentId);
      const bulkPaymentSnap = await getDoc(bulkPaymentRef);
      
      if (!bulkPaymentSnap.exists()) {
        return {
          success: false,
          message: "Bulk payment not found"
        };
      }

      const bulkPayment = bulkPaymentSnap.data() as BulkDepositPayment;

      if (bulkPayment.status !== "receipt_submitted") {
        return {
          success: false,
          message: "Bulk payment is not in correct status for approval"
        };
      }

      // Process all deposits in batch
      const batch = writeBatch(firestore);

      // Update bulk payment status
      batch.update(bulkPaymentRef, {
        status: "approved",
        approvedAt: Timestamp.now(),
        approvedBy: approvedByName,
        updatedAt: Timestamp.now()
      });

      // Update all pending deposits and transfer profits
      for (const depositId of bulkPayment.pendingDepositIds) {
        const depositRef = doc(firestore, "pending_deposits", depositId);
        batch.update(depositRef, {
          status: "deposit_paid",
          depositPaidDate: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }

      await batch.commit();

      // Transfer profits to seller wallet (outside of batch due to transaction complexity)
      // This would typically be handled by the existing profit transfer system
      // For now, we'll log it and let the existing system handle it
      console.log(`✅ Bulk payment approved: ${bulkPaymentId}`);
      console.log(`💰 Total profit to transfer: $${bulkPayment.totalProfitAmount}`);
      console.log(`📦 Orders processed: ${bulkPayment.totalOrdersCount}`);

      return {
        success: true,
        message: `Bulk payment approved successfully. ${bulkPayment.totalOrdersCount} orders processed.`
      };

    } catch (error) {
      console.error("Error approving bulk payment:", error);
      return {
        success: false,
        message: "Failed to approve bulk payment. Please try again."
      };
    }
  }

  /**
   * Get bulk payments for a seller
   */
  static subscribeToBulkPayments(
    sellerId: string,
    callback: (bulkPayments: BulkDepositPayment[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION_NAME),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const bulkPayments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        receiptSubmittedAt: doc.data().receiptSubmittedAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      })) as BulkDepositPayment[];

      callback(bulkPayments);
    });
  }

  /**
   * Get all bulk payments (for admin)
   */
  static subscribeToAllBulkPayments(
    callback: (bulkPayments: BulkDepositPayment[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const bulkPayments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        receiptSubmittedAt: doc.data().receiptSubmittedAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      })) as BulkDepositPayment[];

      callback(bulkPayments);
    });
  }

  /**
   * Get sold orders that can be included in bulk payment
   */
  static async getSoldOrdersForBulkPayment(sellerId: string): Promise<PendingDeposit[]> {
    try {
      const q = query(
        collection(firestore, "pending_deposits"),
        where("sellerId", "==", sellerId),
        where("status", "==", "sold"),
        orderBy("saleDate", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        saleDate: doc.data().saleDate?.toDate(),
        depositPaidDate: doc.data().depositPaidDate?.toDate(),
        receiptSubmittedAt: doc.data().receiptSubmittedAt?.toDate()
      })) as PendingDeposit[];

    } catch (error) {
      console.error("Error fetching sold orders:", error);
      return [];
    }
  }
}

export default BulkDepositPaymentService;

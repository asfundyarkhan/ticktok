// Firestore service for payment receipt management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../lib/firebase/firebase";
import { UserService } from "./userService";

export interface Receipt {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: number;
  referenceNumber?: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  // New fields for pending deposit integration
  isDepositPayment?: boolean;
  pendingDepositId?: string;
  pendingProductId?: string;
  productName?: string;
}

export interface ReceiptSubmitResult {
  success: boolean;
  message: string;
  receiptId?: string;
}

export interface ReceiptApprovalResult {
  success: boolean;
  message: string;
  newBalance?: number;
}

export class ReceiptService {
  static COLLECTION = "receipts";
  /**
   * Submit a receipt for approval
   * @param userId User ID submitting the receipt
   * @param amount Amount of the payment
   * @param receiptFile Receipt image file
   * @param referenceNumber Optional reference number of the payment
   * @param depositInfo Optional deposit payment information
   * @returns Promise with submission result
   */
  static async submitReceipt(
    userId: string,
    amount: number,
    receiptFile: File,
    referenceNumber?: string,
    depositInfo?: {
      isDepositPayment?: boolean;
      pendingDepositId?: string;
      pendingProductId?: string;
      productName?: string;
    }
  ): Promise<ReceiptSubmitResult> {
    try {
      // 1. Upload the receipt image to Firebase Storage
      const imageUrl = await this.uploadReceiptImage(receiptFile, userId);

      if (!imageUrl) {
        return {
          success: false,
          message: "Failed to upload receipt image. Please try again.",
        };
      }

      // 2. Get user information to include in the receipt record
      const user = await UserService.getUserById(userId);

      if (!user) {
        return {
          success: false,
          message: "User not found. Please try again or contact support.",
        };
      }      // 3. Create the receipt record in Firestore
      const receipt: Receipt = {
        userId,
        userEmail: user.email,
        userName: user.displayName || user.email,
        amount,
        imageUrl,
        status: "pending",
        createdAt: new Date(),
        ...(referenceNumber && { referenceNumber }),
        // Add pending deposit information if provided
        ...(depositInfo?.isDepositPayment && {
          isDepositPayment: true,
          pendingDepositId: depositInfo.pendingDepositId,
          pendingProductId: depositInfo.pendingProductId,
          productName: depositInfo.productName
        })
      };

      const receiptRef = await addDoc(collection(firestore, this.COLLECTION), {
        ...receipt,
        createdAt: Timestamp.fromDate(receipt.createdAt),
      });

      return {
        success: true,
        message: "Receipt submitted successfully. It will be reviewed soon.",
        receiptId: receiptRef.id,
      };
    } catch (error) {
      console.error("Error submitting receipt:", error);
      return {
        success: false,
        message:
          "An error occurred while submitting the receipt. Please try again.",
      };
    }
  }

  /**
   * Upload receipt image to Firebase Storage
   * @param file The receipt image file
   * @param userId User ID for organization
   * @returns Promise with the download URL
   */ static async uploadReceiptImage(
    file: File,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const storageRef = ref(storage, `receipts/${userId}/${fileName}`);

      // Upload file with metadata to assist with CORS and permission issues
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          "Access-Control-Allow-Origin": "*",
          uploadedBy: "ticktok-shop",
          userId,
          uploadTimestamp: timestamp.toString(),
          publicAccess: "true", // Indicate this should be publicly accessible
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress monitoring (optional)
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Receipt upload is ${progress}% done`);
          },
          (error) => {
            console.error("Receipt upload failed:", error);

            // Log detailed error information
            console.warn(
              `Upload error details: Code=${error.code}, Message=${error.message}`
            );
            console.warn(`User ID: ${userId}, File name: ${fileName}`);

            // Handle unauthorized or permission errors specifically
            if (error.code === "storage/unauthorized") {
              console.warn(
                "Permission denied error during receipt upload. Check Firebase Storage rules."
              );

              // Create a more specific error message for the user
              resolve("");
              return;
            }

            // Check if it's a CORS error and provide information
            if (
              error.message.includes("CORS") ||
              error.message.includes("cross-origin")
            ) {
              console.warn("CORS error detected during receipt upload");
              resolve("");
              return;
            }

            reject(error);
          },
          async () => {
            try {
              // Try to get the download URL immediately after successful upload
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("Receipt upload successful, URL:", downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting receipt download URL:", error);

              // Try once more with a small delay in case it's just a timing issue
              setTimeout(async () => {
                try {
                  const downloadURL = await getDownloadURL(
                    uploadTask.snapshot.ref
                  );
                  resolve(downloadURL);
                } catch (retryError) {
                  console.error(
                    "Failed to get download URL on retry:",
                    retryError
                  );
                  resolve("");
                }
              }, 1000);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in receipt upload setup:", error);
      return "";
    }
  }

  /**
   * Get receipts submitted by a specific user
   * @param userId User ID to fetch receipts for
   * @returns Promise with array of receipts
   */
  static async getUserReceipts(userId: string): Promise<Receipt[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const receipts: Receipt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Receipt);
      });

      return receipts;
    } catch (error) {
      console.error("Error getting user receipts:", error);
      throw error;
    }
  }

  /**
   * Get all pending receipts (for superadmin)
   * @returns Promise with array of pending receipts
   */
  static async getPendingReceipts(): Promise<Receipt[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("status", "==", "pending"),
        orderBy("createdAt", "asc")
      );

      const querySnapshot = await getDocs(q);
      const receipts: Receipt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Receipt);
      });

      return receipts;
    } catch (error) {
      console.error("Error getting pending receipts:", error);
      throw error;
    }
  }

  /**
   * Subscribe to pending receipts (for real-time updates)
   * @param callback Function to call when the receipts change
   * @returns Unsubscribe function
   */
  static subscribeToPendingReceipts(
    callback: (receipts: Receipt[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
      where("status", "==", "pending"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const receipts: Receipt[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
        } as Receipt);
      });
      callback(receipts);
    });
  }

  /**
   * Subscribe to a user's receipts (for real-time updates)
   * @param userId User ID to subscribe to receipts for
   * @param callback Function to call when the receipts change
   * @returns Unsubscribe function
   */
  static subscribeToUserReceipts(
    userId: string,
    callback: (receipts: Receipt[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20) // Limit to 20 most recent receipts
    );

    return onSnapshot(q, (querySnapshot) => {
      const receipts: Receipt[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Receipt);
      });
      callback(receipts);
    });
  }
  /**
   * Approve a receipt (for superadmin)
   * @param receiptId Receipt ID to approve
   * @param superadminId Superadmin ID approving the receipt
   * @param notes Optional notes from the superadmin
   * @returns Promise with approval result
   */
  static async approveReceipt(
    receiptId: string,
    superadminId: string,
    notes?: string
  ): Promise<ReceiptApprovalResult> {
    try {
      // Import runTransaction here to avoid circular dependency issues
      const { runTransaction } = await import("firebase/firestore");

      return await runTransaction(firestore, async (transaction) => {
        // Get the receipt document
        const receiptRef = doc(firestore, this.COLLECTION, receiptId);
        const receiptSnap = await transaction.get(receiptRef);

        if (!receiptSnap.exists()) {
          throw new Error("Receipt not found");
        }

        const receiptData = receiptSnap.data() as Receipt;

        if (receiptData.status !== "pending") {
          throw new Error(`Receipt is already ${receiptData.status}`);
        }

        // Get the user document to update balance
        const userRef = doc(firestore, "users", receiptData.userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          throw new Error("User not found");
        }

        const userData = userSnap.data();
        let newBalance = userData.balance || 0; // Initialize with current balance
        
        // Check if this is a pending deposit payment
        if (receiptData.isDepositPayment && receiptData.pendingDepositId) {
          try {
            // For deposit payments, DON'T add the receipt amount to balance here
            // The profit will be added by the pending deposit service
            console.log(`🏦 Processing deposit receipt approval for deposit: ${receiptData.pendingDepositId}`);
            console.log(`🏦 Receipt amount: $${receiptData.amount}, User: ${receiptData.userId}`);
            
            // Import PendingDepositService dynamically to avoid circular dependencies
            const { PendingDepositService } = await import("./pendingDepositService");
            
            const depositResult = await PendingDepositService.markDepositPaid(
              receiptData.pendingDepositId,
              receiptData.userId
            );

            if (depositResult.success) {
              console.log(`✅ Successfully marked deposit as paid: ${depositResult.message}`);
              
              // Also update the pending product status if it exists
              if (receiptData.pendingProductId) {
                console.log(`🔄 Updating pending product status: ${receiptData.pendingProductId}`);
                const { PendingProductService } = await import("./pendingProductService");
                await PendingProductService.markDepositApproved(receiptData.pendingProductId);
                console.log(`✅ Pending product status updated to deposit_approved`);
              }
            } else {
              console.error(`❌ Failed to mark deposit as paid: ${depositResult.message}`);
            }
          } catch (depositError) {
            console.error("Error marking deposit as paid:", depositError);
            // Continue with receipt approval even if deposit marking fails
          }
        } else {
          // For regular withdrawal receipts, add the full amount to balance
          const currentBalance = userData.balance || 0;
          newBalance = currentBalance + receiptData.amount;

          console.log(`Regular receipt approval: adding ${receiptData.amount} to balance (${currentBalance} -> ${newBalance})`);

          // Update user's balance
          transaction.update(userRef, {
            balance: newBalance,
            updatedAt: Timestamp.now(),
          });
        }

        // Update the receipt status
        transaction.update(receiptRef, {
          status: "approved",
          approvedBy: superadminId,
          approvedAt: Timestamp.now(),
          notes: notes || "Receipt approved",
        });

        // Record commission if user has a referrer (admin)
        if (userData.referredBy) {
          try {
            // Import commission service dynamically to avoid circular dependencies
            const { CommissionService } = await import("./commissionService");
            
            await CommissionService.recordReceiptApprovalCommission(
              userData.referredBy,
              receiptData.userId,
              receiptData.amount,
              receiptId,
              `Receipt approval commission for ${receiptData.userEmail || "user"}`
            );
          } catch (commissionError) {
            console.error("Error recording receipt approval commission:", commissionError);
            // Don't fail the main transaction for commission error
          }
        }

        // Create activity log for the approved withdrawal
        const activityRef = collection(firestore, "activities");
        const newActivityDoc = doc(activityRef);

        // Prepare activity details, filtering out undefined values
        const activityDetails: {
          amount: number;
          receiptId: string;
          approvedBy: string;
          notes: string;
          reference?: string;
        } = {
          amount: receiptData.amount,
          receiptId: receiptId,
          approvedBy: superadminId,
          notes: notes || "Withdrawal approved",
        };

        // Only add reference if it exists
        if (receiptData.referenceNumber) {
          activityDetails.reference = receiptData.referenceNumber;
        }

        transaction.set(newActivityDoc, {
          userId: receiptData.userId,
          userDisplayName:
            receiptData.userName || receiptData.userEmail || "Unknown User",
          type: "withdrawal_approved",
          details: activityDetails,
          status: "completed",
          createdAt: Timestamp.now(),
        });

        return {
          success: true,
          message: "Receipt approved and funds added to user's account",
          newBalance,
        };
      });
    } catch (error) {
      console.error("Error approving receipt:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred while approving the receipt",
      };
    }
  }

  /**
   * Reject a receipt (for superadmin)
   * @param receiptId Receipt ID to reject
   * @param superadminId Superadmin ID rejecting the receipt
   * @param reason Reason for rejection
   * @returns Promise with rejection result
   */
  static async rejectReceipt(
    receiptId: string,
    superadminId: string,
    reason: string
  ): Promise<ReceiptApprovalResult> {
    try {
      const receiptRef = doc(firestore, this.COLLECTION, receiptId);
      const receiptSnap = await getDoc(receiptRef);

      if (!receiptSnap.exists()) {
        return {
          success: false,
          message: "Receipt not found",
        };
      }

      const receiptData = receiptSnap.data() as Receipt;

      if (receiptData.status !== "pending") {
        return {
          success: false,
          message: `Receipt is already ${receiptData.status}`,
        };
      } // Create activity log for the rejected withdrawal
      const activityRef = collection(firestore, "activities");
      const newActivityDoc = doc(activityRef);

      // Prepare activity details, filtering out undefined values
      const activityDetails: {
        amount: number;
        receiptId: string;
        rejectedBy: string;
        reason: string;
        reference?: string;
      } = {
        amount: receiptData.amount,
        receiptId: receiptId,
        rejectedBy: superadminId,
        reason: reason,
      };

      // Only add reference if it exists
      if (receiptData.referenceNumber) {
        activityDetails.reference = receiptData.referenceNumber;
      }

      await setDoc(newActivityDoc, {
        userId: receiptData.userId,
        userDisplayName:
          receiptData.userName || receiptData.userEmail || "Unknown User",
        type: "withdrawal_rejected",
        details: activityDetails,
        status: "failed",
        createdAt: Timestamp.now(),
      });

      // Update the receipt status
      await updateDoc(receiptRef, {
        status: "rejected",
        approvedBy: superadminId,
        approvedAt: Timestamp.now(),
        notes: reason || "Receipt rejected",
      });

      return {
        success: true,
        message: "Receipt rejected",
      };
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      return {
        success: false,
        message: "An error occurred while rejecting the receipt",
      };
    }
  }

  /**
   * Get a specific receipt by ID
   * @param receiptId Receipt ID to fetch
   * @returns Promise with the receipt or null if not found
   */
  static async getReceiptById(receiptId: string): Promise<Receipt | null> {
    try {
      const receiptRef = doc(firestore, this.COLLECTION, receiptId);
      const receiptSnap = await getDoc(receiptRef);

      if (!receiptSnap.exists()) {
        return null;
      }

      const data = receiptSnap.data();
      return {
        id: receiptSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        approvedAt: data.approvedAt?.toDate(),
      } as Receipt;
    } catch (error) {
      console.error("Error getting receipt by ID:", error);
      throw error;
    }
  }
}

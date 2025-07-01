// New Receipt Service - Proper backend integration with superadmin-only approval
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  runTransaction,
  Transaction,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../lib/firebase/firebase";

export interface NewReceipt {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  receiptImageUrl: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  processedAt?: Date;
  processedBy?: string; // Superadmin ID
  processedByName?: string;
  notes?: string;

  // Deposit payment integration
  isDepositPayment?: boolean;
  pendingDepositId?: string;
  pendingProductId?: string;
  productName?: string;
}

export interface ReceiptSubmissionResult {
  success: boolean;
  message: string;
  receiptId?: string;
}

export interface ReceiptProcessResult {
  success: boolean;
  message: string;
  newBalance?: number;
}

export class NewReceiptService {
  private static readonly COLLECTION = "receipts_v2";
  private static readonly STORAGE_PATH = "receipts";

  /**
   * Remove undefined values from an object for Firestore compatibility
   * Also handles null values and empty strings properly
   */
  private static cleanObjectForFirestore<T>(
    obj: Record<string, T | undefined | null>
  ): Record<string, T> {
    const cleaned: Record<string, T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        // Convert empty strings to null for optional fields, but keep them for required fields
        if (
          typeof value === "string" &&
          value === "" &&
          key !== "description"
        ) {
          continue; // Skip empty strings for optional fields
        }
        cleaned[key] = value as T;
      }
    }
    return cleaned;
  }

  /**
   * Submit a new receipt for approval
   */
  static async submitReceipt(
    userId: string,
    userEmail: string,
    userName: string,
    amount: number,
    receiptFile: File,
    description?: string,
    depositInfo?: {
      pendingDepositId: string;
      pendingProductId?: string;
      productName?: string;
    }
  ): Promise<ReceiptSubmissionResult> {
    try {
      console.log(
        `📋 Submitting receipt for user ${userEmail}, amount: $${amount}`
      );

      // Upload receipt image
      const imageUrl = await this.uploadReceiptImage(receiptFile, userId);
      if (!imageUrl) {
        return {
          success: false,
          message: "Failed to upload receipt image. Please try again.",
        };
      }

      // Create receipt document with explicit undefined handling
      const receiptData: Record<string, unknown> = {
        userId,
        userEmail,
        userName,
        amount,
        receiptImageUrl: imageUrl,
        description: description || "",
        status: "pending",
        submittedAt: Timestamp.now(),
        isDepositPayment: !!depositInfo,
      };

      // Only add deposit-related fields if they have actual values
      if (depositInfo?.pendingDepositId) {
        receiptData.pendingDepositId = depositInfo.pendingDepositId;
      }

      if (depositInfo?.pendingProductId) {
        receiptData.pendingProductId = depositInfo.pendingProductId;
      }

      if (depositInfo?.productName) {
        receiptData.productName = depositInfo.productName;
      }

      console.log("📋 Receipt data before submission:", receiptData);

      const docRef = await addDoc(
        collection(firestore, this.COLLECTION),
        receiptData
      );

      console.log(`✅ Receipt submitted successfully with ID: ${docRef.id}`);

      return {
        success: true,
        message:
          "Receipt submitted successfully! It will be reviewed by our admin team.",
        receiptId: docRef.id,
      };
    } catch (error) {
      console.error("❌ Error submitting receipt:", error);
      return {
        success: false,
        message: "Failed to submit receipt. Please try again.",
      };
    }
  }

  /**
   * Upload receipt image to Firebase Storage
   */
  private static async uploadReceiptImage(
    file: File,
    userId: string
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `receipt_${userId}_${timestamp}.${file.name
        .split(".")
        .pop()}`;
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          uploadedBy: userId,
          uploadTimestamp: timestamp.toString(),
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Receipt upload progress: ${progress}%`);
          },
          (error) => {
            console.error("Receipt upload failed:", error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log("✅ Receipt image uploaded successfully");
              resolve(downloadURL);
            } catch (error) {
              console.error("Failed to get download URL:", error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading receipt image:", error);
      throw error;
    }
  }

  /**
   * Get all pending receipts (for superadmin)
   */
  static async getPendingReceipts(): Promise<NewReceipt[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("status", "==", "pending"),
        orderBy("submittedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const receipts: NewReceipt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt.toDate(),
          processedAt: data.processedAt ? data.processedAt.toDate() : undefined,
        } as NewReceipt);
      });

      return receipts;
    } catch (error) {
      console.error("Error getting pending receipts:", error);
      return [];
    }
  }

  /**
   * Subscribe to pending receipts for real-time updates (for superadmin)
   */
  static subscribeToPendingReceipts(
    callback: (receipts: NewReceipt[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
      where("status", "==", "pending"),
      orderBy("submittedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const receipts: NewReceipt[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          processedAt: data.processedAt?.toDate?.() || undefined,
        } as NewReceipt;
      });

      callback(receipts);
    });
  }

  /**
   * Approve a receipt (superadmin only)
   */
  static async approveReceipt(
    receiptId: string,
    superadminId: string,
    superadminName: string,
    notes?: string
  ): Promise<ReceiptProcessResult> {
    try {
      console.log(
        `🟢 Processing receipt approval: ${receiptId} by ${superadminName}`
      );

      return await runTransaction(
        firestore,
        async (transaction: Transaction) => {
          // Get receipt data
          const receiptRef = doc(firestore, this.COLLECTION, receiptId);
          const receiptDoc = await transaction.get(receiptRef);

          if (!receiptDoc.exists()) {
            return { success: false, message: "Receipt not found" };
          }

          const receiptData = receiptDoc.data() as NewReceipt;

          if (receiptData.status !== "pending") {
            return {
              success: false,
              message: "Receipt has already been processed",
            };
          }

          // Get user data
          const userRef = doc(firestore, "users", receiptData.userId);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists()) {
            return { success: false, message: "User not found" };
          }

          const userData = userDoc.data();
          let newBalance = userData.balance || 0;

          // Handle different types of receipts
          if (receiptData.isDepositPayment && receiptData.pendingDepositId) {
            // Deposit payment - process through pending deposit service
            console.log(
              `🏦 Processing deposit payment for: ${receiptData.pendingDepositId}`
            );

            try {
              const { PendingDepositService } = await import(
                "./pendingDepositService"
              );
              const depositResult = await PendingDepositService.markDepositPaid(
                receiptData.pendingDepositId,
                receiptData.userId
              );

              if (!depositResult.success) {
                return {
                  success: false,
                  message: `Failed to process deposit: ${depositResult.message}`,
                };
              }

              // Update pending product if exists
              if (receiptData.pendingProductId) {
                const { PendingProductService } = await import(
                  "./pendingProductService"
                );
                await PendingProductService.markDepositApproved(
                  receiptData.pendingProductId
                );
                console.log(
                  `✅ Pending product ${receiptData.pendingProductId} marked as deposit approved`
                );
              }

              console.log(`✅ Deposit payment processed successfully`);
            } catch (error) {
              console.error("Error processing deposit payment:", error);
              return {
                success: false,
                message: "Failed to process deposit payment",
              };
            }
          } else {
            // Regular withdrawal receipt - add to balance
            newBalance = (userData.balance || 0) + receiptData.amount;

            console.log(
              `💰 Adding ${receiptData.amount} to user balance (${
                userData.balance || 0
              } -> ${newBalance})`
            );

            transaction.update(userRef, {
              balance: newBalance,
              updatedAt: Timestamp.now(),
            });
          }

          // Update receipt status
          const updateData = this.cleanObjectForFirestore({
            status: "approved",
            processedAt: Timestamp.now(),
            processedBy: superadminId,
            processedByName: superadminName,
            notes: notes || "Receipt approved",
          });

          transaction.update(receiptRef, updateData);

          // Record commission if user has referrer
          if (userData.referredBy) {
            try {
              const { CommissionService } = await import("./commissionService");
              await CommissionService.recordReceiptApprovalCommission(
                userData.referredBy,
                receiptData.userId,
                receiptData.amount,
                receiptId,
                `Receipt approval commission for ${receiptData.userEmail}`
              );
            } catch (commissionError) {
              console.error("Error recording commission:", commissionError);
              // Don't fail the transaction for commission error
            }
          }

          console.log(`✅ Receipt ${receiptId} approved successfully`);

          return {
            success: true,
            message: receiptData.isDepositPayment
              ? `Deposit receipt approved! Profit has been added to ${receiptData.userName}'s wallet.`
              : `Withdrawal receipt approved! $${receiptData.amount} has been added to ${receiptData.userName}'s balance.`,
            newBalance,
          };
        }
      );
    } catch (error) {
      console.error("❌ Error approving receipt:", error);
      return {
        success: false,
        message: "Failed to approve receipt. Please try again.",
      };
    }
  }

  /**
   * Reject a receipt (superadmin only)
   */
  static async rejectReceipt(
    receiptId: string,
    superadminId: string,
    superadminName: string,
    notes: string
  ): Promise<ReceiptProcessResult> {
    try {
      console.log(`🔴 Rejecting receipt: ${receiptId} by ${superadminName}`);

      const receiptRef = doc(firestore, this.COLLECTION, receiptId);
      const receiptDoc = await getDoc(receiptRef);

      if (!receiptDoc.exists()) {
        return { success: false, message: "Receipt not found" };
      }

      const receiptData = receiptDoc.data() as NewReceipt;

      if (receiptData.status !== "pending") {
        return {
          success: false,
          message: "Receipt has already been processed",
        };
      }

      const updateData = this.cleanObjectForFirestore({
        status: "rejected",
        processedAt: Timestamp.now(),
        processedBy: superadminId,
        processedByName: superadminName,
        notes: notes || "Receipt rejected",
      });

      await updateDoc(receiptRef, updateData);

      console.log(`✅ Receipt ${receiptId} rejected successfully`);

      return {
        success: true,
        message: `Receipt rejected. Reason: ${notes}`,
      };
    } catch (error) {
      console.error("❌ Error rejecting receipt:", error);
      return {
        success: false,
        message: "Failed to reject receipt. Please try again.",
      };
    }
  }

  // Subscribe to user receipts for real-time updates
  static subscribeToUserReceipts(
    userId: string,
    callback: (receipts: NewReceipt[]) => void
  ): () => void {
    const receiptsRef = collection(firestore, "receipts_v2");
    const q = query(
      receiptsRef,
      where("userId", "==", userId),
      orderBy("submittedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const receipts: NewReceipt[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          processedAt: data.processedAt?.toDate?.() || undefined,
        } as NewReceipt;
      });

      callback(receipts);
    });
  }

  // Get user receipts
  static async getUserReceipts(userId: string): Promise<NewReceipt[]> {
    try {
      const receiptsRef = collection(firestore, "receipts_v2");
      const q = query(
        receiptsRef,
        where("userId", "==", userId),
        orderBy("submittedAt", "desc")
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          processedAt: data.processedAt?.toDate?.() || undefined,
        } as NewReceipt;
      });
    } catch (error) {
      console.error("Error getting user receipts:", error);
      return [];
    }
  }
}

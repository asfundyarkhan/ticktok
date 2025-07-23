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
  Transaction,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../lib/firebase/firebase";
import { TransactionHelperService } from "./transactionHelperService";

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

  // Bulk payment integration
  isBulkPayment?: boolean;
  pendingDepositIds?: string[];
  bulkOrderCount?: number;

  // Wallet payment integration
  isWalletPayment?: boolean;
  walletBalanceUsed?: number;
  isAutoProcessed?: boolean; // True if wallet payment was auto-processed
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
      pendingDepositId?: string; // Made optional for bulk payments
      pendingProductId?: string;
      productName?: string;
      pendingDepositIds?: string[]; // For bulk payments
      isBulkPayment?: boolean; // Flag to indicate bulk payment
    },
    walletPayment?: {
      isWalletPayment: boolean;
      walletBalanceUsed?: number;
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
        status: walletPayment?.isWalletPayment ? "approved" : "pending", // Auto-approve wallet payments
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

      // Add bulk payment fields
      if (depositInfo?.isBulkPayment) {
        receiptData.isBulkPayment = true;
        if (depositInfo.pendingDepositIds && depositInfo.pendingDepositIds.length > 0) {
          receiptData.pendingDepositIds = depositInfo.pendingDepositIds;
          receiptData.bulkOrderCount = depositInfo.pendingDepositIds.length;
        }
      }

      // Add wallet payment information if provided
      if (walletPayment?.isWalletPayment) {
        receiptData.isWalletPayment = true;
        receiptData.walletBalanceUsed =
          walletPayment.walletBalanceUsed || amount;
      }

      console.log("📋 Receipt data before submission:", receiptData);

      // For wallet payments, we need to handle the payment immediately
      if (walletPayment?.isWalletPayment) {
        console.log(
          `💳 Processing wallet payment of $${
            walletPayment.walletBalanceUsed || amount
          }`
        );

        // Import UserService to deduct wallet balance
        const { UserService } = await import("./userService");

        try {
          const deductedBalance = await UserService.subtractUserBalance(
            userId,
            walletPayment.walletBalanceUsed || amount
          );
          console.log(
            `✅ Wallet balance deducted successfully. New balance: $${deductedBalance}`
          );

          // For wallet payments, set as approved immediately
          receiptData.status = "approved";
          receiptData.isAutoProcessed = true;
          receiptData.processedAt = Timestamp.now();
          receiptData.approvedAt = Timestamp.now();
          receiptData.approvedBy = "SYSTEM_WALLET_PAYMENT";
          receiptData.processedBy = "system";
          receiptData.processedByName = "System (Wallet Payment)";
          receiptData.notes = `Paid via wallet balance. Amount deducted: $${
            walletPayment.walletBalanceUsed || amount
          }`;
        } catch (error) {
          console.error("❌ Error deducting wallet balance:", error);
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Insufficient wallet balance or error processing payment.",
          };
        }
      }

      const docRef = await addDoc(
        collection(firestore, this.COLLECTION),
        receiptData
      );

      console.log(`✅ Receipt submitted successfully with ID: ${docRef.id}`);

      // If this is a deposit payment, update the pending deposit status
      if (depositInfo?.pendingDepositId) {
        try {
          const { PendingDepositService } = await import(
            "./pendingDepositService"
          );

          // For wallet payments, mark deposit as paid immediately
          if (walletPayment?.isWalletPayment) {
            const markDepositResult =
              await PendingDepositService.markDepositPaid(
                depositInfo.pendingDepositId,
                receiptData.userId as string // Pass the seller ID, not the receipt ID
              );
            if (markDepositResult.success) {
              console.log(
                `✅ Deposit marked as paid via wallet payment: ${markDepositResult.message}`
              );
            } else {
              console.error(
                `❌ Failed to mark deposit as paid: ${markDepositResult.message}`
              );
            }
          } else {
            await PendingDepositService.updateDepositStatus(
              depositInfo.pendingDepositId,
              "receipt_submitted",
              docRef.id
            );
            console.log(
              `✅ Updated pending deposit status to receipt_submitted`
            );
          }

          // Also update any related pending product status
          if (depositInfo.pendingProductId) {
            try {
              const { PendingProductService } = await import(
                "./pendingProductService"
              );
              const pendingProducts =
                await PendingProductService.getSellerPendingProducts(
                  receiptData.userId as string
                );
              const targetProduct = pendingProducts.find(
                (p) => p.id === depositInfo.pendingProductId
              );

              if (targetProduct) {
                const newStatus = walletPayment?.isWalletPayment
                  ? "deposit_approved"
                  : "deposit_submitted";
                await PendingProductService.updateStatusAcrossSystems(
                  receiptData.userId as string,
                  targetProduct.productId,
                  newStatus
                );
                console.log(
                  `✅ Updated pending product status to ${newStatus}`
                );
              }
            } catch (error) {
              console.error("❌ Error updating pending product status:", error);
            }
          }
        } catch (error) {
          console.error("❌ Error updating pending deposit status:", error);
          // Don't fail the whole operation if this fails
        }
      }

      // Handle bulk deposit payments (for wallet payments and regular receipts)
      if (depositInfo?.pendingDepositIds && depositInfo.pendingDepositIds.length > 0) {
        try {
          const { PendingDepositService } = await import(
            "./pendingDepositService"
          );

          // For wallet payments, mark ALL deposits as paid immediately
          if (walletPayment?.isWalletPayment) {
            console.log(`💳 Processing bulk wallet payment for ${depositInfo.pendingDepositIds.length} deposits`);
            
            let successCount = 0;
            let failureCount = 0;

            for (const depositId of depositInfo.pendingDepositIds) {
              try {
                const markDepositResult = await PendingDepositService.markDepositPaid(
                  depositId,
                  receiptData.userId as string
                );
                
                if (markDepositResult.success) {
                  successCount++;
                  console.log(`✅ Bulk deposit ${depositId} marked as paid via wallet: ${markDepositResult.message}`);
                } else {
                  failureCount++;
                  console.error(`❌ Failed to mark bulk deposit ${depositId} as paid: ${markDepositResult.message}`);
                }
              } catch (error) {
                failureCount++;
                console.error(`❌ Error processing bulk deposit ${depositId}:`, error);
              }
            }

            console.log(`💳 Bulk wallet payment processing complete: ${successCount} success, ${failureCount} failures`);
          } else {
            // For non-wallet payments, update all deposits to receipt_submitted
            for (const depositId of depositInfo.pendingDepositIds) {
              try {
                await PendingDepositService.updateDepositStatus(
                  depositId,
                  "receipt_submitted",
                  docRef.id
                );
              } catch (error) {
                console.error(`❌ Error updating bulk deposit ${depositId} status:`, error);
              }
            }
            console.log(`✅ Updated ${depositInfo.pendingDepositIds.length} bulk deposits to receipt_submitted`);
          }
        } catch (error) {
          console.error("❌ Error updating bulk deposit status:", error);
          // Don't fail the whole operation if this fails
        }
      }

      const message = walletPayment?.isWalletPayment
        ? "Payment processed successfully via wallet balance! Your profit has been added to your wallet."
        : "Receipt submitted successfully! It will be reviewed by our admin team.";

      return {
        success: true,
        message,
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
        const receipt = {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt.toDate(),
          processedAt: data.processedAt ? data.processedAt.toDate() : undefined,
        } as NewReceipt;

        // Filter out auto-processed receipts from pending view
        if (!receipt.isAutoProcessed) {
          receipts.push(receipt);
        }
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
      const receipts: NewReceipt[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate?.() || new Date(),
            processedAt: data.processedAt?.toDate?.() || undefined,
          } as NewReceipt;
        })
        // Filter out auto-processed receipts from pending view
        .filter((receipt) => !receipt.isAutoProcessed);

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

      // First, handle deposit processing outside of the main transaction
      // to avoid multiple processing during retries
      let depositProcessed = false;
      let depositProcessingResult: {
        success: boolean;
        message: string;
      } | null = null;

      // Get receipt data first to check if it's a deposit payment
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

      // Handle deposit payment processing outside of the main transaction
      if (receiptData.isDepositPayment) {
        // Handle both single and bulk deposit payments
        if (receiptData.isBulkPayment && receiptData.pendingDepositIds && receiptData.pendingDepositIds.length > 0) {
          console.log(
            `🏦 Processing bulk deposit payment for ${receiptData.pendingDepositIds.length} deposits: ${receiptData.pendingDepositIds.join(', ')}`
          );

          try {
            const { PendingDepositService } = await import(
              "./pendingDepositService"
            );

            let allDepositsProcessed = true;
            let processedCount = 0;
            let skippedCount = 0;
            const processingErrors: string[] = [];

            // Process each deposit in the bulk payment
            for (const depositId of receiptData.pendingDepositIds) {
              try {
                // Check if deposit is already processed to avoid duplicate processing
                const existingDeposit = await PendingDepositService.getDepositById(depositId);
                if (existingDeposit && existingDeposit.status === "deposit_paid") {
                  console.log(`✅ Deposit ${depositId} already processed, skipping`);
                  skippedCount++;
                  continue;
                }

                const depositResult = await PendingDepositService.markDepositPaid(
                  depositId,
                  receiptData.userId
                );

                if (depositResult.success) {
                  processedCount++;
                  console.log(`✅ Processed deposit ${depositId}`);
                } else {
                  processingErrors.push(`Failed to process ${depositId}: ${depositResult.message}`);
                  allDepositsProcessed = false;
                }
              } catch (error) {
                const errorMsg = `Error processing deposit ${depositId}: ${error}`;
                console.error(errorMsg);
                processingErrors.push(errorMsg);
                allDepositsProcessed = false;
              }
            }

            depositProcessed = allDepositsProcessed || processedCount > 0; // Success if we processed at least some
            depositProcessingResult = {
              success: depositProcessed,
              message: `Bulk payment: ${processedCount} processed, ${skippedCount} already paid${processingErrors.length > 0 ? `, ${processingErrors.length} errors` : ''}`
            };

            console.log(`✅ Bulk deposit payment processed: ${processedCount}/${receiptData.pendingDepositIds.length} deposits`);
            if (processingErrors.length > 0) {
              console.error('Processing errors:', processingErrors);
            }

          } catch (error) {
            console.error("Error processing bulk deposit payment:", error);
            return {
              success: false,
              message: "Failed to process bulk deposit payment",
            };
          }

        } else if (receiptData.pendingDepositId) {
          // Handle single deposit payment (original logic)
          console.log(
            `🏦 Processing single deposit payment for: ${receiptData.pendingDepositId}`
          );

          try {
            const { PendingDepositService } = await import(
              "./pendingDepositService"
            );

            // Check if deposit is already processed to avoid duplicate processing
            const existingDeposit = await PendingDepositService.getDepositById(
              receiptData.pendingDepositId
            );
            if (existingDeposit && existingDeposit.status === "deposit_paid") {
              console.log(
                `✅ Deposit ${receiptData.pendingDepositId} already processed, skipping`
              );
              depositProcessed = true;
              depositProcessingResult = {
                success: true,
                message: "Deposit already processed",
              };
            } else {
              depositProcessingResult =
                await PendingDepositService.markDepositPaid(
                  receiptData.pendingDepositId,
                  receiptData.userId
                );
              depositProcessed = depositProcessingResult.success;
            }

            if (depositProcessed && receiptData.pendingProductId) {
              try {
                const { PendingProductService } = await import(
                  "./pendingProductService"
                );

                // Get the pending product to find the productId
                const pendingProducts =
                  await PendingProductService.getSellerPendingProducts(
                    receiptData.userId
                  );
                const targetProduct = pendingProducts.find(
                  (p) => p.id === receiptData.pendingProductId
                );

                if (targetProduct) {
                  // Only update to deposit_approved when deposit is actually processed
                  // The deposit processing should handle this status update automatically
                  console.log(
                    `✅ Deposit processed for product ${targetProduct.productId}, status will be updated by deposit service`
                  );
                }
              } catch (error) {
                console.error("Error updating status across systems:", error);
                // Don't fail the whole process if this fails
              }
            }

            console.log(`✅ Single deposit payment processed: ${depositProcessed}`);
          } catch (error) {
            console.error("Error processing single deposit payment:", error);
            return {
              success: false,
              message: "Failed to process single deposit payment",
            };
          }
        }

        if (!depositProcessed) {
          return {
            success: false,
            message:
              depositProcessingResult?.message ||
              "Failed to process deposit payment",
          };
        }
      }

      // Now handle the receipt approval transaction
      const result = await TransactionHelperService.executeWithRetry(
        firestore,
        async (transaction: Transaction) => {
          // Re-read receipt data within transaction
          const receiptDocTx = await transaction.get(receiptRef);

          if (!receiptDocTx.exists()) {
            return { success: false, message: "Receipt not found" };
          }

          const receiptDataTx = receiptDocTx.data() as NewReceipt;

          if (receiptDataTx.status !== "pending") {
            return {
              success: false,
              message: "Receipt has already been processed",
            };
          }

          // Get user data
          const userRef = doc(firestore, "users", receiptDataTx.userId);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists()) {
            return { success: false, message: "User not found" };
          }

          const userData = userDoc.data();
          let newBalance = userData.balance || 0;

          // Handle different types of receipts
          if (!receiptDataTx.isDepositPayment) {
            // Regular withdrawal receipt - add to balance
            newBalance = (userData.balance || 0) + receiptDataTx.amount;

            console.log(
              `💰 Adding ${receiptDataTx.amount} to user balance (${
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

          console.log(`✅ Receipt ${receiptId} approved successfully`);

          return {
            success: true,
            message: receiptDataTx.isDepositPayment
              ? `Deposit receipt approved! Profit has been added to ${receiptDataTx.userName}'s wallet.`
              : `Withdrawal receipt approved! $${receiptDataTx.amount} has been added to ${receiptDataTx.userName}'s balance.`,
            newBalance,
          };
        },
        { maxRetries: 3, baseDelayMs: 100 } // Reduced retries since deposit is handled separately
      );

      if (result.success && result.result) {
        // Handle commission recording after main transaction succeeds
        try {
          const userRef = doc(firestore, "users", receiptData.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          if (userData?.referredBy) {
            const { CommissionService } = await import("./commissionService");
            await CommissionService.recordReceiptApprovalCommission(
              userData.referredBy,
              receiptData.userId,
              receiptData.amount,
              receiptId,
              `Receipt approval commission for ${receiptData.userEmail}`
            );
          }
        } catch (commissionError) {
          console.error("Error recording commission:", commissionError);
          // Don't fail the whole operation for commission error
        }

        return result.result;
      } else {
        return {
          success: false,
          message: result.error || "Failed to approve receipt",
        };
      }
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

  /**
   * Subscribe to all receipts for revenue calculation (for superadmin dashboard)
   */
  static subscribeToAllReceipts(
    callback: (receipts: NewReceipt[]) => void
  ): () => void {
    const q = query(
      collection(firestore, this.COLLECTION),
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
   * Get all receipts for revenue calculation (for superadmin)
   */
  static async getAllReceipts(): Promise<NewReceipt[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        orderBy("submittedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const receipts: NewReceipt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        receipts.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          processedAt: data.processedAt?.toDate?.() || undefined,
        } as NewReceipt);
      });

      return receipts;
    } catch (error) {
      console.error("Error getting all receipts:", error);
      return [];
    }
  }

  /**
   * Fix auto-processed receipts by updating their status to approved
   * This helps reset the pending counter without deleting data
   */
  static async fixAutoProcessedReceipts(): Promise<{
    success: boolean;
    message: string;
    processedCount: number;
  }> {
    try {
      console.log("🔧 Starting to fix auto-processed receipts...");

      // Get all receipts that are auto-processed but still marked as pending
      const q = query(
        collection(firestore, this.COLLECTION),
        where("status", "==", "pending"),
        where("isAutoProcessed", "==", true)
      );

      const querySnapshot = await getDocs(q);
      let processedCount = 0;

      console.log(
        `Found ${querySnapshot.docs.length} auto-processed receipts to fix`
      );

      // Update each auto-processed receipt to approved status
      for (const docSnapshot of querySnapshot.docs) {
        const docRef = doc(firestore, this.COLLECTION, docSnapshot.id);
        await updateDoc(docRef, {
          status: "approved",
          processedAt: Timestamp.now(),
          notes:
            "Auto-processed wallet payment - status corrected by system cleanup",
        });
        processedCount++;
        console.log(`✅ Fixed receipt ${docSnapshot.id}`);
      }

      return {
        success: true,
        message: `Successfully fixed ${processedCount} auto-processed receipts`,
        processedCount,
      };
    } catch (error) {
      console.error("❌ Error fixing auto-processed receipts:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fix receipts",
        processedCount: 0,
      };
    }
  }
}

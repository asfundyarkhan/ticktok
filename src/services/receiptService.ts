// Firestore service for payment receipt management
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
  referenceNumber: string;
  imageUrl: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
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
   * @param referenceNumber Reference number of the payment
   * @param receiptFile Receipt image file
   * @returns Promise with submission result
   */
  static async submitReceipt(
    userId: string,
    amount: number,
    referenceNumber: string,
    receiptFile: File
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
      }

      // 3. Create the receipt record in Firestore
      const receipt: Receipt = {
        userId,
        userEmail: user.email,
        userName: user.displayName || user.email,
        amount,
        referenceNumber,
        imageUrl,
        status: "pending",
        createdAt: new Date(),
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
      // 1. Get the receipt details
      const receiptRef = doc(firestore, this.COLLECTION, receiptId);
      const receiptSnap = await getDoc(receiptRef);

      if (!receiptSnap.exists()) {
        return {
          success: false,
          message: "Receipt not found",
        };
      }

      const receiptData = receiptSnap.data() as Receipt;

      // 2. Make sure it's in pending status
      if (receiptData.status !== "pending") {
        return {
          success: false,
          message: `Receipt is already ${receiptData.status}`,
        };
      }

      // 3. Update the user's balance
      const newBalance = await UserService.updateUserBalance(
        receiptData.userId,
        receiptData.amount
      );

      // 4. Update the receipt status
      await updateDoc(receiptRef, {
        status: "approved",
        approvedBy: superadminId,
        approvedAt: Timestamp.now(),
        notes: notes || "Receipt approved",
      });

      return {
        success: true,
        message: "Receipt approved and funds added to user's account",
        newBalance,
      };
    } catch (error) {
      console.error("Error approving receipt:", error);
      return {
        success: false,
        message: "An error occurred while approving the receipt",
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
      // 1. Get the receipt details
      const receiptRef = doc(firestore, this.COLLECTION, receiptId);
      const receiptSnap = await getDoc(receiptRef);

      if (!receiptSnap.exists()) {
        return {
          success: false,
          message: "Receipt not found",
        };
      }

      const receiptData = receiptSnap.data() as Receipt;

      // 2. Make sure it's in pending status
      if (receiptData.status !== "pending") {
        return {
          success: false,
          message: `Receipt is already ${receiptData.status}`,
        };
      }

      // 3. Update the receipt status
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

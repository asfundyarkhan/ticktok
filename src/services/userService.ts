// Firestore service for users
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore, storage } from "../lib/firebase/firebase";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";

// Export the updateUserProfile function for backward compatibility
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  return UserService.updateUserProfile(uid, data);
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  balance: number;
  role: "user" | "seller" | "admin" | "superadmin";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  suspended?: boolean;
  referralCode?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  static COLLECTION = "users";

  // Collection for tracking referral code history
  private static readonly REFERRAL_HISTORY_COLLECTION = "referral_code_history";

  // Get user by ID
  static async getUserById(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(firestore, this.COLLECTION, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  }

  // Alias for getUserById for consistency
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    return this.getUserById(uid);
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("email", "==", email)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserProfile;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user by email:", error);
      throw error;
    }
  }

  // Get users by role
  static async getUsersByRole(
    role: "user" | "seller" | "admin" | "superadmin"
  ): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("role", "==", role)
      );

      const querySnapshot = await getDocs(q);
      const users: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(),
        } as UserProfile);
      });

      return users;
    } catch (error) {
      console.error("Error getting users by role:", error);
      throw error;
    }
  }

  // Create/Update user profile
  static async updateUserProfile(
    uid: string,
    data: Partial<UserProfile>,
    adminId?: string,
    adminName?: string
  ): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);

      // Get current user data for activity logging
      const userSnap = await getDoc(userRef);
      const currentUserData = userSnap.exists()
        ? (userSnap.data() as UserProfile)
        : null;

      // Filter out any undefined values to prevent Firestore errors
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );

      // Convert Date objects to Firestore Timestamps
      const firestoreData = {
        ...filteredData,
        updatedAt: Timestamp.now(),
      };

      await setDoc(userRef, firestoreData, { merge: true });

      // Log activity if suspension status changed
      if (
        currentUserData &&
        "suspended" in filteredData &&
        filteredData.suspended !== currentUserData.suspended
      ) {
        try {
          const { ActivityService } = await import("./activityService");
          await ActivityService.logUserSuspension(
            uid,
            currentUserData.displayName ||
              currentUserData.email ||
              "Unknown User",
            !!filteredData.suspended,
            adminId,
            adminName
          );
        } catch (activityError) {
          console.error(
            "Error logging user suspension activity:",
            activityError
          );
          // Don't fail the profile update if activity logging fails
        }
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Update user balance
  static async updateUserBalance(uid: string, amount: number): Promise<number> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as UserProfile;
      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(userRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      return newBalance;
    } catch (error) {
      console.error("Error updating user balance:", error);
      throw error;
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(file: File, uid: string): Promise<string> {
    try {
      const fileExtension = file.name.split(".").pop();
      const storageRef = ref(storage, `users/${uid}/profile.${fileExtension}`);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          "Access-Control-Allow-Origin": "*",
          uploadedBy: "ticktok-shop",
          userId: uid,
          uploadTimestamp: Date.now().toString(),
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Optional: Track upload progress
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error("Profile picture upload failed:", error);

            // Check if it's a CORS error and provide fallback
            if (
              error.code === "storage/unauthorized" ||
              error.message.includes("CORS") ||
              error.message.includes("cross-origin")
            ) {
              console.warn(
                "CORS error detected, skipping profile picture upload"
              );
              resolve(""); // Return empty string to indicate no photo URL
              return;
            }

            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Update user profile with new photo URL
              const userRef = doc(firestore, this.COLLECTION, uid);
              await updateDoc(userRef, {
                photoURL: downloadURL,
                updatedAt: Timestamp.now(),
              });

              resolve(downloadURL);
            } catch (error) {
              console.error(
                "Error getting download URL for profile picture:",
                error
              );
              // Don't update profile if URL retrieval fails
              resolve("");
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);

      // Check if it's a CORS-related error
      if (
        error instanceof Error &&
        (error.message.includes("CORS") ||
          error.message.includes("cross-origin") ||
          error.message.includes("unauthorized"))
      ) {
        console.warn("CORS error in profile picture upload setup");
        return ""; // Return empty string instead of throwing
      }

      throw error;
    }
  }

  // Check if a user is a seller
  static async isUserSeller(uid: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return false;
      }

      const userData = userSnap.data() as UserProfile;
      return userData.role === "seller" || userData.role === "admin";
    } catch (error) {
      console.error("Error checking if user is a seller:", error);
      throw error;
    }
  } // Upgrade user to seller role
  static async upgradeToSeller(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      await updateDoc(userRef, {
        role: "seller",
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error upgrading user to seller:", error);
      throw error;
    }
  }

  // Ensure admin/superadmin accounts have sufficient balance for purchasing
  static async ensureAdminBalance(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as UserProfile;

      // Only update balance for admin and superadmin roles
      if (userData.role === "admin" || userData.role === "superadmin") {
        const adminBalance = 99999;

        // Only update if current balance is less than admin balance
        if ((userData.balance || 0) < adminBalance) {
          await updateDoc(userRef, {
            balance: adminBalance,
            updatedAt: Timestamp.now(),
          });
          console.log(
            `Updated admin/superadmin ${uid} balance to ${adminBalance}`
          );
        }
      }
    } catch (error) {
      console.error("Error ensuring admin balance:", error);
      throw error;
    }
  }

  // Upgrade user to admin role and set admin balance
  static async upgradeToAdmin(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      await updateDoc(userRef, {
        role: "admin",
        balance: 99999, // Set admin balance immediately
        updatedAt: Timestamp.now(),
      });
      console.log(`Upgraded user ${uid} to admin with balance 99999`);
    } catch (error) {
      console.error("Error upgrading user to admin:", error);
      throw error;
    }
  }

  // Upgrade user to superadmin role and set admin balance
  static async upgradeToSuperAdmin(uid: string): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      await updateDoc(userRef, {
        role: "superadmin",
        balance: 99999, // Set admin balance immediately
        updatedAt: Timestamp.now(),
      });
      console.log(`Upgraded user ${uid} to superadmin with balance 99999`);
    } catch (error) {
      console.error("Error upgrading user to superadmin:", error);
      throw error;
    }
  }

  // Generate a unique referral code for a user (deprecated - use generateReferralCodeWithHistory)
  static async generateReferralCode(uid: string): Promise<string> {
    console.warn(
      "generateReferralCode is deprecated, using generateReferralCodeWithHistory instead"
    );
    return this.generateReferralCodeWithHistory(uid);
  }

  // Validate a referral code and check if it belongs to an admin (deprecated - use validateReferralCodeWithHistory)
  static async validateReferralCode(
    referralCode: string
  ): Promise<{ isValid: boolean; adminUid?: string }> {
    console.warn(
      "validateReferralCode is deprecated, using validateReferralCodeWithHistory instead"
    );
    return this.validateReferralCodeWithHistory(referralCode);
  }

  // Upgrade user to seller role with referral code
  static async upgradeToSellerWithReferral(
    uid: string,
    referralCode: string
  ): Promise<boolean> {
    try {
      // First validate the referral code
      const validation = await this.validateReferralCode(referralCode);

      if (!validation.isValid) {
        return false;
      }

      const userRef = doc(firestore, this.COLLECTION, uid);

      // Update user to seller role and record referral information
      await updateDoc(userRef, {
        role: "seller",
        referredBy: validation.adminUid,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error("Error upgrading user to seller with referral:", error);
      throw error;
    }
  }

  // Get users referred by a specific admin
  static async getUsersReferredByAdmin(
    adminUid: string
  ): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("referredBy", "==", adminUid)
      );

      const querySnapshot = await getDocs(q);
      const referredUsers: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        referredUsers.push({
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
          updatedAt: data.updatedAt?.toDate
            ? data.updatedAt.toDate()
            : new Date(),
        } as UserProfile);
      });

      return referredUsers;
    } catch (error) {
      console.error("Error getting users referred by admin:", error);
      throw error;
    }
  }

  // Get all referral relationships (for super admins)
  static async getAllReferralRelationships(): Promise<
    { user: UserProfile; referrer: UserProfile }[]
  > {
    try {
      // Get all users who have been referred
      const q = query(
        collection(firestore, this.COLLECTION),
        where("referredBy", "!=", null)
      );

      const querySnapshot = await getDocs(q);
      const referralPromises: Promise<{
        user: UserProfile;
        referrer: UserProfile | null;
      }>[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const referredBy = userData.referredBy;

        if (referredBy) {
          const userProfile = {
            uid: doc.id,
            ...userData,
            createdAt: userData.createdAt?.toDate
              ? userData.createdAt.toDate()
              : new Date(),
            updatedAt: userData.updatedAt?.toDate
              ? userData.updatedAt.toDate()
              : new Date(),
          } as UserProfile;

          // For each referred user, get their referrer
          const referralPromise = this.getUserById(referredBy).then(
            (referrer) => {
              return {
                user: userProfile,
                referrer: referrer,
              };
            }
          );

          referralPromises.push(referralPromise);
        }
      });

      // Wait for all promises to resolve
      const relationships = await Promise.all(referralPromises);

      // Filter out any relationships where the referrer wasn't found
      return relationships.filter((rel) => rel.referrer !== null) as {
        user: UserProfile;
        referrer: UserProfile;
      }[];
    } catch (error) {
      console.error("Error getting referral relationships:", error);
      throw error;
    }
  }

  // Debug utility: Get all referral codes in the system
  static async getAllReferralCodes(): Promise<
    { uid: string; email: string; role: string; referralCode: string }[]
  > {
    try {
      const q = query(
        collection(firestore, this.COLLECTION),
        where("referralCode", "!=", null)
      );

      const querySnapshot = await getDocs(q);
      const referralCodes: {
        uid: string;
        email: string;
        role: string;
        referralCode: string;
      }[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.referralCode) {
          referralCodes.push({
            uid: doc.id,
            email: data.email || "unknown",
            role: data.role || "unknown",
            referralCode: data.referralCode,
          });
        }
      });

      return referralCodes;
    } catch (error) {
      console.error("Error getting all referral codes:", error);
      throw error;
    }
  } // Calculate referral balance for a specific admin (sum of all referred users' balances)
  static async getAdminReferralBalance(adminUid: string): Promise<number> {
    try {
      const referredUsersQuery = query(
        collection(firestore, this.COLLECTION),
        where("referredBy", "==", adminUid)
      );

      const querySnapshot = await getDocs(referredUsersQuery);
      let totalBalance = 0;

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        totalBalance += userData.balance || 0;
      });

      return totalBalance;
    } catch (error) {
      console.error("Error getting admin referral balance:", error);
      throw error;
    }
  }

  // Calculate total admin referral balance (sum of all admins' referral balances)
  static async getTotalAdminReferralBalance(): Promise<{
    totalBalance: number;
    adminsCount: number;
  }> {
    try {
      // Get all admin users
      const adminQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "in", ["admin", "superadmin"])
      );

      const querySnapshot = await getDocs(adminQuery);
      let totalBalance = 0;
      const adminsCount = querySnapshot.size;

      // Calculate referral balance for each admin
      const balancePromises = querySnapshot.docs.map(async (doc) => {
        const adminBalance = await this.getAdminReferralBalance(doc.id);
        return adminBalance;
      });

      const adminBalances = await Promise.all(balancePromises);
      totalBalance = adminBalances.reduce((sum, balance) => sum + balance, 0);

      return {
        totalBalance,
        adminsCount,
      };
    } catch (error) {
      console.error("Error getting total admin referral balance:", error);
      throw error;
    }
  }

  // Update peak referral balance for an admin when their referred users' balances increase
  static async updatePeakReferralBalance(adminUid: string): Promise<void> {
    try {
      const currentBalance = await this.getAdminReferralBalance(adminUid);
      const userRef = doc(firestore, this.COLLECTION, adminUid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentPeak = userData.peakReferralBalance || 0;

        // Only update if current balance is higher than peak
        if (currentBalance > currentPeak) {
          await updateDoc(userRef, {
            peakReferralBalance: currentBalance,
            updatedAt: Timestamp.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error updating peak referral balance:", error);
      throw error;
    }
  }

  // Get peak referral balance for a specific admin (never decreases)
  static async getAdminPeakReferralBalance(adminUid: string): Promise<number> {
    try {
      const userRef = doc(firestore, this.COLLECTION, adminUid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const peakBalance = userData.peakReferralBalance || 0;

        // Also check current balance and update peak if necessary
        const currentBalance = await this.getAdminReferralBalance(adminUid);
        if (currentBalance > peakBalance) {
          await this.updatePeakReferralBalance(adminUid);
          return currentBalance;
        }

        return peakBalance;
      }

      return 0;
    } catch (error) {
      console.error("Error getting admin peak referral balance:", error);
      throw error;
    }
  }

  // Calculate total peak referral balance (for superadmins) - never decreases
  static async getTotalPeakAdminReferralBalance(): Promise<{
    totalBalance: number;
    adminsCount: number;
  }> {
    try {
      // Get all admin users
      const adminQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "in", ["admin", "superadmin"])
      );

      const querySnapshot = await getDocs(adminQuery);
      let totalBalance = 0;
      const adminsCount = querySnapshot.size;

      // Calculate peak referral balance for each admin
      const balancePromises = querySnapshot.docs.map(async (doc) => {
        const adminBalance = await this.getAdminPeakReferralBalance(doc.id);
        return adminBalance;
      });

      const adminBalances = await Promise.all(balancePromises);
      totalBalance = adminBalances.reduce((sum, balance) => sum + balance, 0);

      return {
        totalBalance,
        adminsCount,
      };
    } catch (error) {
      console.error("Error getting total peak admin referral balance:", error);
      throw error;
    }
  }

  // Subtract credits from user balance (for admin use)
  static async subtractUserBalance(
    uid: string,
    amount: number
  ): Promise<number> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as UserProfile;
      const currentBalance = userData.balance || 0;

      if (currentBalance < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = currentBalance - amount;

      await updateDoc(userRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // Log balance update activity (negative amount for subtraction)
      try {
        const { ActivityService } = await import("./activityService");
        await ActivityService.logBalanceUpdate(
          uid,
          userData.displayName || userData.email || "Unknown User",
          -amount, // Negative amount to indicate subtraction
          "system", // No specific admin ID for subtract operation
          "System Admin",
          currentBalance,
          newBalance
        );
      } catch (activityError) {
        console.error(
          "Error logging balance subtraction activity:",
          activityError
        );
        // Don't fail the balance update if activity logging fails
      }

      // Update peak balances for all admins to ensure they don't decrease
      const allAdmins = await this.getUsersByRole("admin");
      const superAdmins = await this.getUsersByRole("superadmin");
      const allAdminUsers = [...allAdmins, ...superAdmins];

      for (const admin of allAdminUsers) {
        await this.updatePeakReferralBalance(admin.uid);
      }

      return newBalance;
    } catch (error) {
      console.error("Error subtracting user balance:", error);
      throw error;
    }
  }

  // Add credits to user balance with commission tracking (for admin use)
  static async addUserBalance(
    uid: string,
    amount: number,
    depositedBy: string,
    description: string = "Admin deposit"
  ): Promise<{
    success: boolean;
    message: string;
    newBalance?: number;
    commissionPaid?: number;
  }> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as UserProfile;
      const currentBalance = userData.balance || 0;
      const newBalance = currentBalance + amount;

      // Update the user's balance
      await updateDoc(userRef, {
        balance: newBalance,
        updatedAt: Timestamp.now(),
      });

      // Get admin info for activity logging
      const adminRef = doc(firestore, this.COLLECTION, depositedBy);
      const adminSnap = await getDoc(adminRef);
      const adminData = adminSnap.exists() ? adminSnap.data() : null;
      const adminName =
        adminData?.displayName || adminData?.email || "Unknown Admin";

      // Log balance update activity
      try {
        const { ActivityService } = await import("./activityService");
        await ActivityService.logBalanceUpdate(
          uid,
          userData.displayName || userData.email || "Unknown User",
          amount,
          depositedBy,
          adminName,
          currentBalance,
          newBalance
        );
      } catch (activityError) {
        console.error("Error logging balance update activity:", activityError);
        // Don't fail the balance update if activity logging fails
      }

      // Check if user has a referrer (admin) and record commission
      let commissionPaid = 0;
      if (userData.referredBy) {
        const { CommissionService } = await import("./commissionService");

        const commissionResult =
          await CommissionService.recordSuperadminDeposit(
            userData.referredBy,
            uid,
            amount,
            depositedBy,
            description
          );

        if (commissionResult.success && commissionResult.commissionAmount) {
          commissionPaid = commissionResult.commissionAmount;
        }
      }

      // Update peak balances for all admins
      const allAdmins = await this.getUsersByRole("admin");
      const superAdmins = await this.getUsersByRole("superadmin");
      const allAdminUsers = [...allAdmins, ...superAdmins];

      for (const admin of allAdminUsers) {
        await this.updatePeakReferralBalance(admin.uid);
      }

      return {
        success: true,
        message: `Successfully added $${amount.toFixed(2)} to user balance${
          commissionPaid > 0
            ? ` (Commission: $${commissionPaid.toFixed(2)})`
            : ""
        }`,
        newBalance,
        commissionPaid,
      };
    } catch (error) {
      console.error("Error adding user balance:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to add balance",
      };
    }
  }

  // Enhanced referral code generation with history tracking
  static async generateReferralCodeWithHistory(uid: string): Promise<string> {
    try {
      // Fetch the user to check if they are admin/superadmin
      const userRef = doc(firestore, this.COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data() as UserProfile;
      if (userData.role !== "admin" && userData.role !== "superadmin") {
        throw new Error(
          "Only admin or superadmin users can generate referral codes"
        );
      }

      // Generate a new code
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const newReferralCode = `ADMIN_${randomPart}`;

      // Store the old referral code in history if it exists
      if (userData.referralCode) {
        await setDoc(
          doc(
            firestore,
            this.REFERRAL_HISTORY_COLLECTION,
            userData.referralCode
          ),
          {
            code: userData.referralCode,
            adminUid: uid,
            adminEmail: userData.email,
            createdAt: userData.updatedAt || Timestamp.now(),
            replacedAt: Timestamp.now(),
            isActive: true, // Keep old codes active for existing referrals
          }
        );
      }

      // Store the new referral code in history
      await setDoc(
        doc(firestore, this.REFERRAL_HISTORY_COLLECTION, newReferralCode),
        {
          code: newReferralCode,
          adminUid: uid,
          adminEmail: userData.email,
          createdAt: Timestamp.now(),
          replacedAt: null,
          isActive: true,
          isCurrent: true, // Mark as the current/primary code
        }
      );

      // Update the user's profile with the new code
      await updateDoc(userRef, {
        referralCode: newReferralCode,
        updatedAt: Timestamp.now(),
      });

      // If there was an old code, mark it as no longer current
      if (userData.referralCode) {
        await updateDoc(
          doc(
            firestore,
            this.REFERRAL_HISTORY_COLLECTION,
            userData.referralCode
          ),
          {
            isCurrent: false,
          }
        );
      }

      // Log referral code generation activity
      try {
        const { ActivityService } = await import("./activityService");
        await ActivityService.logReferralCodeGeneration(
          uid,
          userData.displayName || userData.email || "Unknown User",
          newReferralCode
        );
      } catch (activityError) {
        console.error(
          "Error logging referral code generation activity:",
          activityError
        );
      }

      return newReferralCode;
    } catch (error) {
      console.error("Error generating referral code with history:", error);
      throw error;
    }
  }

  // Enhanced validation that checks both current codes and historical codes
  static async validateReferralCodeWithHistory(
    referralCode: string
  ): Promise<{ isValid: boolean; adminUid?: string }> {
    try {
      console.log("Validating referral code with history:", referralCode);

      const normalizedCode = referralCode.trim();

      // First check the referral code history collection
      const historyDocRef = doc(
        firestore,
        this.REFERRAL_HISTORY_COLLECTION,
        normalizedCode
      );
      const historyDoc = await getDoc(historyDocRef);

      if (historyDoc.exists()) {
        const historyData = historyDoc.data();
        if (historyData.isActive) {
          console.log(
            "Found referral code in history, admin:",
            historyData.adminUid
          );
          return { isValid: true, adminUid: historyData.adminUid };
        }
      }

      // Fallback to the original method for backwards compatibility
      const q = query(
        collection(firestore, this.COLLECTION),
        where("referralCode", "==", normalizedCode)
      );

      const querySnapshot = await getDocs(q);
      console.log("Fallback query results count:", querySnapshot.size);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const userData = adminDoc.data();
        console.log("Found user with role:", userData.role);

        if (userData.role === "admin" || userData.role === "superadmin") {
          // If we found it in the user collection but not in history, add it to history
          await setDoc(
            doc(firestore, this.REFERRAL_HISTORY_COLLECTION, normalizedCode),
            {
              code: normalizedCode,
              adminUid: adminDoc.id,
              adminEmail: userData.email,
              createdAt: userData.createdAt || Timestamp.now(),
              replacedAt: null,
              isActive: true,
              isCurrent: true,
              migratedFromUserProfile: true,
            }
          );

          return { isValid: true, adminUid: adminDoc.id };
        } else {
          console.log("User found but not admin/superadmin");
          return { isValid: false };
        }
      } else {
        console.log("No user found with this referral code");
        return { isValid: false };
      }
    } catch (error) {
      console.error("Error validating referral code with history:", error);
      throw error;
    }
  }

  // Migrate existing referral codes to the history system
  static async migrateExistingReferralCodes(): Promise<void> {
    try {
      console.log(
        "Starting migration of existing referral codes to history system..."
      );

      const q = query(
        collection(firestore, this.COLLECTION),
        where("referralCode", "!=", null)
      );

      const querySnapshot = await getDocs(q);
      console.log(
        `Found ${querySnapshot.size} users with referral codes to migrate`
      );

      const batch = writeBatch(firestore);
      let migrationCount = 0;

      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        if (
          userData.referralCode &&
          (userData.role === "admin" || userData.role === "superadmin")
        ) {
          // Check if already migrated
          const historyDocRef = doc(
            firestore,
            this.REFERRAL_HISTORY_COLLECTION,
            userData.referralCode
          );
          const historyDoc = await getDoc(historyDocRef);

          if (!historyDoc.exists()) {
            batch.set(historyDocRef, {
              code: userData.referralCode,
              adminUid: userDoc.id,
              adminEmail: userData.email,
              createdAt: userData.createdAt || Timestamp.now(),
              replacedAt: null,
              isActive: true,
              isCurrent: true,
              migratedFromUserProfile: true,
            });
            migrationCount++;
          }
        }
      }

      if (migrationCount > 0) {
        await batch.commit();
        console.log(
          `Successfully migrated ${migrationCount} referral codes to history system`
        );
      } else {
        console.log("No referral codes needed migration");
      }
    } catch (error) {
      console.error("Error migrating referral codes:", error);
      throw error;
    }
  }

  // Get all referral codes for an admin (including historical ones)
  static async getAdminReferralCodeHistory(adminUid: string): Promise<
    Array<{
      code: string;
      createdAt: Date;
      replacedAt: Date | null;
      isCurrent: boolean;
      isActive: boolean;
    }>
  > {
    try {
      const q = query(
        collection(firestore, this.REFERRAL_HISTORY_COLLECTION),
        where("adminUid", "==", adminUid),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          code: data.code,
          createdAt: data.createdAt?.toDate() || new Date(),
          replacedAt: data.replacedAt?.toDate() || null,
          isCurrent: data.isCurrent || false,
          isActive: data.isActive || false,
        };
      });
    } catch (error) {
      console.error("Error getting admin referral code history:", error);
      throw error;
    }
  }

  // Fix broken referral relationships - restore sellers to their original admins
  static async fixBrokenReferralChains(): Promise<{
    fixed: number;
    alreadyFixed: number;
    errors: number;
    details: Array<{
      sellerEmail: string;
      adminEmail: string;
      action: string;
      error?: string;
    }>;
  }> {
    try {
      console.log("🔧 Starting broken referral chain repair...");

      const result = {
        fixed: 0,
        alreadyFixed: 0,
        errors: 0,
        details: [] as Array<{
          sellerEmail: string;
          adminEmail: string;
          action: string;
          error?: string;
        }>,
      };

      // Get all sellers who have referredBy but might have broken chains
      const sellersQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "==", "seller"),
        where("referredBy", "!=", null)
      );

      const sellersSnapshot = await getDocs(sellersQuery);
      console.log(
        `📊 Found ${sellersSnapshot.size} sellers with referredBy relationships`
      );

      // Get all admins for reference
      const adminsQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "in", ["admin", "superadmin"])
      );
      const adminsSnapshot = await getDocs(adminsQuery);

      // Create admin lookup map
      const adminMap = new Map<
        string,
        { email: string; referralCode?: string }
      >();
      adminsSnapshot.forEach((doc) => {
        const data = doc.data();
        adminMap.set(doc.id, {
          email: data.email,
          referralCode: data.referralCode,
        });
      });

      console.log(`👥 Found ${adminMap.size} admins in system`);

      // Process each seller
      for (const sellerDoc of sellersSnapshot.docs) {
        const sellerData = sellerDoc.data();
        const sellerId = sellerDoc.id;
        const adminUid = sellerData.referredBy;

        if (!adminMap.has(adminUid)) {
          // Admin no longer exists - this is a data integrity issue
          result.errors++;
          result.details.push({
            sellerEmail: sellerData.email,
            adminEmail: `[MISSING: ${adminUid}]`,
            action: "ERROR - Admin not found",
            error: "Referenced admin no longer exists",
          });
          continue;
        }

        const admin = adminMap.get(adminUid)!;

        // Check if seller's referral code is still valid for this admin
        let needsFix = false;
        const currentReferralCode = sellerData.referralCode;

        if (!currentReferralCode) {
          // Seller has no referral code stored - this might be from old registration
          needsFix = true;
        } else {
          // Check if the stored referral code is still valid for this admin
          const validation = await this.validateReferralCodeWithHistory(
            currentReferralCode
          );
          if (!validation.isValid || validation.adminUid !== adminUid) {
            needsFix = true;
          }
        }

        if (needsFix) {
          // Fix the relationship by using admin's current referral code
          if (admin.referralCode) {
            await updateDoc(doc(firestore, this.COLLECTION, sellerId), {
              referralCode: admin.referralCode,
              updatedAt: Timestamp.now(),
              // Add a flag to indicate this was auto-fixed
              referralChainFixed: true,
              referralChainFixedAt: Timestamp.now(),
            });

            result.fixed++;
            result.details.push({
              sellerEmail: sellerData.email,
              adminEmail: admin.email,
              action: `Fixed - Updated referral code to ${admin.referralCode}`,
            });

            console.log(
              `✅ Fixed ${sellerData.email} → ${admin.email} (${admin.referralCode})`
            );
          } else {
            // Admin has no current referral code - create one
            const newCode = await this.generateReferralCodeWithHistory(
              adminUid
            );

            await updateDoc(doc(firestore, this.COLLECTION, sellerId), {
              referralCode: newCode,
              updatedAt: Timestamp.now(),
              referralChainFixed: true,
              referralChainFixedAt: Timestamp.now(),
            });

            result.fixed++;
            result.details.push({
              sellerEmail: sellerData.email,
              adminEmail: admin.email,
              action: `Fixed - Generated new admin code ${newCode} and linked seller`,
            });

            console.log(
              `✅ Fixed ${sellerData.email} → ${admin.email} (generated ${newCode})`
            );
          }
        } else {
          result.alreadyFixed++;
          result.details.push({
            sellerEmail: sellerData.email,
            adminEmail: admin.email,
            action: "Already valid - No fix needed",
          });
        }
      }

      console.log(`\n🎉 REPAIR COMPLETE!`);
      console.log(`   ✅ Fixed: ${result.fixed} sellers`);
      console.log(`   ⏭️  Already valid: ${result.alreadyFixed} sellers`);
      console.log(`   ❌ Errors: ${result.errors} sellers`);

      return result;
    } catch (error) {
      console.error("Error fixing broken referral chains:", error);
      throw error;
    }
  }

  // Validate all referral relationships in the system
  static async validateAllReferralRelationships(): Promise<{
    valid: number;
    broken: number;
    orphaned: number;
    details: Array<{
      type: "valid" | "broken" | "orphaned";
      sellerEmail: string;
      adminEmail?: string;
      issue?: string;
    }>;
  }> {
    try {
      console.log("🔍 Validating all referral relationships...");

      const result = {
        valid: 0,
        broken: 0,
        orphaned: 0,
        details: [] as Array<{
          type: "valid" | "broken" | "orphaned";
          sellerEmail: string;
          adminEmail?: string;
          issue?: string;
        }>,
      };

      // Get all sellers
      const sellersQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "==", "seller")
      );

      const sellersSnapshot = await getDocs(sellersQuery);
      console.log(`📊 Validating ${sellersSnapshot.size} sellers...`);

      // Get all admins for reference
      const adminsQuery = query(
        collection(firestore, this.COLLECTION),
        where("role", "in", ["admin", "superadmin"])
      );
      const adminsSnapshot = await getDocs(adminsQuery);

      const adminMap = new Map<
        string,
        { email: string; referralCode?: string }
      >();
      adminsSnapshot.forEach((doc) => {
        const data = doc.data();
        adminMap.set(doc.id, {
          email: data.email,
          referralCode: data.referralCode,
        });
      });

      for (const sellerDoc of sellersSnapshot.docs) {
        const sellerData = sellerDoc.data();

        if (!sellerData.referredBy) {
          // Seller not referred by anyone
          result.orphaned++;
          result.details.push({
            type: "orphaned",
            sellerEmail: sellerData.email,
            issue: "No referredBy field - not part of referral system",
          });
          continue;
        }

        const adminUid = sellerData.referredBy;

        if (!adminMap.has(adminUid)) {
          // Referenced admin doesn't exist
          result.broken++;
          result.details.push({
            type: "broken",
            sellerEmail: sellerData.email,
            issue: `Referenced admin ${adminUid} no longer exists`,
          });
          continue;
        }

        const admin = adminMap.get(adminUid)!;

        // Check if referral code is valid
        if (sellerData.referralCode) {
          const validation = await this.validateReferralCodeWithHistory(
            sellerData.referralCode
          );
          if (validation.isValid && validation.adminUid === adminUid) {
            result.valid++;
            result.details.push({
              type: "valid",
              sellerEmail: sellerData.email,
              adminEmail: admin.email,
            });
          } else {
            result.broken++;
            result.details.push({
              type: "broken",
              sellerEmail: sellerData.email,
              adminEmail: admin.email,
              issue: `Referral code ${sellerData.referralCode} is invalid or doesn't match admin`,
            });
          }
        } else {
          result.broken++;
          result.details.push({
            type: "broken",
            sellerEmail: sellerData.email,
            adminEmail: admin.email,
            issue: "Missing referral code",
          });
        }
      }

      console.log(`\n📊 VALIDATION COMPLETE:`);
      console.log(`   ✅ Valid: ${result.valid} relationships`);
      console.log(`   ❌ Broken: ${result.broken} relationships`);
      console.log(`   👤 Orphaned: ${result.orphaned} sellers`);

      return result;
    } catch (error) {
      console.error("Error validating referral relationships:", error);
      throw error;
    }
  }

  // Get detailed referral relationship report
  static async getReferralRelationshipReport(): Promise<{
    totalSellers: number;
    totalAdmins: number;
    referralRelationships: number;
    orphanedSellers: number;
    adminStats: Array<{
      adminEmail: string;
      adminUid: string;
      currentReferralCode?: string;
      referredSellersCount: number;
      totalReferralBalance: number;
      sellers: Array<{
        email: string;
        balance: number;
        referralCode?: string;
        isValid: boolean;
      }>;
    }>;
  }> {
    try {
      console.log("📊 Generating referral relationship report...");

      // Get all users
      const allUsersSnapshot = await getDocs(
        collection(firestore, this.COLLECTION)
      );

      const sellers: UserProfile[] = [];
      const admins: UserProfile[] = [];

      allUsersSnapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        const userWithId = { ...data, uid: doc.id };
        if (data.role === "seller") {
          sellers.push(userWithId);
        } else if (data.role === "admin" || data.role === "superadmin") {
          admins.push(userWithId);
        }
      });

      const orphanedSellers = sellers.filter((s) => !s.referredBy).length;
      const referralRelationships = sellers.filter((s) => s.referredBy).length;

      // Generate admin stats
      const adminStats = [];
      for (const admin of admins) {
        const referredSellers = sellers.filter(
          (s) => s.referredBy === admin.uid
        );
        let totalBalance = 0;

        const sellerDetails = [];
        for (const seller of referredSellers) {
          totalBalance += seller.balance || 0;

          let isValid = false;
          if (seller.referralCode) {
            try {
              const validation = await this.validateReferralCodeWithHistory(
                seller.referralCode
              );
              isValid = validation.isValid && validation.adminUid === admin.uid;
            } catch {
              isValid = false;
            }
          }

          sellerDetails.push({
            email: seller.email,
            balance: seller.balance || 0,
            referralCode: seller.referralCode,
            isValid,
          });
        }

        adminStats.push({
          adminEmail: admin.email,
          adminUid: admin.uid,
          currentReferralCode: admin.referralCode,
          referredSellersCount: referredSellers.length,
          totalReferralBalance: totalBalance,
          sellers: sellerDetails,
        });
      }

      const report = {
        totalSellers: sellers.length,
        totalAdmins: admins.length,
        referralRelationships,
        orphanedSellers,
        adminStats,
      };

      console.log(
        `📋 Report generated: ${referralRelationships} referral relationships found`
      );
      return report;
    } catch (error) {
      console.error("Error generating referral relationship report:", error);
      throw error;
    }
  }
}

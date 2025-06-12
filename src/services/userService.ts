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
  Timestamp,
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
    data: Partial<UserProfile>
  ): Promise<void> {
    try {
      const userRef = doc(firestore, this.COLLECTION, uid); // Filter out any undefined values to prevent Firestore errors
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );

      // Convert Date objects to Firestore Timestamps
      const firestoreData = {
        ...filteredData,
        updatedAt: Timestamp.now(),
      };

      await setDoc(userRef, firestoreData, { merge: true });
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

  // Generate a unique referral code for a user
  static async generateReferralCode(uid: string): Promise<string> {
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

      // Generate a code based on user ID and random string
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const referralCode = `ADMIN_${randomPart}`;

      // Save the referral code to the user's profile
      await updateDoc(userRef, {
        referralCode,
        updatedAt: Timestamp.now(),
      });

      return referralCode;
    } catch (error) {
      console.error("Error generating referral code:", error);
      throw error;
    }
  }
  // Validate a referral code and check if it belongs to an admin
  static async validateReferralCode(
    referralCode: string
  ): Promise<{ isValid: boolean; adminUid?: string }> {
    try {
      console.log("Validating referral code in userService:", referralCode);

      // Normalize the referral code to handle case insensitivity and spaces
      const normalizedCode = referralCode.trim();

      const q = query(
        collection(firestore, this.COLLECTION),
        where("referralCode", "==", normalizedCode)
      );

      const querySnapshot = await getDocs(q);
      console.log("Query results count:", querySnapshot.size);

      if (!querySnapshot.empty) {
        const adminDoc = querySnapshot.docs[0];
        const userData = adminDoc.data();
        console.log("Found user with role:", userData.role);

        // Check if user is admin or superadmin
        if (userData.role === "admin" || userData.role === "superadmin") {
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
      console.error("Error validating referral code:", error);
      throw error;
    }
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
  }  // Calculate referral balance for a specific admin (sum of all referred users' balances)
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
  static async subtractUserBalance(uid: string, amount: number): Promise<number> {
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
  ): Promise<{ success: boolean; message: string; newBalance?: number; commissionPaid?: number }> {
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

      // Check if user has a referrer (admin) and record commission
      let commissionPaid = 0;
      if (userData.referredBy) {
        const { CommissionService } = await import("./commissionService");
        
        const commissionResult = await CommissionService.recordSuperadminDeposit(
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
        message: `Successfully added $${amount.toFixed(2)} to user balance${commissionPaid > 0 ? ` (Commission: $${commissionPaid.toFixed(2)})` : ""}`,
        newBalance,
        commissionPaid,
      };
    } catch (error) {
      console.error("Error adding user balance:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to add balance",
      };
    }
  }
}

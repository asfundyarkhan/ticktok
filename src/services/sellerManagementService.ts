import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  Transaction,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { firestore } from "../lib/firebase";

export interface SellerInfo {
  id: string;
  email: string;
  displayName: string;
  currentAdminId?: string;
  currentAdminName?: string;
  currentAdminEmail?: string;
  referralCode?: string;
  isDummyAccount: boolean;
  createdAt: Date;
  updatedAt: Date;
  balance?: number;
  totalSales?: number;
  totalCommissions?: number;
  referredByAdminId?: string; // Track current referral relationship (for commissions)
  originalReferredBy?: string; // Track original referrer (preserved for history)
}

export interface AdminInfo {
  id: string;
  email: string;
  displayName: string;
  referralCode?: string;
  totalSellers: number;
  totalCommissions: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  sellerId?: string;
  oldAdminId?: string;
  newAdminId?: string;
  migratedData?: {
    pendingDeposits: number;
    activeSales: number;
    commissionHistory: number;
  };
}

export interface DummyAccountResult {
  success: boolean;
  message: string;
  sellerId?: string;
  isDummyAccount?: boolean;
}

export class SellerManagementService {
  private static USERS_COLLECTION = "users";
  private static PENDING_DEPOSITS_COLLECTION = "pendingDeposits";
  private static COMMISSION_HISTORY_COLLECTION = "commissionHistory";
  private static SELLER_MIGRATIONS_COLLECTION = "sellerMigrations";
  
  /**
   * IMPORTANT SYSTEM NOTE:
   * 
   * There are multiple concepts for admin-seller relationships in the system:
   * 
   * 1. referredBy - The current admin who receives commissions from this seller's activities.
   *    This can change through migrations and determines commission flow.
   * 
   * 2. adminId - The current admin assigned to manage a seller. This should match referredBy
   *    after migrations to ensure consistent management and commission flow.
   * 
   * 3. originalReferredBy - A permanent field preserving the admin who originally referred 
   *    the seller. This never changes and is used for historical tracking only.
   * 
   * When migrating a seller:
   * - Both adminId and referredBy are updated to the new admin
   * - originalReferredBy is set to preserve the original referrer (if not already set)
   * - Future commissions from deposits, sales, and transactions go to the new admin
   * - Seller appears in the new admin's referral list and management interface
   */

  /**
   * Get all sellers with their current admin information
   */
  static async getAllSellers(): Promise<SellerInfo[]> {
    try {
      const usersQuery = query(
        collection(firestore, this.USERS_COLLECTION),
        where("role", "==", "seller"),
        orderBy("createdAt", "desc")
      );

      const usersSnapshot = await getDocs(usersQuery);
      const sellers: SellerInfo[] = [];

      for (const docSnapshot of usersSnapshot.docs) {
        const data = docSnapshot.data();
        
        // Get admin information if seller has one
        let adminInfo = null;
        // First check adminId, then fall back to referredBy if adminId is not present
        const adminIdentifier = data.adminId || data.referredBy;
        
        if (adminIdentifier) {
          try {
            const adminDocRef = doc(firestore, this.USERS_COLLECTION, adminIdentifier);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists()) {
              const adminData = adminDoc.data() as { displayName?: string; email?: string };
              adminInfo = {
                id: adminDoc.id,
                name: adminData.displayName || adminData.email || "Unknown Admin",
                email: adminData.email || "",
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch admin info for seller ${docSnapshot.id}:`, error);
          }
        }

        // If adminId is missing but referredBy exists, use referredBy as the admin
        const currentAdminId = data.adminId || data.referredBy || undefined;
        
        sellers.push({
          id: docSnapshot.id,
          email: data.email || "",
          displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
          currentAdminId,
          currentAdminName: adminInfo?.name,
          currentAdminEmail: adminInfo?.email,
          referralCode: data.referralCode,
          isDummyAccount: data.isDummyAccount || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          balance: data.balance || 0,
          totalSales: data.totalSales || 0,
          totalCommissions: data.totalCommissions || 0,
          // Include referredBy for clarity in the UI
          referredByAdminId: data.referredBy || undefined,
          // Include original referrer for historical tracking
          originalReferredBy: data.originalReferredBy || undefined,
        });
      }

      return sellers;
    } catch (error) {
      console.error("Error fetching sellers:", error);
      throw error;
    }
  }

  /**
   * Get all admins for migration dropdown
   */
  static async getAllAdmins(): Promise<AdminInfo[]> {
    try {
      const adminsQuery = query(
        collection(firestore, this.USERS_COLLECTION),
        where("role", "==", "admin"),
        orderBy("createdAt", "desc")
      );

      const adminsSnapshot = await getDocs(adminsQuery);
      const admins: AdminInfo[] = [];

      for (const docSnapshot of adminsSnapshot.docs) {
        const data = docSnapshot.data();

        // Count sellers under this admin
        const sellersQuery = query(
          collection(firestore, this.USERS_COLLECTION),
          where("role", "==", "seller"),
          where("adminId", "==", docSnapshot.id)
        );
        const sellersSnapshot = await getDocs(sellersQuery);

        // Calculate total commissions (this could be optimized with aggregation)
        let totalCommissions = 0;
        try {
          const commissionsQuery = query(
            collection(firestore, this.COMMISSION_HISTORY_COLLECTION),
            where("adminId", "==", docSnapshot.id)
          );
          const commissionsSnapshot = await getDocs(commissionsQuery);
          totalCommissions = commissionsSnapshot.docs.reduce((sum, commissionDoc) => {
            return sum + (commissionDoc.data().amount || 0);
          }, 0);
        } catch (error) {
          console.warn(`Failed to calculate commissions for admin ${docSnapshot.id}:`, error);
        }

        admins.push({
          id: docSnapshot.id,
          email: data.email || "",
          displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
          referralCode: data.referralCode,
          totalSellers: sellersSnapshot.size,
          totalCommissions,
        });
      }

      return admins;
    } catch (error) {
      console.error("Error fetching admins:", error);
      throw error;
    }
  }

  /**
   * Migrate seller from one admin to another
   */
  static async migrateSeller(
    sellerId: string,
    newAdminId: string,
    reason: string = "Admin migration"
  ): Promise<MigrationResult> {
    try {
      return await runTransaction(firestore, async (transaction: Transaction) => {
        // 1. Get seller data
        const sellerRef = doc(firestore, this.USERS_COLLECTION, sellerId);
        const sellerDoc = await transaction.get(sellerRef);

        if (!sellerDoc.exists()) {
          return {
            success: false,
            message: "Seller not found",
          };
        }

        const sellerData = sellerDoc.data();
        const oldAdminId = sellerData.adminId;

        if (oldAdminId === newAdminId) {
          return {
            success: false,
            message: "Seller is already under this admin",
          };
        }

        // 2. Validate new admin exists
        const newAdminRef = doc(firestore, this.USERS_COLLECTION, newAdminId);
        const newAdminDoc = await transaction.get(newAdminRef);

        if (!newAdminDoc.exists() || newAdminDoc.data().role !== "admin") {
          return {
            success: false,
            message: "Target admin not found or invalid",
          };
        }

        // 3. Update seller's admin reference and referral relationship
        const migrationHistoryEntry = {
          fromAdminId: oldAdminId || null, // Ensure null instead of undefined
          toAdminId: newAdminId,
          fromReferredBy: sellerData.referredBy || null, // Track original referrer
          toReferredBy: newAdminId, // New referrer for commissions
          reason,
          timestamp: Timestamp.now(),
          migrationDetails: {
            transferredManagement: true,
            transferredCommissions: true,
            transferredReferralStatus: true,
          }
        };
        
        const existingHistory = Array.isArray(sellerData.migrationHistory) 
          ? sellerData.migrationHistory 
          : [];
          
        // Update adminId AND referredBy to change both management and commission assignment
        // This ensures the seller will:
        // 1. Show up in the new admin's management list (adminId)
        // 2. Generate commissions for the new admin (referredBy)
        // 3. Appear in the new admin's referral list
        transaction.update(sellerRef, {
          adminId: newAdminId,
          referredBy: newAdminId, // Key change: transfer referral relationship
          updatedAt: Timestamp.now(),
          migrationHistory: [...existingHistory, migrationHistoryEntry],
          // Track the original referrer for historical purposes
          originalReferredBy: sellerData.referredBy || sellerData.originalReferredBy || oldAdminId,
        });

        // 4. Update pending deposits to new admin
        const pendingDepositsQuery = query(
          collection(firestore, this.PENDING_DEPOSITS_COLLECTION),
          where("sellerId", "==", sellerId),
          where("status", "==", "pending")
        );
        const pendingDepositsSnapshot = await getDocs(pendingDepositsQuery);

        let migratedPendingDeposits = 0;
        pendingDepositsSnapshot.docs.forEach((doc) => {
          transaction.update(doc.ref, {
            adminId: newAdminId,
            migratedAt: Timestamp.now(),
            migratedReason: reason,
          });
          migratedPendingDeposits++;
        });

        // 5. Update future commission tracking
        // Note: Past commissions remain with original admin for historical accuracy
        const futureCommissionsQuery = query(
          collection(firestore, this.COMMISSION_HISTORY_COLLECTION),
          where("sellerId", "==", sellerId),
          where("status", "==", "pending")
        );
        const futureCommissionsSnapshot = await getDocs(futureCommissionsQuery);

        let migratedCommissions = 0;
        futureCommissionsSnapshot.docs.forEach((doc) => {
          transaction.update(doc.ref, {
            adminId: newAdminId,
            migratedAt: Timestamp.now(),
            migratedReason: reason,
          });
          migratedCommissions++;
        });

        // 6. Log the comprehensive migration
        const migrationRef = doc(collection(firestore, this.SELLER_MIGRATIONS_COLLECTION));
        transaction.set(migrationRef, {
          sellerId,
          sellerEmail: sellerData.email,
          sellerName: sellerData.displayName || sellerData.email,
          oldAdminId: oldAdminId || null, // Ensure null instead of undefined
          newAdminId,
          oldReferredBy: sellerData.referredBy || null,
          newReferredBy: newAdminId,
          reason,
          migratedData: {
            pendingDeposits: migratedPendingDeposits,
            commissionHistory: migratedCommissions,
          },
          migrationScope: {
            transferredManagement: true,
            transferredCommissions: true,
            transferredReferralStatus: true,
            preservedOriginalReferrer: true,
          },
          timestamp: Timestamp.now(),
          performedBy: "superadmin", // You might want to pass actual user ID
        });

        return {
          success: true,
          message: `Seller successfully migrated to new admin. All future commissions and referral credits will go to the new admin.`,
          sellerId,
          oldAdminId,
          newAdminId,
          migratedData: {
            pendingDeposits: migratedPendingDeposits,
            activeSales: 0, // Could be calculated if needed
            commissionHistory: migratedCommissions,
          },
        };
      });
    } catch (error) {
      console.error("Error migrating seller:", error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Toggle dummy account status for a seller
   */
  static async toggleDummyAccount(
    sellerId: string,
    isDummyAccount: boolean,
    reason: string = "Dummy account toggle"
  ): Promise<DummyAccountResult> {
    try {
      return await runTransaction(firestore, async (transaction: Transaction) => {
        // 1. Get seller data
        const sellerRef = doc(firestore, this.USERS_COLLECTION, sellerId);
        const sellerDoc = await transaction.get(sellerRef);

        if (!sellerDoc.exists()) {
          return {
            success: false,
            message: "Seller not found",
          };
        }

        const sellerData = sellerDoc.data();

        if (sellerData.role !== "seller") {
          return {
            success: false,
            message: "User is not a seller",
          };
        }

        // 2. Update seller's dummy account status
        const existingDummyHistory = Array.isArray(sellerData.dummyAccountHistory) 
          ? sellerData.dummyAccountHistory 
          : [];
          
        const dummyHistoryEntry = {
          isDummyAccount,
          reason,
          timestamp: Timestamp.now(),
          performedBy: "superadmin", // You might want to pass actual user ID
        };
          
        transaction.update(sellerRef, {
          isDummyAccount,
          dummyAccountChangedAt: Timestamp.now(),
          dummyAccountHistory: [...existingDummyHistory, dummyHistoryEntry],
          updatedAt: Timestamp.now(),
        });

        // 3. If setting as dummy account, optionally hide from revenue tracking
        if (isDummyAccount) {
          // Mark all pending deposits as dummy (won't count in admin revenue)
          const pendingDepositsQuery = query(
            collection(firestore, this.PENDING_DEPOSITS_COLLECTION),
            where("sellerId", "==", sellerId)
          );
          const pendingDepositsSnapshot = await getDocs(pendingDepositsQuery);

          pendingDepositsSnapshot.docs.forEach((doc) => {
            transaction.update(doc.ref, {
              isDummyAccount: true,
              excludeFromRevenue: true,
              dummyMarkedAt: Timestamp.now(),
            });
          });

          // Mark commission history as dummy
          const commissionQuery = query(
            collection(firestore, this.COMMISSION_HISTORY_COLLECTION),
            where("sellerId", "==", sellerId)
          );
          const commissionSnapshot = await getDocs(commissionQuery);

          commissionSnapshot.docs.forEach((doc) => {
            transaction.update(doc.ref, {
              isDummyAccount: true,
              excludeFromRevenue: true,
              dummyMarkedAt: Timestamp.now(),
            });
          });
        } else {
          // If removing dummy status, restore revenue tracking
          const pendingDepositsQuery = query(
            collection(firestore, this.PENDING_DEPOSITS_COLLECTION),
            where("sellerId", "==", sellerId),
            where("isDummyAccount", "==", true)
          );
          const pendingDepositsSnapshot = await getDocs(pendingDepositsQuery);

          pendingDepositsSnapshot.docs.forEach((doc) => {
            transaction.update(doc.ref, {
              isDummyAccount: false,
              excludeFromRevenue: false,
              dummyRemovedAt: Timestamp.now(),
            });
          });

          const commissionQuery = query(
            collection(firestore, this.COMMISSION_HISTORY_COLLECTION),
            where("sellerId", "==", sellerId),
            where("isDummyAccount", "==", true)
          );
          const commissionSnapshot = await getDocs(commissionQuery);

          commissionSnapshot.docs.forEach((doc) => {
            transaction.update(doc.ref, {
              isDummyAccount: false,
              excludeFromRevenue: false,
              dummyRemovedAt: Timestamp.now(),
            });
          });
        }

        return {
          success: true,
          message: `Seller ${isDummyAccount ? "marked as" : "removed from"} dummy account successfully`,
          sellerId,
          isDummyAccount,
        };
      });
    } catch (error) {
      console.error("Error toggling dummy account:", error);
      return {
        success: false,
        message: `Failed to toggle dummy account: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get migration history for a seller
   */
  static async getSellerMigrationHistory(sellerId: string) {
    try {
      const migrationsQuery = query(
        collection(firestore, this.SELLER_MIGRATIONS_COLLECTION),
        where("sellerId", "==", sellerId),
        orderBy("timestamp", "desc")
      );

      const migrationsSnapshot = await getDocs(migrationsQuery);
      const migrations = [];

      for (const migrationDoc of migrationsSnapshot.docs) {
        const data = migrationDoc.data();
        
        // Get admin names
        let oldAdminName = "Unknown";
        let newAdminName = "Unknown";

        try {
          if (data.oldAdminId) {
            const oldAdminDocRef = doc(firestore, this.USERS_COLLECTION, data.oldAdminId);
            const oldAdminDoc = await getDoc(oldAdminDocRef);
            if (oldAdminDoc.exists()) {
              const oldAdminData = oldAdminDoc.data() as { displayName?: string; email?: string };
              oldAdminName = oldAdminData.displayName || oldAdminData.email || "Unknown";
            }
          }

          if (data.newAdminId) {
            const newAdminDocRef = doc(firestore, this.USERS_COLLECTION, data.newAdminId);
            const newAdminDoc = await getDoc(newAdminDocRef);
            if (newAdminDoc.exists()) {
              const newAdminData = newAdminDoc.data() as { displayName?: string; email?: string };
              newAdminName = newAdminData.displayName || newAdminData.email || "Unknown";
            }
          }
        } catch (error) {
          console.warn("Failed to fetch admin names for migration:", error);
        }

        migrations.push({
          id: migrationDoc.id,
          ...data,
          oldAdminId: data.oldAdminId || null, // Ensure oldAdminId is never undefined
          oldAdminName: data.oldAdminId ? oldAdminName : "None",
          newAdminName,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      }

      return migrations;
    } catch (error) {
      console.error("Error fetching migration history:", error);
      throw error;
    }
  }

  /**
   * Get detailed seller information including stats
   */
  static async getSellerDetails(sellerId: string): Promise<SellerInfo | null> {
    try {
      const sellerDoc = await getDoc(doc(firestore, this.USERS_COLLECTION, sellerId));
      
      if (!sellerDoc.exists()) {
        return null;
      }

      const data = sellerDoc.data();

      // Get admin information
      let adminInfo = null;
      if (data.adminId) {
        try {
          const adminDocRef = doc(firestore, this.USERS_COLLECTION, data.adminId);
          const adminDoc = await getDoc(adminDocRef);
          if (adminDoc.exists()) {
            const adminData = adminDoc.data() as { displayName?: string; email?: string };
            adminInfo = {
              id: adminDoc.id,
              name: adminData.displayName || adminData.email || "Unknown Admin",
              email: adminData.email || "",
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch admin info for seller ${sellerId}:`, error);
        }
      }

      return {
        id: sellerId,
        email: data.email || "",
        displayName: data.displayName || data.email?.split("@")[0] || "Unknown",
        currentAdminId: data.adminId || undefined,
        currentAdminName: adminInfo?.name,
        currentAdminEmail: adminInfo?.email,
        referralCode: data.referralCode,
        isDummyAccount: data.isDummyAccount || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        balance: data.balance || 0,
        totalSales: data.totalSales || 0,
        totalCommissions: data.totalCommissions || 0,
      };
    } catch (error) {
      console.error("Error fetching seller details:", error);
      throw error;
    }
  }
}

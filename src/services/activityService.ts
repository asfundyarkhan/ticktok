// Firebase Activity Service
import {
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";

export interface ActivityItem {
  id?: string;
  userId: string;
  userDisplayName: string;
  type:
    | "seller_account_created"
    | "stock_purchased"
    | "fund_deposit"
    | "fund_withdrawal"
    | "product_sold"
    | "withdrawal_request"
    | "deposit_approved"
    | "deposit_rejected"
    | "balance_updated"
    | "user_suspended"
    | "user_activated"
    | "referral_code_generated"
    | "commission_earned"
    | "profile_updated"
    | "login"
    | "logout"
    | "unknown";
  details: {
    quantity?: number;
    productName?: string;
    amount?: number;
    referralCode?: string;
    previousBalance?: number;
    newBalance?: number;
    reason?: string;
    adminId?: string;
    adminName?: string;
  };
  status: "completed" | "pending" | "failed";
  createdAt: Date;
}

export class ActivityService {
  private static COLLECTION = "activities";

  /**
   * Create a new activity record
   */
  static async createActivity(
    activity: Omit<ActivityItem, "id" | "createdAt">
  ): Promise<string> {
    try {
      const activityRef = await addDoc(collection(firestore, this.COLLECTION), {
        ...activity,
        createdAt: Timestamp.now(),
      });
      return activityRef.id;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  /**
   * Subscribe to all activities in real-time
   */
  static subscribeToActivities(
    onUpdate: (activities: ActivityItem[]) => void,
    onError?: (error: Error) => void,
    maxItems: number = 10
  ): () => void {
    try {
      // For all activities, we only need orderBy and limit
      const activitiesQuery = query(
        collection(firestore, this.COLLECTION),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      );

      return onSnapshot(
        activitiesQuery,
        (snapshot) => {
          const activities: ActivityItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
            } as ActivityItem);
          });
          onUpdate(activities);
        },
        (error) => {
          console.error("Error in activities subscription:", error);
          if (onError) onError(error);
        }
      );
    } catch (error) {
      console.error("Error setting up activities subscription:", error);
      throw error;
    }
  }

  /**
   * Subscribe to user's activities in real-time
   */
  static subscribeToUserActivities(
    userId: string,
    onUpdate: (activities: ActivityItem[]) => void,
    onError?: (error: Error) => void,
    maxItems: number = 10
  ): () => void {
    try {
      // For user activities, we need a composite index on userId + createdAt
      const activitiesQuery = query(
        collection(firestore, this.COLLECTION),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(maxItems)
      );

      return onSnapshot(
        activitiesQuery,
        (snapshot) => {
          const activities: ActivityItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            activities.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt.toDate(),
            } as ActivityItem);
          });
          onUpdate(activities);
        },
        (error) => {
          // If we get an index error, we'll log instructions to create it
          if (error.code === "failed-precondition") {
            console.error(
              "Missing index for activities query. Create a composite index on:"
            );
            console.error("Collection: activities");
            console.error("Fields: userId ASC, createdAt DESC");
          }
          console.error("Error in user activities subscription:", error);
          if (onError) onError(error);
        }
      );
    } catch (error) {
      console.error("Error setting up user activities subscription:", error);
      throw error;
    }
  }

  /**
   * Helper function to create balance update activity
   */
  static async logBalanceUpdate(
    userId: string,
    userDisplayName: string,
    amount: number,
    adminId?: string,
    adminName?: string,
    previousBalance?: number,
    newBalance?: number
  ): Promise<void> {
    try {
      await this.createActivity({
        userId,
        userDisplayName,
        type: "balance_updated",
        details: {
          amount,
          adminId,
          adminName,
          previousBalance,
          newBalance,
        },
        status: "completed",
      });
    } catch (error) {
      console.error("Error logging balance update activity:", error);
    }
  }

  /**
   * Helper function to create user suspension activity
   */
  static async logUserSuspension(
    userId: string,
    userDisplayName: string,
    suspended: boolean,
    adminId?: string,
    adminName?: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.createActivity({
        userId,
        userDisplayName,
        type: suspended ? "user_suspended" : "user_activated",
        details: {
          adminId,
          adminName,
          reason,
        },
        status: "completed",
      });
    } catch (error) {
      console.error("Error logging user suspension activity:", error);
    }
  }

  /**
   * Helper function to create referral code generation activity
   */
  static async logReferralCodeGeneration(
    userId: string,
    userDisplayName: string,
    referralCode: string
  ): Promise<void> {
    try {
      await this.createActivity({
        userId,
        userDisplayName,
        type: "referral_code_generated",
        details: {
          referralCode,
        },
        status: "completed",
      });
    } catch (error) {
      console.error("Error logging referral code generation activity:", error);
    }
  }
  static formatActivityMessage(activity: ActivityItem): string {
    const time = activity.createdAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    switch (activity.type) {
      case "seller_account_created":
        return `[${time}] ${activity.userDisplayName} created a seller account${
          activity.details.referralCode
            ? ` via referral code ${activity.details.referralCode}`
            : ""
        }`;

      case "stock_purchased":
        return `[${time}] ${activity.userDisplayName} bought ${activity.details.quantity} units of ${activity.details.productName}`;

      case "fund_deposit":
        return `[${time}] ${
          activity.userDisplayName
        } requested a fund deposit of $${
          activity.details.amount?.toFixed(2) || "0.00"
        }`;

      case "fund_withdrawal":
        return `[${time}] ${
          activity.userDisplayName
        } requested a withdrawal of $${
          activity.details.amount?.toFixed(2) || "0.00"
        }`;

      case "product_sold":
        return `[${time}] ${activity.userDisplayName} sold ${activity.details.quantity} units of ${activity.details.productName}`;

      case "withdrawal_request":
        return `[${time}] ${activity.userDisplayName} needs to withdraw $${
          activity.details.amount?.toFixed(2) || "0.00"
        }`;

      case "deposit_approved":
        return `[${time}] ${activity.userDisplayName}'s deposit of $${
          activity.details.amount?.toFixed(2) || "0.00"
        } was approved${
          activity.details.adminName ? ` by ${activity.details.adminName}` : ""
        }`;

      case "deposit_rejected":
        return `[${time}] ${activity.userDisplayName}'s deposit of $${
          activity.details.amount?.toFixed(2) || "0.00"
        } was rejected${
          activity.details.reason ? ` - ${activity.details.reason}` : ""
        }`;

      case "balance_updated":
        const balanceChange =
          activity.details.newBalance && activity.details.previousBalance
            ? activity.details.newBalance - activity.details.previousBalance
            : activity.details.amount || 0;
        const changeText = balanceChange > 0 ? "increased" : "decreased";
        return `[${time}] ${
          activity.userDisplayName
        }'s balance ${changeText} by $${Math.abs(balanceChange).toFixed(2)}${
          activity.details.adminName
            ? ` by admin ${activity.details.adminName}`
            : ""
        }`;

      case "user_suspended":
        return `[${time}] ${activity.userDisplayName} was suspended${
          activity.details.adminName ? ` by ${activity.details.adminName}` : ""
        }${activity.details.reason ? ` - ${activity.details.reason}` : ""}`;

      case "user_activated":
        return `[${time}] ${activity.userDisplayName} was activated${
          activity.details.adminName ? ` by ${activity.details.adminName}` : ""
        }`;

      case "referral_code_generated":
        return `[${time}] ${activity.userDisplayName} generated referral code: ${activity.details.referralCode}`;

      case "commission_earned":
        return `[${time}] ${activity.userDisplayName} earned $${
          activity.details.amount?.toFixed(2) || "0.00"
        } commission`;

      case "profile_updated":
        return `[${time}] ${activity.userDisplayName} updated their profile`;

      case "login":
        return `[${time}] ${activity.userDisplayName} logged in`;

      case "logout":
        return `[${time}] ${activity.userDisplayName} logged out`;

      case "unknown":
        return `[${time}] ${activity.userDisplayName} performed an unknown action`;

      default:
        // Log unknown activity types for debugging
        console.warn(`Unknown activity type: ${activity.type}`, activity);
        return `[${time}] ${activity.userDisplayName} performed an action (${activity.type})`;
    }
  }
}

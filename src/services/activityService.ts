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
    | "withdrawal_request";
  details: {
    quantity?: number;
    productName?: string;
    amount?: number;
    referralCode?: string;
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
   * Format activity message based on activity type and details
   */
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
        return `[${time}] ${activity.userDisplayName} requested a fund deposit of $${activity.details.amount}`;

      case "fund_withdrawal":
        return `[${time}] ${activity.userDisplayName} requested a withdrawal of $${activity.details.amount}`;

      case "product_sold":
        return `[${time}] ${activity.userDisplayName} sold ${activity.details.quantity} units of ${activity.details.productName}`;

      case "withdrawal_request":
        return `[${time}] ${activity.userDisplayName} needs to withdraw $${activity.details.amount}`;

      default:
        return `[${time}] ${activity.userDisplayName} performed an action`;
    }
  }
}

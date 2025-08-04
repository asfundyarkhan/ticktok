import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";

export interface MonthlyRevenue {
  month: string; // "2025-01", "2025-02", etc.
  year: number;
  monthName: string; // "January", "February", etc.
  totalRevenue: number;
  profitRevenue: number; // From product sales/profits
  commissionRevenue: number; // From admin commission earnings
  transactionCount: number;
  lastUpdated: Date;
}

export interface RevenueTransaction {
  id: string;
  date: Date;
  amount: number;
  type: "profit" | "commission";
  description: string;
  source: string; // "product_sale", "admin_deposit", "receipt_approval"
}

export class MonthlyRevenueService {
  private static readonly MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  /**
   * Get monthly revenue breakdown for an admin/seller/superadmin
   */
  static async getMonthlyRevenue(
    userId: string,
    userRole: "admin" | "seller" | "superadmin" = "admin",
    limitMonths: number = 12
  ): Promise<MonthlyRevenue[]> {
    try {
      const revenueMap = new Map<string, MonthlyRevenue>();

      if (userRole === "admin") {
        // Get commission revenue for admins
        await this.addCommissionRevenue(userId, revenueMap);
      } else if (userRole === "seller") {
        // Get profit revenue for sellers
        await this.addProfitRevenue(userId, revenueMap);
      } else if (userRole === "superadmin") {
        // Get superadmin revenue (deposits accepted minus withdrawals)
        await this.addSuperadminRevenue(userId, revenueMap);
      }

      // Convert map to array and sort by date (most recent first)
      const revenues = Array.from(revenueMap.values())
        .sort((a, b) => {
          const dateA = new Date(a.year, this.MONTHS.indexOf(a.monthName));
          const dateB = new Date(b.year, this.MONTHS.indexOf(b.monthName));
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limitMonths);

      return revenues;
    } catch (error) {
      console.error("Error getting monthly revenue:", error);
      return [];
    }
  }

  /**
   * Add commission revenue from admin earnings
   */
  private static async addCommissionRevenue(
    adminId: string,
    revenueMap: Map<string, MonthlyRevenue>
  ): Promise<void> {
    try {
      // Get commission transactions for the admin
      const commissionsQuery = query(
        collection(firestore, "commission_transactions"),
        where("adminId", "==", adminId),
        orderBy("createdAt", "desc")
      );

      const commissionsSnapshot = await getDocs(commissionsQuery);

      commissionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate() || new Date();
        const monthKey = this.getMonthKey(date);

        if (!revenueMap.has(monthKey)) {
          revenueMap.set(monthKey, this.createEmptyMonthlyRevenue(date));
        }

        const monthRevenue = revenueMap.get(monthKey)!;
        monthRevenue.commissionRevenue += data.commissionAmount || 0;
        monthRevenue.totalRevenue += data.commissionAmount || 0;
        monthRevenue.transactionCount += 1;
        monthRevenue.lastUpdated = new Date();
      });
    } catch (error) {
      console.error("Error adding commission revenue:", error);
    }
  }

  /**
   * Add profit revenue from seller earnings
   */
  private static async addProfitRevenue(
    sellerId: string,
    revenueMap: Map<string, MonthlyRevenue>
  ): Promise<void> {
    try {
      // Get transferred profits for the seller
      const profitsQuery = query(
        collection(firestore, "pending_deposits"),
        where("sellerId", "==", sellerId),
        where("profitTransferredAmount", ">", 0),
        orderBy("profitTransferredDate", "desc")
      );

      const profitsSnapshot = await getDocs(profitsQuery);

      profitsSnapshot.forEach((doc) => {
        const data = doc.data();
        const date =
          data.profitTransferredDate?.toDate() ||
          data.updatedAt?.toDate() ||
          new Date();
        const monthKey = this.getMonthKey(date);

        if (!revenueMap.has(monthKey)) {
          revenueMap.set(monthKey, this.createEmptyMonthlyRevenue(date));
        }

        const monthRevenue = revenueMap.get(monthKey)!;
        const profitAmount = data.profitTransferredAmount || 0;
        monthRevenue.profitRevenue += profitAmount;
        monthRevenue.totalRevenue += profitAmount;
        monthRevenue.transactionCount += 1;
        monthRevenue.lastUpdated = new Date();
      });
    } catch (error) {
      console.error("Error adding profit revenue:", error);
    }
  }

  /**
   * Get revenue transactions for a specific month
   */
  static async getMonthlyTransactions(
    userId: string,
    userRole: "admin" | "seller",
    year: number,
    month: number // 0-11 (JavaScript month indexing)
  ): Promise<RevenueTransaction[]> {
    try {
      const transactions: RevenueTransaction[] = [];

      // Calculate month boundaries
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      if (userRole === "admin") {
        // Get commission transactions
        const commissionsQuery = query(
          collection(firestore, "commission_transactions"),
          where("adminId", "==", userId),
          where("createdAt", ">=", Timestamp.fromDate(startDate)),
          where("createdAt", "<=", Timestamp.fromDate(endDate)),
          orderBy("createdAt", "desc")
        );

        const commissionsSnapshot = await getDocs(commissionsQuery);

        commissionsSnapshot.forEach((doc) => {
          const data = doc.data();
          transactions.push({
            id: doc.id,
            date: data.createdAt?.toDate() || new Date(),
            amount: data.commissionAmount || 0,
            type: "commission",
            description: data.description || "Commission earnings",
            source: data.type || "commission",
          });
        });
      }

      if (userRole === "seller") {
        // Get profit transactions
        const profitsQuery = query(
          collection(firestore, "pending_deposits"),
          where("sellerId", "==", userId),
          where("profitTransferredDate", ">=", Timestamp.fromDate(startDate)),
          where("profitTransferredDate", "<=", Timestamp.fromDate(endDate)),
          orderBy("profitTransferredDate", "desc")
        );

        const profitsSnapshot = await getDocs(profitsQuery);

        profitsSnapshot.forEach((doc) => {
          const data = doc.data();
          transactions.push({
            id: doc.id,
            date: data.profitTransferredDate?.toDate() || new Date(),
            amount: data.profitTransferredAmount || 0,
            type: "profit",
            description: `Profit from ${data.productName || "product sale"}`,
            source: "product_sale",
          });
        });
      }

      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error("Error getting monthly transactions:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time monthly revenue updates
   */
  static subscribeToMonthlyRevenue(
    userId: string,
    userRole: "admin" | "seller",
    callback: (revenues: MonthlyRevenue[]) => void,
    limitMonths: number = 12
  ): () => void {
    // For now, we'll poll every 30 seconds for updates
    // In a production app, you might want to use more sophisticated real-time updates
    const intervalId = setInterval(async () => {
      const revenues = await this.getMonthlyRevenue(
        userId,
        userRole,
        limitMonths
      );
      callback(revenues);
    }, 30000);

    // Initial load
    this.getMonthlyRevenue(userId, userRole, limitMonths).then(callback);

    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }

  /**
   * Get month key for grouping (YYYY-MM format)
   */
  private static getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }

  /**
   * Create empty monthly revenue object
   */
  private static createEmptyMonthlyRevenue(date: Date): MonthlyRevenue {
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const monthName = this.MONTHS[monthIndex];
    const monthKey = this.getMonthKey(date);

    return {
      month: monthKey,
      year,
      monthName,
      totalRevenue: 0,
      profitRevenue: 0,
      commissionRevenue: 0,
      transactionCount: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get revenue summary for current year
   */
  static async getYearlyRevenueSummary(
    userId: string,
    userRole: "admin" | "seller",
    year?: number
  ): Promise<{
    totalRevenue: number;
    monthlyBreakdown: MonthlyRevenue[];
    bestMonth: MonthlyRevenue | null;
    averageMonthlyRevenue: number;
  }> {
    try {
      const targetYear = year || new Date().getFullYear();
      const allRevenues = await this.getMonthlyRevenue(userId, userRole, 12);

      // Filter for target year
      const yearlyRevenues = allRevenues.filter((r) => r.year === targetYear);

      const totalRevenue = yearlyRevenues.reduce(
        (sum, r) => sum + r.totalRevenue,
        0
      );
      const bestMonth = yearlyRevenues.reduce(
        (best, current) =>
          !best || current.totalRevenue > best.totalRevenue ? current : best,
        null as MonthlyRevenue | null
      );

      const averageMonthlyRevenue =
        yearlyRevenues.length > 0 ? totalRevenue / yearlyRevenues.length : 0;

      return {
        totalRevenue,
        monthlyBreakdown: yearlyRevenues,
        bestMonth,
        averageMonthlyRevenue,
      };
    } catch (error) {
      console.error("Error getting yearly revenue summary:", error);
      return {
        totalRevenue: 0,
        monthlyBreakdown: [],
        bestMonth: null,
        averageMonthlyRevenue: 0,
      };
    }
  }

  /**
   * Add superadmin revenue from deposits accepted minus withdrawals
   */
  private static async addSuperadminRevenue(
    superadminId: string,
    revenueMap: Map<string, MonthlyRevenue>
  ): Promise<void> {
    try {
      // Get approved deposit receipts (money coming in)
      const depositsQuery = query(
        collection(firestore, "receipts_v2"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
      );

      const depositsSnapshot = await getDocs(depositsQuery);

      depositsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt && data.amount) {
          const date = data.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!revenueMap.has(monthKey)) {
            revenueMap.set(monthKey, {
              month: monthKey,
              year: date.getFullYear(),
              monthName: this.MONTHS[date.getMonth()],
              totalRevenue: 0,
              profitRevenue: 0,
              commissionRevenue: 0,
              transactionCount: 0,
              lastUpdated: new Date(),
            });
          }

          const monthData = revenueMap.get(monthKey)!;
          monthData.totalRevenue += data.amount;
          monthData.commissionRevenue += data.amount; // Deposits are commission revenue for superadmin
          monthData.transactionCount += 1;
        }
      });

      // Get withdrawals (money going out)
      const withdrawalsQuery = query(
        collection(firestore, "withdrawal_requests"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc")
      );

      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);

      withdrawalsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt && data.amount) {
          const date = data.createdAt.toDate();
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!revenueMap.has(monthKey)) {
            revenueMap.set(monthKey, {
              month: monthKey,
              year: date.getFullYear(),
              monthName: this.MONTHS[date.getMonth()],
              totalRevenue: 0,
              profitRevenue: 0,
              commissionRevenue: 0,
              transactionCount: 0,
              lastUpdated: new Date(),
            });
          }

          const monthData = revenueMap.get(monthKey)!;
          monthData.totalRevenue -= data.amount; // Subtract withdrawals
          monthData.commissionRevenue -= data.amount;
          monthData.transactionCount += 1;
        }
      });
    } catch (error) {
      console.error("Error adding superadmin revenue:", error);
    }
  }
}

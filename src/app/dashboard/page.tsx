"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard } from "lucide-react";
import StatsCard from "../components/StatsCard";
import ActivityTable from "../components/ActivityTable";
import TransactionHistory from "../components/TransactionHistory";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../components/Loading";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";
import AdminReferralBalanceCard from "../components/AdminReferralBalanceCard";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }
    // Check if user is an admin or superadmin, redirect appropriately for other roles
    if (
      !authLoading &&
      userProfile &&
      userProfile.role !== "admin" &&
      userProfile.role !== "superadmin"
    ) {
      // Redirect based on role
      if (userProfile.role === "seller") {
        window.location.href = "/profile"; // Sellers go to profile
      } else {
        window.location.href = "/store"; // Regular users go to store
      }
      return;
    } // Load dashboard data
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Set up real-time listener for referred users' balances
        const referredUsersQuery = query(
          collection(firestore, "users"),
          where("referredBy", "==", user.uid)
        );
        const unsubscribe = onSnapshot(referredUsersQuery, (snapshot) => {
          const referredUsers = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              uid: doc.id,
              balance: data.balance || 0,
            };
          });

          setReferralCount(referredUsers.length);

          // Calculate total balance from all referred users in real-time
          const totalBalance = referredUsers.reduce(
            (total, user) => total + user.balance,
            0
          );
          setReferralBalance(totalBalance);
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      const unsubscribe = loadDashboardData();

      // Cleanup listeners on unmount
      return () => {
        if (unsubscribe) {
          unsubscribe.then((unsub) => unsub && unsub());
        }
      };
    }
  }, [user, userProfile, authLoading, router]);
  // Stats to display on the dashboard
  const stats = [
    {
      title: "User ID",
      value: user?.uid?.substring(0, 8) || "...",
      icon: Users,
    },
    {
      title: "Referred Sellers",
      value: referralCount.toString(),
      icon: Users,
    },
    {
      title: "Total Referral Balance",
      value: `$${referralBalance.toFixed(2)}`,
      icon: CreditCard,
      description: "Combined balance of referred sellers",
    },
    {
      title: "My Balance",
      value: `$${userProfile?.balance?.toFixed(2) || "0.00"}`,
      icon: CreditCard,
      description: "Your current balance including commissions",
    },
  ];

  // Show loading spinner while loading
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Display AdminReferralBalanceCard only for superadmins */}
      {userProfile?.role === "superadmin" && (
        <div className="mb-6">
          <AdminReferralBalanceCard />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Table */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <ActivityTable title="Recent Activity" />
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}

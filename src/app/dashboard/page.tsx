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

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();  const [loading, setLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  const [referralBalance, setReferralBalance] = useState(0);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      window.location.href = "/login?redirect=/dashboard";
      return;
    }    // Check if user is an admin or superadmin, redirect appropriately for other roles
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
    }// Load dashboard data
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);

        // Set up real-time listener for referred users' balances
        const referredUsersQuery = query(
          collection(firestore, "users"),
          where("referredBy", "==", user.uid)
        );        const unsubscribe = onSnapshot(referredUsersQuery, (snapshot) => {
          const referredUsers = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              uid: doc.id,
              balance: data.balance || 0
            };
          });
          
          setReferralCount(referredUsers.length);
          
          // Calculate total balance from all referred users in real-time
          const totalBalance = referredUsers.reduce((total, user) => total + user.balance, 0);
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
          unsubscribe.then(unsub => unsub && unsub());
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
    <div className="p-6">
      {/* User Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {userProfile?.displayName || "User Dashboard"}
          </h1>
          <span className="px-2 py-1 text-sm bg-gray-100 rounded-md">
            {userProfile?.role || "user"}
          </span>
        </div>
      </div>      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Coming Soon Message */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-pink-600 mb-2">Coming Soon!</h2>
          <p className="text-gray-600">New features and enhanced analytics are on the way</p>
        </div>
      </div>

      {/* Activity Table */}
      <div className="mb-8">
        <ActivityTable title="Recent Activity" />
      </div>{/* Transaction History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User's own transactions */}
        <TransactionHistory 
          maxItems={5}
          showCommissions={false}
        />
        
        {/* Commission earnings (for admins/agents) */}
        {userProfile?.role === "admin" || userProfile?.role === "superadmin" ? (
          <TransactionHistory 
            maxItems={5}
            showCommissions={true}
          />        ) : null}
      </div>
    </div>
  );
}

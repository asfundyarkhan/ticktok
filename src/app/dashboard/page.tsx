"use client";

import { useEffect, useState } from "react";
import ActivityTable from "../components/ActivityTable";
import TransactionHistory from "../components/TransactionHistory";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "../components/Loading";
import { onSnapshot, query, collection, where } from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";
import TransactionBalanceCard from "../components/TransactionBalanceCard";
import TotalCommissionOverviewCard from "../components/TotalCommissionOverviewCard";
import RecentActivityPanel from "../components/RecentActivityPanel";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();  const [loading, setLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);

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
    }    // Load dashboard data
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);        // Set up real-time listener for referred users and their balances
        const referredUsersQuery = query(
          collection(firestore, "users"),
          where("referredBy", "==", user.uid)
        );        const unsubscribeUsers = onSnapshot(referredUsersQuery, (snapshot) => {
          console.log("👥 Referred users snapshot:", snapshot.size, "users");
          setReferralCount(snapshot.docs.length);
        });

        // Store unsubscribe functions for cleanup
        return () => {
          unsubscribeUsers();
        };
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

  // Show loading spinner while loading
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {userProfile?.role === "superadmin" ? "Super Admin Dashboard" : 
           userProfile?.role === "admin" ? "Admin Dashboard" : "Dashboard"}
        </h1>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      
      {/* Dashboard Summary Section - 2x2 Grid Layout */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Left: Total Earnings/Balance */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start space-x-3 lg:space-x-4 mb-4 lg:mb-6">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 118 0H9l-1 1H8m6-1h1a3 3 0 118 0h-2m-4-4v4m0-4V4a1 1 0 011-1h2a1 1 0 011 1v4M9 4h6m-6 0V3m6 1V3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">
                  {userProfile?.role === "superadmin" || userProfile?.role === "admin" ? "Total Balance" : "My Balance"}
                </h3>
                <p className="text-xs lg:text-sm text-gray-500">Your current account balance</p>
              </div>
            </div>
            
            <div className="space-y-3 lg:space-y-4">
              <div className="flex items-baseline space-x-2 lg:space-x-3">
                <span className="text-2xl lg:text-4xl font-bold text-green-600">
                  ${userProfile?.balance?.toFixed(2) || "0.00"}
                </span>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium text-green-600">Live</span>
                </div>
              </div>
              
              <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">Real-time balance updates • Secure transactions</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div className="bg-blue-50 p-3 lg:p-4 rounded-xl">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xs lg:text-sm">ID</span>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-gray-700">User ID</p>
                      <p className="text-sm lg:text-lg font-bold text-gray-900">{user?.uid?.substring(0, 8) || "..."}</p>
                      <p className="text-xs text-gray-500">Your unique identifier</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 lg:p-4 rounded-xl">
                  <div className="flex items-center space-x-2 lg:space-x-3">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 lg:w-4 lg:h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs lg:text-sm font-medium text-gray-700">Referred Users</p>
                      <p className="text-sm lg:text-lg font-bold text-gray-900">{referralCount}</p>
                      <p className="text-xs text-gray-500">Total referrals</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: Commission Overview */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4 lg:mb-6">
              <div className="flex items-start space-x-3 lg:space-x-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">
                    {userProfile?.role === "superadmin" ? "Total Commission" : "Transaction Overview"}
                  </h3>
                  <p className="text-xs lg:text-sm text-gray-500">Performance metrics</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs lg:text-sm text-gray-500">Live Data</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {userProfile?.role === "superadmin" ? (
                <TotalCommissionOverviewCard />
              ) : (
                <TransactionBalanceCard />
              )}
            </div>
          </div>

          {/* Bottom Left: User Profile & Role */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4 lg:mb-6">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">User Profile</h3>
              <div className="inline-block">
                <span className="text-lg lg:text-2xl font-bold text-pink-500 bg-pink-50 px-3 py-1 rounded-lg uppercase">
                  {userProfile?.role || 'User'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 lg:mb-4">Account Details</h4>
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-gray-600">User ID:</span>
                    <span className="text-xs lg:text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {user?.uid?.substring(0, 12) || "..."}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-gray-600">Email:</span>
                    <span className="text-xs lg:text-sm text-gray-900 truncate max-w-32">
                      {user?.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs lg:text-sm text-gray-600">Role:</span>
                    <span className="text-xs lg:text-sm font-medium text-purple-600 capitalize">
                      {userProfile?.role || "User"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 lg:p-4 rounded-xl">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right ml-auto">
                    <div className="text-xs lg:text-sm font-medium text-green-800">Account Status</div>
                    <div className="text-sm lg:text-base font-bold text-green-600">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Recent Activity */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-4 lg:mb-6">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-1">
                <div className="text-xs lg:text-sm text-gray-500 uppercase tracking-wide font-medium mb-3">
                  <div className="grid grid-cols-3 gap-4">
                    <span>DATE</span>
                    <span>ACTIVITY</span>
                    <span>STATUS</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <RecentActivityPanel maxItems={3} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content for Admins/SuperAdmins */}
      {(userProfile?.role === "admin" || userProfile?.role === "superadmin") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Transaction History */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
            <TransactionHistory maxItems={5} />
          </div>

          {/* Activity Overview */}
          <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h2>
            <ActivityTable title="" />
          </div>
        </div>
      )}
    </div>
  );
}

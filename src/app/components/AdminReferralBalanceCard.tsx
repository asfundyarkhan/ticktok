"use client";

import { useState, useEffect } from "react";
import { UserService } from "../../services/userService";

export default function AdminReferralBalanceCard() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [adminsCount, setAdminsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");  useEffect(() => {
    const fetchTotalBalance = async () => {      try {
        setLoading(true);
        const { totalBalance, adminsCount } = await UserService.getTotalPeakAdminReferralBalance();
        setTotalBalance(totalBalance);
        setAdminsCount(adminsCount);
      } catch (error) {
        console.error("Error fetching total admin referral balance:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch total balance");
      } finally {
        setLoading(false);
      }
    };

    fetchTotalBalance();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchTotalBalance, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg shadow-md">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Data</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Total Referral Balance Overview
      </h3>
      <div className="space-y-4">
        <div>          <p className="text-sm text-gray-500">Peak Combined Balance of All Referred Sellers</p>
          <p className="text-3xl font-bold text-green-600">
            ${totalBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Highest total balance reached by all referred sellers (never decreases)
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Number of Active Admins</p>
          <p className="text-xl font-semibold text-gray-900">{adminsCount}</p>
        </div>
        <div className="text-sm text-gray-500">
          <p>Average Referral Balance per Admin: ${(totalBalance / (adminsCount || 1)).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { UserService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function IndividualReferralBalanceCard() {
  const { user } = useAuth();
  const [referralBalance, setReferralBalance] = useState(0);
  const [referredCount, setReferredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReferralBalance = async () => {
      if (!user) return;

      try {
        setLoading(true);
          // Get the peak referral balance (never decreases)
        const balance = await UserService.getAdminPeakReferralBalance(user.uid);
        setReferralBalance(balance);

        // Get the count of referred users
        const referredUsers = await UserService.getUsersReferredByAdmin(user.uid);
        setReferredCount(referredUsers.length);

      } catch (error) {
        console.error("Error fetching referral balance:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch referral balance");
      } finally {
        setLoading(false);
      }
    };

    fetchReferralBalance();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchReferralBalance, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [user]);

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
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        My Referral Balance
      </h3>
      <div className="space-y-4">
        <div>          <p className="text-sm text-gray-500">My Peak Referral Balance</p>
          <p className="text-3xl font-bold text-blue-600">
            ${referralBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Highest combined balance of sellers I referred (never decreases)
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Sellers I Referred</p>
          <p className="text-xl font-semibold text-gray-900">{referredCount}</p>
        </div>
        {referredCount > 0 && (
          <div className="text-sm text-gray-500">
            <p>Average Balance per Referred Seller: ${(referralBalance / referredCount).toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

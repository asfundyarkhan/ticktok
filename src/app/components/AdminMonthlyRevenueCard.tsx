"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { MonthlyRevenueService, MonthlyRevenue } from "../../services/monthlyRevenueService";
import { TrendingUp, DollarSign, Wallet, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AdminMonthlyRevenueCardProps {
  userRole?: "admin" | "seller" | "superadmin";
  showBreakdown?: boolean;
  className?: string;
}

export default function AdminMonthlyRevenueCard({ 
  userRole = "admin", 
  showBreakdown = true,
  className = "" 
}: AdminMonthlyRevenueCardProps) {
  const { user, userProfile } = useAuth();
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectiveRole = userRole || userProfile?.role || "admin";

  useEffect(() => {
    if (!user?.uid) return;

    const fetchMonthlyRevenue = async () => {
      try {
        setLoading(true);
        const revenues = await MonthlyRevenueService.getMonthlyRevenue(
          user.uid,
          effectiveRole,
          3 // Get last 3 months
        );
        setMonthlyRevenues(revenues);
        setError("");
      } catch (error) {
        console.error("Error fetching monthly revenue:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch monthly revenue");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyRevenue();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchMonthlyRevenue, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [user?.uid, effectiveRole]);

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-5 bg-slate-200 rounded-lg w-32 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-48"></div>
              </div>
            </div>
            <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
          </div>
          <div className="mb-6">
            <div className="h-8 bg-slate-200 rounded-lg w-40 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-64"></div>
          </div>
          {showBreakdown && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 rounded-xl"></div>
              <div className="h-24 bg-slate-200 rounded-xl"></div>
              <div className="h-24 bg-slate-200 rounded-xl"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="text-red-600 text-center">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-medium mb-1 text-sm">Error loading monthly revenue</p>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const currentMonth = monthlyRevenues[0];
  const previousMonth = monthlyRevenues[1];
  const currentMonthRevenue = currentMonth?.totalRevenue || 0;
  const currentMonthCommission = currentMonth?.commissionRevenue || 0;
  const currentMonthProfit = currentMonth?.profitRevenue || 0;
  const currentMonthTransactions = currentMonth?.transactionCount || 0;
  
  let changePercentage = 0;
  let isPositiveChange = true;
  if (previousMonth && previousMonth.totalRevenue > 0) {
    changePercentage = ((currentMonthRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100;
    isPositiveChange = changePercentage >= 0;
  }

  const getTitle = () => {
    switch (effectiveRole) {
      case "superadmin":
        return "Monthly Platform Revenue";
      case "seller":
        return "Monthly Profit Earnings";
      default:
        return "Monthly Earnings";
    }
  };

  const getDescription = () => {
    switch (effectiveRole) {
      case "superadmin":
        return "Platform revenue for current month";
      case "seller":
        return "Profit earnings for current month";
      default:
        return "Monthly earnings for current month";
    }
  };

  return (
    <div className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 min-w-0 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 min-w-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{getTitle()}</h2>
            <p className="text-slate-600 text-xs sm:text-sm truncate">{getDescription()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 border border-emerald-200 rounded-full flex-shrink-0">
          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
          <span className="text-emerald-700 font-medium text-xs sm:text-sm">
            {currentMonth?.monthName || "Current"}
          </span>
        </div>
      </div>

      {/* Main Revenue */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent break-all">
            ${currentMonthRevenue.toFixed(2)}
          </span>
          {previousMonth && (
            <div className="flex items-center gap-1">
              {isPositiveChange ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(changePercentage).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <p className="text-slate-600 text-xs sm:text-sm leading-tight">
          {previousMonth 
            ? `vs ${previousMonth.monthName} • ${currentMonthTransactions} transactions` 
            : `${currentMonthTransactions} transactions this month`
          }
        </p>
      </div>

      {/* Breakdown Grid */}
      {showBreakdown && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Commission Revenue */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                {effectiveRole === "superadmin" ? "Deposits" : "Earnings"}
              </h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1 truncate">
              ${currentMonthCommission.toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {effectiveRole === "superadmin" ? "Deposits accepted" : "From admin activities"}
            </p>
          </div>

          {/* Profit/Withdrawal Revenue */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                {effectiveRole === "superadmin" ? "Withdrawals" : "Receipts"}
              </h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1 truncate">
              ${currentMonthProfit.toFixed(2)}
            </p>
            <p className="text-slate-500 text-xs truncate">
              {effectiveRole === "superadmin" ? "Withdrawals processed" : "From receipt approvals"}
            </p>
          </div>

          {/* Transaction Count */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">Transactions</h3>
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1 truncate">
              {currentMonthTransactions}
            </p>
            <p className="text-slate-500 text-xs truncate">
              This month
            </p>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          <strong>Monthly Revenue:</strong> Shows current month&apos;s earnings only. 
          {effectiveRole === "superadmin" 
            ? " Net revenue from platform operations (deposits minus withdrawals)."
            : effectiveRole === "seller"
            ? " Profit earnings from product sales only."
            : " Monthly earnings from deposits and receipt approvals only."}
        </p>
      </div>
    </div>
  );
}

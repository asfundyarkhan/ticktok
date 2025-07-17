"use client";

import { useState, useEffect } from "react";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PlatformStatsService, PlatformStats } from "../../services/platformStatsService";

interface MonthlyRevenueCardProps {
  className?: string;
}

export default function MonthlyRevenueCard({ className = "" }: MonthlyRevenueCardProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const platformStats = await PlatformStatsService.getLivePlatformStats();
        setStats(platformStats);
      } catch (error) {
        console.error("Error loading platform stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadStats();

    // Set up auto-refresh every 30 seconds for live data
    const interval = setInterval(loadStats, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-200 rounded w-16"></div>
          </div>
          <div className="space-y-4">
            <div className="h-12 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-slate-200 rounded"></div>
              <div className="h-20 bg-slate-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2" />
          <p>Unable to load platform statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
              <p className="text-sm text-slate-500">Performance metrics</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Live Data
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Monthly Revenue Overview */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-3">Monthly Revenue Overview</h4>
            <p className="text-sm text-slate-600 mb-4">
              Total Monthly Revenue (Deposits - Withdrawals)
            </p>
            
            {/* Main Revenue Amount */}
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(stats.totalMonthlyRevenue)}
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Net revenue from platform operations
            </p>

            {/* Deposits and Withdrawals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Deposits Accepted */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Deposits Accepted</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.depositsAccepted)}
                </div>
              </div>

              {/* Withdrawals Processed */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownRight className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">Withdrawals Processed</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.withdrawalsProcessed)}
                </div>
              </div>
            </div>

            {/* Transaction Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Transactions */}
              <div>
                <span className="text-sm font-medium text-slate-600 block mb-1">Total Transactions</span>
                <div className="text-xl font-bold text-slate-900">
                  {stats.totalTransactions}
                </div>
              </div>

              {/* Average per Transaction */}
              <div>
                <span className="text-sm font-medium text-slate-600 block mb-1">Average per Transaction</span>
                <div className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.averagePerTransaction)}
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Note:</strong> This shows your platform&apos;s net revenue from accepted deposits minus processed 
                withdrawals. Updates automatically every 30 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

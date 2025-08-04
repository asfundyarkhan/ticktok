"use client";

import { useState, useEffect } from "react";
import { SuperAdminRoute } from "../../../components/SuperAdminRoute";
import TransactionHistory from "../../../components/TransactionHistory";
import MonthlyRevenueCard from "../../../components/MonthlyRevenueCard";
import { useAuth } from "../../../../context/AuthContext";
import { CommissionService } from "../../../../services/commissionService";
import { PlatformStatsService } from "../../../../services/platformStatsService";
import { CommissionSummary } from "../../../../types/commission";
import { LoadingSpinner } from "../../../components/Loading";
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  BarChart3
} from "lucide-react";

function AdminTransactionsPageContent() {
  const { user, userProfile } = useAuth();
  const [transactionSummary, setTransactionSummary] = useState<CommissionSummary>({
    totalCommissionBalance: 0,
    totalFromSuperadminDeposits: 0,
    totalFromReceiptApprovals: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  const isSuperAdmin = userProfile?.role === "superadmin";

  useEffect(() => {
    if (!user) return;

    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary based on user role
        if (isSuperAdmin) {
          // For superadmin, get platform-wide revenue data (deposits minus withdrawals)
          const stats = await PlatformStatsService.getMonthlyPlatformStats();
          
          // Convert platform stats to transaction summary format for display
          setTransactionSummary({
            totalCommissionBalance: stats.totalMonthlyRevenue,
            totalFromSuperadminDeposits: stats.depositsAccepted,
            totalFromReceiptApprovals: stats.withdrawalsProcessed,
            transactionCount: stats.totalTransactions,
          });
        } else {
          // For regular admin, get personal commission data
          const summary = await CommissionService.getAdminCommissionSummary(user.uid);
          setTransactionSummary(summary);
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch transaction data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();

    // Subscribe to real-time updates every 30 seconds for live data
    const interval = setInterval(fetchTransactionData, 30 * 1000);

    // Subscribe to real-time updates for admins only
    let unsubscribeBalance: (() => void) | null = null;
    if (!isSuperAdmin) {
      unsubscribeBalance = CommissionService.subscribeToAdminCommissionBalance(
        user.uid,
        (balance) => {
          setTransactionSummary(prev => ({
            ...prev,
            totalCommissionBalance: balance,
          }));
        }
      );
    }

    return () => {
      clearInterval(interval);
      if (unsubscribeBalance) {
        unsubscribeBalance();
      }
    };
  }, [user, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading your transaction dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md mx-4">
          <div className="text-red-600 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-slate-900">Unable to Load Dashboard</h2>
            <p className="text-sm text-slate-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {isSuperAdmin ? "Platform Revenue Dashboard" : "Transaction Dashboard"}
                </h1>
                <p className="text-slate-600 mt-1">
                  {isSuperAdmin 
                    ? "Monitor platform-wide revenue from deposits and withdrawals"
                    : "Monitor your earnings from merchant deposits and receipt approvals"}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {/* Monthly Revenue Card for Super Admins */}
            {isSuperAdmin && (
              <div className="mb-8">
                <MonthlyRevenueCard />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Earnings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    Live
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperAdmin ? "Net Platform Revenue" : "Total Earnings"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalCommissionBalance.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperAdmin ? "Deposits minus withdrawals" : "From all sources"}
                  </p>
                </div>
              </div>

              {/* Revenue through Receipts */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    Live
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperAdmin ? "Withdrawals Processed" : "Revenue through Receipts"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalFromReceiptApprovals.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperAdmin ? "Total withdrawals processed" : "From approved receipts"}
                  </p>
                </div>
              </div>

              {/* Receipt Earnings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  {!isSuperAdmin && (
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      +15.1%
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperAdmin ? "Deposits Accepted" : "Deposit Commissions"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalFromSuperadminDeposits.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperAdmin ? "Total deposits processed" : "From admin deposits"}
                  </p>
                </div>
              </div>

              {/* Transaction Count */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    Live
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperAdmin ? "Total Operations" : "Total Transactions"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {transactionSummary.transactionCount}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperAdmin ? "Platform operations" : "This month"}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {isSuperAdmin ? "Platform Revenue Information" : "How Transaction Earnings Work"}
                  </h3>
                  <div className="text-blue-800 space-y-2">
                    {isSuperAdmin ? (
                      <>
                        <p className="leading-relaxed">
                          Platform revenue is calculated from deposits and withdrawals processed:
                        </p>
                        <ul className="space-y-2 ml-4">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Deposits:</strong> Total approved deposit receipts from all merchants</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Withdrawals:</strong> Total approved withdrawal requests from all sellers</span>
                          </li>
                        </ul>
                        <div className="mt-4 p-4 bg-white bg-opacity-60 rounded-xl">
                          <p className="font-semibold text-blue-900">
                            📊 Net Revenue = Total Deposits - Total Withdrawals
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="leading-relaxed">
                          Your transaction earnings are generated from two main sources:
                        </p>
                        <ul className="space-y-2 ml-4">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Manual Deposits:</strong> Earnings from deposits made by administrators to your referred merchants</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Receipt Approvals:</strong> Earnings from approved payment receipts submitted by your referred merchants</span>
                          </li>
                        </ul>
                        <div className="mt-4 p-4 bg-white bg-opacity-60 rounded-xl">
                          <p className="font-semibold text-blue-900">
                            📌 Important: Earnings are NOT generated from product sales made by your referred merchants. 
                            This ensures earnings are only paid on actual fund deposits into the system.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <TransactionHistory 
              adminId={user?.uid} 
              maxItems={50}
              showTitle={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminTransactionsPage() {
  return (
    <SuperAdminRoute>
      <AdminTransactionsPageContent />
    </SuperAdminRoute>
  );
}

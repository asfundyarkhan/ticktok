"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { AdminRoute } from "../../components/AdminRoute";
import { LoadingSpinner } from "../../components/Loading";
import { CommissionService } from "../../../services/commissionService";
import { CommissionSummary } from "../../../types/commission";
import AdminMonthlyRevenueCard from "../../components/AdminMonthlyRevenueCard";
import MonthlyRevenueCard from "../../components/MonthlyRevenueCard";
import TransactionHistory from "../../components/TransactionHistory";
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

function TransactionDashboardContent() {
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

  const isSuperadmin = userProfile?.role === "superadmin";

  useEffect(() => {
    if (!user) return;

    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary based on user role
        if (isSuperadmin) {
          // For superadmin, get platform-wide data
          const summary = await CommissionService.getTotalCommissionBalance();
          setTransactionSummary({
            totalCommissionBalance: summary.totalBalance,
            totalFromSuperadminDeposits: summary.totalFromSuperadminDeposits,
            totalFromReceiptApprovals: summary.totalFromReceiptApprovals,
            transactionCount: summary.adminsCount, // Using adminsCount as transaction count
          });
        } else {
          // For regular admin, get personal data
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

    // Subscribe to real-time updates
    const unsubscribeBalance = CommissionService.subscribeToAdminCommissionBalance(
      user.uid,
      (balance) => {
        setTransactionSummary(prev => ({
          ...prev,
          totalCommissionBalance: balance,
        }));
      }
    );

    return () => {
      unsubscribeBalance();
    };
  }, [user, isSuperadmin]);

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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {isSuperadmin ? "Platform Revenue Dashboard" : "Transaction Dashboard"}
              </h1>
              <p className="text-slate-600 mt-1">
                {isSuperadmin 
                  ? "Monitor platform-wide revenue from deposits and withdrawals"
                  : "Monitor your earnings from merchant deposits and receipt approvals"}
              </p>
            </div>
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
            {/* Main Balance Card */}
            <div className="mb-8">
              {isSuperadmin ? (
                <MonthlyRevenueCard />
              ) : (
                <AdminMonthlyRevenueCard 
                  userRole={userProfile?.role as "admin" | "seller" | "superadmin"}
                  showBreakdown={true}
                />
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Earnings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperadmin ? "Net Platform Revenue" : "Total Earnings"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalCommissionBalance.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperadmin ? "Deposits minus withdrawals" : "From all sources"}
                  </p>
                </div>
              </div>

              {/* Deposit Earnings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                    <ArrowUpRight className="w-4 h-4" />
                    +8.2%
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperadmin ? "Deposits Accepted" : "Deposit Commissions"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalFromSuperadminDeposits.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperadmin ? "Total deposits processed" : "From admin deposits"}
                  </p>
                </div>
              </div>

              {/* Receipt Earnings */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  {!isSuperadmin && (
                    <div className="flex items-center gap-1 text-purple-600 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      +15.1%
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperadmin ? "Withdrawals Processed" : "Receipt Approvals"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    ${transactionSummary.totalFromReceiptApprovals.toFixed(2)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperadmin ? "Total withdrawals processed" : "From approved receipts"}
                  </p>
                </div>
              </div>

              {/* Transaction Count */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  {!isSuperadmin && (
                    <div className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                      <ArrowUpRight className="w-4 h-4" />
                      +24
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-slate-600 text-sm font-medium mb-1">
                    {isSuperadmin ? "Total Operations" : "Total Transactions"}
                  </h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {transactionSummary.transactionCount}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {isSuperadmin ? "Platform operations" : "This month"}
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
                    How Transaction Earnings Work
                  </h3>
                  <div className="text-blue-800 space-y-2">
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
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <TransactionHistory maxItems={50} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionDashboardPage() {
  return (
    <AdminRoute>
      <TransactionDashboardContent />
    </AdminRoute>
  );
}

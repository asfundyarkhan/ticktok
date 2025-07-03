import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CommissionService } from "../../services/commissionService";
import { CommissionSummary } from "../../types/commission";
import { TrendingUp, DollarSign, Wallet, ArrowUpRight } from "lucide-react";

export default function TransactionBalanceCard() {
  const { user } = useAuth();
  const [transactionSummary, setTransactionSummary] = useState<CommissionSummary>({
    totalCommissionBalance: 0,
    totalFromSuperadminDeposits: 0,
    totalFromReceiptApprovals: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchTransactionData = async () => {
      try {
        setLoading(true);
        const summary = await CommissionService.getAdminCommissionSummary(user.uid);
        setTransactionSummary(summary);
      } catch (error) {
        console.error("Error fetching transaction data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch transaction data");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();

    // Subscribe to real-time updates
    const unsubscribe = CommissionService.subscribeToAdminCommissionBalance(
      user.uid,
      (balance) => {
        setTransactionSummary(prev => ({
          ...prev,
          totalCommissionBalance: balance,
        }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
            <div className="h-24 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
        <div className="text-red-600 text-center">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-medium mb-1 text-sm">Error loading transaction data</p>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900">Total Earnings</h2>
            <p className="text-slate-600 text-sm">Your accumulated transaction earnings</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 font-medium text-sm">Active</span>
        </div>
      </div>

      {/* Main Balance */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
          <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            ${transactionSummary.totalCommissionBalance.toFixed(2)}
          </span>
          <div className="flex items-center gap-1 text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
            <span className="font-semibold text-sm">+12.5%</span>
          </div>
        </div>
        <p className="text-slate-600 text-sm">
          From deposits and receipt approvals • Updated in real-time
        </p>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deposits */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Admin Deposits</h3>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">
            ${transactionSummary.totalFromSuperadminDeposits.toFixed(2)}
          </p>
          <p className="text-slate-500 text-xs">From manual deposits</p>
        </div>

        {/* Receipts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Receipt Approvals</h3>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">
            ${transactionSummary.totalFromReceiptApprovals.toFixed(2)}
          </p>
          <p className="text-slate-500 text-xs">From approved receipts</p>
        </div>

        {/* Transaction Count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">Transactions</h3>
          </div>
          <p className="text-xl font-bold text-slate-900 mb-1">
            {transactionSummary.transactionCount}
          </p>
          <p className="text-slate-500 text-xs">
            {transactionSummary.lastTransaction 
              ? `Last: ${transactionSummary.lastTransaction.toLocaleDateString()}`
              : "No transactions yet"
            }
          </p>
        </div>
      </div>
    </div>
  );
}

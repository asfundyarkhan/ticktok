"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CommissionService } from "../../services/commissionService";
import { CommissionTransaction } from "../../types/commission";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  DollarSign, 
  Calendar,
  Search,
  TrendingUp
} from "lucide-react";

interface TransactionHistoryProps {
  adminId?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export default function TransactionHistory({ 
  adminId, 
  maxItems = 10,
  showTitle = true 
}: TransactionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "deposits" | "receipts">("all");

  const targetAdminId = adminId || user?.uid;

  useEffect(() => {
    if (!targetAdminId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time transaction updates
    const unsubscribe = CommissionService.subscribeToAdminCommissionTransactions(
      targetAdminId,
      (newTransactions) => {
        setTransactions(newTransactions.slice(0, maxItems));
        setLoading(false);
      },
      maxItems
    );

    return () => unsubscribe();
  }, [targetAdminId, maxItems]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.sellerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "deposits" && transaction.type === "superadmin_deposit") ||
      (filterType === "receipts" && transaction.type === "receipt_approval");

    return matchesSearch && matchesFilter;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "superadmin_deposit":
        return <ArrowDownLeft className="w-5 h-5 text-blue-600" />;
      case "receipt_approval":
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-slate-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "superadmin_deposit":
        return "from-blue-500 to-indigo-600";
      case "receipt_approval":
        return "from-purple-500 to-pink-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "superadmin_deposit":
        return "Admin Deposit";
      case "receipt_approval":
        return "Receipt Approval";
      default:
        return "Transaction";
    }
  };

  const formatDate = (timestamp: { toDate?: () => Date } | undefined) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return 'N/A';
  };

  const formatTime = (timestamp: { toDate?: () => Date } | undefined) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString();
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="animate-pulse space-y-4">
          {showTitle && (
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-slate-200 rounded-lg w-48"></div>
              <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
            </div>
          )}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {showTitle && (
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Transaction History</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "deposits" | "receipts")}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
              >
                <option value="all">All Types</option>
                <option value="deposits">Deposits</option>
                <option value="receipts">Receipts</option>
              </select>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-slate-200 rounded-xl hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${getTransactionColor(transaction.type)} rounded-xl flex items-center justify-center shrink-0`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                      {getTransactionLabel(transaction.type)}
                    </h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium self-start shrink-0">
                      Completed
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm mb-1 max-w-full">
                    <span className="inline-block max-w-[120px] sm:max-w-[200px] truncate">{transaction.sellerName}</span>
                    <span className="mx-1">•</span>
                    <span className="inline-block max-w-[150px] sm:max-w-[250px] truncate">{transaction.sellerEmail}</span>
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(transaction.createdAt)}
                    </span>
                    <span className="hidden sm:inline shrink-0">{formatTime(transaction.createdAt)}</span>
                    <span className="sm:hidden shrink-0">{formatTime(transaction.createdAt)}</span>
                  </div>
                </div>
                
                <div className="text-left sm:text-right shrink-0 min-w-0">
                  <div className="flex items-center gap-1 text-green-600 font-bold text-base sm:text-lg">
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                    <span className="truncate">+${transaction.commissionAmount.toFixed(2)}</span>
                  </div>
                  <p className="text-slate-500 text-xs truncate">
                    From ${transaction.originalAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">
              {searchTerm || filterType !== "all" ? "No matching transactions" : "No transactions yet"}
            </h4>
            <p className="text-slate-500 max-w-md mx-auto">
              {searchTerm || filterType !== "all" 
                ? "Try adjusting your search criteria or filters to find transactions."
                : "Earnings are generated when administrators deposit funds to your referred merchants or when their receipts are approved."
              }
            </p>
          </div>
        )}
      </div>

      {transactions.length >= maxItems && maxItems < 10 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600 mb-3">
              Showing latest {maxItems} transactions
              {filteredTransactions.length !== transactions.length && (
                <span className="block sm:inline">
                  <span className="hidden sm:inline"> • </span>
                  <span className="font-medium">{filteredTransactions.length} match your filters</span>
                </span>
              )}
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/admin/transactions'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 hover:border-pink-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View All Transactions
            </button>
          </div>
        </div>
      )}

      {transactions.length >= maxItems && maxItems >= 10 && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Showing latest {maxItems} transactions
              {filteredTransactions.length !== transactions.length && (
                <span className="block sm:inline">
                  <span className="hidden sm:inline"> • </span>
                  <span className="font-medium">{filteredTransactions.length} match your filters</span>
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

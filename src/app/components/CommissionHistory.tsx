import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CommissionService } from "../../services/commissionService";
import { CommissionTransaction } from "../../types/commission";

interface CommissionHistoryProps {
  adminId?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export default function CommissionHistory({ 
  adminId, 
  maxItems = 10,
  showTitle = true 
}: CommissionHistoryProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const targetAdminId = adminId || user?.uid;

  useEffect(() => {
    if (!targetAdminId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time commission transaction updates
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
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        {showTitle && (
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
          </div>
        )}
        <div className="p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-1 ml-13">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!targetAdminId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        {showTitle && (
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
          </div>
        )}
        <div className="p-4 sm:p-6 text-center text-gray-500">
          Please log in to view commission history
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {showTitle && (
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Commission History</h3>
          <p className="text-sm text-gray-500 mt-1">
            Earnings from deposits and receipt approvals only
          </p>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 sm:p-6">
              {/* Mobile-first layout that stacks vertically */}
              <div className="space-y-4">
                {/* Header with icon and type */}
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "superadmin_deposit" 
                      ? "bg-blue-100" 
                      : "bg-purple-100"
                  }`}>
                    {transaction.type === "superadmin_deposit" ? (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.type === "superadmin_deposit" 
                          ? "Superadmin Deposit Commission" 
                          : "Receipt Approval Commission"
                        }
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                        transaction.type === "superadmin_deposit"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}>
                        {transaction.type === "superadmin_deposit" ? "Deposit" : "Receipt"}
                      </span>
                    </div>
                  </div>

                  {/* Commission amount - prominent on mobile */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      +${transaction.commissionAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Commission</p>
                  </div>
                </div>

                {/* Transaction details - stacked on mobile */}
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium">
                      From: <span className="font-normal">{transaction.sellerName || transaction.sellerEmail || "Unknown"}</span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="font-medium">
                      Original: <span className="font-normal">${transaction.originalAmount.toFixed(2)}</span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {transaction.createdAt.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  
                  {transaction.description && (
                    <p className="text-sm text-gray-600 break-words">
                      {transaction.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 sm:p-6 text-center">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">No commission transactions yet</h4>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Commission is earned when superadmins deposit funds to your referred sellers or when their receipts are approved.
            </p>
          </div>
        )}
      </div>

      {transactions.length >= maxItems && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Showing latest {maxItems} transactions
          </p>
        </div>
      )}
    </div>
  );
}

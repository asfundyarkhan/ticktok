import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { CommissionService } from "../../services/commissionService";
import { CommissionSummary } from "../../types/commission";

export default function CommissionBalanceCard() {
  const { user } = useAuth();
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary>({
    totalCommissionBalance: 0,
    totalFromSuperadminDeposits: 0,
    totalFromReceiptApprovals: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchCommissionData = async () => {
      try {
        setLoading(true);
        const summary = await CommissionService.getAdminCommissionSummary(user.uid);
        setCommissionSummary(summary);
      } catch (error) {
        console.error("Error fetching commission data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch commission data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionData();

    // Subscribe to real-time updates
    const unsubscribe = CommissionService.subscribeToAdminCommissionBalance(
      user.uid,
      (balance) => {
        setCommissionSummary(prev => ({
          ...prev,
          totalCommissionBalance: balance,
        }));
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className="text-red-600 text-sm">
          <p className="font-medium">Error loading commission data</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            My Commission Balance
          </h3>
          
          <div className="space-y-4">
            {/* Total Commission Balance */}
            <div>
              <p className="text-sm text-gray-500">Total Commission Earned</p>
              <p className="text-3xl font-bold text-green-600">
                ${commissionSummary.totalCommissionBalance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                From referred seller activities
              </p>
            </div>

            {/* Transaction Count */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Total Transactions</p>
              <p className="text-lg font-semibold text-gray-700">
                {commissionSummary.transactionCount}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">From Superadmin Deposits</p>
                <p className="text-lg font-semibold text-blue-600">
                  ${commissionSummary.totalFromSuperadminDeposits.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">From Receipt Approvals</p>
                <p className="text-lg font-semibold text-purple-600">
                  ${commissionSummary.totalFromReceiptApprovals.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 ml-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

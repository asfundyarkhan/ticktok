import { useState, useEffect } from "react";
import { CommissionService } from "../../services/commissionService";
import { useAuth } from "../../context/AuthContext";

export default function TotalCommissionOverviewCard() {
  const { userProfile } = useAuth();
  const [commissionData, setCommissionData] = useState({
    totalBalance: 0,
    adminsCount: 0,
    totalFromSuperadminDeposits: 0,
    totalFromReceiptApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperadmin = userProfile?.role === "superadmin";

  useEffect(() => {
    const fetchCommissionData = async () => {
      try {
        setLoading(true);
        const data = await CommissionService.getTotalCommissionBalance();
        setCommissionData(data);
      } catch (error) {
        console.error("Error fetching total commission data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch commission data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchCommissionData, 30 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className="text-red-600 text-sm">
          <p className="font-medium">Error loading commission overview</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const averagePerAdmin = commissionData.adminsCount > 0 
    ? commissionData.totalBalance / commissionData.adminsCount 
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isSuperadmin ? "Monthly Revenue Overview" : "Total Revenue Overview"}
          </h3>
          
          <div className="space-y-4">
            {/* Total Balance */}
            <div>
              <p className="text-sm text-gray-500">
                {isSuperadmin 
                  ? "Total Monthly Revenue (Deposits - Withdrawals)" 
                  : "Total Commission Earned by All Admins"}
              </p>
              <p className="text-3xl font-bold text-green-600">
                ${commissionData.totalBalance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isSuperadmin 
                  ? "Net revenue from platform operations" 
                  : "From deposits and receipt approvals only"}
              </p>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-600 font-medium">
                  {isSuperadmin ? "Deposits Accepted" : "Superadmin Deposits"}
                </p>
                <p className="text-lg font-bold text-blue-700">
                  ${commissionData.totalFromSuperadminDeposits.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-xs text-purple-600 font-medium">
                  {isSuperadmin ? "Withdrawals Processed" : "Receipt Approvals"}
                </p>
                <p className="text-lg font-bold text-purple-700">
                  ${commissionData.totalFromReceiptApprovals.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-sm text-gray-500">
                  {isSuperadmin ? "Total Transactions" : "Active Admins"}
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {commissionData.adminsCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {isSuperadmin ? "Average per Transaction" : "Average per Admin"}
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  ${averagePerAdmin.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Icon - Only show for non-superadmin */}
        {!isSuperadmin && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> {isSuperadmin 
            ? "This shows your platform's net revenue from accepted deposits minus processed withdrawals. Updates automatically every 30 seconds."
            : "This earnings balance only includes earnings from superadmin deposits and receipt approvals. Product sales revenue is not included in earnings calculations."}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { AdminRoute } from "../../components/AdminRoute";
import { LoadingSpinner } from "../../components/Loading";
import { CommissionService } from "../../../services/commissionService";
import { CommissionTransaction, CommissionSummary } from "../../../types/commission";
import CommissionBalanceCard from "../../components/CommissionBalanceCard";
import CommissionHistory from "../../components/CommissionHistory";

function CommissionDashboardContent() {
  const { user } = useAuth();
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary>({
    totalCommissionBalance: 0,
    totalFromSuperadminDeposits: 0,
    totalFromReceiptApprovals: 0,
    transactionCount: 0,
  });
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchCommissionData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary and transactions
        const [summary, transactionList] = await Promise.all([
          CommissionService.getAdminCommissionSummary(user.uid),
          CommissionService.getAdminCommissionTransactions(user.uid, 50),
        ]);

        setCommissionSummary(summary);
        setTransactions(transactionList);
      } catch (error) {
        console.error("Error fetching commission data:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch commission data");
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionData();

    // Subscribe to real-time updates
    const unsubscribeBalance = CommissionService.subscribeToAdminCommissionBalance(
      user.uid,
      (balance) => {
        setCommissionSummary(prev => ({
          ...prev,
          totalCommissionBalance: balance,
        }));
      }
    );

    const unsubscribeTransactions = CommissionService.subscribeToAdminCommissionTransactions(
      user.uid,
      (newTransactions) => {
        setTransactions(newTransactions);
      },
      50
    );

    return () => {
      unsubscribeBalance();
      unsubscribeTransactions();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 max-w-md">
          <div className="text-red-600 text-center">
            <h2 className="text-lg font-semibold mb-2">Error Loading Commission Data</h2>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Commission Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your commission earnings from deposits and receipt approvals for your referred sellers.
          </p>
        </div>

        {/* Commission Balance Card */}
        <div className="mb-8">
          <CommissionBalanceCard />
        </div>

        {/* Commission Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Summary Cards */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Superadmin Deposits</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${commissionSummary.totalFromSuperadminDeposits.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Commission from manual deposits by superadmins
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Receipt Approvals</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${commissionSummary.totalFromReceiptApprovals.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Commission from approved payment receipts
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600">
                  {commissionSummary.transactionCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {commissionSummary.lastTransaction && (
                `Last: ${commissionSummary.lastTransaction.toLocaleDateString()}`
              )}
            </p>
          </div>
        </div>

        {/* Commission History */}
        <div className="mb-8">
          <CommissionHistory maxItems={20} />
        </div>

        {/* Important Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Commission Balance Information
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your commission balance only includes earnings from:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Manual deposits made by superadmins to your referred sellers</li>
                  <li>Receipt approvals for your referred sellers' payment submissions</li>
                </ul>
                <p className="mt-2 font-medium">
                  Note: Commission is NOT earned from product sales made by your referred sellers. 
                  This ensures commission is only paid on actual fund deposits into the system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommissionDashboardPage() {
  return (
    <AdminRoute>
      <CommissionDashboardContent />
    </AdminRoute>
  );
}

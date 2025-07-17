"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { WithdrawalRequestService, WithdrawalRequest } from "@/services/withdrawalRequestService";
import { format } from "date-fns";
import { Eye, Clock, CheckCircle, XCircle, Plus, DollarSign, FileText, Calendar, CreditCard } from "lucide-react";
import WithdrawalModal from "@/app/components/WithdrawalModal";
import { SellerWalletService } from "@/services/sellerWalletService";
import type { WalletBalance } from "@/types/wallet";

export default function SellerWithdrawalsPage() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    available: 0,
    pending: 0,
    total: 0,
  });

  const loadWithdrawals = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userWithdrawals = await WithdrawalRequestService.getSellerWithdrawalRequests(user.uid);
      setWithdrawals(userWithdrawals);
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const loadWalletBalance = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const balance = await SellerWalletService.getWalletBalance(user.uid);
      setWalletBalance(balance);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadWithdrawals();
      loadWalletBalance();
    }
  }, [user?.uid, loadWithdrawals, loadWalletBalance]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const viewDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailModal(true);
  };

  const handleNewWithdrawal = () => {
    setShowWithdrawalModal(true);
  };

  const handleWithdrawalSuccess = () => {
    loadWithdrawals();
    loadWalletBalance();
    setShowWithdrawalModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Manage your account and track your activities</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max space-x-1 sm:space-x-0">
            <Link
              href="/profile"
              className="px-2 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              General
            </Link>
            <Link
              href="/receipts-v2"
              className="px-2 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              Receipts
            </Link>
            <Link
              href="/withdrawals"
              className="px-2 sm:px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px] whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              Withdrawals
            </Link>
            <Link
              href="/stock"
              className="px-2 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              Product Pool
            </Link>
            <Link
              href="/stock/listings"
              className="px-2 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              My Listings
            </Link>
            <Link
              href="/stock/orders"
              className="px-2 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-xs sm:text-base flex-shrink-0"
            >
              Orders
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                My Withdrawals
              </h2>
              <p className="text-gray-600">
                Track your withdrawal requests and manage your payments
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              {/* Wallet Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Available Balance</span>
                </div>
                <p className="text-xl font-bold text-blue-900">
                  ${walletBalance.available.toFixed(2)}
                </p>
              </div>
              
              {/* New Withdrawal Button */}
              <button
                onClick={handleNewWithdrawal}
                disabled={walletBalance.available < 5}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Request Withdrawal
              </button>
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="bg-white rounded-lg shadow-sm">
          {withdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No withdrawals yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t made any withdrawal requests. Start by requesting your first withdrawal.
              </p>
              <button
                onClick={handleNewWithdrawal}
                disabled={walletBalance.available < 5}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Request First Withdrawal
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        USDT ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Request Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Processed Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                            <span className="font-medium text-gray-900">
                              ${withdrawal.amount.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.usdtId ? (
                            <div className="flex items-center">
                              <CreditCard className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm text-gray-600 font-mono">
                                {withdrawal.usdtId.length > 20 
                                  ? `${withdrawal.usdtId.substring(0, 20)}...` 
                                  : withdrawal.usdtId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not provided</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(withdrawal.requestDate, "MMM dd, yyyy 'at' h:mm a")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {withdrawal.processedDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(withdrawal.processedDate, "MMM dd, yyyy 'at' h:mm a")}
                            </div>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => viewDetails(withdrawal)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-gray-900">
                          ${withdrawal.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {withdrawal.usdtId && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">USDT ID:</span>
                        </div>
                        <span className="text-sm text-gray-600 font-mono break-all">
                          {withdrawal.usdtId}
                        </span>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Requested: {format(withdrawal.requestDate, "MMM dd, yyyy")}</span>
                      </div>
                      {withdrawal.processedDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Processed: {format(withdrawal.processedDate, "MMM dd, yyyy")}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => viewDetails(withdrawal)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          availableBalance={walletBalance.available}
          sellerName={user?.displayName || user?.email || ""}
          sellerEmail={user?.email || ""}
          onSuccess={handleWithdrawalSuccess}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Withdrawal Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900">
                    ${selectedWithdrawal.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {getStatusIcon(selectedWithdrawal.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedWithdrawal.status)}`}>
                    {selectedWithdrawal.status.charAt(0).toUpperCase() + selectedWithdrawal.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedWithdrawal.usdtId && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">USDT Wallet ID:</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm text-gray-900 font-mono break-all">
                        {selectedWithdrawal.usdtId}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-sm font-medium text-gray-700">Request Date:</span>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(selectedWithdrawal.requestDate, "MMMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>

                {selectedWithdrawal.processedDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Processed Date:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {format(selectedWithdrawal.processedDate, "MMMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                )}

                {selectedWithdrawal.adminNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Admin Notes:</span>
                    <div className="bg-blue-50 p-3 rounded-lg mt-1">
                      <p className="text-sm text-blue-900">
                        {selectedWithdrawal.adminNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

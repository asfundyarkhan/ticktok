"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { SuperAdminRoute } from "@/app/components/SuperAdminRoute";
import { WithdrawalRequestService, WithdrawalRequest } from "@/services/withdrawalRequestService";
import { LoadingSpinner } from "@/app/components/Loading";

function WithdrawalRequestsPageContent() {
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
  });

  useEffect(() => {
    // Subscribe to withdrawal requests
    const unsubscribe = WithdrawalRequestService.subscribeToWithdrawalRequests((requests) => {
      setWithdrawalRequests(requests);
      setLoading(false);
    });

    // Load stats
    loadStats();

    return unsubscribe;
  }, []);

  const loadStats = async () => {
    const withdrawalStats = await WithdrawalRequestService.getWithdrawalStats();
    setStats(withdrawalStats);
  };

  const filteredRequests = withdrawalRequests.filter((request) => {
    if (filter === "all") return true;
    return request.status === filter;
  });

  const viewRequestDetails = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
    setAdminNotes("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNotes("");
  };

  const handleProcessRequest = async (action: "approve" | "reject") => {
    if (!selectedRequest?.id) return;

    setProcessingId(selectedRequest.id);

    try {
      const result = await WithdrawalRequestService.processWithdrawalRequest(
        selectedRequest.id,
        "admin", // You might want to get actual admin ID from auth context
        action,
        adminNotes
      );

      if (result.success) {
        toast.success(`Withdrawal request ${action}d successfully!`);
        closeModal();
        loadStats(); // Refresh stats
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(`Error ${action}ing withdrawal request:`, error);
      toast.error(`Failed to ${action} withdrawal request. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage seller withdrawal requests</p>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">Pending</div>
          <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
          <div className="text-xs sm:text-sm text-gray-500">${stats.pendingAmount.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <div className="text-xs sm:text-sm font-medium text-gray-500">Approved</div>
          <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalApproved}</div>
          <div className="text-xs sm:text-sm text-gray-500">${stats.approvedAmount.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-6 col-span-2 sm:col-span-1">
          <div className="text-xs sm:text-sm font-medium text-gray-500">Rejected</div>
          <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.totalRejected}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-6 hidden sm:block">
          <div className="text-xs sm:text-sm font-medium text-gray-500">Total Processed</div>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">
            {stats.totalApproved + stats.totalRejected}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-6 hidden lg:block">
          <div className="text-xs sm:text-sm font-medium text-gray-500">Success Rate</div>
          <div className="text-lg sm:text-2xl font-bold text-blue-600">
            {stats.totalApproved + stats.totalRejected > 0
              ? Math.round((stats.totalApproved / (stats.totalApproved + stats.totalRejected)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Filters - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { key: "all", label: "All", count: withdrawalRequests.length },
              { key: "pending", label: "Pending", count: stats.totalPending },
              { key: "approved", label: "Approved", count: stats.totalApproved },
              { key: "rejected", label: "Rejected", count: stats.totalRejected },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as "all" | "pending" | "approved" | "rejected")}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  filter === tab.key
                    ? "border-[#FF0059] text-[#FF0059]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Requests Table/Cards - Responsive */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USDT ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processed Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No withdrawal requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.sellerName}
                          </div>
                          <div className="text-sm text-gray-500">{request.sellerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${request.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.usdtId ? (
                          <div className="text-sm text-gray-900 font-mono">
                            {request.usdtId.length > 20 
                              ? `${request.usdtId.substring(0, 20)}...` 
                              : request.usdtId}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(request.requestDate, "MMM dd, yyyy 'at' h:mm a")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.processedDate
                          ? format(request.processedDate, "MMM dd, yyyy 'at' h:mm a")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewRequestDetails(request)}
                          className="text-[#FF0059] hover:text-[#E6004F] font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div key={request.id} className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {request.sellerName}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{request.sellerEmail}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">${request.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Request Date</p>
                      <p className="text-sm text-gray-900">{format(request.requestDate, "MMM dd, yyyy")}</p>
                    </div>
                  </div>

                  {request.usdtId && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">USDT Address</p>
                      <p className="text-xs font-mono text-gray-900 bg-gray-50 p-2 rounded break-all">
                        {request.usdtId.length > 30 
                          ? `${request.usdtId.substring(0, 30)}...` 
                          : request.usdtId}
                      </p>
                    </div>
                  )}

                  {request.processedDate && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Processed Date</p>
                      <p className="text-sm text-gray-900">{format(request.processedDate, "MMM dd, yyyy 'at' h:mm a")}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => viewRequestDetails(request)}
                      className="text-[#FF0059] hover:text-[#E6004F] font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Mobile Optimized */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeModal}
            ></div>

            <div className="relative w-full max-w-lg transform rounded-lg bg-white p-4 sm:p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Withdrawal Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Seller</label>
                  <div className="text-base sm:text-lg font-medium text-gray-900">{selectedRequest.sellerName}</div>
                  <div className="text-xs sm:text-sm text-gray-500 break-all">{selectedRequest.sellerEmail}</div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Amount</label>
                  <div className="text-xl sm:text-2xl font-bold text-gray-900">${selectedRequest.amount.toFixed(2)}</div>
                </div>

                {selectedRequest.usdtId && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">USDT Wallet Address</label>
                    <div className="text-gray-900 font-mono text-xs sm:text-sm bg-gray-50 p-2 rounded border break-all">
                      {selectedRequest.usdtId}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500">Status</label>
                  <div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Request Date</label>
                    <div className="text-sm sm:text-base text-gray-900">
                      {format(selectedRequest.requestDate, "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(selectedRequest.requestDate, "h:mm a")}
                    </div>
                  </div>

                  {selectedRequest.processedDate && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500">Processed Date</label>
                      <div className="text-sm sm:text-base text-gray-900">
                        {format(selectedRequest.processedDate, "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(selectedRequest.processedDate, "h:mm a")}
                      </div>
                    </div>
                  )}
                </div>

                {selectedRequest.adminNotes && (
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Admin Notes</label>
                    <div className="text-sm sm:text-base text-gray-900 bg-gray-50 p-2 rounded">{selectedRequest.adminNotes}</div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" && (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label htmlFor="adminNotes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                      placeholder="Add notes for this decision..."
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleProcessRequest("reject")}
                      disabled={processingId === selectedRequest.id}
                      className="w-full sm:flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {processingId === selectedRequest.id ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleProcessRequest("approve")}
                      disabled={processingId === selectedRequest.id}
                      className="w-full sm:flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {processingId === selectedRequest.id ? "Processing..." : "Approve"}
                    </button>
                  </div>
                </div>
              )}

              {selectedRequest.status !== "pending" && (
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WithdrawalRequestsPage() {
  return (
    <SuperAdminRoute>
      <WithdrawalRequestsPageContent />
    </SuperAdminRoute>
  );
}

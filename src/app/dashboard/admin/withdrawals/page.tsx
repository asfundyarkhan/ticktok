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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="mt-2 text-gray-600">Manage seller withdrawal requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Pending Requests</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
          <div className="text-sm text-gray-500">${stats.pendingAmount.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
          <div className="text-sm text-gray-500">${stats.approvedAmount.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Processed</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalApproved + stats.totalRejected}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Success Rate</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalApproved + stats.totalRejected > 0
              ? Math.round((stats.totalApproved / (stats.totalApproved + stats.totalRejected)) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "all", label: "All", count: withdrawalRequests.length },
              { key: "pending", label: "Pending", count: stats.totalPending },
              { key: "approved", label: "Approved", count: stats.totalApproved },
              { key: "rejected", label: "Rejected", count: stats.totalRejected },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as "all" | "pending" | "approved" | "rejected")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={closeModal}
            ></div>

            <div className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Withdrawal Request Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Seller</label>
                  <div className="text-lg font-medium text-gray-900">{selectedRequest.sellerName}</div>
                  <div className="text-sm text-gray-500">{selectedRequest.sellerEmail}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <div className="text-2xl font-bold text-gray-900">${selectedRequest.amount.toFixed(2)}</div>
                </div>

                {selectedRequest.usdtId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">USDT Wallet Address</label>
                    <div className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded border break-all">
                      {selectedRequest.usdtId}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Request Date</label>
                  <div className="text-gray-900">
                    {format(selectedRequest.requestDate, "MMMM dd, yyyy 'at' h:mm a")}
                  </div>
                </div>

                {selectedRequest.processedDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Processed Date</label>
                    <div className="text-gray-900">
                      {format(selectedRequest.processedDate, "MMMM dd, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}

                {selectedRequest.adminNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                    <div className="text-gray-900">{selectedRequest.adminNotes}</div>
                  </div>
                )}
              </div>

              {selectedRequest.status === "pending" && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                      placeholder="Add notes for this decision..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleProcessRequest("reject")}
                      disabled={processingId === selectedRequest.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingId === selectedRequest.id ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleProcessRequest("approve")}
                      disabled={processingId === selectedRequest.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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

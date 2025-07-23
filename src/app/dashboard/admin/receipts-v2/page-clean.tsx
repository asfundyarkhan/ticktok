"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { NewReceiptService, NewReceipt } from "@/services/newReceiptService";
import { toast } from "react-hot-toast";
import {
  Receipt,
  Check,
  X,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  DollarSign,
  User,
  Calendar,
  MessageSquare,
  FileText
} from "lucide-react";

export default function AdminReceiptsV2Page() {
  const [user] = useAuthState(auth);
  const [allReceipts, setAllReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<NewReceipt | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load all receipts on mount
  useEffect(() => {
    if (!user) return;

    const unsubscribe = NewReceiptService.subscribeToAllReceipts((receipts) => {
      console.log(`📡 Received ${receipts.length} total receipts`);
      setAllReceipts(receipts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleApprove = async (receipt: NewReceipt) => {
    setSelectedReceipt(receipt);
    setAction("approve");
    setNotes("");
    setShowModal(true);
  };

  const handleReject = async (receipt: NewReceipt) => {
    setSelectedReceipt(receipt);
    setAction("reject");
    setNotes("");
    setShowModal(true);
  };

  const processReceipt = async () => {
    if (!selectedReceipt || !user) return;

    setProcessingId(selectedReceipt.id!);
    
    try {
      let result;
      
      if (action === "approve") {
        result = await NewReceiptService.approveReceipt(
          selectedReceipt.id!,
          user.uid,
          user.displayName || user.email || "Superadmin",
          notes
        );
      } else {
        if (!notes.trim()) {
          toast.error("Please provide a reason for rejection");
          return;
        }
        result = await NewReceiptService.rejectReceipt(
          selectedReceipt.id!,
          user.uid,
          user.displayName || user.email || "Superadmin",
          notes
        );
      }

      if (result.success) {
        toast.success(result.message);
        setShowModal(false);
        setSelectedReceipt(null);
        setNotes("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error processing receipt:", error);
      toast.error("Failed to process receipt");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Clean receipt type detection
  const getReceiptType = (receipt: NewReceipt) => {
    if (receipt.isWalletPayment) {
      return {
        type: "Wallet Payment",
        icon: <Wallet className="w-4 h-4 text-purple-600" />,
        bgColor: "bg-purple-50",
        textColor: "text-purple-800",
        borderColor: "border-purple-200"
      };
    }
    if (receipt.isDepositPayment) {
      return {
        type: "USDT Deposit",
        icon: <DollarSign className="w-4 h-4 text-yellow-600" />,
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-800",
        borderColor: "border-yellow-200"
      };
    }
    return {
      type: "Manual/Other",
      icon: <DollarSign className="w-4 h-4 text-gray-600" />,
      bgColor: "bg-gray-50",
      textColor: "text-gray-800",
      borderColor: "border-gray-200"
    };
  };

  // Clean status detection
  const getReceiptStatus = (receipt: NewReceipt) => {
    if (receipt.isAutoProcessed || receipt.status === "approved") {
      return {
        status: "Approved",
        icon: <CheckCircle className="w-4 h-4" />,
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        borderColor: "border-green-200"
      };
    }
    if (receipt.status === "rejected") {
      return {
        status: "Rejected",
        icon: <XCircle className="w-4 h-4" />,
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        borderColor: "border-red-200"
      };
    }
    return {
      status: "Pending",
      icon: <Clock className="w-4 h-4" />,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200"
    };
  };

  // Calculate stats
  const stats = {
    total: allReceipts.length,
    pending: allReceipts.filter(r => r.status === "pending" && !r.isAutoProcessed).length,
    approved: allReceipts.filter(r => r.status === "approved" || r.isAutoProcessed).length,
    rejected: allReceipts.filter(r => r.status === "rejected").length,
    wallet: allReceipts.filter(r => !!r.isWalletPayment).length,
    usdt: allReceipts.filter(r => !!r.isDepositPayment && !r.isWalletPayment).length,
    manual: allReceipts.filter(r => !r.isDepositPayment && !r.isWalletPayment).length,
    totalAmount: allReceipts.reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please sign in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Receipt Management</h1>
          <p className="text-gray-600 mt-2">
            Complete history and management of all payment receipts
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Receipts</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Approved</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Rejected</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Type Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Wallet Payments</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.wallet}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">USDT Deposits</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.usdt}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Manual/Other</h3>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.manual}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">All Receipt History</h2>
            <p className="text-sm text-gray-500 mt-1">
              Complete history of all receipt types with current status
            </p>
          </div>
          
          <div className="overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading receipts...</span>
              </div>
            ) : allReceipts.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Receipt history will appear here as they are submitted.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {allReceipts
                  .sort((a, b) => {
                    const dateA = a.submittedAt?.toDate() || new Date(0);
                    const dateB = b.submittedAt?.toDate() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((receipt) => {
                    const typeInfo = getReceiptType(receipt);
                    const statusInfo = getReceiptStatus(receipt);
                    
                    return (
                      <div key={receipt.id} className="p-4 sm:p-6 hover:bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Receipt Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {/* Receipt Type Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor} ${typeInfo.borderColor} border`}>
                                {typeInfo.icon}
                                {typeInfo.type}
                              </span>
                              
                              {/* Status Badge */}
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
                                {statusInfo.icon}
                                {statusInfo.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-900">Amount:</span>
                                <span className="ml-1 text-gray-600">${(receipt.amount || 0).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">User:</span>
                                <span className="ml-1 text-gray-600">{receipt.userEmail || "N/A"}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-900">Date:</span>
                                <span className="ml-1 text-gray-600">
                                  {receipt.submittedAt ? formatDate(receipt.submittedAt.toDate()) : "N/A"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Processing Info */}
                            {(receipt.processedBy || receipt.rejectionReason) && (
                              <div className="mt-2 text-xs text-gray-500">
                                {receipt.processedBy && (
                                  <div>Processed by: {receipt.processedBy}</div>
                                )}
                                {receipt.rejectionReason && (
                                  <div>Reason: {receipt.rejectionReason}</div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {receipt.receiptImageUrl && (
                              <button
                                onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View Receipt
                              </button>
                            )}
                            
                            {/* Action buttons only for pending receipts */}
                            {receipt.status === "pending" && !receipt.isAutoProcessed && (
                              <>
                                <button
                                  onClick={() => handleApprove(receipt)}
                                  disabled={processingId === receipt.id}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                >
                                  {processingId === receipt.id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  ) : (
                                    <Check className="w-3 h-3 mr-1" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(receipt)}
                                  disabled={processingId === receipt.id}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {action === "approve" ? "Approve Receipt" : "Reject Receipt"}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>User:</strong> {selectedReceipt.userName || selectedReceipt.userEmail}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Amount:</strong> ${(selectedReceipt.amount || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {getReceiptType(selectedReceipt).type}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === "approve" ? "Notes (optional)" : "Rejection reason (required)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={action === "approve" ? "Add any notes..." : "Explain why this receipt is being rejected..."}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={processReceipt}
                  disabled={processingId === selectedReceipt.id}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    action === "approve" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50`}
                >
                  {processingId === selectedReceipt.id ? "Processing..." : 
                    action === "approve" ? "Approve" : "Reject"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

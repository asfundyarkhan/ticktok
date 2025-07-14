"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { NewReceiptService, NewReceipt } from "../../../../services/newReceiptService";
import { toast } from "react-hot-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Eye, 
  FileText,
  User,
  Calendar,
  MessageSquare,
  Wallet
} from "lucide-react";

export default function NewReceiptManagementPage() {
  const { user, userProfile } = useAuth();
  const [receipts, setReceipts] = useState<NewReceipt[]>([]);
  const [allReceipts, setAllReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<NewReceipt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    if (userProfile.role !== "superadmin") {
      toast.error("Access denied. Superadmin privileges required.");
      setLoading(false);
      return;
    }

    // Subscribe to real-time updates for both pending and all receipts
    setLoading(true);
    
    // Subscribe to pending receipts for the main view
    const unsubscribePending = NewReceiptService.subscribeToPendingReceipts((updatedReceipts) => {
      setReceipts(updatedReceipts);
      setLoading(false);
    });

    // Subscribe to all receipts for revenue calculation
    const unsubscribeAll = NewReceiptService.subscribeToAllReceipts((allUpdatedReceipts) => {
      setAllReceipts(allUpdatedReceipts);
    });

    return () => {
      unsubscribePending();
      unsubscribeAll();
    };
  }, [user, userProfile]);

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

  const getReceiptTypeInfo = (receipt: NewReceipt) => {
    if (receipt.isDepositPayment) {
      return {
        type: "Deposit Payment",
        icon: <DollarSign className="w-4 h-4 text-blue-600" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-800",
        borderColor: "border-blue-200"
      };
    }
    return {
      type: "Withdrawal",
      icon: <FileText className="w-4 h-4 text-green-600" />,
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      borderColor: "border-green-200"
    };
  };

  if (!userProfile || userProfile.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need superadmin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Receipt Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Review and approve receipt submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{receipts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  ${allReceipts.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Deposit Payments</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => r.isDepositPayment).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Receipts</h2>
          </div>
          
          {receipts.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No pending receipts to review.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {receipts.map((receipt) => {
                const typeInfo = getReceiptTypeInfo(receipt);
                
                return (
                  <div key={receipt.id} className="p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor} ${typeInfo.borderColor} border`}>
                            {typeInfo.icon}
                            {typeInfo.type}
                          </span>
                          {receipt.isWalletPayment && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
                              <Wallet className="w-4 h-4" />
                              Wallet Payment
                            </span>
                          )}
                          {receipt.isAutoProcessed && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                              <CheckCircle className="w-4 h-4" />
                              Auto-Processed
                            </span>
                          )}
                          <span className="text-xl sm:text-2xl font-bold text-gray-900">
                            ${receipt.amount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium truncate">{receipt.userName}</span>
                            <span className="text-xs text-gray-500 truncate">({receipt.userEmail})</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{formatDate(receipt.submittedAt)}</span>
                          </div>
                        </div>
                        
                        {receipt.isDepositPayment && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Deposit Payment</strong>
                              {receipt.productName && (
                                <span> for: {receipt.productName}</span>
                              )}
                            </p>
                            {receipt.isWalletPayment && (
                              <p className="text-sm text-purple-800 mt-1">
                                <strong>💳 Paid with wallet balance:</strong> ${receipt.walletBalanceUsed?.toFixed(2)}
                              </p>
                            )}
                            {receipt.isAutoProcessed && (
                              <p className="text-sm text-green-800 mt-1">
                                <strong>✅ Status:</strong> Payment processed automatically and deposit activated
                              </p>
                            )}
                          </div>
                        )}
                        
                        {receipt.description && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>Description:</span>
                            </div>
                            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                              {receipt.description}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 sm:ml-6">
                        {!receipt.isWalletPayment ? (
                          <button
                            onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sm:inline">View Receipt</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md">
                            <Wallet className="w-4 h-4" />
                            <span className="sm:inline">Wallet Payment</span>
                          </span>
                        )}
                        
                        {receipt.isAutoProcessed ? (
                          <span className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
                            <CheckCircle className="w-4 h-4" />
                            <span className="sm:inline">Already Processed</span>
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleApprove(receipt)}
                              disabled={processingId === receipt.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(receipt)}
                              disabled={processingId === receipt.id}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
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
                  <strong>User:</strong> {selectedReceipt.userName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Amount:</strong> ${selectedReceipt.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {selectedReceipt.isDepositPayment ? "Deposit Payment" : "Withdrawal"}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {action === "approve" ? "Notes (optional)" : "Reason for rejection *"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === "approve" ? "Add any notes..." : "Please provide a reason..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF0059] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processReceipt}
                  disabled={processingId === selectedReceipt.id || (action === "reject" && !notes.trim())}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                    action === "approve" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {processingId === selectedReceipt.id ? "Processing..." : action === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

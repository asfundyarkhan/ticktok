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

    // Simple: Subscribe to ALL receipts for complete history tracking
    setLoading(true);
    const unsubscribe = NewReceiptService.subscribeToAllReceipts((receipts) => {
      console.log("� Loaded receipts:", receipts.length);
      setAllReceipts(receipts || []);
      setLoading(false);
    });

    return () => unsubscribe();
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Receipt Management</h1>
              <p className="text-sm sm:text-base text-gray-600">Review and approve receipt submissions</p>
            </div>
            
            {/* Cleanup Button */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  console.log('🔄 Manual refresh requested');
                  setLoading(true);
                  try {
                    const allReceiptsData = await NewReceiptService.getAllReceipts();
                    console.log('📡 Manual fetch result:', allReceiptsData.length, 'receipts');
                    setAllReceipts(allReceiptsData);
                    toast.success(`Refreshed: ${allReceiptsData.length} receipts loaded`);
                  } catch (error) {
                    console.error('❌ Manual refresh failed:', error);
                    toast.error('Failed to refresh receipts');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Refresh All
              </button>
              <button
                onClick={async () => {
                  if (confirm("This will fix auto-processed receipts that are incorrectly showing as pending. Continue?")) {
                    try {
                      const result = await NewReceiptService.fixAutoProcessedReceipts();
                      if (result.success) {
                        toast.success(`${result.message} (${result.processedCount} receipts fixed)`);
                      } else {
                        toast.error(result.message);
                      }
                    } catch {
                      toast.error("Failed to fix receipts");
                    }
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Reset Pending Counter
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => r.status === "approved" || r.isAutoProcessed).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => r.status === "rejected").length}
                </p>
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
        </div>

        {/* Receipt Type Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Wallet Payments</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => !!r.isWalletPayment).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">USDT Deposits</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => !!r.isDepositPayment && !r.isWalletPayment).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Manual/Other</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {allReceipts.filter(r => !r.isDepositPayment && !r.isWalletPayment).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Complete Receipt History</h2>
                <p className="text-sm text-gray-600 mt-1">All receipts: Wallet, USDT Deposits, Manual - Approved, Rejected, Pending</p>
              </div>
              <div className="text-sm text-gray-600">
                Total: {allReceipts.length} receipts
              </div>
            </div>
            {/* Debug Info */}
            {allReceipts.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>🔍 Debug Info:</strong> 
                  {" "}Wallet: {allReceipts.filter(r => !!r.isWalletPayment).length}, 
                  {" "}USDT: {allReceipts.filter(r => !!r.isDepositPayment && !r.isWalletPayment).length}, 
                  {" "}Manual: {allReceipts.filter(r => !r.isDepositPayment && !r.isWalletPayment).length}
                  {" "}| Status: Pending: {allReceipts.filter(r => r.status === "pending").length}, 
                  {" "}Approved: {allReceipts.filter(r => r.status === "approved" || r.isAutoProcessed).length}, 
                  {" "}Rejected: {allReceipts.filter(r => r.status === "rejected").length}
                </p>
              </div>
            )}
          </div>
          
          {allReceipts.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No receipts found!</h3>
              <p className="text-sm sm:text-base text-gray-600">No receipts have been submitted yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(() => {
                const sortedReceipts = allReceipts
                  .sort((a, b) => {
                    // Sort by status priority: pending first, then approved, then rejected
                    const statusOrder = { pending: 0, approved: 1, rejected: 2 };
                    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
                    if (statusDiff !== 0) return statusDiff;
                    // Within same status, sort by date (newest first)
                    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
                  });
                
                console.log('🎨 Rendering receipts:', {
                  total: sortedReceipts.length,
                  wallet: sortedReceipts.filter(r => !!r.isWalletPayment).length,
                  usdt: sortedReceipts.filter(r => !!r.isDepositPayment && !r.isWalletPayment).length,
                  manual: sortedReceipts.filter(r => !r.isDepositPayment && !r.isWalletPayment).length
                });
                
                return sortedReceipts.map((receipt) => {
                  // Defensive: fallback for missing fields with detailed logging
                  const typeInfo = getReceiptTypeInfo(receipt);
                  
                  // Log any receipts with missing critical fields
                  const missingFields = [];
                  if (!receipt.id) missingFields.push('id');
                  if (!receipt.amount && receipt.amount !== 0) missingFields.push('amount');
                  if (!receipt.userName) missingFields.push('userName');
                  if (!receipt.submittedAt) missingFields.push('submittedAt');
                  if (!receipt.status) missingFields.push('status');
                  
                  if (missingFields.length > 0) {
                    console.warn('⚠️ Receipt with missing fields:', {
                      id: receipt.id || 'NO_ID',
                      type: typeInfo.type,
                      missingFields,
                      receipt: JSON.stringify(receipt, null, 2)
                    });
                  }
                  
                  // Ensure critical fields have fallbacks
                  const safeReceipt = {
                    ...receipt,
                    id: receipt.id || `temp_${Date.now()}_${Math.random()}`,
                    amount: typeof receipt.amount === 'number' ? receipt.amount : 0,
                    userName: receipt.userName || 'Unknown User',
                    userEmail: receipt.userEmail || 'N/A',
                    status: receipt.status || 'pending',
                    submittedAt: receipt.submittedAt || new Date(),
                    isWalletPayment: !!receipt.isWalletPayment,
                    isDepositPayment: !!receipt.isDepositPayment,
                    isAutoProcessed: !!receipt.isAutoProcessed
                  };
                  
                  return (
                    <div key={safeReceipt.id} className="p-3 sm:p-6 hover:bg-gray-50">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor} ${typeInfo.borderColor} border`}>
                              {typeInfo.icon}
                              {typeInfo.type}
                            </span>
                            {safeReceipt.isAutoProcessed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-800 border border-green-200">
                                <CheckCircle className="w-4 h-4" />
                                Auto
                              </span>
                            )}
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              safeReceipt.isAutoProcessed || safeReceipt.status === "approved" 
                                ? "bg-green-50 text-green-800 border-green-200" 
                                : safeReceipt.status === "rejected" 
                                ? "bg-red-50 text-red-800 border-red-200"
                                : "bg-yellow-50 text-yellow-800 border-yellow-200"
                            }`}>
                              {(safeReceipt.isAutoProcessed || safeReceipt.status === "approved") && <CheckCircle className="w-4 h-4" />}
                              {safeReceipt.status === "rejected" && <XCircle className="w-4 h-4" />}
                              {(!safeReceipt.isAutoProcessed && safeReceipt.status === "pending") && <Clock className="w-4 h-4" />}
                              {safeReceipt.isAutoProcessed ? "Approved" : safeReceipt.status.charAt(0).toUpperCase() + safeReceipt.status.slice(1)}
                            </span>
                          </div>
                          <div className="mb-3">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                              ${safeReceipt.amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{safeReceipt.userName}</span>
                              </div>
                              <span className="text-xs text-gray-500 sm:ml-2 truncate">({safeReceipt.userEmail})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>{formatDate(new Date(safeReceipt.submittedAt))}</span>
                            </div>
                          </div>
                          {/* Deposit/USDT details */}
                          {safeReceipt.isDepositPayment && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Deposit</strong>
                                {safeReceipt.productName && (
                                  <span> for: {safeReceipt.productName}</span>
                                )}
                              </p>
                              {safeReceipt.isWalletPayment && (
                                <p className="text-sm text-purple-800 mt-1">
                                  <strong>💳 Paid with wallet balance:</strong> ${safeReceipt.walletBalanceUsed?.toFixed(2) || '0.00'}
                                </p>
                              )}
                              {safeReceipt.isAutoProcessed && (
                                <p className="text-sm text-green-800 mt-1">
                                  <strong>✅ Status:</strong> Payment processed automatically and deposit activated
                                </p>
                              )}
                            </div>
                          )}
                          {/* Description */}
                          {safeReceipt.description && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>Description:</span>
                              </div>
                              <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                {safeReceipt.description}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <div className="flex flex-row gap-2 w-full">
                            {/* Always show view button for non-wallet receipts, fallback for missing image */}
                            {!safeReceipt.isWalletPayment ? (
                              <button
                                onClick={() => safeReceipt.receiptImageUrl ? window.open(safeReceipt.receiptImageUrl, '_blank') : null}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={!safeReceipt.receiptImageUrl}
                              >
                                <Eye className="w-4 h-4" />
                                <span>{safeReceipt.receiptImageUrl ? 'View Receipt' : 'No Image'}</span>
                              </button>
                            ) : (
                              <span className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md">
                                <Wallet className="w-4 h-4" />
                                <span>Wallet Payment</span>
                              </span>
                            )}
                          </div>
                          {/* Status/Action Buttons: always show for all receipts */}
                          {safeReceipt.isAutoProcessed ? (
                            <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
                              <CheckCircle className="w-4 h-4" />
                              <span>Already Processed</span>
                            </span>
                          ) : safeReceipt.status === "pending" ? (
                            <div className="flex flex-row gap-2 w-full">
                              <button
                                onClick={() => handleApprove(safeReceipt)}
                                disabled={processingId === safeReceipt.id}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(safeReceipt)}
                                disabled={processingId === safeReceipt.id}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          ) : safeReceipt.status === "approved" ? (
                            <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
                              <CheckCircle className="w-4 h-4" />
                              <span>Approved {safeReceipt.processedAt ? `on ${new Date(safeReceipt.processedAt).toLocaleDateString()}` : ''}</span>
                            </span>
                          ) : (
                            <span className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md">
                              <XCircle className="w-4 h-4" />
                              <span>Rejected {safeReceipt.processedAt ? `on ${new Date(safeReceipt.processedAt).toLocaleDateString()}` : ''}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
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
                  <strong>Type:</strong> {selectedReceipt.isDepositPayment ? "Product Deposit" : "Manual Deposit"}
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

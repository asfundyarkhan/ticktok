"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "next/navigation";
import { NewReceiptService, NewReceipt } from "../../services/newReceiptService";
import ReceiptSubmission from "../components/ReceiptSubmission";
import Image from "next/image";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Plus,
  DollarSign,
  FileText,
  Calendar,
  MessageSquare
} from "lucide-react";

function ReceiptsV2Content() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [depositContext, setDepositContext] = useState<{
    depositId?: string;
    amount?: string;
  }>({});

  useEffect(() => {
    // Check for deposit context in URL parameters
    const depositId = searchParams.get('deposit');
    const amount = searchParams.get('amount');
    
    if (depositId) {
      setDepositContext({ depositId, amount: amount || undefined });
      setShowSubmissionForm(true);
    }

    const loadReceipts = async () => {
      if (user?.uid) {
        try {
          const userReceipts = await NewReceiptService.getUserReceipts(user.uid);
          setReceipts(userReceipts);
        } catch (error) {
          console.error("Error loading receipts:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReceipts();
  }, [user, searchParams]);

  const handleReceiptSubmitted = () => {
    setShowSubmissionForm(false);
    // Reload receipts
    if (user?.uid) {
      NewReceiptService.getUserReceipts(user.uid).then(setReceipts);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          text: "Pending Review",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200"
        };
      case "approved":
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          text: "Approved",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          borderColor: "border-green-200"
        };
      case "rejected":
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          text: "Rejected",
          bgColor: "bg-red-50",
          textColor: "text-red-800",
          borderColor: "border-red-200"
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-gray-600" />,
          text: "Unknown",
          bgColor: "bg-gray-50",
          textColor: "text-gray-800",
          borderColor: "border-gray-200"
        };
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Receipts</h1>
          <p className="text-gray-600">Track your submitted payment receipts</p>
        </div>

        {/* Submit New Receipt Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowSubmissionForm(!showSubmissionForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0059] text-white rounded-lg hover:bg-[#E6004F] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Submit New Receipt
          </button>
        </div>

        {/* USDT Payment Information */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-gray-800 mb-2">USDT Payment Option:</p>
            <p className="text-sm text-gray-900">
              <span className="font-semibold">USDT TRC20 Wallet Address:</span>
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-200 select-all mb-3 break-all">
              TSTRhivi8wpe22LR3eHTo3ZEkTZyZmLipd
            </p>
            <div className="flex justify-center my-3">
              <Image 
                src="/USDT_QR.png" 
                alt="USDT QR Code" 
                width={200}
                height={200}
                className="object-contain max-w-full w-32 h-32 sm:w-48 sm:h-48"
              />
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please ensure you transfer the exact amount and upload
                the receipt for verification. Include your user ID in the transfer reference if possible.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        {showSubmissionForm && (
          <div className="mb-8">
            <ReceiptSubmission 
              onSubmitted={handleReceiptSubmitted}
              className="max-w-2xl"
              isDepositPayment={!!depositContext.depositId}
              pendingDepositId={depositContext.depositId}
              requiredAmount={depositContext.amount ? parseFloat(depositContext.amount) : undefined}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{receipts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {receipts.filter(r => r.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {receipts.filter(r => r.status === "approved").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${receipts.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Receipt History</h2>
          </div>
          
          {receipts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
              <p className="text-gray-600 mb-4">
                Submit your first payment receipt to get started
              </p>
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF0059] text-white rounded-lg hover:bg-[#E6004F] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Submit Receipt
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {receipts.map((receipt) => {
                const statusInfo = getStatusInfo(receipt.status);
                
                return (
                  <div key={receipt.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            ${receipt.amount.toFixed(2)}
                          </span>
                          {receipt.isDepositPayment && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                              <DollarSign className="w-3 h-3" />
                              Deposit
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted: {formatDate(receipt.submittedAt)}</span>
                          </div>
                          {receipt.processedAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Processed: {formatDate(receipt.processedAt)}</span>
                            </div>
                          )}
                        </div>

                        {receipt.isDepositPayment && receipt.productName && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Deposit Payment for:</strong> {receipt.productName}
                            </p>
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

                        {receipt.notes && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>Admin Notes:</span>
                            </div>
                            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                              {receipt.notes}
                            </p>
                          </div>
                        )}

                        {receipt.processedByName && (
                          <p className="text-xs text-gray-500">
                            Processed by: {receipt.processedByName}
                          </p>
                        )}
                      </div>
                      
                      <div className="ml-6">
                        <button
                          onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          <Eye className="w-4 h-4" />
                          View Receipt
                        </button>
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
  );
}

export default function ReceiptsV2Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
    </div>}>
      <ReceiptsV2Content />
    </Suspense>
  );
}

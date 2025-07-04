"use client";

import { useState, useEffect } from "react";
import { NewReceiptService, NewReceipt } from "../../services/newReceiptService";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Plus,
  DollarSign,
  FileText,
  Calendar,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface ProfileReceiptsSectionProps {
  userId: string;
}

export default function ProfileReceiptsSection({ userId }: ProfileReceiptsSectionProps) {
  const [receipts, setReceipts] = useState<NewReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const RECEIPTS_PER_PAGE = 3;

  useEffect(() => {
    const loadReceipts = async () => {
      if (userId) {
        try {
          const userReceipts = await NewReceiptService.getUserReceipts(userId);
          // Sort by most recent first
          const sortedReceipts = userReceipts.sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          setReceipts(sortedReceipts);
        } catch (error) {
          console.error("Error loading receipts:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReceipts();

    // Subscribe to receipt updates
    const unsubscribe = NewReceiptService.subscribeToUserReceipts(userId, (userReceipts) => {
      const sortedReceipts = userReceipts.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      setReceipts(sortedReceipts);
    });

    return () => unsubscribe();
  }, [userId]);

  // Calculate which receipts to display based on visibleCount
  const displayedReceipts = receipts.slice(0, visibleCount);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="w-4 h-4 text-yellow-600" />,
          text: "Pending",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200"
        };
      case "approved":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          text: "Approved",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          borderColor: "border-green-200"
        };
      case "rejected":
        return {
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          text: "Rejected",
          bgColor: "bg-red-50",
          textColor: "text-red-800",
          borderColor: "border-red-200"
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-600" />,
          text: "Unknown",
          bgColor: "bg-gray-50",
          textColor: "text-gray-800",
          borderColor: "border-gray-200"
        };
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `Yesterday, ${new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)}`;
    } else if (diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {})
      }).format(date);
    }
  };

  const loadMoreReceipts = () => {
    const newVisibleCount = visibleCount + RECEIPTS_PER_PAGE;
    setVisibleCount(newVisibleCount);
  };

  const toggleShowAll = () => {
    const showingAll = visibleCount >= receipts.length;
    if (showingAll) {
      // If currently showing all, go back to showing first 3
      setVisibleCount(RECEIPTS_PER_PAGE);
    } else {
      // If currently showing limited, show all
      setVisibleCount(receipts.length);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-20 h-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded hidden sm:block"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Payment Receipts</h3>
            {receipts.length > 0 && (
              <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {receipts.length}
              </span>
            )}
          </div>
          <Link
            href="/receipts-v2"
            className="text-sm text-pink-600 hover:text-pink-700 font-medium inline-flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {receipts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">{receipts.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-lg font-bold text-yellow-700">
                {receipts.filter(r => r.status === "pending").length}
              </div>
              <div className="text-xs text-yellow-600">Pending</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-700">
                {receipts.filter(r => r.status === "approved").length}
              </div>
              <div className="text-xs text-green-600">Approved</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-lg font-bold text-blue-700">
                ${receipts.reduce((sum, r) => sum + r.amount, 0).toFixed(0)}
              </div>
              <div className="text-xs text-blue-600">Total Amount</div>
            </div>
          </div>
        )}
      </div>

      {receipts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h4>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Submit your first payment receipt to track your transactions and get started
          </p>
          <Link
            href="/receipts-v2"
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Submit Your First Receipt
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {displayedReceipts.map((receipt) => {
            const statusInfo = getStatusInfo(receipt.status);
            
            return (
              <div key={receipt.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Mobile-optimized header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                        {receipt.isDepositPayment && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                            <DollarSign className="w-3 h-3" />
                            Deposit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto">
                        <span className="text-xl font-bold text-gray-900">
                          ${receipt.amount.toFixed(2)}
                        </span>
                        <div className="sm:hidden">
                          <button
                            onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date and time - responsive */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{formatDate(receipt.submittedAt)}</span>
                    </div>

                    {/* Deposit context */}
                    {receipt.isDepositPayment && receipt.productName && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Deposit for:</strong> {receipt.productName}
                        </p>
                      </div>
                    )}
                    
                    {/* Description (truncated on mobile) */}
                    {receipt.description && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>Description:</span>
                        </div>
                        <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded line-clamp-2">
                          {receipt.description}
                        </p>
                      </div>
                    )}

                    {/* Admin notes for rejected receipts */}
                    {receipt.notes && receipt.status === 'rejected' && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>Admin Notes:</span>
                        </div>
                        <p className="text-sm text-red-800 bg-red-50 p-2 rounded">
                          {receipt.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop action button */}
                  <div className="flex-shrink-0 hidden sm:block">
                    <button
                      onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Receipt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more / Show all controls */}
          {receipts.length > RECEIPTS_PER_PAGE && (
            <div className="p-4 sm:p-6 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {visibleCount < receipts.length && (
                  <button
                    onClick={loadMoreReceipts}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Load More ({Math.min(RECEIPTS_PER_PAGE, receipts.length - visibleCount)} more)
                  </button>
                )}
                
                <button
                  onClick={toggleShowAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-md transition-colors"
                >
                  {visibleCount >= receipts.length ? (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show All ({receipts.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

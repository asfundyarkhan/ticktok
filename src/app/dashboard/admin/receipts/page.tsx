"use client";

import React, { useState, useEffect } from 'react';
import { Receipt, ReceiptService } from '../../../../services/receiptService';
import { useAuth } from '../../../../context/AuthContext';
import { format } from 'date-fns';
import { SuperAdminRoute } from '../../../components/SuperAdminRoute';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../../components/Loading';

function ReceiptApprovalPageContent() {
  const { user } = useAuth();
  const [pendingReceipts, setPendingReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  // Initialize real-time subscription to pending receipts
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = ReceiptService.subscribeToPendingReceipts((receipts) => {
      setPendingReceipts(receipts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const viewReceiptDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
    setRejectionReason('');
    setApprovalNotes('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedReceipt(null);
    setRejectionReason('');
    setApprovalNotes('');
  };
  const handleApproveReceipt = async () => {
    if (!selectedReceipt || !user || !selectedReceipt.id) return;
    
    try {
      setProcessingId(selectedReceipt.id);
      
      const result = await ReceiptService.approveReceipt(
        selectedReceipt.id,
        user.uid,
        approvalNotes
      );
      
      if (result.success) {
        toast.success(`Receipt approved and $${selectedReceipt.amount.toFixed(2)} added to ${selectedReceipt.userName}'s account`);
        closeModal();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error approving receipt:', error);
      toast.error('Failed to approve receipt. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectReceipt = async () => {    if (!selectedReceipt || !user || !selectedReceipt.id || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setProcessingId(selectedReceipt.id);
      
      const result = await ReceiptService.rejectReceipt(
        selectedReceipt.id,
        user.uid,
        rejectionReason
      );
      
      if (result.success) {
        toast.success(`Receipt from ${selectedReceipt.userName} has been rejected`);
        closeModal();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      toast.error('Failed to reject receipt. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };
  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Receipt Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Review and approve pending payment receipts from sellers</p>
      </div>
      
      {pendingReceipts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No pending receipts</h3>
          <p className="mt-1 text-sm text-gray-500">
            All receipts have been processed or no sellers have submitted receipts yet.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{receipt.userName}</div>
                        <div className="text-xs text-gray-500">{receipt.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(receipt.createdAt, 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(receipt.createdAt, 'h:mm a')}
                        </div>
                      </td>                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{receipt.referenceNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">${receipt.amount.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => viewReceiptDetails(receipt)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={processingId === receipt.id}
                        >
                          {processingId === receipt.id ? 'Processing...' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {pendingReceipts.map((receipt) => (
              <div key={receipt.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                {/* Seller Info */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{receipt.userName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{receipt.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${receipt.amount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="border-t border-gray-100 pt-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Submitted</p>
                      <p className="text-gray-900 mt-1">{format(receipt.createdAt, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-500">{format(receipt.createdAt, 'h:mm a')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</p>
                      <p className="text-gray-900 mt-1">{receipt.referenceNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => viewReceiptDetails(receipt)}
                    disabled={processingId === receipt.id}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processingId === receipt.id ? 'Processing...' : 'Review Receipt'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}      {/* Mobile-Friendly Receipt Details Modal */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeModal}></div>
            
            {/* Mobile-first modal sizing */}
            <div className="inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:max-w-lg sm:align-middle">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Review Receipt</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Seller Info */}
                  <div className="border border-gray-100 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Seller</p>
                        <p className="font-semibold text-gray-900">{selectedReceipt.userName}</p>
                        <p className="text-xs text-gray-500">{selectedReceipt.userEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Submitted</p>
                        <p className="font-semibold text-gray-900">
                          {format(selectedReceipt.createdAt, 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(selectedReceipt.createdAt, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount and Reference */}
                  <div className="border border-gray-100 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</p>
                        <p className="font-bold text-lg text-green-600">${selectedReceipt.amount.toFixed(2)}</p>
                      </div>                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference</p>
                        <p className="font-semibold text-gray-900">{selectedReceipt.referenceNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Image */}
                  <div className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Receipt Image</p>
                    <div className="bg-gray-50 rounded-md p-2 max-h-64 overflow-y-auto">
                      {selectedReceipt.imageUrl && (
                        <img
                          src={selectedReceipt.imageUrl}
                          alt="Receipt"
                          className="w-full h-auto object-contain rounded"
                        />
                      )}
                      {!selectedReceipt.imageUrl && (
                        <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500">No image available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Approval Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add notes for approval (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    ></textarea>
                  </div>
                  
                  {/* Rejection Reason */}
                  <div>
                    <label htmlFor="reason" className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Rejection Reason (Required for rejection)
                    </label>
                    <textarea
                      id="reason"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Mobile-friendly button layout */}
              <div className="bg-gray-50 px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:flex-row-reverse sm:space-x-2 sm:space-x-reverse">
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={handleApproveReceipt}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === selectedReceipt.id ? 'Processing...' : 'Approve Receipt'}
                </button>
                <button
                  type="button"
                  disabled={processingId !== null || !rejectionReason.trim()}
                  onClick={handleRejectReceipt}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === selectedReceipt.id ? 'Processing...' : 'Reject Receipt'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the component with SuperAdminRoute for access control
export default function ReceiptApprovalPage() {
  return (
    <SuperAdminRoute>
      <ReceiptApprovalPageContent />
    </SuperAdminRoute>
  );
}

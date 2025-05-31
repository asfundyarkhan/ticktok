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

  // Helper to render color-coded status badges
  const renderStatusBadge = (status: string) => {
    let color: string;
    
    switch(status) {
      case 'approved':
        color = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        color = 'bg-red-100 text-red-800';
        break;
      case 'pending':
      default:
        color = 'bg-yellow-100 text-yellow-800';
        break;
    }
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Pending Payment Receipts</h2>
      
      {pendingReceipts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No pending receipts to approve
        </div>
      ) : (
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
                <tr key={receipt.id}>
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
                  </td>                  <td className="px-6 py-4 whitespace-nowrap">
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
      )}

      {/* Receipt Details Modal for Approval/Rejection */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeModal}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold mb-4">Review Payment Receipt</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Seller</p>
                      <p className="font-semibold">{selectedReceipt.userName}</p>
                      <p className="text-xs text-gray-500">{selectedReceipt.userEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted On</p>
                      <p className="font-semibold">
                        {format(selectedReceipt.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold text-lg">${selectedReceipt.amount.toFixed(2)}</p>
                    </div>                    <div>
                      <p className="text-sm text-gray-500">Reference Number</p>
                      <p className="font-semibold">{selectedReceipt.referenceNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Receipt Image</p>
                    <div className="mt-1 border border-gray-200 rounded-md p-2">
                      <img
                        src={selectedReceipt.imageUrl}
                        alt="Receipt"
                        className="max-h-80 object-contain mx-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Approval Form */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add notes for approval (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF0059] text-sm"
                    ></textarea>
                  </div>
                  
                  {/* Rejection Form */}
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason (Required for rejection)
                    </label>
                    <textarea
                      id="reason"
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF0059] text-sm"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse gap-2 sm:px-6">
                <button
                  type="button"
                  disabled={processingId !== null}
                  onClick={handleApproveReceipt}
                  className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto disabled:opacity-50"
                >
                  {processingId === selectedReceipt.id ? 'Processing...' : 'Approve Receipt'}
                </button>
                <button
                  type="button"
                  disabled={processingId !== null || !rejectionReason.trim()}
                  onClick={handleRejectReceipt}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50"
                >
                  {processingId === selectedReceipt.id ? 'Processing...' : 'Reject Receipt'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

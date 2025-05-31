"use client";

import React, { useState, useEffect } from 'react';
import { Receipt, ReceiptService } from '../../services/receiptService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export default function UserReceiptList() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = ReceiptService.subscribeToUserReceipts(
      user.uid,
      (updatedReceipts) => {
        setReceipts(updatedReceipts);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const openReceiptDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const closeReceiptDetails = () => {
    setShowModal(false);
    setSelectedReceipt(null);
  };

  // Helper to render status badge with appropriate color
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
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF0059]"></div>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">You haven&apos;t submitted any receipts yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Receipts Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(receipt.createdAt, 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(receipt.createdAt, 'h:mm a')}
                  </div>
                </td>                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{receipt.referenceNumber || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">${receipt.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(receipt.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => openReceiptDetails(receipt)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receipt Details Modal */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeReceiptDetails}></div>
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-semibold mb-4">Receipt Details</h3>
                
                <div className="space-y-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-semibold">${selectedReceipt.amount.toFixed(2)}</p>
                    </div>                    <div>
                      <p className="text-sm text-gray-500">Reference Number</p>
                      <p className="font-semibold">{selectedReceipt.referenceNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="mt-1">{renderStatusBadge(selectedReceipt.status)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted On</p>
                      <p className="font-semibold">
                        {format(selectedReceipt.createdAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {selectedReceipt.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="mt-1">{selectedReceipt.notes}</p>
                    </div>
                  )}
                  
                  {selectedReceipt.status !== 'pending' && selectedReceipt.approvedAt && (
                    <div>
                      <p className="text-sm text-gray-500">
                        {selectedReceipt.status === 'approved' ? 'Approved On' : 'Rejected On'}
                      </p>
                      <p className="font-semibold">
                        {format(selectedReceipt.approvedAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={closeReceiptDetails}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

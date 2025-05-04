"use client";

import { X } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: {
    id: string;
    date: string;
    amount: number;
    sellerId: string;
    sellerName: string;
    status: "pending" | "approved" | "rejected";
    imageUrl: string;
  } | null;
  onApprove?: () => void;
  onReject?: () => void;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  receipt,
  onApprove,
  onReject,
}: ReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-25"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">Receipt Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Receipt ID</p>
                <p className="font-medium">{receipt.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {new Date(receipt.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Seller</p>
                <p className="font-medium">{receipt.sellerName}</p>
                <p className="text-sm text-gray-500">{receipt.sellerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">${receipt.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Receipt Image</p>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={receipt.imageUrl}
                  alt="Receipt"
                  className="w-full h-auto"
                />
              </div>
            </div>

            {receipt.status === "pending" && (
              <div className="flex justify-end gap-4">
                <button
                  onClick={onReject}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Reject
                </button>
                <button
                  onClick={onApprove}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

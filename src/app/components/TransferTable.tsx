"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { LoadingSpinner } from "./Loading";

interface Transfer {
  id: string;
  amount: number;
  bankAccount: string;
  status: "pending" | "completed" | "failed";
  date: string;
  reference: string;
}

interface TransferTableProps {
  transfers?: Transfer[];
  loading?: boolean;
  error?: string;
}

export default function TransferTable({
  transfers: initialTransfers,
  loading = false,
  error,
}: TransferTableProps) {
  const [transfers] = useState<Transfer[]>(
    initialTransfers || [
      {
        id: "1",
        amount: 1500.0,
        bankAccount: "**** 1234",
        status: "completed",
        date: "2025-04-30T14:30:00",
        reference: "TRF-123456",
      },
      {
        id: "2",
        amount: 2750.0,
        bankAccount: "**** 5678",
        status: "pending",
        date: "2025-04-30T13:15:00",
        reference: "TRF-123457",
      },
      {
        id: "3",
        amount: 1000.0,
        bankAccount: "**** 1234",
        status: "completed",
        date: "2025-04-29T15:45:00",
        reference: "TRF-123458",
      },
    ]
  );

  const getStatusColor = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Transfers
          </h2>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transfers to display
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transfer.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transfer.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transfer.bankAccount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        transfer.status
                      )}`}
                    >
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transfer.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-pink-600 hover:text-pink-900"
                      title="Download Receipt"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Page 1 of 1</span>
          <button
            className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { SuperAdminRoute } from "../../../components/SuperAdminRoute";
import TransactionHistory from "../../../components/TransactionHistory";
import { useAuth } from "../../../../context/AuthContext";

function AdminTransactionsPageContent() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="text-gray-600 mt-2">Complete history of your commission earnings</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      <TransactionHistory 
        adminId={user?.uid} 
        maxItems={100}
        showTitle={true}
      />
    </div>
  );
}

export default function AdminTransactionsPage() {
  return (
    <SuperAdminRoute>
      <AdminTransactionsPageContent />
    </SuperAdminRoute>
  );
}

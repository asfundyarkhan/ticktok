"use client";

import { useState } from "react";
import { AdminRoute } from "../../../components/AdminRoute";
import ReferralsTable from "../../../components/ReferralsTable";
import { useAuth } from "@/context/AuthContext";

function AdminReferralsPageContent() {
  const { userProfile } = useAuth();
  const [loading] = useState(false);
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">My Referred Sellers</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Below is a list of sellers who registered using your referral code.
        </p>
      </div>
      
      {userProfile?.referralCode ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 sm:mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Your Referral Code
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <span className="font-medium text-pink-600 text-lg bg-white border border-pink-200 rounded-md px-3 py-2 block sm:inline-block">
                {userProfile.referralCode}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(userProfile.referralCode || "");
                alert("Referral code copied to clipboard!");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              title="Copy to clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy Code
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Share this code with potential sellers to allow them to register
            through your referral.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 sm:mb-6 border-l-4 border-l-yellow-400">
          <p className="text-yellow-800">
            You don&apos;t have a referral code yet. Contact a super admin to get one.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Referred Sellers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            These sellers registered using your referral code
          </p>
        </div>
        <ReferralsTable loading={loading} adminId={userProfile?.uid} />
      </div>
    </div>
  );
}

export default function AdminReferralsPage() {
  return (
    <AdminRoute>
      <AdminReferralsPageContent />
    </AdminRoute>
  );
}

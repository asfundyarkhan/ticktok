"use client";

import { useState } from "react";
import { AdminRoute } from "../../../components/AdminRoute";
import ReferralsTable from "../../../components/ReferralsTable";
import { useAuth } from "@/context/AuthContext";

function AdminReferralsPageContent() {
  const { userProfile } = useAuth();
  const [loading] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">My Referred Sellers</h1>
      <div className="mb-6 space-y-2">
        <p className="text-gray-600">
          Below is a list of sellers who registered using your referral code.
        </p>
        {userProfile?.referralCode ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm text-gray-700 font-medium mb-1">
              Your Referral Code
            </h3>
            <div className="flex items-center">
              <span className="font-medium text-pink-600 text-lg mr-2">
                {userProfile.referralCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userProfile.referralCode || "");
                  alert("Referral code copied to clipboard!");
                }}
                className="text-gray-400 hover:text-gray-600"
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
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with potential sellers to allow them to register
              through your referral.
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
            <p className="text-yellow-800">
              You don&apos;t have a referral code yet. Contact a super admin to get one.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            Referred Sellers
          </h2>
          <p className="text-sm text-gray-500">
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

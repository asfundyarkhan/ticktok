"use client";

import { useState } from "react";
import { SuperAdminRoute } from "../../../components/SuperAdminRoute";
import ReferralsTable from "../../../components/ReferralsTable";

function AllReferralsPageContent() {
  const [loading] = useState(false);
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">All Referral Relationships</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Complete overview of all referral relationships in the system. This view shows all sellers who were referred by admins.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">
            All Referrals
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Complete list of all referred sellers in the system
          </p>
        </div>
        <ReferralsTable loading={loading} showAllReferrals={true} />
      </div>
    </div>
  );
}

export default function AllReferralsPage() {
  return (
    <SuperAdminRoute>
      <AllReferralsPageContent />
    </SuperAdminRoute>
  );
}

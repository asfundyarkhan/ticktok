"use client";

import { useState } from "react";
import ReferralsTable from "../../components/ReferralsTable";

export default function ReferralsPage() {
  const [isLoading] = useState(false);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        My Referrals
      </h1>
      <ReferralsTable loading={isLoading} />
    </div>
  );
}

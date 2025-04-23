"use client";

import { useState } from "react";
import StatsCard from "../components/StatsCard";
import ActivityTable from "../components/ActivityTable";

const sampleActivities = [
  {
    id: "1",
    date: "2025-04-23",
    activity: "New referral signup - John Smith",
    status: "Completed" as const,
  },
  {
    id: "2",
    date: "2025-04-23",
    activity: "Commission payout - $50.00",
    status: "Pending" as const,
  },
];

export default function DashboardPage() {
  const [userId] = useState("USER123456");
  const [stats] = useState({
    referrals: {
      total: 12,
      activeThisMonth: 8,
    },
    earnings: {
      total: "$1,250.00",
      pending: "$250.00",
    },
    myRefId: "REF789012",
  });

  return (
    <div className="space-y-8">
      {/* User ID Badge */}
      <div className="bg-white px-4 py-2 inline-flex items-center rounded-lg shadow-sm">
        <span className="text-sm font-medium text-gray-600 mr-2">User ID:</span>
        <span className="text-sm font-bold text-gray-900">{userId}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="My Referrals"
          value={stats.referrals.total}
          subtitle={{
            label: "Active this month",
            value: stats.referrals.activeThisMonth.toString(),
          }}
        />
        <StatsCard
          title="Total Earnings"
          value={stats.earnings.total}
          subtitle={{
            label: "Pending",
            value: stats.earnings.pending,
          }}
        />
        <StatsCard
          title="My Referral ID"
          value={stats.myRefId}
          subtitle={{
            label: "Share with others",
            value: "Click to copy",
          }}
          copyable={true}
        />
      </div>

      {/* Activity Table */}
      <ActivityTable activities={sampleActivities} />
    </div>
  );
}

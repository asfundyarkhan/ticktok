"use client";

import { Users } from "lucide-react";
import StatsCard from "../components/StatsCard";
import ActivityTable from "../components/ActivityTable";

export default function DashboardPage() {
  const stats = [
    {
      title: "My Referrals",
      value: "8",
      icon: Users,
    },
    {
      title: "My Ref ID",
      value: "REF002",
      icon: Users,
    },
  ];

  return (
    <div className="p-6">
      {/* User Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">John Doe</h1>
          <span className="px-2 py-1 text-sm bg-gray-100 rounded-md">
            ref002
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Activity Table */}
      <div className="mb-8">
        <ActivityTable title="Recent Activity" />
      </div>
    </div>
  );
}

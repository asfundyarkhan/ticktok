"use client";

import { useEffect, useState } from "react";
import { ActivityItem, ActivityService } from "../../services/activityService";

interface ActivityTableProps {
  title: string;
}

export default function ActivityTable({ title }: ActivityTableProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage] = useState(5);

  useEffect(() => {
    // Subscribe to activities in real-time
    const unsubscribe = ActivityService.subscribeToActivities(
      (updatedActivities) => {
        setActivities(updatedActivities);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading activities:", error);
        setLoading(false);
      },
      rowsPerPage
    );

    return () => unsubscribe();
  }, [rowsPerPage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No activities to display
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  DATE
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  ACTIVITY
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activity.createdAt.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.createdAt.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {ActivityService.formatActivityMessage(activity)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${
                        activity.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {activities.length} most recent activities
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

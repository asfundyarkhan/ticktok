"use client";

import { useState } from "react";
import clsx from "clsx";

interface Activity {
  id: string;
  date: string;
  activity: string;
  status: "Completed" | "Pending";
}

interface ActivityTableProps {
  activities: Activity[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  const [rowsPerPage, setRowsPerPage] = useState(5);

  return (
    <div className="bg-white rounded-lg">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Activity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {activities.map((activity) => (
            <tr key={activity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">
                {activity.date}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {activity.activity}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={clsx(
                    "px-2 py-1 text-xs font-medium rounded-full",
                    activity.status === "Completed"
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  )}
                >
                  {activity.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded px-2 py-1 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">1-2 of 2</span>
        </div>
      </div>
    </div>
  );
}

"use client";

interface ActivityTableProps {
  title: string;
}

export default function ActivityTable({ title }: ActivityTableProps) {
  const activities = [
    {
      date: "01/04/2025",
      activity: "(User ID: John0982) Purchase 100 unit (Product Code)",
      status: "Completed",
    },
    {
      date: "01/04/2025",
      activity: "(User ID: Jake0820) Uploaded Receipt",
      status: "Pending",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">DATE</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ACTIVITY</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index} className="border-t">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {activity.date}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {activity.activity}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                    ${
                      activity.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {activity.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Rows per page:</span>
            <select className="border rounded px-2 py-1 text-sm">
              <option>5</option>
            </select>
          </div>
          <div className="text-sm text-gray-700">1-2 of 2</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LoadingSpinner } from "./Loading";

interface Referral {
  id: string;
  name: string;
  userId: string;
  credential: string;
  dateJoined: string;
  credit: number;
}

interface ReferralsTableProps {
  referrals?: Referral[];
  loading?: boolean;
}

export default function ReferralsTable({
  loading = false,
}: ReferralsTableProps) {
  const [referrals] = useState<Referral[]>([
    {
      id: "REF003",
      name: "Carson Darrin",
      userId: "carson.darrin@devias.io",
      credential: "Associate",
      dateJoined: "2025-04-02",
      credit: 300.0,
    },
    {
      id: "REF004",
      name: "Fran Perez",
      userId: "fran.perez@devias.io",
      credential: "Senior Developer",
      dateJoined: "2025-03-23",
      credit: 0.0,
    },
    {
      id: "REF005",
      name: "Jie Yan Song",
      userId: "jie.yan.song@devias.io",
      credential: "UX Designer",
      dateJoined: "2025-03-20",
      credit: 5600.0,
    },
    {
      id: "REF006",
      name: "Anika Visser",
      userId: "anika.visser@devias.io",
      credential: "Product Manager",
      dateJoined: "2025-03-15",
      credit: 500.0,
    },
    {
      id: "REF007",
      name: "Miron Vitold",
      userId: "miron.vitold@devias.io",
      credential: "Software Engineer",
      dateJoined: "2025-03-10",
      credit: 0.0,
    },
  ]);

  return (
    <div className="bg-white rounded-lg">
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{referral.name}</div>
                    <div className="text-xs text-gray-500">
                      {referral.credential}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {referral.id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(referral.dateJoined).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${referral.credit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Rows per page:</span>
          <select className="text-sm border rounded px-1 py-0.5">
            <option>5</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">1-5 of 10</span>
          <div className="flex">
            <button className="p-1" disabled>
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <button className="p-1">
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

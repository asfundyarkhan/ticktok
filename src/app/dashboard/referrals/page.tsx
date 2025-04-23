"use client";

import { useState } from "react";
import ReferralsTable from "@/app/components/ReferralsTable";

const mockReferrals = [
  {
    name: "Carson Darrin",
    email: "carson.darrin@devias.io",
    refId: "REF003",
    dateJoined: "02/04/2025",
    credit: 300.0,
  },
  {
    name: "Fran Perez",
    email: "fran.perez@devias.io",
    refId: "REF004",
    dateJoined: "23/03/2025",
    credit: 0.0,
  },
  {
    name: "Jie Yan Song",
    email: "jie.yan.song@devias.io",
    refId: "REF005",
    dateJoined: "20/03/2025",
    credit: 5600.0,
  },
  {
    name: "Anika Visser",
    email: "anika.visser@devias.io",
    refId: "REF006",
    dateJoined: "15/03/2025",
    credit: 500.0,
  },
  {
    name: "Miron Vitold",
    email: "miron.vitold@devias.io",
    refId: "REF007",
    dateJoined: "10/03/2025",
    credit: 0.0,
  },
];

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Referrals</h1>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      <ReferralsTable referrals={mockReferrals} searchQuery={searchQuery} />

      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center text-sm text-gray-500">
          Rows per page:
          <select className="ml-2 border-0 bg-transparent text-gray-500 focus:ring-0">
            <option>5</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">1-5 of 10</div>
      </div>
    </div>
  );
}

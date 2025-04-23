"use client";

import { useState } from "react";
import TransferTable from "@/app/components/TransferTable";
import toast from "react-hot-toast";

const mockUsers = [
  {
    name: "Carson Darrin",
    email: "carson.darrin@devias.io",
    refId: "REF003",
    balance: 300.0,
  },
  {
    name: "Fran Perez",
    email: "fran.perez@devias.io",
    refId: "REF004",
    balance: 150.0,
  },
  {
    name: "Jie Yan Song",
    email: "jie.yan.song@devias.io",
    refId: "REF005",
    balance: 5600.0,
  },
  {
    name: "Anika Visser",
    email: "anika.visser@devias.io",
    refId: "REF006",
    balance: 500.0,
  },
  {
    name: "Miron Vitold",
    email: "miron.vitold@devias.io",
    refId: "REF007",
    balance: 250.0,
  },
];

export default function TransferPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState(mockUsers);

  const handleTransfer = async (userId: string, amount: number) => {
    try {
      // Here you would typically make an API call to process the transfer
      // For now, we'll just update the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.refId === userId
            ? { ...user, balance: user.balance + amount }
            : user
        )
      );
      toast.success(
        `Successfully transferred $${amount.toFixed(2)} to ${userId}`
      );
    } catch (error) {
      toast.error("Failed to process transfer");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Transfer Money</h1>
        <p className="mt-2 text-sm text-gray-600">
          Search for users and transfer money to their accounts
        </p>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users"
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

      <TransferTable
        users={users}
        searchQuery={searchQuery}
        onTransfer={handleTransfer}
      />

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

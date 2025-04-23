"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Account {
  name: string;
  email: string;
  refId: string;
  status: "approved" | "suspended" | "pending";
}

const mockAccounts: Account[] = [
  {
    name: "Carson Darrin",
    email: "carson.darrin@devias.io",
    refId: "REF003",
    status: "approved",
  },
  {
    name: "Fran Perez",
    email: "fran.perez@devias.io",
    refId: "REF004",
    status: "approved",
  },
  {
    name: "Jie Yan Song",
    email: "jie.yan.song@devias.io",
    refId: "REF005",
    status: "pending",
  },
  {
    name: "Anika Visser",
    email: "anika.visser@devias.io",
    refId: "REF006",
    status: "approved",
  },
  {
    name: "Miron Vitold",
    email: "miron.vitold@devias.io",
    refId: "REF007",
    status: "suspended",
  },
];

export default function PaymentPage() {
  const [accounts, setAccounts] = useState(mockAccounts);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = accounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.refId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (
    refId: string,
    newStatus: "approved" | "suspended"
  ) => {
    setAccounts((prevAccounts) =>
      prevAccounts.map((account) =>
        account.refId === refId ? { ...account, status: newStatus } : account
      )
    );

    const message =
      newStatus === "approved"
        ? "Account has been approved"
        : "Account has been suspended";
    toast.success(message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage payment accounts and their access privileges
        </p>
      </div>

      <div className="max-w-md">
        <div className="relative">
          <input
            type="text"
            placeholder="Search account"
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

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                NAME
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                REF ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
              >
                GRANT
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredAccounts.map((account) => (
              <tr key={account.refId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {account.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {account.email}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {account.refId}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="space-x-2">
                    {account.status !== "approved" && (
                      <button
                        onClick={() =>
                          handleStatusChange(account.refId, "approved")
                        }
                        className="text-sm bg-pink-500 text-white px-3 py-1 rounded-md hover:bg-pink-600"
                      >
                        Approve
                      </button>
                    )}
                    {account.status !== "suspended" && (
                      <button
                        onClick={() =>
                          handleStatusChange(account.refId, "suspended")
                        }
                        className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                      >
                        Deny
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

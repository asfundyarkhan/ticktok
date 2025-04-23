"use client";

import { useState } from "react";

interface User {
  name: string;
  email: string;
  refId: string;
  balance: number;
}

interface TransferTableProps {
  users: User[];
  searchQuery: string;
  onTransfer: (userId: string, amount: number) => void;
}

export default function TransferTable({
  users,
  searchQuery,
  onTransfer,
}: TransferTableProps) {
  const [transferAmount, setTransferAmount] = useState<{
    [key: string]: string;
  }>({});

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = (refId: string) => {
    const amount = parseFloat(transferAmount[refId] || "0");
    if (amount > 0) {
      onTransfer(refId, amount);
      setTransferAmount((prev) => ({
        ...prev,
        [refId]: "",
      }));
    }
  };

  return (
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
              BALANCE
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
            >
              TRANSFER AMOUNT
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-sm font-semibold text-gray-900"
            >
              ACTION
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {filteredUsers.map((user) => (
            <tr key={user.refId} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.name}
                  </span>
                  <span className="text-sm text-gray-500">{user.email}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{user.refId}</td>
              <td className="px-6 py-4 text-right text-sm">
                <span className="text-gray-900 font-medium">
                  ${user.balance.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    value={transferAmount[user.refId] || ""}
                    onChange={(e) =>
                      setTransferAmount((prev) => ({
                        ...prev,
                        [user.refId]: e.target.value,
                      }))
                    }
                    className="w-24 px-2 py-1 text-right border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleTransfer(user.refId)}
                  disabled={
                    !transferAmount[user.refId] ||
                    parseFloat(transferAmount[user.refId]) <= 0
                  }
                  className="text-sm bg-pink-500 text-white px-3 py-1 rounded-md hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Transfer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

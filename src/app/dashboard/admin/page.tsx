"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface User {
  name: string;
  email: string;
  sellerId: string;
  receipts: number;
  credit: number;
  suspended: boolean;
}

interface CreditInput {
  sellerId: string;
  amount: string;
}

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [creditInput, setCreditInput] = useState<CreditInput>({
    sellerId: "",
    amount: "",
  });
  const [users, setUsers] = useState<User[]>([
    {
      name: "Carson Darrin",
      email: "carson.darrin@devias.io",
      sellerId: "REF003",
      receipts: 1,
      credit: 450.0,
      suspended: false,
    },
    {
      name: "Fran Perez",
      email: "fran.perez@devias.io",
      sellerId: "REF004",
      receipts: 0,
      credit: 0.0,
      suspended: false,
    },
    {
      name: "Jie Yan Song",
      email: "jie.yan.song@devias.io",
      sellerId: "REF005",
      receipts: 0,
      credit: 5600.0,
      suspended: true,
    },
    {
      name: "Anika Visser",
      email: "anika.visser@devias.io",
      sellerId: "REF006",
      receipts: 0,
      credit: 500.0,
      suspended: false,
    },
    {
      name: "Miron Vitold",
      email: "miron.vitold@devias.io",
      sellerId: "REF007",
      receipts: 0,
      credit: 0.0,
      suspended: false,
    },
  ]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.sellerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreditChange = (sellerId: string) => {
    const amount = parseFloat(creditInput.amount);
    if (isNaN(amount)) {
      alert("Please enter a valid amount");
      return;
    }

    setUsers(
      users.map((user) =>
        user.sellerId === sellerId
          ? { ...user, credit: user.credit + amount }
          : user
      )
    );
    setCreditInput({ sellerId: "", amount: "" });
  };

  const toggleSuspension = (sellerId: string) => {
    setUsers(
      users.map((user) =>
        user.sellerId === sellerId
          ? { ...user, suspended: !user.suspended }
          : user
      )
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search user"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Merchant Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.sellerId}>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.sellerId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.receipts}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  ${user.credit.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        className="pl-8 pr-4 py-1 border border-gray-300 rounded-md w-24 focus:outline-none focus:border-pink-500"
                        value={
                          creditInput.sellerId === user.sellerId
                            ? creditInput.amount
                            : ""
                        }
                        onChange={(e) =>
                          setCreditInput({
                            sellerId: user.sellerId,
                            amount: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={() => handleCreditChange(user.sellerId)}
                      className="text-pink-600 hover:text-pink-900 bg-pink-50 px-3 py-1 rounded-md"
                      disabled={
                        creditInput.sellerId !== user.sellerId ||
                        !creditInput.amount
                      }
                    >
                      Add Credit
                    </button>
                  </div>
                  <button
                    onClick={() => toggleSuspension(user.sellerId)}
                    className={`${
                      user.suspended
                        ? "text-green-600 hover:text-green-900 bg-green-50"
                        : "text-red-600 hover:text-red-900 bg-red-50"
                    } px-3 py-1 rounded-md`}
                  >
                    {user.suspended ? "Activate" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

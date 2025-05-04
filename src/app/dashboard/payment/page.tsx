"use client";

import { useState } from "react";
import { CreditCard, Download } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  type: "credit" | "debit";
  description: string;
}

interface Card {
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

export default function PaymentPage() {
  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      date: "2025-04-30T12:00:00",
      amount: 2500.0,
      status: "completed",
      type: "credit",
      description: "Sales revenue",
    },
    {
      id: "2",
      date: "2025-04-29T15:00:00",
      amount: 150.0,
      status: "completed",
      type: "debit",
      description: "Platform fee",
    },
    {
      id: "3",
      date: "2025-04-28T09:00:00",
      amount: 1800.0,
      status: "completed",
      type: "credit",
      description: "Sales revenue",
    },
  ]);

  const [cards] = useState<Card[]>([
    {
      last4: "4242",
      brand: "visa",
      expMonth: 12,
      expYear: 2025,
    },
  ]);

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={
                            transaction.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "credit" ? "+" : "-"}$
                          {transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-pink-500 hover:text-pink-600">
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">Payment Methods</h2>
            </div>
            <div className="p-6">
              {cards.map((card) => (
                <div
                  key={card.last4}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center">
                    <CreditCard className="w-8 h-8 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">
                        {card.brand.charAt(0).toUpperCase() +
                          card.brand.slice(1)}{" "}
                        ending in {card.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        Expires {card.expMonth}/{card.expYear}
                      </p>
                    </div>
                  </div>
                  <button className="text-sm text-pink-500 hover:text-pink-600">
                    Edit
                  </button>
                </div>
              ))}
              <button className="w-full mt-4 px-4 py-2 text-pink-500 border border-pink-500 rounded-lg hover:bg-pink-50">
                Add Payment Method
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">Billing Address</h2>
            </div>
            <div className="p-6">
              <div className="text-gray-600">
                <p>John Doe</p>
                <p>1234 Main Street</p>
                <p>Apt 4B</p>
                <p>New York, NY 10001</p>
                <p>United States</p>
              </div>
              <button className="mt-4 text-sm text-pink-500 hover:text-pink-600">
                Edit Address
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

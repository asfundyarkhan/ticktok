"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import TransferTable from "@/app/components/TransferTable";
import { LoadingSpinner } from "@/app/components/Loading";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase/firebase";
import { useAuth } from "@/context/AuthContext";
import { useUserBalance } from "@/app/components/UserBalanceContext";

export default function TransferPage() {
  const { user } = useAuth();
  const { balance, deductFromBalance } = useUserBalance();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");

  const savedAccounts = [
    { id: "1", number: "**** 1234", bank: "Chase", primary: true },
    { id: "2", number: "**** 5678", bank: "Bank of America", primary: false },
    { id: "3", number: "**** 9012", bank: "Wells Fargo", primary: false },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Get the selected bank account info
    const bankAccount = savedAccounts.find(
      (account) => account.id === selectedAccount
    );
    if (!bankAccount) {
      setIsLoading(false);
      alert("Please select a bank account");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setIsLoading(false);
      alert("Please enter a valid amount");
      return;
    }

    // Check if user has enough balance
    if (transferAmount > balance) {
      setIsLoading(false);
      alert("Insufficient balance for this transfer");
      return;
    }

    try {
      // Create withdrawal activity first
      const activityRef = collection(firestore, "activities");
      const newActivityDoc = doc(activityRef);
      await setDoc(newActivityDoc, {
        userId: user?.uid,
        userDisplayName: user?.displayName || user?.email || "Unknown User",
        type: "funds_withdrawn",
        details: {
          amount: transferAmount,
          bankAccount: `${bankAccount.bank} (${bankAccount.number})`,
        },
        status: "pending",
        createdAt: Timestamp.now(),
      });

      // Deduct from user balance
      await deductFromBalance(transferAmount);

      // Reset form
      setSelectedAccount("");
      setAmount("");
      setIsLoading(false);

      alert(
        "Withdrawal request submitted. It will be processed within 24 hours."
      );
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Error processing withdrawal. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Transfer Funds</h1>
        <p className="mt-1 text-sm text-gray-600">
          Transfer your earnings to your bank account.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Bank Account
                  </label>
                  <div className="mt-2 space-y-3">
                    {savedAccounts.map((account) => (
                      <label
                        key={account.id}
                        className={`relative block p-4 border rounded-lg cursor-pointer focus-within:ring-2 focus-within:ring-pink-500 ${
                          selectedAccount === account.id
                            ? "border-pink-500 ring-1 ring-pink-500"
                            : "border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bank-account"
                          value={account.id}
                          checked={selectedAccount === account.id}
                          onChange={(e) => setSelectedAccount(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {account.bank}
                              </p>
                              <p className="text-sm text-gray-500">
                                {account.number}
                              </p>
                            </div>
                          </div>
                          {account.primary && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              Primary
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="text-sm font-medium text-pink-600 hover:text-pink-500"
                    >
                      + Add New Bank Account
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Amount to Transfer
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      name="amount"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="focus:ring-pink-500 focus:border-pink-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !selectedAccount || !amount}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      "Transfer Funds"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Transfer History */}
        <div className="lg:col-span-2">
          <TransferTable />
        </div>
      </div>
    </div>
  );
}

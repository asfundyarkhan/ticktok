"use client";

import { useState } from "react";
import { useUserBalance } from "./UserBalanceContext";
import { useAuth } from "../../context/AuthContext";

export default function BalanceTestComponent() {
  const { balance, addToBalance, loading } = useUserBalance();
  const { user, userProfile } = useAuth();
  const [testAmount, setTestAmount] = useState("100");
  const [processing, setProcessing] = useState(false);

  const handleTestTopUp = async () => {
    const amount = parseFloat(testAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    try {
      const result = await addToBalance(amount, `Test top-up of $${amount}`);
      if (result.success) {
        alert(`Success: ${result.message}`);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert("Failed to process test top-up");
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to test the balance system</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4">Balance Test Component</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current User: {userProfile?.displayName || user.email}</p>
        <p className="text-sm text-gray-600">Role: {userProfile?.role || "user"}</p>
        {userProfile?.referredBy && (
          <p className="text-sm text-gray-600">Referred by: {userProfile.referredBy}</p>
        )}
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p className="text-sm font-medium text-gray-700">Current Balance:</p>
        <p className="text-2xl font-bold text-green-600">
          {loading ? "Loading..." : `$${balance.toFixed(2)}`}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Amount ($)
          </label>
          <input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md w-full"
            min="0.01"
            step="0.01"
            disabled={processing}
          />
        </div>

        <button
          onClick={handleTestTopUp}
          disabled={processing || loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Test Top-Up"}
        </button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This will add funds to your balance</p>
          <p>• If you have a referrer, they will get 10% commission</p>
          <p>• Balance updates should appear in real-time</p>
          <p>• Check the transaction history for details</p>
        </div>
      </div>
    </div>
  );
}

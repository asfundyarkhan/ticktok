"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserBalance } from "../components/UserBalanceContext";

export default function WalletPage() {
  const [paymentAmount, setPaymentAmount] = useState("1000");
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { balance, addToBalance } = useUserBalance();

  const handleSubmit = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (!receiptUploaded) {
      alert("Please upload a receipt");
      return;
    }

    setSubmitting(true);

    // Simulate processing delay
    setTimeout(() => {
      // In a real app, this would be an API call to verify the payment
      addToBalance(amount);
      alert(`$${amount} has been added to your wallet!`);
      setReceiptUploaded(false);
      setPaymentAmount("1000");
      setSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with TikTok Shop and search */}
      <div className="bg-white py-4 px-6 border-b flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-black">TikTok Shop</h1>
          <div className="relative">
            <button className="px-3 py-1 border rounded-md text-sm flex items-center text-black">
              Category <span className="ml-1">▼</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 w-96 text-black placeholder-gray-500 border border-gray-300"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-700">
            Balance: ${balance.toFixed(2)}
          </div>
          <div className="flex items-center space-x-1 text-sm">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <span className="text-gray-700 font-medium">Your Name</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-medium text-gray-900 mb-6">Account</h1>

        <div className="flex space-x-8 border-b border-gray-200 mb-6">
          <Link
            href="/profile"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            General
          </Link>
          <Link
            href="/wallet"
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold"
          >
            Wallet
          </Link>
          <Link
            href="/stock"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Buy stock
          </Link>
          <Link
            href="/stock/inventory"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Inventory
          </Link>
        </div>

        {/* Total Balance */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-800 uppercase mb-1">
            TOTAL BALANCE
          </h2>
          <div className="text-3xl font-bold text-gray-900">
            ${balance.toFixed(2)}
          </div>
        </div>

        {/* Deposit Funds */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900">
            Deposit Funds
          </h2>
        </div>

        {/* Three-column deposit process */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 1: TRANSFER TO OUR ACCOUNT
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Bank Name:</span> [Bank Name]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Account Name:</span> [Full
                  Name]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Account Number:</span> [Bank
                  Account Number]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Transfer Amount:</span>{" "}
                  [Minimum $50]
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 2: ADD REFERENCE CODE
              </h3>
              <div className="flex items-start mb-2">
                <span className="text-amber-500 mr-2 text-lg font-bold">⚠</span>
                <p className="text-sm text-gray-900">
                  In your bank&apos;s transfer reference/ message field, please
                  enter your unique user ID or username.
                </p>
              </div>
              <p className="text-sm text-gray-900 mb-4">
                This is how we identify your deposit.
              </p>

              <div className="mb-2">
                <p className="text-xs uppercase text-gray-800 font-semibold">
                  EXAMPLE:
                </p>
              </div>
              <p className="text-sm text-gray-900 font-medium">
                Seller789 or UserID#12345
              </p>
              <p className="text-sm text-gray-900 font-medium">
                No reference = No credit update.
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-800 uppercase mb-4">
                STEP 3: SUBMIT PROOF
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-900 font-semibold">
                  After transferring:
                </p>
                <ul className="list-disc ml-5 text-sm text-gray-900">
                  <li>Upload your receipt</li>
                  <li>
                    Wait for admin approval{" "}
                    <span className="text-xs text-gray-700">
                      (USUALLY WITHIN 24 HOURS)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-800 font-medium mb-2">
                  Payment Amount
                </label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white mb-4"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-800 font-medium mb-2">
                  Upload Receipt
                </label>
                <div
                  className={`border-2 border-dashed ${
                    receiptUploaded
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-white"
                  } p-8 rounded-md text-center`}
                >
                  {receiptUploaded ? (
                    <>
                      <p className="text-sm text-green-600 mb-1">
                        Receipt uploaded successfully!
                      </p>
                      <button
                        onClick={() => setReceiptUploaded(false)}
                        className="text-sm text-gray-500 underline mt-2"
                      >
                        Remove Receipt
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800 mb-1">
                        Drag & Drop your receipt here,
                      </p>
                      <p className="text-sm text-gray-800 mb-4">or</p>
                      <button
                        onClick={() => setReceiptUploaded(true)}
                        className="bg-[#FF0059] text-white py-2 px-4 rounded-md text-sm font-semibold"
                      >
                        Upload Receipt
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!receiptUploaded || submitting}
                  className={`${
                    !receiptUploaded || submitting
                      ? "bg-gray-400"
                      : "bg-[#FF0059]"
                  } text-white py-2 px-6 rounded-md text-sm font-semibold`}
                >
                  {submitting ? "Processing..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

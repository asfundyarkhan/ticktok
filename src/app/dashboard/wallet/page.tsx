"use client";

import { useState } from "react";
import Link from "next/link";

export default function WalletPage() {
  const [paymentAmount, setPaymentAmount] = useState("1000");

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
              className="pl-10 pr-4 py-2 rounded-full bg-gray-100 w-96 text-black"
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
          <div className="text-sm font-medium text-gray-700">Balance: $100</div>
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
            className="px-1 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            General
          </Link>
          <Link
            href="/dashboard/wallet"
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium"
          >
            Wallet
          </Link>
          <Link
            href="/dashboard/stock"
            className="px-1 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Buy stock
          </Link>
          <Link
            href="/dashboard/stock/inventory"
            className="px-1 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Inventory
          </Link>
        </div>

        {/* Total Balance */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-gray-700 uppercase mb-1">
            TOTAL BALANCE
          </h2>
          <div className="text-3xl font-semibold text-gray-900">$35,916.81</div>
        </div>

        {/* Deposit Funds */}
        <div className="mb-6">
          <h2 className="text-base font-medium text-gray-900">Deposit Funds</h2>
        </div>

        {/* Three-column deposit process */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">
                STEP 1: TRANSFER TO OUR ACCOUNT
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Bank Name:</span> [Bank Name]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Account Name:</span> [Full Name]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Account Number:</span> [Bank
                  Account Number]
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Transfer Amount:</span> [Minimum
                  $50]
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">
                STEP 2: ADD REFERENCE CODE
              </h3>
              <div className="flex items-start mb-2">
                <span className="text-amber-500 mr-2">⚠</span>
                <p className="text-sm text-gray-900">
                  In your bank&apos;s transfer reference/ message field, please
                  enter your unique user ID or username.
                </p>
              </div>
              <p className="text-sm text-gray-900 mb-4">
                This is how we identify your deposit.
              </p>

              <div className="mb-2">
                <p className="text-xs uppercase text-gray-500 font-medium">
                  EXAMPLE:
                </p>
              </div>
              <p className="text-sm text-gray-900">Seller789 or UserID#12345</p>
              <p className="text-sm text-gray-900">
                No reference = No credit update.
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="mb-6">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-4">
                STEP 3: SUBMIT PROOF
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-900 font-medium">
                  After transferring:
                </p>
                <ul className="list-disc ml-5 text-sm text-gray-900">
                  <li>Upload your receipt</li>
                  <li>
                    Wait for admin approval{" "}
                    <span className="text-xs text-gray-500">
                      (USUALLY WITHIN 24 HOURS)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-500 mb-2">
                  Payment Amount
                </label>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-2 border rounded-md mb-4 text-gray-900"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-2">
                  Upload Receipt
                </label>
                <div className="border-2 border-dashed border-gray-300 p-8 rounded-md text-center">
                  <p className="text-sm text-gray-500 mb-1">
                    Drag & Drop your receipt here,
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <button className="bg-[#FF0059] text-white py-2 px-4 rounded-md text-sm font-medium">
                    Upload Receipt
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-[#FF0059] text-white py-2 px-6 rounded-md text-sm font-medium">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

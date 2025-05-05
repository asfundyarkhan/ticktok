"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserBalance } from "../components/UserBalanceContext";

export default function ProfilePage() {
  const { balance } = useUserBalance();
  const [profileData, setProfileData] = useState({
    fullName: "Anika Visser",
    email: "anika.visser@devias.io",
    sellerId: "SEL001",
  });

  const recentActivity = [
    { date: "01/04/2025", activity: "Order: SHIRT-NIKE-001", quantity: 2 },
    { date: "01/04/2025", activity: "Order: SHIRT-NIKE-001", quantity: 10 },
  ];

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
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold"
          >
            General
          </Link>
          <Link
            href="/wallet"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
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

        {/* Basic Details */}
        <div className="bg-white p-6 rounded-md shadow-sm mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Basic details
          </h2>
          <div className="flex mb-4">
            <div className="mr-6">
              <div className="relative">
                <div className="w-14 h-14 bg-purple-100 rounded-full overflow-hidden flex items-center justify-center">
                  <Image
                    src="/images/placeholders/avatar.jpg"
                    alt="Profile"
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                </div>
                <button className="absolute -right-1 -bottom-1 bg-white text-xs px-2 py-1 rounded-md border text-[#FF0059] font-semibold">
                  Change
                </button>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm text-gray-800 font-medium mb-1">
                  Full Name
                </label>
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                  <button className="ml-2 px-4 py-1.5 text-sm bg-[#FF0059] text-white rounded-md font-semibold">
                    Save
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-800 font-medium mb-1">
                  Email Address *
                </label>
                <div className="flex justify-between items-center">
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white"
                  />
                  <button className="ml-2 px-4 py-1.5 text-sm text-gray-800 hover:bg-gray-100 rounded-md font-medium">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seller ID */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Your Seller ID
            </label>
            <div className="flex">
              <span className="p-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-800 font-medium">
                SEL001
              </span>
              <button className="px-4 py-2 bg-[#FF0059] border border-l-0 rounded-r-md text-sm text-white font-semibold">
                Copy ID
              </button>
            </div>
          </div>
        </div>

        {/* Total Balance */}
        <div className="bg-white p-6 rounded-md shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-800 uppercase mb-2">
            Total Balance
          </h2>
          <div className="text-3xl font-bold text-gray-900 mb-4">
            ${balance.toFixed(2)}
          </div>
          <Link
            href="/wallet"
            className="flex items-center text-sm text-[#FF0059] font-semibold"
          >
            Deposit funds
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-md shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Recent Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-xs text-gray-800 font-semibold uppercase">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-gray-800 font-semibold uppercase">
                    Activity
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-gray-800 font-semibold uppercase">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3 px-4 text-gray-900">{item.date}</td>
                    <td className="py-3 px-4 text-gray-900">{item.activity}</td>
                    <td className="py-3 px-4 text-gray-900">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-800">
              <div className="flex items-center font-medium">
                Rows per page:
                <select className="ml-2 p-1 border border-gray-300 rounded text-gray-900 bg-white">
                  <option>5</option>
                  <option>10</option>
                  <option>25</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 font-medium">
                <span>1-2 of 2</span>
                <button className="p-1" disabled>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button className="p-1" disabled>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4-4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

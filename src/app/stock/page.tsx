"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function StockPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const products = [
    {
      id: 1,
      name: "T-Shirt Nike",
      description: "100% cotton, unisex",
      price: "$300.00",
      image: "/images/placeholders/t-shirt.svg",
    },
    {
      id: 2,
      name: "Long Pants Nike",
      description: "100% cotton, unisex",
      price: "$500.00",
      image: "/images/placeholders/t-shirt.svg", // Using placeholder image
    },
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
          <div className="text-sm font-medium text-gray-700">Balance: $100</div>
          <div className="flex items-center space-x-2 text-sm">
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
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>

        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 mb-6">
          <Link
            href="/profile"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
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
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold"
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

        {/* Search stock */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search available stock"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 pl-10 border border-gray-300 rounded-md w-full text-gray-900 bg-white placeholder-gray-500"
            />
            <div className="absolute left-3 top-3.5 text-gray-600">
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

        {/* Table Header */}
        <div className="bg-gray-100 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-800 uppercase">
          <div className="col-span-2">Product Image</div>
          <div className="col-span-2">Product Name</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Prices</div>
          <div className="col-span-2">Units</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Products List */}
        {products.map((product) => (
          <div
            key={product.id}
            className="border-b p-4 grid grid-cols-12 gap-4 items-center bg-white"
          >
            <div className="col-span-2">
              <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
            </div>
            <div className="col-span-2 font-semibold text-gray-900">
              {product.name}
            </div>
            <div className="col-span-3 text-gray-800">
              {product.description}
            </div>
            <div className="col-span-2 font-semibold text-gray-900">
              {product.price}
            </div>
            <div className="col-span-2">
              {product.id === 1 ? (
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-300 bg-white p-2 pr-8 rounded-md text-gray-900">
                    <option>50pcs</option>
                    <option>100pcs</option>
                    <option>200pcs</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-300 bg-white p-2 pr-8 rounded-md text-gray-900">
                    <option>Choose unit</option>
                    <option>50pcs</option>
                    <option>100pcs</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-1">
              {product.id === 1 ? (
                <button className="py-2 px-6 bg-[#FF0059] text-white rounded-md text-sm font-semibold">
                  Buy
                </button>
              ) : (
                <button className="py-2 px-6 bg-gray-600 text-white rounded-md text-sm font-semibold">
                  Buy
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

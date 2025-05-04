"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);

  const inventoryProducts = [
    {
      id: 1,
      name: "T-Shirt Nike",
      description: "100% cotton, unisex",
      stock: "100pcs",
      productCode: "SHRT-NIKE-001",
      image: "/images/placeholders/t-shirt.svg",
    },
    {
      id: 2,
      name: "Long Pants Nike",
      description: "100% cotton, unisex",
      stock: "100pcs",
      productCode: "PNT-NIKE-001",
      image: "/images/placeholders/t-shirt.svg",
    },
    {
      id: 3,
      name: "Long Pants Nike",
      description: "100% cotton, unisex",
      stock: "0pcs",
      productCode: "PNT-NIKE-001",
      image: "/images/placeholders/t-shirt.svg",
    },
  ];

  const totalItems = inventoryProducts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentProducts = inventoryProducts.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with TikTok Shop and search */}
      <div className="py-4 px-6 border-b flex items-center justify-between">
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
          <button className="relative">
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
          </button>
          <div className="text-sm font-medium text-gray-700">Balance: $100</div>
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-700 font-medium">Your Name</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <Link
            href="/profile"
            className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            General
          </Link>
          <Link
            href="/wallet"
            className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Wallet
          </Link>
          <Link
            href="/stock"
            className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Buy stock
          </Link>
          <Link
            href="/stock/inventory"
            className="px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px]"
          >
            Inventory
          </Link>
        </div>

        {/* Search inventory */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search inventory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-gray-900 bg-white placeholder-gray-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-600">
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

        {/* Table */}
        <div className="mb-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-gray-700 uppercase text-xs font-semibold">
                <th className="py-3 text-left pl-2 pr-6">PRODUCT IMAGE</th>
                <th className="py-3 text-left px-6">PRODUCT NAME</th>
                <th className="py-3 text-left px-6">DESCRIPTION</th>
                <th className="py-3 text-left px-6">STOCK</th>
                <th className="py-3 text-left px-6">PRODUCT CODE</th>
                <th className="py-3 text-left px-6">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product.id} className="text-sm">
                  <td className="py-4 pl-2 pr-6">
                    <div className="w-16 h-16 bg-gray-200">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="py-4 px-6 text-gray-800">
                    {product.description}
                  </td>
                  <td className="py-4 px-6 text-gray-900">{product.stock}</td>
                  <td className="py-4 px-6 text-gray-900">
                    {product.productCode}
                  </td>
                  <td className="py-4 px-6">
                    {product.stock === "0pcs" ? (
                      <button className="px-4 py-1.5 bg-gray-400 text-white rounded-md text-sm font-medium">
                        Restock
                      </button>
                    ) : (
                      <button className="px-4 py-1.5 bg-[#FF0059] text-white rounded-md text-sm font-medium">
                        Sell
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="mr-2 text-gray-700">Rows per page:</span>
            <select
              className="border border-gray-300 rounded-md px-2 py-1 text-gray-900 bg-white"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={2}>2</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </div>
          <div className="text-gray-700">
            {startIndex + 1}-{endIndex} of {totalItems}
          </div>
          <div className="flex items-center">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`p-1 ${
                currentPage === 1
                  ? "text-gray-400"
                  : "text-gray-700 hover:bg-gray-100"
              } rounded-full`}
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`p-1 ${
                currentPage === totalPages
                  ? "text-gray-400"
                  : "text-gray-700 hover:bg-gray-100"
              } rounded-full`}
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

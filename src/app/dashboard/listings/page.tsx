"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUserBalance } from "../../components/UserBalanceContext";

interface StoreProduct {
  id: number;
  productCode: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  sellerName: string;
  rating: number;
  reviews: number;
}

export default function MyListingsPage() {
  const [myListings, setMyListings] = useState<StoreProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { balance } = useUserBalance();

  // Load seller's listings from localStorage
  useEffect(() => {
    const storeProducts = JSON.parse(
      localStorage.getItem("storeProducts") || "[]"
    );

    // Filter for only the current seller's products
    // In a real app, this would use actual authentication
    const currentSellerId = "current-user-id"; // This should match the ID used when creating listings
    const sellerProducts = storeProducts.filter(
      (product) => product.sellerId === currentSellerId
    );

    setMyListings(sellerProducts);
  }, []);

  // Filter products based on search query
  const filteredListings = myListings.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Pagination handlers
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

  // Remove a listing
  const handleRemoveListing = (productId: number) => {
    const updatedListings = myListings.filter(
      (product) => product.id !== productId
    );
    setMyListings(updatedListings);
    localStorage.setItem("storeProducts", JSON.stringify(updatedListings));
  };

  // Edit a listing (price or stock)
  const handleEditListing = (
    productId: number,
    newPrice: number,
    newStock: number
  ) => {
    const updatedListings = myListings.map((product) =>
      product.id === productId
        ? { ...product, price: newPrice, stock: newStock }
        : product
    );
    setMyListings(updatedListings);
    localStorage.setItem("storeProducts", JSON.stringify(updatedListings));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <p className="text-gray-600">
          Manage your product listings on TikTok Shop
        </p>
      </div>

      {/* Balance Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059] flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-gray-500">
            CURRENT BALANCE
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            ${balance.toFixed(2)}
          </p>
        </div>
        <Link
          href="/dashboard/stock/add"
          className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
        >
          Add New Product
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search your listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900"
          />
          <div className="absolute left-3 top-3 text-gray-400">
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

      {/* Listings Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {myListings.length > 0 ? (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentListings.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.productCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.stock > 10
                            ? "bg-green-100 text-green-800"
                            : product.stock > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-500">
                          {product.rating.toFixed(1)}
                        </div>
                        <div className="ml-1 text-yellow-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div className="ml-2 text-sm text-gray-500">
                          {product.reviews} reviews
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          const newPrice = parseFloat(
                            prompt(
                              "Enter new price:",
                              product.price.toString()
                            ) || product.price.toString()
                          );
                          const newStock = parseInt(
                            prompt(
                              "Enter new stock quantity:",
                              product.stock.toString()
                            ) || product.stock.toString()
                          );
                          handleEditListing(product.id, newPrice, newStock);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to remove this listing?"
                            )
                          ) {
                            handleRemoveListing(product.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-4">
                  Rows per page:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {endIndex} of {totalItems} results
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  } px-3 py-1 rounded-md`}
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  } px-3 py-1 rounded-md`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="text-gray-500 mb-4">
              You don't have any product listings yet
            </div>
            <Link
              href="/stock/inventory"
              className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
            >
              List Products for Sale
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUserBalance } from "../../components/UserBalanceContext";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import { StockService } from "../../../services/stockService";
import { StockListing } from "../../../types/marketplace";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";

export default function MyListingsPage() {
  const [myListings, setMyListings] = useState<StockListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);  const [editingListing, setEditingListing] = useState<string | null>(null);
  const { balance } = useUserBalance();
  const { user } = useAuth();
  // Subscribe to Firebase real-time listings updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = StockService.subscribeToSellerListings(
      user.uid,
      (listings) => {
        setMyListings(listings);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading listings:", error);
        toast.error("Failed to load listings");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user?.uid]);// Filter products based on search query
  const filteredListings = myListings.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentListings = filteredListings.slice(startIndex, endIndex);
  // Remove a listing using Firebase
  const handleRemoveListing = async (listingId: string) => {
    if (!user?.uid) {
      toast.error("Authentication required");
      return;
    }

    if (!confirm("Are you sure you want to remove this listing?")) {
      return;
    }

    try {
      const result = await StockService.deleteListing(listingId, user.uid);
      
      if (result.success) {
        toast.success("Listing removed successfully. Stock returned to inventory.");
      } else {
        toast.error(result.message || "Failed to remove listing");
      }
    } catch (error) {
      console.error("Error removing listing:", error);
      toast.error("Failed to remove listing. Please try again.");
    }  };

  // Edit a listing using Firebase
  const handleEditListing = async (
    listingId: string,
    newPrice: number,
    newQuantity: number
  ) => {
    if (!user?.uid) {
      toast.error("Authentication required");
      return;
    }

    if (newPrice <= 0 || newQuantity <= 0) {
      toast.error("Price and quantity must be greater than 0");
      return;
    }

    try {
      setEditingListing(listingId);
      
      const result = await StockService.updateListing(listingId, user.uid, {
        price: newPrice,
        quantity: newQuantity
      });

      if (result.success) {
        toast.success("Listing updated successfully");
      } else {
        toast.error(result.message || "Failed to update listing");
      }
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing. Please try again.");
    } finally {
      setEditingListing(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your listings...</p>
        </div>
      </div>
    );
  }

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
          <Link href="/cart" className="ml-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700 cursor-pointer hover:text-[#FF0059]"
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
          </Link>
          <div className="text-sm font-medium text-gray-700">
            Balance: ${balance.toFixed(2)}
          </div>
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
            className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            Inventory
          </Link>
          <Link
            href="/stock/listings"
            className="px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px]"
          >
            My Listings
          </Link>
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
            href="/stock/inventory"
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
                <thead className="bg-gray-50">                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listed Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentListings.map((listing) => (
                    <tr key={listing.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100">
                            <Image
                              src={listing.image || "/images/placeholders/t-shirt.svg"}
                              alt={listing.name}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {listing.name}
                            </div>                            <div className="text-sm text-gray-500">
                              {listing.productId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${listing.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.quantity > 10
                              ? "bg-green-100 text-green-800"
                              : listing.quantity > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {listing.quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-500">
                            Listed on {listing.createdAt?.toLocaleDateString() || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            const newPrice = parseFloat(
                              prompt(
                                "Enter new price:",
                                listing.price.toString()
                              ) || listing.price.toString()
                            );
                            const newQuantity = parseInt(
                              prompt(
                                "Enter new quantity:",
                                listing.quantity.toString()
                              ) || listing.quantity.toString()
                            );
                            handleEditListing(listing.id!, newPrice, newQuantity);
                          }}
                          disabled={editingListing === listing.id}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                        >
                          {editingListing === listing.id ? "Updating..." : "Edit"}
                        </button>
                        <button
                          onClick={() => handleRemoveListing(listing.id!)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>{" "}
              {/* Pagination */}
              <div className="px-6 py-3 bg-white border-t border-gray-200">
                <PaginationWithCustomRows
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(newRowsPerPage) => {
                    setRowsPerPage(newRowsPerPage);
                    setCurrentPage(1); // Reset to first page when changing rows per page
                  }}
                />
              </div>
            </>
          ) : (            <div className="py-20 text-center">
              <div className="text-gray-500 mb-4">
                You don&apos;t have any product listings yet
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
    </div>
  );
}

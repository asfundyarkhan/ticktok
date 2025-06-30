"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import { StockService } from "../../../services/stockService";
import { StockListing } from "../../../types/marketplace";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { getBestProductImage } from "../../utils/imageHelpers";

export default function MyListingsPage() {
  const [myListings, setMyListings] = useState<StockListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<string | null>(null);
  const { user, userProfile, loading: authLoading } = useAuth();

  // Check authentication and seller role
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login?redirect=/stock/listings";
      return;
    }

    if (!authLoading && userProfile && userProfile.role !== "seller") {
      toast.error("Only sellers can access product listings");
      if (userProfile.role === "admin" || userProfile.role === "superadmin") {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/store";
      }
      return;
    }
  }, [user, userProfile, authLoading]);

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

    return () => unsubscribe();
  }, [user?.uid]);
  // Filter listings based on search query
  const filteredListings = myListings.filter(
    (listing) =>
      listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.productId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentListings = filteredListings.slice(startIndex, endIndex);

  // Handle listing removal
  const handleRemoveListing = async (listingId: string) => {
    if (!user?.uid || !listingId) {
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
      toast.error("Failed to remove listing. Please try again.");    }
  };

  // Handle listing edit - seller can only update quantity, not price
  const handleEditListing = async (
    listingId: string,
    newQuantity: number
  ) => {
    if (!user?.uid || !listingId) {
      toast.error("Authentication required");
      return;
    }

    if (newQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    try {
      setEditingListing(listingId);
      
      // Only pass the quantity to update, not the price
      const result = await StockService.updateListing(listingId, user.uid, {
        quantity: newQuantity
      });

      if (result.success) {
        toast.success("Listing quantity updated successfully");
      } else {
        toast.error(result.message || "Failed to update listing quantity");
      }
    } catch (error) {
      console.error("Error updating listing quantity:", error);
      toast.error("Failed to update listing quantity. Please try again.");
    } finally {
      setEditingListing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your listings...</p>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-gray-50 sm:bg-white">
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6 text-gray-900">My Listings</h1>
        
        {/* Mobile-friendly tabs with horizontal scroll */}
        <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
          <Link href="/profile" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            General
          </Link>
          <Link href="/receipts-v2" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            Wallet
          </Link>
          <Link href="/stock" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            Buy stock
          </Link>
          <Link href="/stock/listings" className="px-3 sm:px-4 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-medium -mb-[2px] whitespace-nowrap text-sm sm:text-base">
            My Listings
          </Link>
          <Link href="/stock/pending" className="px-3 sm:px-4 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap text-sm sm:text-base">
            Pending Products
          </Link>        </div>        {/* Mobile-optimized Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF0059] focus:border-transparent text-base sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>        {/* Responsive Listings Layout */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {currentListings.length > 0 ? (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                            <div className="flex-shrink-0 h-10 w-10">
                              <Image
                                src={getBestProductImage(listing)}
                                alt={listing.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholders/product.svg';
                                }}
                                unoptimized
                                priority
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {listing.name}
                              </div>
                              <div className="text-sm text-gray-500">
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            listing.quantity > 10
                              ? "bg-green-100 text-green-800"
                              : listing.quantity > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {listing.quantity === 0 ? "Out of Stock" : `${listing.quantity} units`}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Listed on {listing.createdAt?.toLocaleDateString() || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {listing.quantity === 0 ? (
                            <button
                              onClick={() => {
                                localStorage.setItem("productToRestock", listing.productId);
                                window.location.href = "/stock";
                              }}
                              className="px-3 py-1 bg-gray-400 text-white rounded-md text-sm font-medium hover:bg-gray-500"
                            >
                              Restock Needed
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    if (!user?.uid) {
                                      toast.error("Authentication required");
                                      return;
                                    }
                                    const inventoryItems = await StockService.getInventoryItems(user.uid);
                                    const inventoryItem = inventoryItems.find(item => item.productId === listing.productId);
                                    const maxQuantity = listing.quantity + (inventoryItem?.stock || 0);
                                    
                                    if (maxQuantity <= 0) {
                                      toast.error("No inventory available for this product");
                                      return;
                                    }
                                    
                                    const newQuantity = parseInt(
                                      prompt(`Enter new quantity (max available: ${maxQuantity}):`, 
                                      listing.quantity.toString()) || listing.quantity.toString()
                                    );
                                    
                                    if (newQuantity > maxQuantity) {
                                      toast.error(`Quantity cannot exceed ${maxQuantity}`);
                                      return;
                                    }
                                    
                                    handleEditListing(listing.id!, newQuantity);
                                  } catch (error) {
                                    console.error("Error checking inventory:", error);
                                    toast.error("Failed to check inventory availability");
                                  }
                                }}
                                disabled={editingListing === listing.id}
                                className="text-indigo-600 hover:text-indigo-900 mr-4 disabled:opacity-50"
                              >
                                {editingListing === listing.id ? "Updating..." : "Edit Quantity"}
                              </button>
                              <button
                                onClick={() => handleRemoveListing(listing.id!)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View - Visible on mobile and tablet */}
              <div className="lg:hidden">
                <div className="divide-y divide-gray-200">
                  {currentListings.map((listing) => (
                    <div key={listing.id} className="p-4 sm:p-6">
                      {/* Product Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          <Image
                            src={getBestProductImage(listing)}
                            alt={listing.name}
                            width={60}
                            height={60}
                            className="object-cover w-15 h-15 sm:w-16 sm:h-16 rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholders/product.svg';
                            }}
                            unoptimized
                            priority
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                            {listing.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {listing.productId}
                          </p>
                          <p className="text-lg sm:text-xl font-semibold text-gray-900 mt-1">
                            ${listing.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Status and Stock */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            listing.quantity > 10
                              ? "bg-green-100 text-green-800"
                              : listing.quantity > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {listing.quantity === 0 ? "Out of Stock" : `${listing.quantity} units`}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Listed {listing.createdAt?.toLocaleDateString() || "N/A"}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {listing.quantity === 0 ? (
                          <button
                            onClick={() => {
                              localStorage.setItem("productToRestock", listing.productId);
                              window.location.href = "/stock";
                            }}
                            className="w-full sm:flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg font-medium hover:bg-gray-500 text-center"
                          >
                            Restock Needed
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  if (!user?.uid) {
                                    toast.error("Authentication required");
                                    return;
                                  }
                                  const inventoryItems = await StockService.getInventoryItems(user.uid);
                                  const inventoryItem = inventoryItems.find(item => item.productId === listing.productId);
                                  const maxQuantity = listing.quantity + (inventoryItem?.stock || 0);
                                  
                                  if (maxQuantity <= 0) {
                                    toast.error("No inventory available for this product");
                                    return;
                                  }
                                  
                                  const newQuantity = parseInt(
                                    prompt(`Enter new quantity (max available: ${maxQuantity}):`, 
                                    listing.quantity.toString()) || listing.quantity.toString()
                                  );
                                  
                                  if (newQuantity > maxQuantity) {
                                    toast.error(`Quantity cannot exceed ${maxQuantity}`);
                                    return;
                                  }
                                  
                                  handleEditListing(listing.id!, newQuantity);
                                } catch (error) {
                                  console.error("Error checking inventory:", error);
                                  toast.error("Failed to check inventory availability");
                                }
                              }}
                              disabled={editingListing === listing.id}
                              className="w-full sm:flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 text-center"
                            >
                              {editingListing === listing.id ? "Updating..." : "Edit Quantity"}
                            </button>
                            <button
                              onClick={() => handleRemoveListing(listing.id!)}
                              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-center"
                            >
                              Remove Listing
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>              {/* Mobile-friendly Pagination */}
              <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-200">
                <PaginationWithCustomRows
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(newRowsPerPage) => {
                    setRowsPerPage(newRowsPerPage);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="py-12 sm:py-20 text-center px-4">
              <div className="text-gray-500 mb-4 text-base sm:text-lg">
                You don&apos;t have any product listings yet
              </div>
              <Link
                href="/stock/inventory"
                className="inline-block px-6 py-3 bg-[#FF0059] text-white rounded-lg text-base font-medium hover:bg-[#E6004F] transition-colors"
              >
                Go to Inventory to List Products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

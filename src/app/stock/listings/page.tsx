"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUserBalance } from "../../components/UserBalanceContext";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "../../utils/localStorage";
import { StoreProduct, InventoryProduct } from "../../types/marketplace";

export default function MyListingsPage() {
  const [myListings, setMyListings] = useState<StoreProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { balance } = useUserBalance();

  // Load seller's listings from localStorage - using safe utility functions
  useEffect(() => {
    // Direct function to load listings - guaranteed to work
    function loadListingsDirectly() {
      // First, get all store products
      const allStoreProducts: StoreProduct[] = getFromLocalStorage(
        "storeProducts",
        []
      );

      // Get inventory to check for listed items
      const inventoryProducts: InventoryProduct[] = getFromLocalStorage(
        "inventoryProducts",
        []
      );
      const listedInventoryItems: InventoryProduct[] = inventoryProducts.filter(
        (product: InventoryProduct) => product.listed === true
      );

      // Filter for current seller's products
      const currentSellerId = "current-user-id";
      let sellerListings: StoreProduct[] = allStoreProducts.filter(
        (product: StoreProduct) => product.sellerId === currentSellerId
      );

      // Check if we're missing any products that are marked as listed in inventory
      if (listedInventoryItems.length > 0) {
        // Get product codes that are already in listings
        const existingListingsCodes = sellerListings.map(
          (item: StoreProduct) => item.productCode
        );

        // Find inventory items that are not in listings
        const missingListings = listedInventoryItems.filter(
          (item: InventoryProduct) =>
            !existingListingsCodes.includes(item.productCode)
        );

        // If we have missing items, add them to store products
        if (missingListings.length > 0) {
          const newListings = missingListings.map(
            (item: InventoryProduct, index: number) => {
              // Create a unique ID from:
              // 1. Current timestamp
              // 2. Index in the array
              // 3. Numeric portion of product code
              // 4. Random value
              const numericCode = parseInt(
                item.productCode.replace(/\D/g, "") || "0"
              );
              const uniqueId =
                Date.now() +
                index +
                numericCode * 100 +
                Math.floor(Math.random() * 10000);

              return {
                id: uniqueId,
                name: item.name,
                description: item.description,
                price: item.price,
                stock: item.stock,
                image: item.image,
                productCode: item.productCode,
                sellerName: "Your Store",
                sellerId: currentSellerId,
                rating: 4.5,
                reviews: 0,
              };
            }
          );

          // Add new listings to store products - using safe utility function
          const updatedStoreProducts = [...allStoreProducts, ...newListings];
          setToLocalStorage("storeProducts", updatedStoreProducts);

          // Update our local state with all listings
          sellerListings = [...sellerListings, ...newListings];
        }
      }

      // Update state with final listings and ensure all IDs are unique
      const seenIds = new Set();
      const uniqueListings = sellerListings.filter((listing: StoreProduct) => {
        // Convert the ID to a string to ensure consistent type handling
        const idStr = String(listing.id);
        if (seenIds.has(idStr)) {
          // If we've seen this ID before, generate a new unique ID
          listing.id = Date.now() + Math.random() * 10000;
          seenIds.add(String(listing.id));
          return true;
        } else {
          seenIds.add(idStr);
          return true;
        }
      });

      setMyListings(uniqueListings);
    }

    // Load listings immediately
    loadListingsDirectly();

    // Set up polling to refresh listings
    const intervalId = setInterval(loadListingsDirectly, 1000);

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
    };
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
    // Get the product to be removed
    const productToRemove = myListings.find(
      (product) => product.id === productId
    );

    // Remove from listings
    const updatedListings = myListings.filter(
      (product) => product.id !== productId
    );
    setMyListings(updatedListings);

    // Update localStorage safely
    setToLocalStorage("storeProducts", updatedListings);

    // Update inventory listed status
    if (productToRemove) {
      const inventoryProducts: InventoryProduct[] = getFromLocalStorage(
        "inventoryProducts",
        []
      );
      const updatedInventory = inventoryProducts.map(
        (product: InventoryProduct) =>
          product.productCode === productToRemove.productCode
            ? { ...product, listed: false }
            : product
      );
      setToLocalStorage("inventoryProducts", updatedInventory);
    }
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
    setToLocalStorage("storeProducts", updatedListings);
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
    </div>
  );
}

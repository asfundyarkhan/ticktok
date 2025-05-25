// This script will update the necessary files for the TikTokShop backend changes
const fs = require("fs");
const path = require("path");

// Path to inventory page
const inventoryPagePath = path.join(
  __dirname,
  "src",
  "app",
  "stock",
  "inventory",
  "page.tsx"
);
const listingsPagePath = path.join(
  __dirname,
  "src",
  "app",
  "stock",
  "listings",
  "page.tsx"
);

// Inventory page content
const inventoryPageContent = `"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserBalance } from "../../components/UserBalanceContext";
import { useAuth } from "../../../context/AuthContext";
import { InventoryService, InventoryItem } from "../../../services/inventoryService";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import { toast } from "react-hot-toast";

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, addToBalance } = useUserBalance();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);

  // Load inventory items from Firebase
  useEffect(() => {
    const fetchInventoryItems = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const items = await InventoryService.getSellerInventory(user.uid);
        setInventoryItems(items);
      } catch (error) {
        console.error("Error fetching inventory:", error);
        toast.error("Failed to load inventory items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryItems();
  }, [user]);

  // Filter products based on search query
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const validRowsPerPage = isNaN(rowsPerPage) || rowsPerPage <= 0 ? 5 : rowsPerPage;
  const totalPages = Math.ceil(totalItems / validRowsPerPage);
  const startIndex = (currentPage - 1) * validRowsPerPage;
  const endIndex = Math.min(startIndex + validRowsPerPage, totalItems);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Open sell modal for a product
  const openSellModal = (item: InventoryItem) => {
    setCurrentItem(item);
    setSellQuantity(Math.min(10, item.stock));
    setSellPrice(item.price);
    setShowSellModal(true);
  };

  // Handle listing a product for sale
  const handleSellProduct = async () => {
    if (!currentItem || sellQuantity <= 0 || !user) {
      toast.error("Invalid item or quantity");
      return;
    }

    try {
      // Update the listing status in Firebase
      await InventoryService.updateListingStatus(currentItem.id!, true, sellPrice);
      
      // Calculate the listing fee (10% of total value)
      const listingValue = sellPrice * sellQuantity;
      const listingFee = listingValue * 0.1;
      
      // Update balance - earn listing fee as income (simulating platform fee)
      await addToBalance(listingFee);
      
      // Update local state
      setInventoryItems((prevItems) =>
        prevItems.map((item) =>
          item.id === currentItem.id
            ? { ...item, listed: true, price: sellPrice }
            : item
        )
      );
      
      setShowSellModal(false);
      
      // Show success notification
      toast.success(\`\${currentItem.name} listed for sale! Earned $\${listingFee.toFixed(2)} in listing fees.\`);
      
      // Redirect to listings page after short delay
      setTimeout(() => {
        router.push("/stock/listings");
      }, 1500);
    } catch (error) {
      console.error("Error listing item:", error);
      toast.error("Failed to list item for sale");
    }
  };

  // Restock product
  const handleRestock = (productCode: string) => {
    // Save the product code in localStorage to highlight it on the Buy Stock page
    if (productCode && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("productToRestock", productCode);
      } catch (error) {
        console.error("Error setting productToRestock to localStorage:", error);
      }
    }

    // Redirect to the buy stock page
    router.push("/stock");
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
          <Link href="/cart" className="relative">
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
            <span className="text-gray-700 font-medium">{user?.displayName || 'User'}</span>
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
          <Link
            href="/stock/listings"
            className="px-4 py-2 text-gray-800 hover:text-gray-900 font-medium"
          >
            My Listings
          </Link>
        </div>
        {/* Current Balance Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                CURRENT BALANCE
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                ${balance.toFixed(2)}
              </p>
            </div>
            <Link
              href="/wallet"
              className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
            >
              Add Funds
            </Link>
          </div>
        </div>
        {/* Search inventory */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search inventory"
              value={searchQuery}
              onChange={handleSearchChange}
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
        
        {/* Loading indicator */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0059]"></div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="mb-4">
              {filteredItems.length > 0 ? (
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
                    {currentItems.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-4 pl-2 pr-6">
                          <div className="w-16 h-16 bg-gray-200">
                            <Image
                              src={item.image || "/images/placeholders/t-shirt.svg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {item.name}
                          {item.listed && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Listed
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-800">
                          {item.description}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          <div className="flex items-center">
                            <span className="px-4 py-1 bg-gray-100 rounded-md">
                              {item.stock}
                            </span>
                            <span className="ml-2">pcs</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          {item.productCode}
                        </td>
                        <td className="py-4 px-6">
                          {item.stock === 0 ? (
                            <button
                              onClick={() => handleRestock(item.productCode)}
                              className="px-4 py-1.5 bg-gray-400 text-white rounded-md text-sm font-medium"
                            >
                              Restock
                            </button>
                          ) : item.listed ? (
                            <button
                              disabled
                              className="px-4 py-1.5 bg-gray-300 text-gray-600 rounded-md text-sm font-medium cursor-not-allowed"
                            >
                              Already Listed
                            </button>
                          ) : (
                            <button
                              onClick={() => openSellModal(item)}
                              className="px-4 py-1.5 bg-[#FF0059] text-white rounded-md text-sm font-medium"
                            >
                              List for Sale
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-white border rounded">
                  {searchQuery ? 
                    "No products found matching your search." : 
                    "Your inventory is empty. Purchase stock from the Buy Stock page."}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="mt-4">
                <PaginationWithCustomRows
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page: number) => setCurrentPage(page)}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(newRowsPerPage: number) => {
                    setRowsPerPage(newRowsPerPage);
                    setCurrentPage(1); // Reset to first page when changing rows per page
                  }}
                />
              </div>
            )}
          </>
        )}
        
        {/* Sell Modal */}
        {showSellModal && currentItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">List Product for Sale</h2>

              <div className="flex items-start mb-4">
                <div className="mr-4">
                  <div className="w-16 h-16 bg-gray-200">
                    <Image
                      src={currentItem.image || "/images/placeholders/t-shirt.svg"}
                      alt={currentItem.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">{currentItem.name}</h3>
                  <p className="text-sm text-gray-600">
                    {currentItem.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available: {currentItem.stock} pcs
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to List
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      setSellQuantity(Math.max(1, sellQuantity - 1))
                    }
                    className="px-3 py-1 bg-gray-200 rounded-l-md"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={sellQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (
                        !isNaN(val) &&
                        val >= 1 &&
                        val <= currentItem.stock
                      ) {
                        setSellQuantity(val);
                      }
                    }}
                    className="px-3 py-1 border-t border-b text-center w-20"
                    min={1}
                    max={currentItem.stock}
                  />
                  <button
                    onClick={() =>
                      setSellQuantity(
                        Math.min(currentItem.stock, sellQuantity + 1)
                      )
                    }
                    className="px-3 py-1 bg-gray-200 rounded-r-md"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit ($)
                </label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      setSellPrice(val);
                    }
                  }}
                  className="px-3 py-2 border rounded-md w-full"
                  min={0.01}
                  step={0.01}
                />
              </div>

              <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                <p className="text-sm font-medium text-gray-700">
                  Listing Summary:
                </p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">
                    \${(sellPrice * sellQuantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-600">Platform Fee (10%):</span>
                  <span className="font-medium text-green-600">
                    +\${(sellPrice * sellQuantity * 0.1).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowSellModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSellProduct}
                  className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
                >
                  List for Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;

// Listings page content
const listingsPageContent = `"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useUserBalance } from "../../components/UserBalanceContext";
import { InventoryService, InventoryItem } from "../../../services/inventoryService";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import { toast } from "react-hot-toast";

export default function MyListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance } = useUserBalance();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [listedItems, setListedItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load listed items from Firebase
  useEffect(() => {
    const fetchListedItems = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const items = await InventoryService.getListedItems(user.uid);
        setListedItems(items);
      } catch (error) {
        console.error("Error fetching listed items:", error);
        toast.error("Failed to load listed items");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListedItems();
  }, [user]);

  // Filter products based on search query
  const filteredItems = listedItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredItems.length;
  const validRowsPerPage = isNaN(rowsPerPage) || rowsPerPage <= 0 ? 5 : rowsPerPage;
  const totalPages = Math.ceil(totalItems / validRowsPerPage);
  const startIndex = (currentPage - 1) * validRowsPerPage;
  const endIndex = Math.min(startIndex + validRowsPerPage, totalItems);
  const currentItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  
  // Unlist a product
  const handleUnlistProduct = async (itemId: string) => {
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }
    
    try {
      // Update the listing status in Firebase
      await InventoryService.updateListingStatus(itemId, false);
      
      // Update local state
      setListedItems(prevItems => prevItems.filter(item => item.id !== itemId));
      
      toast.success("Item unlisted successfully");
    } catch (error) {
      console.error("Error unlisting item:", error);
      toast.error("Failed to unlist item");
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
          <Link href="/cart" className="relative">
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
            <span className="text-gray-700 font-medium">{user?.displayName || 'User'}</span>
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
        
        {/* Current Balance Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-gray-500">
                CURRENT BALANCE
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                ${balance.toFixed(2)}
              </p>
            </div>
            <Link
              href="/wallet"
              className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
            >
              Add Funds
            </Link>
          </div>
        </div>
        
        {/* Search listings */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search your listings"
              value={searchQuery}
              onChange={handleSearchChange}
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
          <Link
            href="/stock/inventory"
            className="ml-4 px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
          >
            Add New Listing
          </Link>
        </div>
        
        {/* Loading indicator */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0059]"></div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="mb-4">
              {filteredItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-gray-700 uppercase text-xs font-semibold">
                      <th className="py-3 text-left pl-2 pr-6">PRODUCT IMAGE</th>
                      <th className="py-3 text-left px-6">PRODUCT NAME</th>
                      <th className="py-3 text-left px-6">DESCRIPTION</th>
                      <th className="py-3 text-left px-6">STOCK</th>
                      <th className="py-3 text-left px-6">PRICE</th>
                      <th className="py-3 text-left px-6">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-4 pl-2 pr-6">
                          <div className="w-16 h-16 bg-gray-200">
                            <Image
                              src={item.image || "/images/placeholders/t-shirt.svg"}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 text-gray-800">
                          {item.description}
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          <div className="flex items-center">
                            <span className="px-4 py-1 bg-gray-100 rounded-md">
                              {item.stock}
                            </span>
                            <span className="ml-2">pcs</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-900">
                          \${item.price.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleUnlistProduct(item.id!)}
                            className="px-4 py-1.5 border border-[#FF0059] text-[#FF0059] rounded-md text-sm font-medium"
                          >
                            Unlist
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-white border rounded">
                  {searchQuery ? 
                    "No listings found matching your search." : 
                    "You don't have any products listed for sale. List items from your inventory."}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {filteredItems.length > 0 && (
              <div className="mt-4">
                <PaginationWithCustomRows
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page: number) => setCurrentPage(page)}
                  totalItems={totalItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(newRowsPerPage: number) => {
                    setRowsPerPage(newRowsPerPage);
                    setCurrentPage(1); // Reset to first page when changing rows per page
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}`;

// Write the files
try {
  // Ensure directories exist
  fs.mkdirSync(path.dirname(inventoryPagePath), { recursive: true });
  fs.mkdirSync(path.dirname(listingsPagePath), { recursive: true });

  // Write the files
  fs.writeFileSync(inventoryPagePath, inventoryPageContent);
  fs.writeFileSync(listingsPagePath, listingsPageContent);

  console.log("Successfully updated the following files:");
  console.log("- " + inventoryPagePath);
  console.log("- " + listingsPagePath);
} catch (error) {
  console.error("Error updating files:", error);
}

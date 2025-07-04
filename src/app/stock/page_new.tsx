"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUserBalance } from "../components/UserBalanceContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { StockService } from "../../services/stockService";
import { StockItem } from "../../types/marketplace";
import QuantityCounter from "../components/QuantityCounter";

export default function StockPage() {
  const { balance } = useUserBalance();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminProducts, setAdminProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<string, number>
  >({});
  const [highlightedProductCode, setHighlightedProductCode] = useState<
    string | null
  >(null);

  useEffect(() => {
    // Subscribe to real-time admin stock updates
    const unsubscribe = StockService.subscribeToAdminStock((stockItems) => {
      setAdminProducts(stockItems);
      setLoading(false);
      
      // Initialize quantities
      const initialQuantities: Record<string, number> = {};
      stockItems.forEach((item) => {
        initialQuantities[item.productId] = 0;
      });
      setSelectedQuantities(initialQuantities);
    });

    // Check if there's a product to highlight (coming from restock button)
    const productToRestock = localStorage.getItem("productToRestock");
    if (productToRestock) {
      setHighlightedProductCode(productToRestock);
      localStorage.removeItem("productToRestock");
    }

    return () => unsubscribe();
  }, []);

  // Filter products based on search query
  const filteredProducts = adminProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);
  
  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedQuantities({
      ...selectedQuantities,
      [productId]: quantity,
    });
  };

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
  const handleBuyStock = async (productId: string) => {
    const product = adminProducts.find((p) => p.productId === productId);
    const quantity = selectedQuantities[productId];

    if (!product || !quantity || quantity === 0) {
      toast.error("Please select a quantity greater than 0");
      return;
    }

    const totalPrice = product.price * quantity;    // Check if user has enough balance but DON'T deduct it yet - let the transaction handle it
    if (balance < totalPrice) {
      toast.error("Insufficient balance. Please add funds to your wallet.");
      return;
    }
    
    try {
      if (!user || !user.uid) {
        toast.error("You must be logged in to purchase stock");
        return;
      }
      
      // Use Firebase transaction for stock purchase with user's actual ID
      await StockService.processStockPurchase(user.uid, productId.toString(), quantity);
      
      // Reset quantity
      handleQuantityChange(productId, 0);

      // Show success notification and redirect to inventory
      toast.success(
        `Added ${quantity} units of ${product.name} to your inventory!`
      );

      // Use setTimeout to wait for toast to appear before redirecting
      setTimeout(() => {
        window.location.href = "/stock/inventory";
      }, 1500);
    } catch (error) {
      console.error("Error purchasing stock:", error);
      toast.error("Failed to purchase stock. Please try again.");
    }
  };

  useEffect(() => {
    // Highlight row if needed
    if (highlightedProductCode && typeof window !== "undefined") {
      const element = document.getElementById(`product-${highlightedProductCode}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("bg-yellow-50");

        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.classList.remove("bg-yellow-50");
        }, 3000);
      }
    }
  }, [highlightedProductCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF0059]"></div>
          <p className="mt-4 text-gray-600">Loading available stock...</p>
        </div>
      </div>
    );
  }

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
          <Link href="/cart">
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
          <Link
            href="/stock/listings"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium"
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
        </div>        {/* Table Header */}
        <div className="bg-gray-100 p-4 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-800 uppercase">
          <div className="col-span-2">Product Image</div>
          <div className="col-span-2">Product Name</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Prices</div>
          <div className="col-span-1">Units</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Products List */}
        {filteredProducts.length > 0 ? (
          <>
            {currentProducts.map((product) => (              <div
                key={product.productId}
                id={`product-${product.productCode}`}
                className="border-b p-4 grid grid-cols-12 gap-4 items-center bg-white transition-all duration-300"
              >
                {/* Product Image */}
                <div className="col-span-2">
                  <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-lg overflow-hidden">
                    <Image
                      src={product.mainImage || product.images?.[0] || "/images/placeholders/t-shirt.svg"}
                      alt={product.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                
                {/* Product Name */}
                <div className="col-span-2 font-semibold text-gray-900">
                  {product.name}
                </div>
                
                {/* Description */}
                <div className="col-span-2 text-gray-800 text-sm">
                  {product.description}
                </div>
                
                {/* Category */}
                <div className="col-span-2 text-gray-600 text-sm">
                  {product.category || 'General'}
                </div>
                
                {/* Prices */}
                <div className="col-span-2 font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </div>
                
                {/* Units */}
                <div className="col-span-1">
                  {product.stock > 0 ? (
                    <>
                      <QuantityCounter
                        quantity={selectedQuantities[product.productId] || 0}
                        onQuantityChange={(quantity) => handleQuantityChange(product.productId, quantity)}
                        min={1}
                        max={product.stock}
                        size="md"
                        className="w-full"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Max: {product.stock} units available
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-sm font-medium text-red-600 mb-1">
                        Out of Stock
                      </div>
                      <div className="text-xs text-gray-500">
                        0 units available
                      </div>
                    </div>
                  )}                </div>
                
                {/* Actions */}
                <div className="col-span-1">
                  {product.stock > 0 ? (
                    <button
                      onClick={() => handleBuyStock(product.productId)}
                      disabled={!selectedQuantities[product.productId] || selectedQuantities[product.productId] === 0}
                      className={`py-2 px-3 text-white rounded-md text-xs font-semibold flex items-center justify-center transition-all duration-200 w-full ${
                        selectedQuantities[product.productId] && selectedQuantities[product.productId] > 0
                          ? "bg-[#FF0059] hover:bg-[#E0004D]"
                          : "bg-gray-400"
                      }`}
                    >
                      <span>Buy</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="py-2 px-3 text-gray-500 bg-gray-200 rounded-md text-xs font-semibold flex items-center justify-center cursor-not-allowed w-full"
                    >
                      <span>Restock</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination UI */}
            <div className="flex items-center justify-between bg-white p-4 mt-4">
              <div className="flex items-center">
                <span className="mr-2 text-gray-700">Rows per page:</span>
                <div className="relative inline-block">
                  <select
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-gray-900 bg-white hover:border-[#FF0059] focus:outline-none focus:ring-1 focus:ring-[#FF0059] focus:border-[#FF0059] transition-colors min-w-[65px] appearance-none pr-8"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="h-4 w-4 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
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
          <div className="p-6 text-center text-gray-500 bg-white border-b">
            {loading ? "Loading available stock..." : "No products found matching your search."}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { PendingDepositService } from "../../services/pendingDepositService";
import { StockService } from "../../services/stockService";
import { StockItem } from "../../types/marketplace";
import QuantityCounter from "../components/QuantityCounter";

export default function StockPage() {
  const [walletSummary, setWalletSummary] = useState({
    availableBalance: 0,
    totalPendingDeposits: 0,
    withdrawableAmount: 0,
    totalProfit: 0,
  });
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
  // Filter products based on search query and category
  const filteredProducts = adminProducts.filter(
    (product) => {
      // Category filter
      const matchesCategory = selectedCategory === "all" || 
        product.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      // Search filter
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    }
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
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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

    try {
      if (!user || !user.uid) {
        toast.error("You must be logged in to list stock");
        return;
      }
      
      // Calculate 30% markup for the listing price
      const markupPercentage = 30;
      const listingPrice = product.price * (1 + markupPercentage / 100);
      const originalCost = product.price * quantity;
      
      // No balance check - sellers can list without funds
      // Create listing directly and track pending deposit
      
      try {
        // Validate that we have the required data
        if (!product.id) {
          toast.error("Product ID is missing. Please refresh the page and try again.");
          return;
        }

        // Create listing from admin stock without upfront payment
        const listingResult = await StockService.createListingFromAdminStock(
          user.uid,
          product.id, // Use the document ID, not productId
          quantity,
          listingPrice
        );

        if (listingResult.success && listingResult.listingId && listingResult.productId) {
          console.log(`Listing created successfully. ProductId: ${listingResult.productId}, ListingId: ${listingResult.listingId}`);
          console.log(`Original product data:`, product);
          
          // Create pending deposit entry
          const depositResult = await PendingDepositService.createPendingDeposit(
            user.uid,
            listingResult.productId,
            product.name,
            listingResult.listingId,
            quantity,
            product.price, // Original cost per unit
            listingPrice, // Listing price with markup
            product.mainImage || (product.images && product.images[0]) || "", // Product image
            product.images || (product.mainImage ? [product.mainImage] : []) // Product images array
          );

          if (depositResult.success) {
            console.log(`Pending deposit created successfully with ID: ${depositResult.depositId}`);
            toast.success(
              `Listed ${quantity} units of ${product.name} for sale at $${listingPrice.toFixed(2)} each (${markupPercentage}% markup)! You'll need to deposit $${originalCost.toFixed(2)} when this product sells.`
            );
          } else {
            console.error("Failed to create pending deposit:", depositResult.message);
            toast.success(
              `Listed ${quantity} units of ${product.name} for sale at $${listingPrice.toFixed(2)} each, but deposit tracking may not work properly.`
            );
          }
        } else {
          toast.error(listingResult.message || "Failed to create listing");
          return;
        }
        
        // Reset quantity and redirect to listings
        handleQuantityChange(productId, 0);
        setTimeout(() => {
          window.location.href = "/stock/listings";
        }, 2000);
        
      } catch (error) {
        console.error("Error creating listing:", error);
        toast.error("Failed to create listing. Please try again.");
      }
      
    } catch (error) {
      console.error("Error in stock listing flow:", error);
      const errorMessage = error instanceof Error 
        ? `Error: ${error.message}`
        : "An error occurred. Please try again.";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    const loadWalletSummary = async () => {
      if (user?.uid) {
        try {
          const summary = await PendingDepositService.getSellerWalletSummary(user.uid);
          setWalletSummary(summary);
        } catch (error) {
          console.error("Error loading wallet summary:", error);
        }
      }
    };

    loadWalletSummary();
  }, [user?.uid]);

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

      <div className="p-6">
        <h1 className="text-xl font-medium mb-6 text-gray-900">Account</h1>        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:space-x-8 border-b border-gray-200 mb-6 overflow-x-auto">
          <Link
            href="/profile"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            General
          </Link>
          <Link
            href="/receipts-v2"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Receipts
          </Link>
          <Link
            href="/stock"
            className="px-1 py-2 text-[#FF0059] border-b-2 border-[#FF0059] font-semibold whitespace-nowrap"
          >
            Product Pool
          </Link>
          <Link
            href="/stock/listings"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            My Listings
          </Link>
          <Link
            href="/stock/pending"
            className="px-1 py-2 text-gray-800 hover:text-gray-900 font-medium whitespace-nowrap"
          >
            Orders
          </Link>
        </div>

        {/* Enhanced Wallet Summary Card */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-[#FF0059]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">
                  WALLET SUMMARY
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ${walletSummary.availableBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">Available Balance</p>
              </div>
              <Link
                href="/receipts-v2"
                className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium"
              >
                Add Funds
              </Link>
            </div>
            
            {/* Additional wallet info */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Pending Deposits</p>
                <p className="text-sm font-semibold text-orange-600">
                  ${walletSummary.totalPendingDeposits.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Profit</p>
                <p className="text-sm font-semibold text-yellow-600">
                  ${walletSummary.totalProfit.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Withdrawable</p>
                <p className="text-sm font-semibold text-green-600">
                  ${walletSummary.withdrawableAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {(walletSummary.totalPendingDeposits > 0 || walletSummary.totalProfit > 0) && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                <p className="text-xs text-orange-700">
                  ⚠️ {walletSummary.totalPendingDeposits > 0 && "You have pending deposits required."} 
                  {walletSummary.totalProfit > 0 && " Profits from sales will be added to your wallet after you pay the required deposits."}
                  {walletSummary.totalPendingDeposits > 0 && " Funds cannot be withdrawn until deposits are paid."}
                </p>
              </div>
            )}
          </div>
        </div>        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
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

          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Filter by category:
            </label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none border border-gray-300 bg-white p-2 pr-8 rounded-md text-gray-900 w-full sm:min-w-[200px]"
              ><option value="all">All Categories</option>
                <option value="clothing">Clothing</option>
                <option value="electronics">Electronics</option>
                <option value="home">Home & Kitchen</option>
                <option value="beauty">Beauty</option>
                <option value="toys">Toys & Games</option>
                <option value="books">Books</option>
                <option value="accessories">Accessories</option>
                <option value="sports">Sports</option>
                <option value="liquor">Liquor</option>
                <option value="gym">Gym</option>
                <option value="sex">Sex</option>
                <option value="makeup">Makeup</option>
                <option value="luxury">Luxury</option>
                <option value="general">General</option>
                <option value="other">Other</option>
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
          </div>
        </div>        {/* Filter Summary */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm text-gray-600">
              Showing {totalItems} of {adminProducts.length} products
            </span>
            {(selectedCategory !== "all" || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Filters:</span>
                {selectedCategory !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs capitalize">
                    {selectedCategory}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Search: &ldquo;{searchQuery}&rdquo;
                  </span>
                )}
              </div>
            )}
          </div>
          {(selectedCategory !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline self-start sm:self-auto"
            >
              Clear all filters
            </button>
          )}
        </div>{/* Table Header - Desktop Only */}
        <div className="hidden lg:grid grid-cols-12 gap-4 items-center font-semibold text-gray-700 bg-gray-100 p-4 rounded-lg mb-4">
          <div className="col-span-2 justify-center">Product Image</div>
          <div className="col-span-2">Product Name</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-1">Category</div>
          <div className="col-span-2">Prices</div>
          <div className="col-span-2">Units</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Products List */}
        {filteredProducts.length > 0 ? (
          <>
            {currentProducts.map((product) => (              <div
                key={product.productId}
                id={`product-${product.productCode}`}
                className="border-b p-4 bg-white transition-all duration-300"
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2">
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg">
                      <Image
                        src={product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : "/images/placeholders/t-shirt.svg")}
                        alt={product.name}
                        unoptimized={true}
                        priority
                        className="object-cover w-full h-full"
                        width={96}
                        height={96}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 font-semibold text-gray-900">
                    {product.name}
                  </div>
                  <div className="col-span-2 text-gray-800">
                    {product.description}
                  </div>
                  <div className="col-span-1 text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">
                      {product.category || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="col-span-2 font-semibold text-gray-900">
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="col-span-2">
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
                    )}
                  </div>
                  <div className="col-span-1">
                    {product.stock > 0 ? (
                      <button
                        onClick={() => handleBuyStock(product.productId)}
                        disabled={!selectedQuantities[product.productId] || selectedQuantities[product.productId] === 0}
                        className={`py-2 px-6 text-white rounded-md text-sm font-semibold flex items-center justify-center transition-all duration-200 ${
                          selectedQuantities[product.productId] && selectedQuantities[product.productId] > 0
                            ? "bg-[#FF0059] hover:bg-[#E0004D]"
                            : "bg-gray-400"
                        }`}
                      >
                        <span>List Product</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="py-2 px-6 text-gray-500 bg-gray-200 rounded-md text-sm font-semibold flex items-center justify-center cursor-not-allowed"
                      >
                        <span>Restock Needed</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-200 flex items-center justify-center overflow-hidden rounded-lg flex-shrink-0">
                      <Image
                        src={product.mainImage || (product.images && product.images.length > 0 ? product.images[0] : "/images/placeholders/t-shirt.svg")}
                        alt={product.name}
                        unoptimized={true}
                        priority
                        className="object-cover w-full h-full"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize text-gray-600">
                          {product.category || 'Uncategorized'}
                        </span>
                        <span className="font-bold text-lg text-gray-900">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Purchase Section */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {product.stock > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Quantity:</span>
                          <span className="text-sm text-gray-500">Max: {product.stock} available</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <QuantityCounter
                              quantity={selectedQuantities[product.productId] || 0}
                              onQuantityChange={(quantity) => handleQuantityChange(product.productId, quantity)}
                              min={1}
                              max={product.stock}
                              size="md"
                              className="w-full"
                            />
                          </div>
                          <button
                            onClick={() => handleBuyStock(product.productId)}
                            disabled={!selectedQuantities[product.productId] || selectedQuantities[product.productId] === 0}
                            className={`py-2 px-6 text-white rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                              selectedQuantities[product.productId] && selectedQuantities[product.productId] > 0
                                ? "bg-[#FF0059] hover:bg-[#E0004D]"
                                : "bg-gray-400"
                            }`}
                          >
                            List Product
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <div className="text-lg font-medium text-red-600 mb-1">
                          Out of Stock
                        </div>
                        <div className="text-sm text-gray-500">
                          0 units available
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}            {/* Pagination UI */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 mt-4 space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                <span className="mr-2 text-gray-700 text-sm">Rows per page:</span>
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

              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {startIndex + 1} to {endIndex} of {totalItems} results
              </div>

              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  } px-3 py-1 rounded-md text-sm`}
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
                  } px-3 py-1 rounded-md text-sm`}
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
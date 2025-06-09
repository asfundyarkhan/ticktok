"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserBalance } from "../../components/UserBalanceContext";
import { useAuth } from "../../../context/AuthContext";
import PaginationWithCustomRows from "../../components/PaginationWithCustomRows";
import { StockService } from "../../../services/stockService";
import { StockItem } from "../../../types/marketplace";
import { toast } from "react-hot-toast";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../../lib/firebase/firebase";
import { getBestProductImage } from "../../utils/imageHelpers";
import QuantityCounter from "../../components/QuantityCounter";

export default function InventoryPage() {
  const router = useRouter();
  const { balance } = useUserBalance();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<StockItem | null>(null);
  const [sellQuantity, setSellQuantity] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [processingListing, setProcessingListing] = useState(false);  useEffect(() => {
    console.log("Inventory page mounted, user:", user?.uid);
    
    if (!user || !user.uid) {
      // If not logged in, show appropriate message
      setLoading(false);
      toast.error("You must be logged in to view inventory");
      return () => {
        console.log("Cleanup function called for non-authenticated user");
      };
    }
      console.log(`Setting up inventory subscription for user ${user.uid}`);
    
    // Subscribe to real-time inventory updates
    const unsubscribe = StockService.subscribeToInventory(user.uid,
      (items) => {
        console.log(`Received ${items.length} inventory items for user ${user.uid}`);
        setInventoryItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading inventory:", error);
        toast.error("Failed to load inventory");
        setLoading(false);
      }
    );// Check if there's a product to highlight (coming from restock button)
    const productToRestock = localStorage.getItem("productToRestock");
    if (productToRestock) {
      // Find and highlight the product in the list
      setTimeout(() => {
        const row = document.querySelector(`[data-product-code="${productToRestock}"]`);
        if (row) {
          row.scrollIntoView({ behavior: "smooth", block: "center" });
          row.classList.add("bg-yellow-100");
          setTimeout(() => row.classList.remove("bg-yellow-100"), 3000);
        }
      }, 500);
      localStorage.removeItem("productToRestock");
    }    return () => {
      console.log(`Cleaning up inventory subscription for user ${user.uid}`);
      unsubscribe();
    };
  }, [user]);
  // Filter products based on search query
  const filteredProducts = inventoryItems.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  const totalItems = filteredProducts.length;
  const validRowsPerPage = isNaN(rowsPerPage) || rowsPerPage <= 0 ? 5 : rowsPerPage;
  const totalPages = Math.ceil(totalItems / validRowsPerPage);
  const startIndex = (currentPage - 1) * validRowsPerPage;
  const endIndex = Math.min(startIndex + validRowsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);


  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };
  // Open sell modal for a product
  const openSellModal = (product: StockItem) => {
    setCurrentProduct(product);
    // For inventory items, stock is now called 'quantity' in Firebase structure
    const availableStock = product.stock || 0;
    setSellQuantity(Math.min(10, availableStock));
    // Calculate 30% markup from original price
    setSellPrice(product.price * 1.3);
    setShowSellModal(true);
  };

  // Handle listing a product for sale using Firebase
  const handleSellProduct = async () => {
    if (!currentProduct || sellQuantity <= 0 || !currentProduct.id) {
      toast.error("Invalid product or quantity");
      return;
    }

    setProcessingListing(true);
    try {
      if (!user || !user.uid) {
        toast.error("You must be logged in to create a listing");
        return;
      }
      
      // Use Firebase transaction to create listing
      const result = await StockService.createListing(
        user.uid,
        currentProduct.id,
        sellQuantity,
        sellPrice
      );

      if (result.success) {
        setShowSellModal(false);

        // Show success notification
        toast.success(
          `${sellQuantity} units of ${currentProduct.name} listed for sale!`
        );

        // Redirect to listings page
        setTimeout(() => {
          router.push("/stock/listings");
        }, 1500);
      } else {
        toast.error(result.message || "Failed to create listing");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      toast.error("Failed to create listing. Please try again.");
    } finally {
      setProcessingListing(false);
    }
  };
  // Debug function to directly check the Firebase database
  const debugCheckInventory = async () => {
    if (!user || !user.uid) return;
    
    try {
      // Check both potential paths where inventory might be stored
      const newPath = collection(firestore, `inventory/${user.uid}/products`);
      const newPathDocs = await getDocs(newPath);
      
      console.log("Debug - New path inventory check:", newPathDocs.size, "items found");
      newPathDocs.forEach(doc => {
        console.log(`Item: ${doc.id}`, doc.data());
      });
      
      if (newPathDocs.size === 0) {
        toast.error("No inventory items found. Try purchasing some stock.");
      } else {
        toast.success(`Found ${newPathDocs.size} items in your inventory!`);
      }
    } catch (error) {
      console.error("Error in debug check:", error);
      toast.error("Error checking inventory directly");
    }
  };

  // Restock product
  const handleRestock = (productCode: string) => {
    // Save the product code in localStorage to highlight it on the Buy Stock page
    try {
      localStorage.setItem("productToRestock", productCode);
    } catch (error) {
      console.error("Error setting productToRestock to localStorage:", error);
    }

    // Redirect to the buy stock page
    router.push("/stock");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0059] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }  return (
    <div className="min-h-screen bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-medium mb-6">Account</h1>
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
        </div>        {/* Current Balance Card */}
        <div className="bg-white p-4 rounded-lg mb-6 border-l-4 border-[#FF0059]">
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
              className="px-4 py-2 bg-[#FF0059] text-white rounded-md font-medium"
            >
              Add Funds
            </Link>
          </div>
        </div>        {/* Search inventory */}
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
          <div className="flex space-x-2">
            <button
              onClick={debugCheckInventory}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md font-medium"
            >
              Refresh Inventory
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mb-4">
          {filteredProducts.length > 0 ? (            <table className="min-w-full divide-y divide-gray-200">
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
                  <tr 
                    key={product.id} 
                    className="text-sm"
                    data-product-code={product.productCode}
                  >                    <td className="py-4 pl-2 pr-6">                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">                        <Image
                          src={getBestProductImage(product)}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            console.log("Image failed to load:", e.currentTarget.src);
                            e.currentTarget.src = '/images/placeholders/product.svg';
                          }}
                          unoptimized={true}
                          priority
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {product.name}
                      {product.listed && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Listed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-800">
                      {product.description}
                    </td>                    <td className="py-4 px-6 text-gray-900">
                      <div className="flex items-center">
                        <span className={`px-4 py-1 rounded-md ${
                          (product.stock || 0) === 0 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-gray-100'
                        }`}>
                          {(product.stock || 0) === 0 ? 'Out of Stock' : `${product.stock || 0}`}
                        </span>
                        {(product.stock || 0) > 0 && <span className="ml-2">pcs</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {product.productCode}
                    </td>                    <td className="py-4 px-6">
                      {(product.stock || 0) === 0 ? (
                        <button
                          onClick={() => handleRestock(product.productCode)}
                          className="px-4 py-1.5 bg-[#FF0059] text-white rounded-md text-sm font-medium hover:bg-[#E0004D] transition-colors"
                        >
                          Restock Needed
                        </button>
                      ) : (
                        <button
                          onClick={() => openSellModal(product)}
                          className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
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
                "No inventory items found. Purchase some stock to get started!"
              }
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
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
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        {/* Sell Modal */}
        {showSellModal && currentProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">List Product for Sale</h2>

              <div className="flex items-start mb-4">                <div className="mr-4">                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">                    <Image
                      src={currentProduct.mainImage || (currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images[0] : '/images/placeholders/product.svg')}
                      unoptimized={true}
                      priority
                      alt={currentProduct.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.log("Modal image failed to load:", e.currentTarget.src);
                        e.currentTarget.src = '/images/placeholders/product.svg';
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">{currentProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    {currentProduct.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available: {currentProduct.stock || 0} pcs
                  </p>
                </div>
              </div>              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to List
                </label>
                <QuantityCounter
                  quantity={sellQuantity}
                  onQuantityChange={setSellQuantity}
                  min={1}
                  max={currentProduct.stock || 0}
                  size="md"
                  className="w-fit"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit ($) - 30% Markup Applied
                </label>
                <input
                  type="number"
                  value={sellPrice.toFixed(2)}
                  readOnly
                  className="px-3 py-2 border rounded-md w-full bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original price: ${currentProduct.price.toFixed(2)} → Sale price: ${sellPrice.toFixed(2)}
                </p>
              </div>              <div className="mb-4 p-3 bg-gray-50 border rounded-md">
                <p className="text-sm font-medium text-gray-700">
                  Listing Summary:
                </p>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium">
                    ${(sellPrice * sellQuantity).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowSellModal(false)}
                  disabled={processingListing}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSellProduct}
                  disabled={processingListing}
                  className="px-4 py-2 bg-[#FF0059] text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center"
                >
                  {processingListing && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {processingListing ? "Creating..." : "List for Sale"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
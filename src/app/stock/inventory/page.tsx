"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserBalance } from "../../components/UserBalanceContext";

interface Product {
  id: number;
  name: string;
  description: string;
  stock: number;
  productCode: string;
  image: string;
  price: number;
  listed: boolean;
}

interface StoreProduct {
  productCode: string;
  stock: number;
  price: number;
  id: number;
  name: string;
  description: string;
  image: string;
  sellerName: string;
  sellerId: string; // Add sellerId to StoreProduct
  rating: number;
  reviews: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const { balance, addToBalance } = useUserBalance();
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [sellQuantity, setSellQuantity] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);

  useEffect(() => {
    // Get inventory products from localStorage or initialize with default data
    const storedProducts = localStorage.getItem("inventoryProducts");
    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      // Initial product data
      const initialProducts: Product[] = [
        {
          id: 1,
          name: "T-Shirt Nike",
          description: "100% cotton, unisex",
          stock: 100,
          productCode: "SHRT-NIKE-001",
          image: "/images/placeholders/t-shirt.svg",
          price: 30,
          listed: false,
        },
        {
          id: 2,
          name: "Long Pants Nike",
          description: "100% cotton, unisex",
          stock: 100,
          productCode: "PNT-NIKE-001",
          image: "/images/placeholders/t-shirt.svg",
          price: 50,
          listed: false,
        },
        {
          id: 3,
          name: "Long Pants Nike",
          description: "100% cotton, unisex",
          stock: 0,
          productCode: "PNT-NIKE-002",
          image: "/images/placeholders/t-shirt.svg",
          price: 50,
          listed: false,
        },
      ];
      setProducts(initialProducts);
      localStorage.setItem(
        "inventoryProducts",
        JSON.stringify(initialProducts)
      );
    }
  }, []);

  // Save changes to localStorage whenever products change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem("inventoryProducts", JSON.stringify(products));
    }
  }, [products]);

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

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

  // Reset to first page when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle stock quantity change
  const handleStockChange = (id: number, newStock: number) => {
    if (newStock < 0) return; // Prevent negative stock

    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, stock: newStock } : product
      )
    );
  };

  // Open sell modal for a product
  const openSellModal = (product: Product) => {
    setCurrentProduct(product);
    setSellQuantity(Math.min(10, product.stock)); // Default to 10 or max available
    setSellPrice(product.price);
    setShowSellModal(true);
  };

  // Handle listing a product for sale
  const handleSellProduct = () => {
    if (!currentProduct || sellQuantity <= 0) return;

    // Create a store listing
    const storeProducts: StoreProduct[] = JSON.parse(
      localStorage.getItem("storeProducts") || "[]"
    );

    // Get seller information (in a real app, this would come from authentication)
    const sellerInfo = {
      id: "current-user-id", // This would be the actual user ID in a real app
      name: "Your Store", // This would be the actual store name
    };

    // Create a unique ID that will be stable for this product
    const stableId =
      Date.now() + parseInt(currentProduct.productCode.replace(/\D/g, ""));

    const listingExists = storeProducts.some(
      (p: StoreProduct) =>
        p.productCode === currentProduct.productCode &&
        p.sellerId === sellerInfo.id
    );

    if (listingExists) {
      // Update existing listing
      const updatedStoreProducts = storeProducts.map((p: StoreProduct) =>
        p.productCode === currentProduct.productCode &&
        p.sellerId === sellerInfo.id
          ? {
              ...p,
              stock: p.stock + sellQuantity,
              price: sellPrice, // Update price if changed
            }
          : p
      );
      localStorage.setItem(
        "storeProducts",
        JSON.stringify(updatedStoreProducts)
      );
    } else {
      // Create new listing
      const newListing: StoreProduct = {
        id: stableId, // Use stable ID
        name: currentProduct.name,
        description: currentProduct.description,
        price: sellPrice,
        stock: sellQuantity,
        image: currentProduct.image,
        productCode: currentProduct.productCode,
        sellerName: sellerInfo.name,
        sellerId: sellerInfo.id,
        rating: 4.5,
        reviews: 12,
      };

      // Force-update storeProducts array
      const updatedStoreProducts = [...storeProducts, newListing];
      localStorage.setItem(
        "storeProducts",
        JSON.stringify(updatedStoreProducts)
      );

      // Trigger a storage event for other components to detect
      window.dispatchEvent(new Event("storage"));
    }

    // Calculate the listing fee (10% of total value)
    const listingValue = sellPrice * sellQuantity;
    const listingFee = listingValue * 0.1;

    // Update balance - earn listing fee as income
    addToBalance(listingFee);

    // Update inventory
    const updatedProducts = products.map((p) =>
      p.id === currentProduct.id
        ? { ...p, stock: p.stock - sellQuantity, listed: true }
        : p
    );
    setProducts(updatedProducts);
    localStorage.setItem("inventoryProducts", JSON.stringify(updatedProducts));

    setShowSellModal(false);

    // Show success notification
    alert(
      `${sellQuantity} units of ${
        currentProduct.name
      } listed for sale! Earned $${listingFee.toFixed(2)} in listing fees.`
    );

    // Redirect to listings page
    router.push("/stock/listings");
  };

  // Restock product
  const handleRestock = (id: number) => {
    // Save the product code in localStorage to highlight it on the Buy Stock page
    const productToRestock = products.find((p) => p.id === id);
    if (productToRestock) {
      localStorage.setItem("productToRestock", productToRestock.productCode);
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

        {/* Table */}
        <div className="mb-4">
          {filteredProducts.length > 0 ? (
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
                      {product.listed && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Listed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-800">
                      {product.description}
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            handleStockChange(product.id, product.stock - 1)
                          }
                          className="px-2 py-0.5 bg-gray-200 rounded-l-md"
                          disabled={product.stock <= 0}
                        >
                          -
                        </button>
                        <span className="px-4 py-0.5 bg-gray-100">
                          {product.stock}
                        </span>
                        <button
                          onClick={() =>
                            handleStockChange(product.id, product.stock + 1)
                          }
                          className="px-2 py-0.5 bg-gray-200 rounded-r-md"
                        >
                          +
                        </button>
                        <span className="ml-2">pcs</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {product.productCode}
                    </td>
                    <td className="py-4 px-6">
                      {product.stock === 0 ? (
                        <button
                          onClick={() => handleRestock(product.id)}
                          className="px-4 py-1.5 bg-gray-400 text-white rounded-md text-sm font-medium"
                        >
                          Restock
                        </button>
                      ) : (
                        <button
                          onClick={() => openSellModal(product)}
                          className="px-4 py-1.5 bg-[#FF0059] text-white rounded-md text-sm font-medium"
                        >
                          Sell
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500 bg-white border rounded">
              No products found matching your search.
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
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
              {totalItems > 0
                ? `${startIndex + 1}-${endIndex} of ${totalItems}`
                : "0-0 of 0"}
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
        )}

        {/* Sell Modal */}
        {showSellModal && currentProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">List Product for Sale</h2>

              <div className="flex items-start mb-4">
                <div className="mr-4">
                  <div className="w-16 h-16 bg-gray-200">
                    <Image
                      src={currentProduct.image}
                      alt={currentProduct.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">{currentProduct.name}</h3>
                  <p className="text-sm text-gray-600">
                    {currentProduct.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available: {currentProduct.stock} pcs
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
                        val <= currentProduct.stock
                      ) {
                        setSellQuantity(val);
                      }
                    }}
                    className="px-3 py-1 border-t border-b text-center w-20"
                    min={1}
                    max={currentProduct.stock}
                  />
                  <button
                    onClick={() =>
                      setSellQuantity(
                        Math.min(currentProduct.stock, sellQuantity + 1)
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
                    ${(sellPrice * sellQuantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span className="text-gray-600">Platform Fee (10%):</span>
                  <span className="font-medium text-green-600">
                    +${(sellPrice * sellQuantity * 0.1).toFixed(2)}
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
}

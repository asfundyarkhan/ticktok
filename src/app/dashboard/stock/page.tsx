"use client";

import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { StockService } from "../../../services/stockService";
import { StockItem } from "../../../types/marketplace";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { AdminRoute } from "../../components/AdminRoute";

function StockPageContent() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Set up real-time subscription to admin stock
  useEffect(() => {
    const unsubscribe = StockService.subscribeToAdminStock(
      (stocks: StockItem[]) => {
        setProducts(stocks);
        setLoading(false);
      },
      (error: Error) => {
        console.error("Error loading stocks:", error);
        toast.error("Failed to load stock data");
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  // Save products to localStorage whenever they change
  useEffect(() => {
    // No longer needed since we're using Firestore
    // localStorage.setItem("stockProducts", JSON.stringify(products));
  }, [products]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmDelete = (productId: string) => {
    setSelectedProduct(productId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setSelectedProduct(null);
    setShowDeleteConfirm(false);
  };

  const deleteProduct = async () => {
    if (selectedProduct) {
      try {
        await StockService.deleteStockItem(selectedProduct);
        toast.success("Product deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedProduct(null);
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    }
  };

  const handleEdit = (productId: string) => {
    router.push(`/dashboard/stock/edit/${productId}`);
  };
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold">
            {userProfile?.displayName || user?.email?.split("@")[0] || "User"}
          </h1>
          <span className="px-2 py-1 text-sm bg-gray-200 rounded self-start sm:self-auto">
            {userProfile?.uid?.slice(-6) || "ref000"}
          </span>
        </div>
      </div>      {/* Tabs */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap gap-4 sm:gap-8 overflow-x-auto pb-2 sm:pb-0">
          <Link
            href="/dashboard/stock"
            className="px-1 py-3 sm:py-4 text-pink-500 border-b-2 border-pink-500 whitespace-nowrap text-sm sm:text-base font-medium"
          >
            Stock
          </Link>
          <Link
            href="/dashboard/stock/add"
            className="px-1 py-3 sm:py-4 text-gray-500 hover:text-gray-700 whitespace-nowrap text-sm sm:text-base font-medium"
          >
            List a Stock
          </Link>
        </nav>
      </div>      {/* Search */}
      <div className="relative mb-4 sm:mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search available stock"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">        {/* Desktop Table */}
        <div className="hidden lg:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b">
                <th className="w-24 px-6 py-4 text-left text-sm font-medium text-gray-500">
                  PRODUCT IMAGE
                </th>
                <th className="w-48 px-6 py-4 text-left text-sm font-medium text-gray-500">
                  PRODUCT NAME
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                  DESCRIPTION
                </th>
                <th className="w-28 px-6 py-4 text-left text-sm font-medium text-gray-500">
                  PRICES
                </th>
                <th className="w-32 px-6 py-4 text-left text-sm font-medium text-gray-500">
                  UNITS
                </th>
                <th className="w-40 px-6 py-4 text-left text-sm font-medium text-gray-500">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-b-0">
                    <td className="w-24 px-6 py-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={product.mainImage || product.images?.[0] || '/placeholder.jpg'}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </td>
                    <td className="w-48 px-6 py-4">
                      <span className="font-medium text-gray-900 break-words">{product.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 break-words">{product.description}</span>
                    </td>
                    <td className="w-28 px-6 py-4">
                      <span className="font-medium">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="w-32 px-6 py-4">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                          (product.stock || 0) === 0 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(product.stock || 0) === 0 ? 'Out of Stock' : `${product.stock}pcs`}
                        </span>
                      </div>                    </td>
                    <td className="w-40 px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {(product.stock || 0) === 0 ? (
                          <>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="px-4 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 font-medium text-sm"
                            >
                              Add Stock
                            </button>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="px-4 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Edit
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="px-4 py-1 text-white bg-pink-500 rounded-md hover:bg-pink-600 text-sm"
                              onClick={() => confirmDelete(product.id!)}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="px-4 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No products found.{" "}
                    <Link
                      href="/dashboard/stock/add"
                      className="text-pink-500 hover:underline"
                    >
                      Add your first product
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              Loading products...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                      <Image
                        src={product.mainImage || product.images?.[0] || '/placeholder.jpg'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col space-y-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">
                            ${product.price.toFixed(2)}
                          </span>
                          <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                            (product.stock || 0) === 0 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {(product.stock || 0) === 0 ? 'Out of Stock' : `${product.stock}pcs`}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-col space-y-2">
                        {(product.stock || 0) === 0 ? (
                          <>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 font-medium text-sm"
                            >
                              Add Stock
                            </button>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Edit Product
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="w-full px-4 py-2 text-white bg-pink-500 rounded-md hover:bg-pink-600 text-sm font-medium"
                              onClick={() => confirmDelete(product.id!)}
                            >
                              Delete Product
                            </button>
                            <button
                              onClick={() => handleEdit(product.id!)}
                              className="w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 text-sm"
                            >
                              Edit Product
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No products found.{" "}
              <Link
                href="/dashboard/stock/add"
                className="text-pink-500 hover:underline"
              >
                Add your first product
              </Link>
            </div>
          )}
        </div>
      </div>      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            {(() => {
              const product = products.find(p => p.id === selectedProduct);
              const isOutOfStock = (product?.stock || 0) === 0;
              
              return (
                <>
                  <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
                  {isOutOfStock ? (
                    <div className="mb-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Out of Stock Item</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                              This item is currently out of stock. Consider restocking instead of deleting.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Are you sure you want to permanently delete &ldquo;{product?.name}&rdquo;? 
                        You can also edit it to add more stock instead.
                      </p>
                    </div>
                  ) : (
                    <p className="mb-4 text-gray-600 text-sm">
                      Are you sure you want to delete &ldquo;{product?.name}&rdquo;? This action cannot be undone.
                    </p>
                  )}
                </>
              );
            })()}

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={cancelDelete}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 order-2 sm:order-1"
              >
                Cancel
              </button>
              {(() => {
                const product = products.find(p => p.id === selectedProduct);
                const isOutOfStock = (product?.stock || 0) === 0;
                
                return isOutOfStock ? (
                  <>
                    <button
                      onClick={() => {
                        cancelDelete();
                        handleEdit(selectedProduct);
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 order-1 sm:order-2"
                    >
                      Add Stock Instead
                    </button>
                    <button
                      onClick={deleteProduct}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 order-3"
                    >
                      Delete Anyway
                    </button>
                  </>
                ) : (
                  <button
                    onClick={deleteProduct}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 order-1 sm:order-2"
                  >
                    Delete
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockPage() {
  return (
    <AdminRoute>
      <StockPageContent />
    </AdminRoute>
  );
}

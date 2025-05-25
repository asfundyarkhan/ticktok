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

export default function StockPage() {
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold">
            {userProfile?.displayName || user?.email?.split("@")[0] || "User"}
          </h1>
          <span className="px-2 py-1 text-sm bg-gray-200 rounded">
            {userProfile?.uid?.slice(-6) || "ref000"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-8">
          <Link
            href="/dashboard/stock"
            className="px-1 py-4 text-pink-500 border-b-2 border-pink-500"
          >
            Stock
          </Link>
          <Link
            href="/dashboard/stock/add"
            className="px-1 py-4 text-gray-500 hover:text-gray-700"
          >
            List a Stock
          </Link>
        </nav>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search available stock"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRODUCT IMAGE
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRODUCT NAME
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                DESCRIPTION
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                PRICES
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                UNITS
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
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
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b last:border-b-0">
                  <td className="px-6 py-4">
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {product.description}
                  </td>
                  <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">{product.stock}pcs</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <button
                        className="px-4 py-1 text-white bg-pink-500 rounded-md hover:bg-pink-600"
                        onClick={() => confirmDelete(product.id!)}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleEdit(product.id!)}
                        className="px-4 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

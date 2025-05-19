"use client";

import { useState, useEffect } from "react";
import { ProductService, Product } from "../../services/productService";
import { LoadingSpinner } from "../components/Loading";
import Link from "next/link";

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Get products from Firestore
        const listedProducts = await ProductService.getListedProducts();
        setProducts(listedProducts.products || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to fetch products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            No Products Found
          </h2>
          <p className="mt-2 text-gray-600">
            There are currently no products available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Product Catalog</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="aspect-w-4 aspect-h-3 relative h-48">
              <img
                src={product.image || "/images/placeholders/t-shirt.svg"}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm flex-1 line-clamp-3">
                {product.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-pink-600 font-medium">
                  ${product.price.toFixed(2)}
                </span>
                <div className="text-sm text-gray-500">
                  {product.stock} in stock
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex space-x-2">
              <Link
                href={`/products/${product.id}`}
                className="flex-1 bg-pink-600 text-white text-center py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

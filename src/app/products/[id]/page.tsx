"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useUserBalance } from "../../components/UserBalanceContext";
import { ProductService, Product } from "../../../services/productService";
import { LoadingSpinner } from "../../components/Loading";
import AddToCartButton from "../../components/AddToCartButton";
import StarRating from "../../components/StarRating";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { user } = useAuth();
  const { balance, deductFromBalance } = useUserBalance();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await ProductService.getProduct(params.id);
        if (!productData) {
          setError("Product not found");
        } else {
          setProduct(productData);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handlePurchase = async () => {
    if (!product) return;

    const totalCost = product.price * quantity;

    if (await deductFromBalance(totalCost)) {
      toast.success(`Successfully purchased ${quantity} ${product.name}!`);

      // In a real application, you'd create an order in Firestore here
      // For demo purposes, just simulate a success
      setTimeout(() => {
        router.push("/checkout/success");
      }, 1000);
    } else {
      toast.error("Insufficient balance for this purchase");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700">{error || "Product not found"}</p>
          <Link
            href="/products"
            className="text-pink-600 mt-4 inline-block hover:underline"
          >
            Return to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/2">
          <div className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
            <img
              src={product.image || "/images/placeholders/t-shirt.svg"}
              alt={product.name}
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        <div className="md:w-1/2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} />
            <span className="text-gray-500">({product.reviews} reviews)</span>
          </div>

          <div className="text-2xl font-semibold text-pink-600">
            ${product.price.toFixed(2)}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="font-medium">Availability:</div>
              {product.stock > 0 ? (
                <div className="text-green-600">
                  In Stock ({product.stock} available)
                </div>
              ) : (
                <div className="text-red-600">Out of Stock</div>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="font-medium">Seller:</div>
              <div>{product.sellerName}</div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="font-medium">Product Code:</div>
              <div>{product.productCode}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{product.description}</p>
          </div>

          {product.stock > 0 && (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <label className="mr-4 font-medium">Quantity:</label>
                <div className="flex border rounded-md border-gray-300">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 border-r border-gray-300"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.min(
                          product.stock,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-14 text-center"
                  />
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="px-3 py-1 border-l border-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <AddToCartButton
                  product={product}
                  quantity={quantity}
                  className="px-6 py-3 flex-1"
                />

                <button
                  onClick={handlePurchase}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Buy Now (${(product.price * quantity).toFixed(2)})
                </button>
              </div>

              <div className="text-sm text-gray-500 mt-2">
                Your balance: ${balance.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

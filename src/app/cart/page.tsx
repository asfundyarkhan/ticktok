"use client";

import { useState } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import Breadcrumb from "@/app/components/Breadcrumb";
import { useCart } from "@/app/components/CartContext";
import Link from "next/link";
import Image from "next/image";
import CheckoutButton from "@/app/components/CheckoutButton";
import RelatedProducts from "@/app/components/RelatedProducts";
import LoadingOverlay from "@/app/components/LoadingOverlay";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function CartPage() {
  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}

function CartContent() {
  const {
    cartItems,
    savedItems,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    cartTotal,
    loading,
    operationLoading,
  } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const discount = 0.2; // 20% discount

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Cart", href: "/cart" },
  ];

  // Calculate summary values
  const subtotal = cartTotal;
  const discountAmount = subtotal * discount;
  const deliveryFee = 15;
  const total = subtotal - discountAmount + deliveryFee;
  // Handle loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-8 text-center py-16">
          <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Loading your cart...
            </h1>
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0059]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty cart state
  if (!loading && cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-8 text-center py-16">
          <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Your cart is empty
            </h1>            <p className="text-gray-600 mb-8">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/store"
              className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF0059] hover:bg-[#E60050]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-3xl font-bold text-gray-900 mt-8">Shopping Cart</h1>
      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}{" "}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <LoadingOverlay
              key={item.id}
              isLoading={
                operationLoading.removeFromCart ||
                operationLoading.saveForLater ||
                operationLoading.updateQuantity
              }
              message="Updating cart..."
            >
              <div className="flex gap-6 p-6 bg-white rounded-lg border">                <div className="w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        {item.name}
                      </h3>
                      {(item.size || item.color) && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.size && `Size: ${item.size}`}{" "}
                          {item.color && `| Color: ${item.color}`}
                        </p>
                      )}
                    </div>{" "}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => saveForLater(item.id)}
                        className="text-sm text-[#FF0059] hover:underline px-2 py-1"
                        disabled={operationLoading.saveForLater}
                      >
                        Save for later
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-gray-500"
                        disabled={operationLoading.removeFromCart}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() =>
                          item.quantity > 1 &&
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="px-3 py-1 border-r text-gray-700 hover:bg-gray-50 font-medium text-lg"
                        disabled={
                          item.quantity <= 1 || operationLoading.updateQuantity
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1 text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="px-3 py-1 border-l text-gray-700 hover:bg-gray-50 font-medium text-lg"
                        disabled={operationLoading.updateQuantity}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-medium">
                      $
                      {((item.salePrice || item.price) * item.quantity).toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </LoadingOverlay>
          ))}
        </div>
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Discount (-20%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-base font-medium">Total</span>
                  <span className="text-base font-medium">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Add promo code"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                />
                <button className="px-4 py-2 text-sm font-medium text-[#FF0059] bg-white border border-[#FF0059] rounded-md hover:bg-pink-50">
                  Apply
                </button>
              </div>{" "}
            </div>{" "}
            <div className="mt-6">
              <LoadingOverlay
                isLoading={operationLoading.clearCart}
                message="Processing..."
              >
                <CheckoutButton className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium" />
              </LoadingOverlay>
            </div>
            <div className="mt-4">
              <Link
                href="/store"
                className="flex items-center justify-center text-sm text-[#FF0059] hover:underline"
              >
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>
        </div>{" "}
      </div>{" "}
      {/* Saved For Later Section */}
      {savedItems.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Saved for Later ({savedItems.length})
          </h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedItems.map((item) => (
              <LoadingOverlay
                key={item.id}
                isLoading={
                  operationLoading.moveToCart ||
                  operationLoading.removeSavedItem
                }
                message="Updating saved items..."
              >                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {item.description}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-900">
                        ${(item.salePrice || item.price).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-col space-y-2">
                      <button
                        onClick={() => moveToCart(item.id)}
                        className="w-full py-2 px-3 text-sm font-medium text-white bg-[#FF0059] rounded-md hover:bg-[#E60050]"
                        disabled={operationLoading.moveToCart}
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeSavedItem(item.id)}
                        className="w-full py-2 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={operationLoading.removeSavedItem}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </LoadingOverlay>
            ))}
          </div>
        </div>
      )}
      {/* Related Products Section */}
      <div className="mt-16">
        <RelatedProducts />
      </div>
    </div>
  );
}

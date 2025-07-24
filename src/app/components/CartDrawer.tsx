"use client";

import { ShoppingBag, X, Plus, Minus, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./NewCartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { userProfile } = useAuth();
  const cartTotal = getCartTotal();
  const isSeller = userProfile?.role === "seller";

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Shopping Cart
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -m-2 text-gray-400 hover:text-gray-500 rounded-md"
              >
                <span className="sr-only">Close panel</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 sm:px-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      {/* Item image */}
                      <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden rounded-md">
                        <Image
                          src={item.image || "/placeholder.png"}
                          alt={item.name}
                          className="object-cover object-center"
                          fill
                          sizes="96px"
                        />
                      </div>

                      {/* Item details */}
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="ml-4 text-pink-600 hover:text-pink-500 p-1 rounded-full hover:bg-pink-50"
                            >
                              <span className="sr-only">Remove</span>
                              <X className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex-1 flex items-end justify-between">
                          <div className="flex items-center border rounded-md">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, Math.max(1, item.quantity - 1))
                              }
                              className="p-2 text-gray-600 hover:text-gray-900"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="p-2 text-gray-600 hover:text-gray-900"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
              <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                <p>Subtotal</p>
                <p>${cartTotal.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="space-y-3">
                {isSeller ? (
                  <div className="w-full p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">Sellers can&apos;t purchase items</p>
                    </div>
                    <p className="text-xs text-amber-700">
                      You can add items to your cart to browse, but checkout is not available for seller accounts.
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="w-full flex items-center justify-center rounded-md border border-transparent bg-pink-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-pink-700 transition-colors"
                  >
                    Checkout
                  </Link>
                )}
                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

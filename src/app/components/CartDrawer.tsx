"use client";

import { Fragment } from "react";
import { Dialog } from "@headlessui/react";
import { Transition } from "@headlessui/react";
import { X, Minus, Plus, ShoppingBag, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./CartContext";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Shopping Cart
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          {" "}
                          {cartItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                              <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="text-gray-500">
                                Your cart is empty
                              </p>
                            </div>
                          ) : (
                            <ul
                              role="list"
                              className="-my-6 divide-y divide-gray-200"
                            >
                              {cartItems.map((item) => (
                                <li key={item.id} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>{item.name}</h3>{" "}
                                        <p className="ml-4">
                                          $
                                          {(
                                            (item.salePrice || item.price) *
                                            item.quantity
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        {" "}
                                        <button
                                          onClick={() => {
                                            if (item.quantity > 1) {
                                              updateQuantity(
                                                item.id,
                                                item.quantity - 1
                                              );
                                            }
                                          }}
                                          className="p-1 rounded-full hover:bg-gray-100"
                                          disabled={item.quantity <= 1}
                                        >
                                          <Minus className="h-4 w-4 text-gray-500" />
                                        </button>
                                        <span className="text-gray-700">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() =>
                                            updateQuantity(
                                              item.id,
                                              item.quantity + 1
                                            )
                                          }
                                          className="p-1 rounded-full hover:bg-gray-100"
                                        >
                                          <Plus className="h-4 w-4 text-gray-500" />
                                        </button>
                                      </div>{" "}
                                      <button
                                        type="button"
                                        onClick={() => removeFromCart(item.id)}
                                        className="font-medium text-[#FF0059] hover:text-[#E60050]"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <p>Subtotal</p>
                          <p>${cartTotal.toFixed(2)}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Shipping and taxes calculated at checkout.
                        </p>
                        <div className="mt-6 flex flex-col space-y-3">
                          <Link
                            href="/cart"
                            onClick={onClose}
                            className="flex items-center justify-center rounded-md border border-transparent bg-[#FF0059] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#E60050]"
                          >
                            View Cart
                          </Link>{" "}
                          <Link
                            href="/cart"
                            onClick={onClose}
                            className="flex items-center justify-center rounded-md border border-transparent bg-gray-900 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-800"
                          >
                            Checkout
                          </Link>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            or{" "}
                            <button
                              type="button"
                              className="font-medium text-[#FF0059] hover:text-[#E60050]"
                              onClick={onClose}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../components/CartContext";
import CheckoutButton from "../components/CheckoutButton";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";

export default function CheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={["user", "admin", "superadmin"]}>
      <CheckoutContent />
    </ProtectedRoute>
  );
}

function CheckoutContent() {
  const { cartItems, cartTotal } = useCart();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Form validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.postalCode.trim())
      newErrors.postalCode = "Postal code is required";
    if (!formData.country.trim()) newErrors.country = "Country is required";

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Add some items to your cart to proceed with checkout.
          </p>
          <Link
            href="/store"
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF0059] hover:bg-[#E60050]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/cart"
            className="flex items-center text-[#FF0059] hover:text-[#E60050]"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span>Back to cart</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.firstName ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.lastName ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 mt-4">
                    Shipping Address
                  </h3>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.address ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.city ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Postal/ZIP Code
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.postalCode ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.postalCode}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`w-full rounded-md border ${
                      errors.country ? "border-red-300" : "border-gray-300"
                    } shadow-sm focus:border-pink-500 focus:ring-pink-500`}
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="flow-root">
                <ul role="list" className="divide-y divide-gray-200">
                  {cartItems.map((item) => (                    <li key={item.id} className="py-4 flex">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="ml-4 flex flex-1 flex-col">
                        <div className="flex justify-between text-sm font-medium text-gray-900">
                          <h3>{item.name}</h3>
                          <p className="ml-2">
                            $
                            {(
                              (item.salePrice || item.price) * item.quantity
                            ).toFixed(2)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Qty {item.quantity}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>${cartTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-500">
                  <p>Shipping</p>
                  <p>$15.00</p>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Total</p>
                  <p>${(cartTotal + 15).toFixed(2)}</p>
                </div>

                <div className="mt-6">
                  <CheckoutButton
                    className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium ${
                      !isFormValid ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

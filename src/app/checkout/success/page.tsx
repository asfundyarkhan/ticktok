"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6 md:p-10">
        <div className="text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Thank you for your purchase. We've sent you an email with your order
            details.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>

          <dl className="mt-4 space-y-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-900">
                Order number
              </dt>
              <dd className="text-sm font-medium text-gray-700">
                TKT-{Math.floor(Math.random() * 900000) + 100000}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-900">Order date</dt>
              <dd className="text-sm font-medium text-gray-700">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-900">
                Estimated delivery
              </dt>
              <dd className="text-sm font-medium text-gray-700">
                {(() => {
                  const date = new Date();
                  date.setDate(date.getDate() + 5);
                  return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  });
                })()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex justify-center space-x-4">
          <Link
            href="/profile"
            className="inline-flex items-center px-5 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Order History
          </Link>
          <Link
            href="/store"
            className="inline-flex items-center px-5 py-2 border border-transparent rounded-md bg-[#FF0059] text-sm font-medium text-white hover:bg-[#E0004D]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

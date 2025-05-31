"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart, DollarSign, Users, CheckCircle } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              How TikTok Shop Works
            </h1>
            <p className="mt-4 text-xl text-pink-100">
              Discover, shop, and sell on the world's most creative marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* For Buyers Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            For Buyers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Products</h3>
              <p className="text-gray-600">
                Browse millions of products from creators and brands you love. 
                Find unique items through engaging video content.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Shop Seamlessly</h3>
              <p className="text-gray-600">
                Add items to cart, use secure payment methods, and track your 
                orders with real-time notifications.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enjoy Protection</h3>
              <p className="text-gray-600">
                Shop with confidence knowing your purchases are protected by 
                our buyer protection program.
              </p>
            </div>
          </div>
        </div>

        {/* For Sellers Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            For Sellers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Store</h3>
              <p className="text-gray-600">
                Set up your seller account, add products with compelling videos,
                and start reaching millions of potential customers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Manage & Grow</h3>
              <p className="text-gray-600">
                Use our seller dashboard to manage inventory, process orders,
                and analyze your performance with detailed analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scale Your Business</h3>
              <p className="text-gray-600">
                Leverage TikTok's massive audience and creative tools to build
                your brand and increase sales.
              </p>
            </div>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6">
            Join millions of users who are already buying and selling on TikTok Shop
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 transition duration-200"
            >
              Start Shopping
            </Link>
            <Link
              href="/seller-center"
              className="bg-white text-pink-600 border border-pink-600 px-6 py-3 rounded-md hover:bg-pink-50 transition duration-200"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

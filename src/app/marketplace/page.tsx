"use client";

import { ShoppingBagIcon, UsersIcon, TruckIcon, ShieldCheckIcon, SparklesIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ShoppingBagIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              TikTok Marketplace
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Discover millions of products from trusted sellers worldwide. Shop trending items, unique finds, and everything in between.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/browse">
                <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Start Shopping
                </button>
              </Link>
              <Link href="/seller-center">
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Become a Seller
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Shop on TikTok Marketplace?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience a new way to discover and shop with features designed for the modern shopper.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trending Products</h3>
              <p className="text-gray-600">
                Discover viral products and trending items before they become mainstream. Shop what's popular on TikTok.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mb-6">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trusted Sellers</h3>
              <p className="text-gray-600">
                Shop with confidence from verified sellers with ratings and reviews from real customers.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fast Shipping</h3>
              <p className="text-gray-600">
                Get your orders quickly with multiple shipping options and real-time tracking.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Shopping</h3>
              <p className="text-gray-600">
                Shop safely with buyer protection, secure payments, and easy returns.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Global Selection</h3>
              <p className="text-gray-600">
                Access products from sellers around the world with diverse styles and unique items.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-400 to-blue-500 rounded-lg flex items-center justify-center mb-6">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personalized</h3>
              <p className="text-gray-600">
                Get product recommendations tailored to your interests and shopping behavior.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore top categories loved by millions of shoppers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Fashion", count: "2.5M+ items" },
              { name: "Beauty", count: "1.8M+ items" },
              { name: "Electronics", count: "950K+ items" },
              { name: "Home & Garden", count: "1.2M+ items" },
              { name: "Sports", count: "750K+ items" },
              { name: "Toys & Games", count: "650K+ items" },
              { name: "Books", count: "500K+ items" },
              { name: "Health", count: "400K+ items" }
            ].map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 text-center hover:bg-gray-100 transition-colors cursor-pointer">
                <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Join Millions of Happy Shoppers
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50M+", label: "Active Shoppers", color: "bg-pink-500" },
              { number: "5M+", label: "Products Listed", color: "bg-purple-500" },
              { number: "100K+", label: "Verified Sellers", color: "bg-blue-500" },
              { number: "4.8/5", label: "Average Rating", color: "bg-green-500" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white font-bold text-lg">{stat.number}</span>
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Join millions of shoppers discovering amazing products every day. Start your shopping journey now!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Browse Products
              </button>
            </Link>
            <Link href="/register">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

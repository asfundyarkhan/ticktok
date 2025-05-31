"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, ShoppingBag, Users, BarChart3, Headphones, BookOpen } from "lucide-react";

export default function SellerCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            TikTok Seller Center
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Everything you need to succeed as a seller on TikTok Shop. Access powerful tools, 
            insights, and resources to grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-pink-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Start Selling
            </Link>
            <Link
              href="/dashboard"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-pink-600 transition duration-200 font-semibold"
            >
              Seller Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Seller Tools & Features</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Manage your inventory, track performance, and grow your business with our comprehensive seller tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Management</h3>
            <p className="text-gray-600 mb-4">
              Easily add, edit, and manage your product catalog with bulk upload capabilities and inventory tracking.
            </p>
            <Link href="/dashboard/stock" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              Manage Products <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
            <p className="text-gray-600 mb-4">
              Track your sales performance, understand customer behavior, and optimize your strategy with detailed analytics.
            </p>
            <Link href="/dashboard" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              View Analytics <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Management</h3>
            <p className="text-gray-600 mb-4">
              Build relationships with your customers, manage orders, and provide excellent customer service.
            </p>
            <Link href="/dashboard" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              Manage Customers <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Marketing Tools</h3>
            <p className="text-gray-600 mb-4">
              Promote your products with campaigns, discounts, and social media integration to reach more customers.
            </p>
            <Link href="/business" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              Learn More <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">24/7 Support</h3>
            <p className="text-gray-600 mb-4">
              Get help when you need it with our dedicated seller support team and comprehensive help center.
            </p>
            <Link href="/help-center" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              Get Support <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Learning Resources</h3>
            <p className="text-gray-600 mb-4">
              Access guides, tutorials, and best practices to help you maximize your success on TikTok Shop.
            </p>
            <Link href="/help-center" className="text-pink-600 hover:text-pink-700 font-medium inline-flex items-center">
              Start Learning <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Seller Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of successful sellers who have grown their businesses on TikTok Shop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-pink-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">300%</div>
              <div className="text-gray-600">Average sales increase</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">10M+</div>
              <div className="text-gray-600">Active sellers</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">50M+</div>
              <div className="text-gray-600">Products sold monthly</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join millions of sellers and start your TikTok Shop journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-pink-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Start Your Journey
            </Link>
            <Link
              href="/how-it-works"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-pink-600 transition duration-200 font-semibold"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

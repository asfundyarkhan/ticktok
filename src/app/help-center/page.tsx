"use client";

import Link from "next/link";
import { Search, BookOpen, Headphones, MessageCircle, Shield, CreditCard, Package, UserCheck } from "lucide-react";
import { useState } from "react";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const popularTopics = [
    { icon: Package, title: "Order & Shipping", description: "Track orders, shipping info, and delivery issues" },
    { icon: CreditCard, title: "Payments & Refunds", description: "Payment methods, billing, and refund processes" },
    { icon: UserCheck, title: "Account Management", description: "Profile settings, verification, and account security" },
    { icon: Shield, title: "Safety & Security", description: "Privacy settings, reporting, and safety guidelines" },
  ];

  const categories = [
    {
      title: "Getting Started",
      articles: [
        "How to create an account",
        "Setting up your seller profile",
        "How to list your first product",
        "Understanding TikTok Shop policies"
      ]
    },
    {
      title: "Selling on TikTok Shop",
      articles: [
        "Product listing guidelines",
        "Inventory management",
        "Order fulfillment process",
        "Seller performance metrics"
      ]
    },
    {
      title: "Buying on TikTok Shop",
      articles: [
        "How to place an order",
        "Payment methods and security",
        "Order tracking and delivery",
        "Returns and refunds"
      ]
    },
    {
      title: "Technical Support",
      articles: [
        "App troubleshooting",
        "Browser compatibility",
        "Mobile app issues",
        "System requirements"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Help Center
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Find answers to your questions and get the support you need to succeed on TikTok Shop.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Popular Topics</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Quick access to the most commonly searched help topics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {popularTopics.map((topic, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200 cursor-pointer">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <topic.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic.title}</h3>
              <p className="text-gray-600 text-sm">{topic.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Help Categories */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore help articles organized by topic to find exactly what you're looking for.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <Link 
                        href="#" 
                        className="text-blue-600 hover:text-blue-700 hover:underline transition duration-200"
                      >
                        {article}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Need More Help?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Get instant help from our support team</p>
              <Link
                href="/contact"
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                Start Chat
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">Speak directly with a support agent</p>
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Call Now
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-gray-600 mb-4">Comprehensive guides and tutorials</p>
              <Link
                href="#"
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition duration-200"
              >
                Browse Docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Join Our Community</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with other TikTok Shop users, share tips, and get advice from experienced sellers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/community-guidelines"
              className="bg-pink-600 text-white px-8 py-3 rounded-md hover:bg-pink-700 transition duration-200 font-semibold"
            >
              Community Guidelines
            </Link>
            <Link
              href="/contact"
              className="bg-white text-pink-600 border border-pink-600 px-8 py-3 rounded-md hover:bg-pink-50 transition duration-200 font-semibold"
            >
              Join Discussion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./main.module.css";

export default function MainPage() {
  return (
    <main className="min-h-screen bg-[#121212] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-2xl font-bold text-pink-500">
            TikTok Shop
          </Link>
          <div className="relative">
            <button className="flex items-center space-x-2 text-gray-300">
              <span>Category</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full px-4 py-2 bg-gray-800 rounded-full text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button className="absolute right-3 top-2">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button className="text-gray-300">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </button>
          <Link
            href="/login"
            className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 pt-20 pb-24 text-center"
        >
          <h1 className="text-pink-500 text-5xl font-bold mb-4">TikTok Shop</h1>
          <h2 className="text-6xl font-bold mb-8 leading-tight">
            Create joy and
            <br />
            sell more
          </h2>
          <p className="text-gray-400 text-xl mb-12">
            Let your customers discover and buy your products the fun way.
          </p>
          <button className="px-8 py-4 bg-pink-500 text-white rounded-full text-lg font-semibold hover:bg-pink-600 transition-colors">
            Get started
          </button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-24">
            <div>
              <h3 className="text-4xl font-bold mb-2">200+</h3>
              <p className="text-gray-400">International Brands</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">2,000+</h3>
              <p className="text-gray-400">High-Quality Products</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold mb-2">30,000+</h3>
              <p className="text-gray-400">Happy Customers</p>
            </div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-screen bg-gradient-to-b from-pink-500/20 to-transparent transform rotate-12 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-screen bg-gradient-to-t from-cyan-500/20 to-transparent transform -rotate-12 -translate-x-1/2 translate-y-1/4"></div>
      </div>
    </main>
  );
}

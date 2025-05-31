"use client";

import { motion } from "framer-motion";
import styles from "./main.module.css";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

export default function MainPage() {
  // Mock authentication state - in a real app, this would come from context/cookies
  const [isAuthenticated] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const suspended = searchParams.get("suspended");

  // Show suspended message if applicable
  useEffect(() => {
    if (suspended === "true") {
      toast.error(
        "Your account has been suspended. Please contact support for assistance.",
        {
          duration: 10000,
          position: "top-center",
          style: {
            border: "1px solid #FF0000",
            padding: "16px",
            color: "#FF0000",
            maxWidth: "500px",
          },
        }
      );
    }
  }, [suspended]);  // Removed navbar state and scroll handling since we're removing the header

  const handleGetStartedClick = () => {
    if (isAuthenticated) {
      router.push("/store");
    } else {
      toast.error("Please login to continue");
      router.push("/login");
    }
  };

  return (    <main className="min-h-screen bg-[#121212] text-white relative">
      {/* Hero Section - Added pt-6 for better spacing */}
      <div className={`${styles.heroSection} pt-6`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-6 pt-20 pb-24 text-center relative z-10"
        >
          <h1
            className={`text-pink-500 text-5xl font-bold mb-4 ${styles.textVisible}`}
          >
            TikTok Shop
          </h1>
          <h2
            className={`text-5xl text-white font-bold mb-8 leading-tight ${styles.textVisible}`}
          >
            Create joy and
            <br />
            sell more
          </h2>
          <p className={`text-gray-400 text-xl mb-12 ${styles.textVisible}`}>
            Let your customers discover and buy your products the fun way.
          </p>
          <button
            onClick={handleGetStartedClick}
            className="px-8 py-4 bg-pink-500 text-white rounded-full text-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Get started
          </button>

          {/* Stats - Added better visibility with improved contrast and colors */}
          <div className="grid grid-cols-3 gap-8 mt-24 relative z-10">
            <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg">
              <h3
                className={`text-cyan-400 text-4xl font-bold mb-2 ${styles.textVisible}`}
              >
                200+
              </h3>
              <p className={`text-white ${styles.textVisible}`}>
                International Brands
              </p>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg">
              <h3
                className={`text-pink-400 text-4xl font-bold mb-2 ${styles.textVisible}`}
              >
                2,000+
              </h3>
              <p className={`text-white ${styles.textVisible}`}>
                High-Quality Products
              </p>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-lg shadow-lg">
              <h3
                className={`text-amber-400 text-4xl font-bold mb-2 ${styles.textVisible}`}
              >
                30,000+
              </h3>
              <p className={`text-white ${styles.textVisible}`}>
                Happy Customers
              </p>
            </div>
          </div>
        </motion.div>

        {/* Decorative Elements - Adjusted opacity and z-index */}
        <div className="absolute top-0 right-0 w-1/3 h-screen bg-gradient-to-b from-pink-500/10 to-transparent transform rotate-12 translate-x-1/2 -translate-y-1/4 z-0"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-screen bg-gradient-to-t from-cyan-500/10 to-transparent transform -rotate-12 -translate-x-1/2 translate-y-1/4 z-0"></div>
      </div>
    </main>
  );
}

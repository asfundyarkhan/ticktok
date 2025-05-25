"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import Image from "next/image";

export default function CartNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const { lastAddedItem, hasNewAddition, clearNewAdditionFlag, setIsCartOpen } =
    useCart();

  useEffect(() => {
    // Show notification when we have a new item added
    if (hasNewAddition && lastAddedItem) {
      setIsVisible(true);

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        clearNewAdditionFlag();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [hasNewAddition, lastAddedItem, clearNewAdditionFlag]);
  return (
    <AnimatePresence>
      {isVisible && lastAddedItem && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="fixed top-5 right-5 z-50 flex items-center bg-white shadow-xl rounded-lg p-4 border-l-4 border-[#FF0059] max-w-sm"
        >
          <div className="flex-shrink-0 mr-3">
            {lastAddedItem.image ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-12 w-12 rounded-md overflow-hidden bg-gray-100"              >
                <Image
                  src={lastAddedItem.image}
                  alt={lastAddedItem.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ) : (
              <div className="h-12 w-12 rounded-md bg-pink-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-[#FF0059]" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-medium text-gray-900 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                Added to cart!
              </h3>
              <p className="text-sm text-gray-600 truncate font-medium">
                {lastAddedItem.name}
              </p>
              <div className="mt-1 flex space-x-2">
                <button
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsVisible(false);
                  }}
                  className="text-xs text-[#FF0059] font-medium hover:underline"
                >
                  View Cart
                </button>
                <span className="text-xs text-gray-400">•</span>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-xs text-gray-500 font-medium hover:underline"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

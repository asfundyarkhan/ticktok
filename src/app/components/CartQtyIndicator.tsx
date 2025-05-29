"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "./NewCartContext";

interface CartQtyIndicatorProps {
  size?: "sm" | "md" | "lg";
  position?:
    | "top-right"
    | "bottom-right"
    | "top-left"
    | "bottom-left"
    | "center";
}

export default function CartQtyIndicator({
  size = "md",
  position = "top-right",
}: CartQtyIndicatorProps) {
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();
  const [prevCount, setPrevCount] = useState(cartCount);
  const [showAnimation, setShowAnimation] = useState(false);

  // Determine size classes
  const sizeClass = {
    sm: { width: "18px", height: "18px", text: "text-xs" },
    md: { width: "20px", height: "20px", text: "text-xs" },
    lg: { width: "24px", height: "24px", text: "text-sm" },
  }[size];

  // Determine position classes
  const positionClass = {
    "top-right": "-top-2 -right-2",
    "bottom-right": "bottom-0 -right-2",
    "top-left": "-top-2 -left-2",
    "bottom-left": "bottom-0 -left-2",
    center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
  }[position];

  // Track changes to cart count to trigger animation
  useEffect(() => {
    if (cartCount > prevCount) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  // Don't show anything if cart is empty
  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={cartCount}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: showAnimation ? 1.3 : 1,
          opacity: 1,
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 20,
          duration: 0.4,
        }}
        className={`absolute ${positionClass} bg-[#FF0059] text-white font-bold rounded-full flex items-center justify-center shadow-md ${sizeClass.text}`}
        style={{
          width:
            cartCount > 99 ? `calc(${sizeClass.width} + 8px)` : sizeClass.width,
          height: sizeClass.height,
        }}
      >
        {cartCount > 99 ? "99+" : cartCount}
      </motion.div>
    </AnimatePresence>
  );
}

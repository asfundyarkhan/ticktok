"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

interface AnimatedCartIconProps {
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AnimatedCartIcon({
  onClick,
  className = "",
  size = "md",
}: AnimatedCartIconProps) {
  const { cartCount, setIsCartOpen } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(cartCount);

  // Determine icon size
  const sizeClass = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }[size];

  // Determine badge size
  const badgeSize = {
    sm: {
      width: cartCount > 9 ? "18px" : "16px",
      height: cartCount > 9 ? "18px" : "16px",
    },
    md: {
      width: cartCount > 9 ? "20px" : "18px",
      height: cartCount > 9 ? "20px" : "18px",
    },
    lg: {
      width: cartCount > 9 ? "22px" : "20px",
      height: cartCount > 9 ? "22px" : "20px",
    },
  }[size];

  // Track changes to cart count to trigger animation
  useEffect(() => {
    if (cartCount > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 800);
      return () => clearTimeout(timer);
    }
    setPrevCount(cartCount);
  }, [cartCount, prevCount]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsCartOpen(true);
    }
  };
  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {" "}
      <motion.div
        animate={isAnimating ? { scale: 1.2 } : { scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      >
        <ShoppingBag className={`${sizeClass} text-[#FF0059]`} />
      </motion.div>
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            key={cartCount} // Add key to force re-render when count changes
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isAnimating ? 1.3 : 1,
              opacity: 1,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="absolute -top-2 -right-2 bg-[#FF0059] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
            style={badgeSize}
          >
            {cartCount > 99 ? "99+" : cartCount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

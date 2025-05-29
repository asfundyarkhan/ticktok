"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "./NewCartContext";
import { toast } from "react-hot-toast";
import { Product } from "@/types/product";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  size?: string;
  className?: string;
  fullWidth?: boolean;
  requiresSize?: boolean;
  buttonText?: string;
  variant?: "filled" | "outline" | "subtle";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function AddToCartButton({
  product,
  quantity = 1,
  size,
  className = "",
  fullWidth = false,
  requiresSize = false,
  buttonText = "Add to Cart",
  variant = "filled",
  onClick,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();

  // Determine variant-specific classes
  const variantClasses = {
    filled: "bg-[#FF0059] text-white hover:bg-[#E0004D]",
    outline: "border-2 border-[#FF0059] text-[#FF0059] hover:bg-pink-50",
    subtle: "bg-pink-50 text-[#FF0059] hover:bg-pink-100",
  }[variant];
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (requiresSize && !size) {
      toast.error("Please select a size");
      return;
    }

    // If custom click handler is provided, use it
    if (onClick) {
      onClick(e);
      return;
    }

    setIsAdding(true);    // Add to cart using CartContext
    addToCart({
      ...product,
      quantity: quantity,
      size: size,
      productId: product.id || '', // Add productId for cart tracking
      rating: product.rating || 0, // Ensure rating is always a number
    });

    // Show success notification
    toast.success(`${product.name} added to your cart!`);

    // Show success state
    setTimeout(() => {
      setIsAdded(true);
      setIsAdding(false);
    }, 300);

    // Reset success state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };
  return (
    <motion.button
      onClick={handleAddToCart}
      disabled={isAdding}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 
        flex items-center justify-center transition-all duration-200 shadow-md
        ${
          isAdded
            ? "bg-green-500 text-white hover:bg-green-600"
            : variantClasses
        }
        ${fullWidth ? "w-full" : ""}
        ${className}`}
    >
      {isAdding ? (
        <span className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Adding...
        </span>
      ) : isAdded ? (
        <span className="flex items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Check className="h-5 w-5 mr-2" />
          </motion.div>
          Added!
        </span>
      ) : (
        <span className="flex items-center">
          <motion.div
            animate={isHovered ? { y: [-1, 1, -1], rotate: [-2, 2, -2] } : {}}
            transition={{ repeat: isHovered ? Infinity : 0, duration: 0.6 }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
          </motion.div>
          {buttonText}

          {isHovered && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ml-2"
            >
              <motion.div
                animate={{ y: [-2, 0, -2] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xs bg-white text-[#FF0059] px-1 py-0.5 rounded-md"
              >
                +1
              </motion.div>
            </motion.div>
          )}
        </span>
      )}
    </motion.button>
  );
}

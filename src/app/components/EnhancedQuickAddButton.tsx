"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { toast } from "react-hot-toast";
import { ShoppingCart, Check } from "lucide-react";
import { motion } from "framer-motion";

interface EnhancedQuickAddButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category?: string;
    description?: string;
    rating?: number;
    reviews?: number;
    salePrice?: number;
  };
  className?: string;
  showIcon?: boolean;
  variant?: "round" | "pill" | "rect";
  size?: "sm" | "md" | "lg";
  onClick?: (e: React.MouseEvent) => void;
}

export default function EnhancedQuickAddButton({
  product,
  className = "",
  showIcon = true,
  variant = "rect",
  size = "md",
  onClick,
}: EnhancedQuickAddButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  // Determine shape-specific classes
  const variantClasses = {
    round: "rounded-full p-2 aspect-square",
    pill: "rounded-full px-4 py-2",
    rect: "rounded-md px-4 py-2",
  }[variant];

  // Determine size-specific classes
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];
  const handleQuickAdd = (e: React.MouseEvent) => {
    setIsAdding(true);

    // Call the onClick prop if provided (for animation)
    if (onClick) {
      onClick(e);
    } else {
      // Add product to cart directly if no onClick handler
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        salePrice: product.salePrice,
        category: product.category || "product",
        rating: product.rating || 0,
        image: product.image,
        reviews: product.reviews || 0,
        quantity: 1,
        description: product.description || "",
      });

      // Show toast notification
      toast.success(`${product.name} added to cart!`);
    }

    // Show success state
    setIsAdded(true);
    setIsAdding(false);

    // Reset button after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };
  return (
    <motion.button
      onClick={(e) => handleQuickAdd(e)}
      disabled={isAdding}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={`relative inline-flex items-center justify-center transition-all duration-200 
        ${
          isAdded
            ? "bg-green-500 text-white hover:bg-green-600 shadow-md"
            : "bg-[#FF0059] text-white hover:bg-[#E0004D] shadow-md"
        } ${variantClasses} ${sizeClasses} ${className}`}
    >
      {" "}
      {isAdding ? (
        <motion.span
          className="flex items-center"
          animate={{ rotate: 10 }}
          transition={{
            type: "tween",
            duration: 0.25,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
          {variant !== "round" && "Adding..."}
        </motion.span>
      ) : isAdded ? (
        <span className="flex items-center">
          {" "}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            <Check
              className={`h-4 w-4 ${
                variant !== "round" && showIcon ? "mr-1" : ""
              }`}
            />
          </motion.div>
          {variant !== "round" && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Added!
            </motion.span>
          )}
        </span>
      ) : (
        <motion.span
          className="flex items-center"
          whileHover={{
            y: [-1, 1, -1],
            transition: { repeat: Infinity, duration: 0.6 },
          }}
        >
          <ShoppingCart
            className={`h-4 w-4 ${
              variant !== "round" && showIcon ? "mr-1" : ""
            }`}
          />
          {variant !== "round" && "Quick Add"}
        </motion.span>
      )}
      {/* Add a ripple effect when clicked */}
      {isAdded && (
        <motion.span
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 rounded-full bg-white"
        />
      )}
    </motion.button>
  );
}

"use client";

import { useState } from "react";
import { useCart } from "./NewCartContext";
import { toast } from "react-hot-toast";
import { ShoppingCart, Check } from "lucide-react";

interface QuickAddButtonProps {
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
    sellerId?: string;
  };
  className?: string;
  showIcon?: boolean;
}

export default function QuickAddButton({
  product,
  className = "",
  showIcon = true,
}: QuickAddButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  const handleQuickAdd = () => {
    setIsAdding(true);    // Add product to cart
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
      sellerId: product.sellerId || "",
      productId: product.id,
    });

    // Show toast notification
    toast.success(`${product.name} added to cart!`);

    // Show success state
    setIsAdded(true);
    setIsAdding(false);

    // Reset button after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleQuickAdd}
      disabled={isAdding}
      className={`relative inline-flex items-center justify-center transition-all duration-200 
        ${
          isAdded
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-[#FF0059] text-white hover:bg-[#E0004D]"
        } ${className}`}
    >
      {isAdding ? (
        <span className="flex items-center">
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
          Adding...
        </span>
      ) : isAdded ? (
        <span className="flex items-center">
          <Check className={`${showIcon ? "mr-1 h-4 w-4" : "hidden"}`} />
          Added!
        </span>
      ) : (
        <span className="flex items-center">
          <ShoppingCart className={`${showIcon ? "mr-1 h-4 w-4" : "hidden"}`} />
          Quick Add
        </span>
      )}
    </button>
  );
}

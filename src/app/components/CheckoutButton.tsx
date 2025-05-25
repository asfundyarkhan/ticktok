"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { toast } from "react-hot-toast";

interface CheckoutButtonProps {
  className?: string;
}

export default function CheckoutButton({
  className = "",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { cartItems, clearCart } = useCart();
  const router = useRouter();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    try {
      // Simulate checkout process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // On success
      toast.success("Order placed successfully!");
      clearCart();      router.push("/checkout/success");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || cartItems.length === 0}
      className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-all duration-200 
        ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : cartItems.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#FF0059] hover:bg-[#E0004D] active:transform active:scale-95"
        } ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
          Processing...
        </span>
      ) : (
        "Proceed to Checkout"
      )}
    </button>
  );
}

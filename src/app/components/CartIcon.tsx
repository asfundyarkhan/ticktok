"use client";

import { useCart } from "./CartContext";
import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartIconProps {
  onClick?: () => void;
  className?: string;
}

export default function CartIcon({ onClick, className = "" }: CartIconProps) {
  const { cartCount, setIsCartOpen } = useCart();

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
      <ShoppingBag className="h-6 w-6" />
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-[#FF0059] text-white text-xs font-bold rounded-full flex items-center justify-center"
            style={{
              width: cartCount > 9 ? "20px" : "18px",
              height: cartCount > 9 ? "20px" : "18px",
            }}
          >
            {cartCount > 99 ? "99+" : cartCount}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

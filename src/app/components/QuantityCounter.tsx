"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityCounterProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function QuantityCounter({
  quantity,
  onQuantityChange,
  min = 1,
  max = 999999,
  disabled = false,
  className = "",
  size = "md",
}: QuantityCounterProps) {  const sizeClasses = {
    sm: {
      button: "px-2 py-1 text-xs",
      input: "px-2 py-1 text-xs w-16",
      icon: "h-3 w-3",
    },
    md: {
      button: "px-3 py-2 text-sm",
      input: "px-3 py-2 text-sm w-20",
      icon: "h-4 w-4",
    },
    lg: {
      button: "px-4 py-2 text-base",
      input: "px-4 py-2 text-base w-24",
      icon: "h-5 w-5",
    },
  };

  const handleDecrease = () => {
    if (disabled || quantity <= min) return;
    onQuantityChange(Math.max(min, quantity - 1));
  };

  const handleIncrease = () => {
    if (disabled || quantity >= max) return;
    onQuantityChange(Math.min(max, quantity + 1));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  const canDecrease = !disabled && quantity > min;
  const canIncrease = !disabled && quantity < max;

  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={handleDecrease}
        disabled={!canDecrease}
        className={`
          ${sizeClasses[size].button}
          bg-gray-200 hover:bg-gray-300 
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50
          rounded-l-md border border-gray-300 border-r-0
          flex items-center justify-center
          transition-colors duration-150
        `}
        aria-label="Decrease quantity"
      >
        <Minus className={sizeClasses[size].icon} />
      </button>
      
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        className={`
          ${sizeClasses[size].input}
          border-t border-b border-gray-300 text-center
          disabled:bg-gray-100 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
        aria-label="Quantity"
      />
      
      <button
        onClick={handleIncrease}
        disabled={!canIncrease}
        className={`
          ${sizeClasses[size].button}
          bg-gray-200 hover:bg-gray-300 
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50
          rounded-r-md border border-gray-300 border-l-0
          flex items-center justify-center
          transition-colors duration-150
        `}
        aria-label="Increase quantity"
      >
        <Plus className={sizeClasses[size].icon} />
      </button>
    </div>
  );
}

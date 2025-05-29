"use client";

import { motion } from "framer-motion";
import { CSSProperties } from "react";

type CartAnimationProps = {
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  productImage?: string;
  onAnimationComplete?: () => void;
  size?: number;
};

export function FlyToCartAnimation({
  startPosition,
  endPosition,
  productImage,
  onAnimationComplete,
  size = 40,
}: CartAnimationProps) {
  const style: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    zIndex: 1000,    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundImage: productImage ? `url(${productImage})` : undefined,
    backgroundColor: !productImage ? "#FF0059" : undefined,
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
  };

  return (
    <motion.div
      style={style}
      initial={{
        x: startPosition.x,
        y: startPosition.y,
        opacity: 1,
        scale: 1,
      }}
      animate={{
        x: endPosition.x,
        y: endPosition.y,
        opacity: 0,
        scale: 0.5,
      }}
      transition={{
        type: "spring",
        duration: 0.7,
        bounce: 0.3,
      }}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

export function CartBounceAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: 1.2 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 10,
        duration: 0.5,
      }}
    >
      {children}
    </motion.div>
  );
}

export function CartItemAddedAnimation({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

export function CartNotificationBadge({ count }: { count: number }) {
  const showCount = count > 99 ? "99+" : count;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute -top-2 -right-2 bg-[#FF0059] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md"
      style={{
        width: count > 9 ? "20px" : "18px",
        height: count > 9 ? "20px" : "18px",
      }}
    >
      {showCount}
    </motion.div>
  );
}

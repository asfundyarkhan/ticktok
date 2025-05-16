"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem } from "@/types/product";

interface CartContextType {
  cartItems: CartItem[];
  savedItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSavedItem: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  savedItemsCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  lastAddedItem: CartItem | null;
  hasNewAddition: boolean;
  clearNewAdditionFlag: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Safe localStorage getter function
const getFromLocalStorage = (key: string, defaultValue: any = null) => {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Safe localStorage setter function
const setToLocalStorage = (key: string, value: any) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [hasNewAddition, setHasNewAddition] = useState(false);

  // Load cart and saved items from localStorage on first render
  useEffect(() => {
    const savedCart = getFromLocalStorage("cart", []);
    if (savedCart.length > 0) {
      setCartItems(savedCart);
    }

    const savedForLater = getFromLocalStorage("savedItems", []);
    if (savedForLater.length > 0) {
      setSavedItems(savedForLater);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    setToLocalStorage("cart", cartItems);
  }, [cartItems]);

  // Save savedItems to localStorage whenever it changes
  useEffect(() => {
    setToLocalStorage("savedItems", savedItems);
  }, [savedItems]);
  const addToCart = (item: CartItem) => {
    // Set as last added item for cart notification
    setLastAddedItem(item);
    setHasNewAddition(true);

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
      );

      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map((i) =>
          i.id === item.id && i.size === item.size && i.color === item.color
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  const clearNewAdditionFlag = () => {
    setHasNewAddition(false);
  };

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };
  const saveForLater = (id: string) => {
    const itemToSave = cartItems.find((item) => item.id === id);
    if (itemToSave) {
      // Remove from cart
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      // Add to saved items
      setSavedItems((prev) => [
        ...prev,
        { ...itemToSave, savedForLater: true },
      ]);
    }
  };

  const moveToCart = (id: string) => {
    const itemToMove = savedItems.find((item) => item.id === id);
    if (itemToMove) {
      // Remove from saved items
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
      // Add to cart
      const { savedForLater, ...cartItem } = itemToMove;
      addToCart(cartItem);
    }
  };

  const removeSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.salePrice || item.price) * item.quantity,
    0
  );

  const savedItemsCount = savedItems.length;
  const value = {
    cartItems,
    savedItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveToCart,
    removeSavedItem,
    clearCart,
    cartCount,
    cartTotal,
    savedItemsCount,
    isCartOpen,
    setIsCartOpen,
    lastAddedItem,
    hasNewAddition,
    clearNewAdditionFlag,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

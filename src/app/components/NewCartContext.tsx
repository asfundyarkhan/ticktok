"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { NewCartService, CartItem } from "@/services/newCartService";
import { toast } from "react-hot-toast";
import { generateUniqueId } from "../../utils/idGenerator";

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  loading: boolean;
  addToCart: (item: Partial<CartItem>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  refreshCart: () => Promise<void>;
  lastAddedItem: CartItem | null;
  hasNewAddition: boolean;
  clearNewAdditionFlag: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// Safe localStorage functions
const getFromLocalStorage = (key: string, defaultValue: unknown = null) => {
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

const setToLocalStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export function NewCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [hasNewAddition, setHasNewAddition] = useState(false);

  // Load cart when user changes
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // Load from Firestore for authenticated users
          const items = await NewCartService.getCart(user.uid);
          setCartItems(items);
        } else {
          // Load from localStorage for guests
          const localItems = getFromLocalStorage("cart_items", []);
          setCartItems(localItems);
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Save to localStorage for guests
  useEffect(() => {
    if (!user) {
      setToLocalStorage("cart_items", cartItems);
    }
  }, [cartItems, user]);

  const refreshCart = async () => {
    if (user) {
      const items = await NewCartService.getCart(user.uid);
      setCartItems(items);
    }
  };

  const addToCart = async (item: Partial<CartItem>) => {
    setLoading(true);
    try {
      // Validate required fields
      if (!item.name || (!item.price && item.price !== 0) || !item.productId) {
        toast.error("Invalid product data");
        return;
      }

      // Check stock
      const currentQuantity = cartItems
        .filter(i => i.productId === item.productId)
        .reduce((total, i) => total + i.quantity, 0);
      
      const newQuantity = currentQuantity + (item.quantity || 1);
      const maxStock = item.stock || 0;

      if (maxStock > 0 && newQuantity > maxStock) {
        toast.error(`Cannot add more items. Only ${maxStock} available in stock.`);
        return;
      }      if (user) {
        // Add to Firestore
        const success = await NewCartService.addToCart(user.uid, item);
        if (success) {
          await refreshCart();          // Set notification state
          const newItem = cartItems.find(i => i.productId === item.productId) || {
            id: item.id || item.productId || generateUniqueId('new'),
            productId: item.productId || generateUniqueId('prod'),
            name: item.name || "Unknown Product",
            price: typeof item.price === 'number' ? item.price : 0,
            image: item.image || "/images/placeholders/product.svg",
            quantity: item.quantity || 1,
          } as CartItem;
          setLastAddedItem(newItem);
          setHasNewAddition(true);
          // Removed toast notification - using CartNotification instead
        } else {
          toast.error("Failed to add item to cart");
        }
      } else {
        // Add to local cart
        let addedItem: CartItem | null = null;
        setCartItems(prevItems => {
          const existingIndex = prevItems.findIndex(
            i => i.productId === item.productId && 
                 i.size === item.size && 
                 i.color === item.color
          );

          if (existingIndex >= 0) {
            // Update existing item
            addedItem = prevItems[existingIndex];
            return prevItems.map((i, index) => 
              index === existingIndex 
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            );
          } else {            // Add new item
            const newItem: CartItem = {
              id: item.id || item.productId || generateUniqueId('local'),
              productId: item.productId || generateUniqueId('prod'),
              name: item.name || "Unknown Product",
              price: typeof item.price === 'number' ? item.price : 0,
              salePrice: item.salePrice,
              image: item.image || "/images/placeholders/product.svg",
              quantity: item.quantity || 1,
              sellerId: item.sellerId || "",
              category: item.category || "Uncategorized",
              description: item.description || "",
              stock: item.stock || 0,
              rating: item.rating || 0,
              size: item.size,
              color: item.color,
              addedAt: new Date(),
              updatedAt: new Date(),
            };
            addedItem = newItem;
            return [...prevItems, newItem];
          }
        });
        // Set notification state
        if (addedItem) {
          setLastAddedItem(addedItem);
          setHasNewAddition(true);
        }
        // Removed toast notification - using CartNotification instead
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    setLoading(true);
    try {
      if (user) {
        const success = await NewCartService.removeFromCart(user.uid, itemId);
        if (success) {
          await refreshCart();
          // Removed toast notification for less clutter
        } else {
          toast.error("Failed to remove item");
        }
      } else {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
        // Removed toast notification for less clutter
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // Check stock limits before updating
    const currentItem = cartItems.find(item => item.id === itemId);
    if (currentItem) {
      const maxStock = Number(currentItem.stock) || 0;
      if (maxStock > 0 && quantity > maxStock) {
        toast.error(`Cannot add more items. Only ${maxStock} available in stock.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (user) {
        const success = await NewCartService.updateQuantity(user.uid, itemId, quantity);
        if (success) {
          await refreshCart();
        }
      } else {
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      if (user) {
        const success = await NewCartService.clearCart(user.uid);
        if (success) {
          setCartItems([]);
          // Removed toast notification for less clutter
        }
      } else {
        setCartItems([]);
        // Removed toast notification for less clutter
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearNewAdditionFlag = () => {
    setHasNewAddition(false);
  };

  const value: CartContextType = {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    refreshCart,
    lastAddedItem,
    hasNewAddition,
    clearNewAdditionFlag,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

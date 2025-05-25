"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem } from "@/types/product";
import { useAuth } from "../../context/AuthContext";
import { CartService } from "../../services/cartService";

interface OperationLoadingState {
  addToCart: boolean;
  removeFromCart: boolean;
  updateQuantity: boolean;
  saveForLater: boolean;
  moveToCart: boolean;
  removeSavedItem: boolean;
  clearCart: boolean;
}

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
  loading: boolean;
  operationLoading: OperationLoadingState;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Safe localStorage getter function
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

// Safe localStorage setter function
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

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [hasNewAddition, setHasNewAddition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [operationLoading, setOperationLoading] = useState({
    addToCart: false,
    removeFromCart: false,
    updateQuantity: false,
    saveForLater: false,
    moveToCart: false,
    removeSavedItem: false,
    clearCart: false,
  });

  // Load cart and saved items on user change
  useEffect(() => {
    const loadUserCart = async () => {
      setLoading(true);
      try {
        if (user) {
          // User is logged in, load from Firestore
          const userCartItems = await CartService.getCart(user.uid);
          const userSavedItems = await CartService.getSavedItems(user.uid);
          setCartItems(userCartItems);
          setSavedItems(userSavedItems);
        } else {
          // User is not logged in, load from localStorage
          const savedCart = getFromLocalStorage("cart", []);
          if (savedCart.length > 0) {
            setCartItems(savedCart);
          }

          const savedForLater = getFromLocalStorage("savedItems", []);
          if (savedForLater.length > 0) {
            setSavedItems(savedForLater);
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserCart();
  }, [user]);

  // Save cart to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      setToLocalStorage("cart", cartItems);
    }
  }, [cartItems, user]);

  // Save savedItems to localStorage when not logged in
  useEffect(() => {
    if (!user) {
      setToLocalStorage("savedItems", savedItems);
    }
  }, [savedItems, user]);
  const addToCart = async (item: CartItem) => {
    // Set as last added item for cart notification
    setLastAddedItem(item);
    setHasNewAddition(true);

    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, addToCart: true }));

      if (user) {
        // User is logged in, add to Firestore
        await CartService.addToCart(user.uid, item);

        // Refresh cart from Firestore
        const updatedCart = await CartService.getCart(user.uid);
        setCartItems(updatedCart);
      } else {
        // User is not logged in, use local state
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
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, addToCart: false }));
    }
  };
  const clearNewAdditionFlag = () => {
    setHasNewAddition(false);
  };
  const removeFromCart = async (id: string) => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, removeFromCart: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.removeFromCart(user.uid, id);

        // Refresh cart from Firestore
        const updatedCart = await CartService.getCart(user.uid);
        setCartItems(updatedCart);
      } else {
        // User is not logged in, update local state
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, removeFromCart: false }));
    }
  };
  const updateQuantity = async (id: string, quantity: number) => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, updateQuantity: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.updateQuantity(user.uid, id, quantity);

        // Refresh cart from Firestore
        const updatedCart = await CartService.getCart(user.uid);
        setCartItems(updatedCart);
      } else {
        // User is not logged in, update local state
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, updateQuantity: false }));
    }
  };

  const saveForLater = async (id: string) => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, saveForLater: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.saveForLater(user.uid, id);

        // Refresh cart and saved items from Firestore
        const [updatedCart, updatedSavedItems] = await Promise.all([
          CartService.getCart(user.uid),
          CartService.getSavedItems(user.uid),
        ]);
        setCartItems(updatedCart);
        setSavedItems(updatedSavedItems);
      } else {
        // User is not logged in, use local state
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
      }
    } catch (error) {
      console.error("Error saving item for later:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, saveForLater: false }));
    }
  };
  const moveToCart = async (id: string) => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, moveToCart: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.moveToCart(user.uid, id);

        // Refresh cart and saved items from Firestore
        const [updatedCart, updatedSavedItems] = await Promise.all([
          CartService.getCart(user.uid),
          CartService.getSavedItems(user.uid),
        ]);
        setCartItems(updatedCart);
        setSavedItems(updatedSavedItems);
      } else {
        // User is not logged in, use local state
        const itemToMove = savedItems.find((item) => item.id === id);
        if (itemToMove) {
          // Remove from saved items        setSavedItems((prev) => prev.filter((item) => item.id !== id));
          // Add to cart - remove savedForLater property
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { savedForLater, ...cartItem } = itemToMove;
          // Directly add to cart without triggering the addToCart function's loading state
          setCartItems((prevItems) => [...prevItems, cartItem]);
        }
      }
    } catch (error) {
      console.error("Error moving item to cart:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, moveToCart: false }));
    }
  };
  const removeSavedItem = async (id: string) => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, removeSavedItem: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.removeSavedItem(user.uid, id);

        // Refresh saved items from Firestore
        const updatedSavedItems = await CartService.getSavedItems(user.uid);
        setSavedItems(updatedSavedItems);
      } else {
        // User is not logged in, update local state
        setSavedItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error("Error removing saved item:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, removeSavedItem: false }));
    }
  };
  const clearCart = async () => {
    try {
      // Set operation loading state
      setOperationLoading((prev) => ({ ...prev, clearCart: true }));

      if (user) {
        // User is logged in, use Firestore
        await CartService.clearCart(user.uid);

        // Refresh cart from Firestore
        const updatedCart = await CartService.getCart(user.uid);
        setCartItems(updatedCart);
      } else {
        // User is not logged in, update local state
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setOperationLoading((prev) => ({ ...prev, clearCart: false }));
    }
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
    loading,
    operationLoading,
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

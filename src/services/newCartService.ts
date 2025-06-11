// New Cart Service - Clean implementation without undefined values
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { generateUniqueId } from "../utils/idGenerator";

// Simple cart item interface
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  quantity: number;
  sellerId: string;
  category: string;
  description: string;
  stock: number;
  rating: number;
  size?: string;
  color?: string;
  addedAt: Date;
  updatedAt: Date;
}

// Clean cart data for Firestore
interface FirestoreCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice: number | null;
  image: string;
  quantity: number;
  sellerId: string;
  category: string;
  description: string;
  stock: number;
  rating: number;
  size: string | null;
  color: string | null;
  addedAt: Timestamp;
  updatedAt: Timestamp;
}

export class NewCartService {
  private static COLLECTION = "carts";

  // Sanitize cart item - ensures no undefined values
  private static sanitizeCartItem(item: Partial<CartItem>): FirestoreCartItem {
    const now = Timestamp.now();
    return {
      id: item.id || item.productId || generateUniqueId("item"),
      productId: item.productId || item.id || generateUniqueId("prod"),
      name: item.name || "Unknown Product",
      price: typeof item.price === "number" ? item.price : 0,
      salePrice: typeof item.salePrice === "number" ? item.salePrice : null,
      image: item.image || "/images/placeholders/product.svg",
      quantity:
        typeof item.quantity === "number" && item.quantity > 0
          ? item.quantity
          : 1,
      sellerId: item.sellerId || "",
      category: item.category || "Uncategorized",
      description: item.description || "",
      stock: typeof item.stock === "number" ? item.stock : 0,
      rating: typeof item.rating === "number" ? item.rating : 0,
      size: item.size || null,
      color: item.color || null,
      addedAt: now,
      updatedAt: now,
    };
  }

  // Convert Firestore item to CartItem
  private static firestoreToCartItem(fsItem: FirestoreCartItem): CartItem {
    return {
      id: fsItem.id,
      productId: fsItem.productId,
      name: fsItem.name,
      price: fsItem.price,
      salePrice: fsItem.salePrice || undefined,
      image: fsItem.image,
      quantity: fsItem.quantity,
      sellerId: fsItem.sellerId,
      category: fsItem.category,
      description: fsItem.description,
      stock: fsItem.stock,
      rating: fsItem.rating,
      size: fsItem.size || undefined,
      color: fsItem.color || undefined,
      addedAt: fsItem.addedAt.toDate(),
      updatedAt: fsItem.updatedAt.toDate(),
    };
  }

  // Get user's cart
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return [];
      }

      const cartData = docSnap.data();
      const items = cartData.items || [];

      return items.map((item: FirestoreCartItem) =>
        this.firestoreToCartItem(item)
      );
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  }

  // Add item to cart
  static async addToCart(
    userId: string,
    item: Partial<CartItem>
  ): Promise<boolean> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      const sanitizedItem = this.sanitizeCartItem(item);

      if (!docSnap.exists()) {
        // Create new cart
        await setDoc(cartRef, {
          userId,
          items: [sanitizedItem],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        return true;
      }

      // Get existing cart data
      const cartData = docSnap.data();
      const existingItems: FirestoreCartItem[] = cartData.items || [];

      // Check if item already exists
      const existingIndex = existingItems.findIndex(
        (existing) =>
          existing.productId === sanitizedItem.productId &&
          existing.size === sanitizedItem.size &&
          existing.color === sanitizedItem.color
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        existingItems[existingIndex].quantity += sanitizedItem.quantity;
        existingItems[existingIndex].updatedAt = Timestamp.now();

        await updateDoc(cartRef, {
          items: existingItems,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Add new item using array replacement to avoid arrayUnion issues
        await updateDoc(cartRef, {
          items: [...existingItems, sanitizedItem],
          updatedAt: Timestamp.now(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return false;
    }
  }

  // Remove item from cart
  static async removeFromCart(
    userId: string,
    itemId: string
  ): Promise<boolean> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return false;
      }

      const cartData = docSnap.data();
      const items: FirestoreCartItem[] = cartData.items || [];

      const updatedItems = items.filter((item) => item.id !== itemId);

      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error("Error removing item from cart:", error);
      return false;
    }
  }

  // Update item quantity
  static async updateQuantity(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      if (quantity <= 0) {
        return this.removeFromCart(userId, itemId);
      }

      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return false;
      }

      const cartData = docSnap.data();
      const items: FirestoreCartItem[] = cartData.items || [];

      const updatedItems = items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: Math.max(1, quantity),
            updatedAt: Timestamp.now(),
          };
        }
        return item;
      });

      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  }

  // Clear cart
  static async clearCart(userId: string): Promise<boolean> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);

      await updateDoc(cartRef, {
        items: [],
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }

  // Get cart item count
  static async getCartItemCount(userId: string): Promise<number> {
    try {
      const items = await this.getCart(userId);
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error("Error getting cart count:", error);
      return 0;
    }
  }
}

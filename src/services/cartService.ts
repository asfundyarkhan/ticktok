// Firestore service for cart operations
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import { firestore } from "../lib/firebase/firebase";
import { CartItem } from "@/types/product";

interface FirestoreCartItem extends Omit<CartItem, "id"> {
  productId: string;
  addedAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export class CartService {
  static COLLECTION = "carts";
  // Helper function to convert Firestore timestamps to Date objects
  private static convertTimestamp(
    timestamp: Date | Timestamp | { toDate(): Date } | undefined
  ): Date {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (
      timestamp &&
      "toDate" in timestamp &&
      typeof timestamp.toDate === "function"
    ) {
      return timestamp.toDate();
    }
    return new Date();
  }

  // Helper function to sanitize cart item data
  private static sanitizeCartItem(item: CartItem): FirestoreCartItem {
    return {
      name: item.name || "Unknown Product",
      price: typeof item.price === "number" ? item.price : 0,
      salePrice:
        typeof item.salePrice === "number" ? item.salePrice : undefined,
      category: item.category || "Uncategorized",
      image: item.image || "/images/placeholders/product.svg",
      description: item.description || "",
      sellerId: item.sellerId || "",
      sellerName: item.sellerName || "",
      stock: typeof item.stock === "number" ? item.stock : 0,
      rating: typeof item.rating === "number" ? item.rating : 0,
      reviews: typeof item.reviews === "number" ? item.reviews : 0,
      productCode: item.productCode || "",
      listed: typeof item.listed === "boolean" ? item.listed : true,
      isSale: typeof item.isSale === "boolean" ? item.isSale : false,
      salePercentage:
        typeof item.salePercentage === "number" ? item.salePercentage : 0,
      productId: item.productId || item.id || `PROD-${Date.now()}`,
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      size: item.size || undefined,
      color: item.color || undefined,
      savedForLater:
        typeof item.savedForLater === "boolean" ? item.savedForLater : false,
      addedAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Get a user's cart
  static async getCart(userId: string): Promise<CartItem[]> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return [];
      }

      const cartData = docSnap.data();

      if (!cartData.items || !Array.isArray(cartData.items)) {
        return [];
      } // Format and return the cart items
      return cartData.items.map((item: FirestoreCartItem) => ({
        ...item,
        id: item.productId,
        addedAt: this.convertTimestamp(item.addedAt),
        updatedAt: this.convertTimestamp(item.updatedAt),
      }));
    } catch (error) {
      console.error("Error getting cart:", error);
      throw error;
    }
  }

  // Get saved items
  static async getSavedItems(userId: string): Promise<CartItem[]> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return [];
      }

      const cartData = docSnap.data();

      if (!cartData.savedItems || !Array.isArray(cartData.savedItems)) {
        return [];
      } // Format and return the saved items
      return cartData.savedItems.map((item: FirestoreCartItem) => ({
        ...item,
        id: item.productId,
        savedForLater: true,
        addedAt: this.convertTimestamp(item.addedAt),
        updatedAt: this.convertTimestamp(item.updatedAt),
      }));
    } catch (error) {
      console.error("Error getting saved items:", error);
      throw error;
    }
  }
  // Add an item to cart
  static async addToCart(userId: string, item: CartItem): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      // Convert item to Firestore format with sanitization
      const firestoreItem = this.sanitizeCartItem(item);

      if (!docSnap.exists()) {
        // Create new cart if it doesn't exist
        await setDoc(cartRef, {
          userId,
          items: [firestoreItem],
          savedItems: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        // Check if item already exists in cart
        const cartData = docSnap.data();
        const existingItemIndex = cartData.items.findIndex(
          (i: FirestoreCartItem) =>
            i.productId === firestoreItem.productId &&
            i.size === firestoreItem.size &&
            i.color === firestoreItem.color
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const existingItem = cartData.items[existingItemIndex];
          cartData.items[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + firestoreItem.quantity,
            updatedAt: new Date(),
          };

          await updateDoc(cartRef, {
            items: cartData.items,
            updatedAt: Timestamp.now(),
          });
        } else {
          // Add new item to cart
          await updateDoc(cartRef, {
            items: arrayUnion(firestoreItem),
            updatedAt: Timestamp.now(),
          });
        }
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  }

  // Remove an item from cart
  static async removeFromCart(
    userId: string,
    productId: string
  ): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      const cartData = docSnap.data();

      // Filter out the item to remove
      const updatedItems = cartData.items.filter(
        (item: FirestoreCartItem) => item.productId !== productId
      );

      // Update the cart with filtered items
      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error removing item from cart:", error);
      throw error;
    }
  }

  // Update item quantity
  static async updateQuantity(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      const cartData = docSnap.data();
      const updatedItems = cartData.items.map((item: FirestoreCartItem) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity,
            updatedAt: new Date(),
          };
        }
        return item;
      });

      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating item quantity:", error);
      throw error;
    }
  }
  // Save item for later
  static async saveForLater(userId: string, productId: string): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      const cartData = docSnap.data();

      // Find the item to save
      const itemToSave = cartData.items.find(
        (item: FirestoreCartItem) => item.productId === productId
      );

      if (!itemToSave) {
        return;
      }

      // Remove the item from cart items
      const updatedItems = cartData.items.filter(
        (item: FirestoreCartItem) => item.productId !== productId
      );

      // Sanitize the item before saving
      const savedItem = {
        ...itemToSave,
        name: itemToSave.name || "Unknown Product",
        price: typeof itemToSave.price === "number" ? itemToSave.price : 0,
        salePrice:
          typeof itemToSave.salePrice === "number"
            ? itemToSave.salePrice
            : undefined,
        category: itemToSave.category || "Uncategorized",
        image: itemToSave.image || "/images/placeholders/product.svg",
        description: itemToSave.description || "",
        sellerId: itemToSave.sellerId || "",
        sellerName: itemToSave.sellerName || "",
        stock: typeof itemToSave.stock === "number" ? itemToSave.stock : 0,
        rating: typeof itemToSave.rating === "number" ? itemToSave.rating : 0,
        reviews:
          typeof itemToSave.reviews === "number" ? itemToSave.reviews : 0,
        productCode: itemToSave.productCode || "",
        listed:
          typeof itemToSave.listed === "boolean" ? itemToSave.listed : true,
        isSale:
          typeof itemToSave.isSale === "boolean" ? itemToSave.isSale : false,
        salePercentage:
          typeof itemToSave.salePercentage === "number"
            ? itemToSave.salePercentage
            : 0,
        productId: itemToSave.productId || `PROD-${Date.now()}`,
        quantity:
          typeof itemToSave.quantity === "number" ? itemToSave.quantity : 1,
        size: itemToSave.size || undefined,
        color: itemToSave.color || undefined,
        savedForLater: true,
        addedAt: itemToSave.addedAt || new Date(),
        updatedAt: new Date(),
      };

      await updateDoc(cartRef, {
        items: updatedItems,
        savedItems: arrayUnion(savedItem),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error saving item for later:", error);
      throw error;
    }
  }
  // Move item to cart
  static async moveToCart(userId: string, productId: string): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      const cartData = docSnap.data();

      // Find the item to move
      const itemToMove = cartData.savedItems.find(
        (item: FirestoreCartItem) => item.productId === productId
      );

      if (!itemToMove) {
        return;
      }

      // Remove the item from saved items
      const updatedSavedItems = cartData.savedItems.filter(
        (item: FirestoreCartItem) => item.productId !== productId
      );

      // Sanitize the item before moving to cart
      const cartItem = {
        ...itemToMove,
        name: itemToMove.name || "Unknown Product",
        price: typeof itemToMove.price === "number" ? itemToMove.price : 0,
        salePrice:
          typeof itemToMove.salePrice === "number"
            ? itemToMove.salePrice
            : undefined,
        category: itemToMove.category || "Uncategorized",
        image: itemToMove.image || "/images/placeholders/product.svg",
        description: itemToMove.description || "",
        sellerId: itemToMove.sellerId || "",
        sellerName: itemToMove.sellerName || "",
        stock: typeof itemToMove.stock === "number" ? itemToMove.stock : 0,
        rating: typeof itemToMove.rating === "number" ? itemToMove.rating : 0,
        reviews:
          typeof itemToMove.reviews === "number" ? itemToMove.reviews : 0,
        productCode: itemToMove.productCode || "",
        listed:
          typeof itemToMove.listed === "boolean" ? itemToMove.listed : true,
        isSale:
          typeof itemToMove.isSale === "boolean" ? itemToMove.isSale : false,
        salePercentage:
          typeof itemToMove.salePercentage === "number"
            ? itemToMove.salePercentage
            : 0,
        productId: itemToMove.productId || `PROD-${Date.now()}`,
        quantity:
          typeof itemToMove.quantity === "number" ? itemToMove.quantity : 1,
        size: itemToMove.size || undefined,
        color: itemToMove.color || undefined,
        savedForLater: false,
        addedAt: itemToMove.addedAt || new Date(),
        updatedAt: new Date(),
      };

      await updateDoc(cartRef, {
        savedItems: updatedSavedItems,
        items: arrayUnion(cartItem),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error moving item to cart:", error);
      throw error;
    }
  }

  // Remove saved item
  static async removeSavedItem(
    userId: string,
    productId: string
  ): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      const cartData = docSnap.data();

      // Filter out the item to remove
      const updatedSavedItems = cartData.savedItems.filter(
        (item: FirestoreCartItem) => item.productId !== productId
      );

      // Update the cart with filtered saved items
      await updateDoc(cartRef, {
        savedItems: updatedSavedItems,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error removing saved item:", error);
      throw error;
    }
  }

  // Clear cart
  static async clearCart(userId: string): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);

      if (!docSnap.exists()) {
        return;
      }

      await updateDoc(cartRef, {
        items: [],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  }
}

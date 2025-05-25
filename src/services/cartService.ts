// Firestore service for cart operations
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { firestore } from '../lib/firebase/firebase';
import { CartItem } from '@/types/product';

interface FirestoreCartItem extends Omit<CartItem, 'id'> {
  productId: string;
  addedAt: Date;
  updatedAt: Date;
}

export class CartService {
  static COLLECTION = 'carts';
  
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
      }
      
      // Format and return the cart items
      return cartData.items.map((item: FirestoreCartItem) => ({
        ...item,
        id: item.productId,
        addedAt: item.addedAt?.toDate(),
        updatedAt: item.updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting cart:', error);
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
      }
      
      // Format and return the saved items
      return cartData.savedItems.map((item: FirestoreCartItem) => ({
        ...item,
        id: item.productId,
        savedForLater: true,
        addedAt: item.addedAt?.toDate(),
        updatedAt: item.updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting saved items:', error);
      throw error;
    }
  }
  
  // Add an item to cart
  static async addToCart(userId: string, item: CartItem): Promise<void> {
    try {
      const cartRef = doc(firestore, this.COLLECTION, userId);
      const docSnap = await getDoc(cartRef);
      
      // Convert item to Firestore format
      const firestoreItem: FirestoreCartItem = {
        ...item,
        productId: item.id,
        addedAt: new Date(),
        updatedAt: new Date(),
      };      // We'll keep the firestoreItem as is and use it directly
      
      if (!docSnap.exists()) {
        // Create new cart if it doesn't exist
        await setDoc(cartRef, {
          userId,
          items: [firestoreItem],
          savedItems: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      } else {
        // Check if item already exists in cart
        const cartData = docSnap.data();
        const existingItemIndex = cartData.items.findIndex(
          (i: FirestoreCartItem) => 
            i.productId === item.id && 
            i.size === item.size && 
            i.color === item.color
        );
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          const existingItem = cartData.items[existingItemIndex];
          cartData.items[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
            updatedAt: new Date()
          };
          
          await updateDoc(cartRef, {
            items: cartData.items,
            updatedAt: Timestamp.now()
          });
        } else {
          // Add new item to cart
          await updateDoc(cartRef, {
            items: arrayUnion(firestoreItem),
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }
  
  // Remove an item from cart
  static async removeFromCart(userId: string, productId: string): Promise<void> {
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
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }
  
  // Update item quantity
  static async updateQuantity(userId: string, productId: string, quantity: number): Promise<void> {
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
            updatedAt: new Date()
          };
        }
        return item;
      });
      
      await updateDoc(cartRef, {
        items: updatedItems,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating item quantity:', error);
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
      
      // Add the item to saved items
      const savedItem = {
        ...itemToSave,
        updatedAt: new Date()
      };
      
      await updateDoc(cartRef, {
        items: updatedItems,
        savedItems: arrayUnion(savedItem),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving item for later:', error);
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
      
      // Add the item to cart items
      const cartItem = {
        ...itemToMove,
        updatedAt: new Date()
      };
      
      await updateDoc(cartRef, {
        savedItems: updatedSavedItems,
        items: arrayUnion(cartItem),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error moving item to cart:', error);
      throw error;
    }
  }
  
  // Remove saved item
  static async removeSavedItem(userId: string, productId: string): Promise<void> {
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
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing saved item:', error);
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
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}

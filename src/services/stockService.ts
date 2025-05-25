// Firestore service for admin stock management
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  runTransaction,
  DocumentData,
  Transaction,
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../lib/firebase/firebase';
import { StockItem, PurchaseResult, StockListing } from '../types/marketplace';

// Re-export types for convenience
export type { StockItem, PurchaseResult, StockListing } from '../types/marketplace';

// Error types
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientBalanceError';
  }
}

export class StockService {
  private static COLLECTION = 'adminStock';
  private static INVENTORY_COLLECTION = 'inventory';
  private static PURCHASES_COLLECTION = 'purchases';
  private static LISTINGS_COLLECTION = 'listings';

  // Active listeners store
  private static activeListeners: Map<string, Unsubscribe> = new Map();

  // Real-time sync methods
  static subscribeToSellerListings(
    sellerId: string,
    onUpdate: (listings: StockListing[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const listenerKey = `listings_${sellerId}`;
      
      // Unsubscribe existing listener if any
      this.unsubscribeListener(listenerKey);
      
      const listingsQuery = query(
        collection(firestore, this.LISTINGS_COLLECTION),
        where('sellerId', '==', sellerId),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        listingsQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const listings: StockListing[] = [];
          snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (data) {
              listings.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
              } as StockListing);
            }
          });
          onUpdate(listings);
        },
        (error: Error) => {
          console.error('Error in listings subscription:', error);
          if (onError) onError(error);
        }
      );
      
      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);
      
      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error('Error setting up listings subscription:', error);
      throw error;
    }
  }

  static subscribeToInventory(
    sellerId: string,
    onUpdate: (items: StockItem[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const listenerKey = `inventory_${sellerId}`;
      
      // Unsubscribe existing listener if any
      this.unsubscribeListener(listenerKey);
      
      const inventoryQuery = query(
        collection(firestore, `${this.INVENTORY_COLLECTION}/${sellerId}/products`),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        inventoryQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items: StockItem[] = [];
          snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (data) {
              items.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
              } as StockItem);
            }
          });
          onUpdate(items);
        },
        (error: Error) => {
          console.error('Error in inventory subscription:', error);
          if (onError) onError(error);
        }
      );
      
      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);
      
      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error('Error setting up inventory subscription:', error);
      throw error;
    }
  }

  private static unsubscribeListener(key: string): void {
    const unsubscribe = this.activeListeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(key);
    }
  }

  static cleanupListeners(): void {
    for (const [key, unsubscribe] of this.activeListeners) {
      unsubscribe();
      this.activeListeners.delete(key);
    }
  }

  // Error handling wrapper for transactions
  private static async runSecureTransaction<T>(
    operation: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(firestore, operation);    } catch (error: Error | unknown) {      const e = error as { code?: string };
      if (e.code === 'failed-precondition') {
        throw new Error('Another operation is in progress. Please try again.');
      } else if (e.code === 'not-found') {
        throw new Error('Required data not found. The operation cannot be completed.');
      } else if (e.code === 'permission-denied') {
        throw new Error('You do not have permission to perform this operation.');
      }
      throw error;
    }
  }

  /**
   * Get all stock items available for sellers
   * @returns Promise with array of stock items
   */  static async getAllStockItems(): Promise<StockItem[]> {
    try {
      const q = query(
        collection(firestore, StockService.COLLECTION),
        where('stock', '>', 0), // Only show items with available stock
        where('listed', '==', true), // Only show items that are listed
        orderBy('stock', 'desc'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: StockItem[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        // Validate required fields exist
        if (
          data.productCode &&
          data.name &&
          typeof data.price === 'number' &&
          typeof data.stock === 'number'
        ) {
          // Ensure all fields are properly formatted
          const item: StockItem = {
            id: docSnapshot.id,
            productId: data.productId,
            productCode: data.productCode,
            name: data.name,
            description: data.description || '',
            price: Number(data.price),
            stock: Number(data.stock),
            image: data.image || '/images/placeholders/t-shirt.svg',
            category: data.category || 'general',
            listed: data.listed ?? true,
            sellerId: data.sellerId,
            sellerName: data.sellerName,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          };
          items.push(item);
        }
      }
      
      return items;
    } catch (error: unknown) {
      console.error('Error getting stock items:', error);
      throw error;
    }
  }

  /**
   * Get a specific stock item
   * @param id Item ID or product code
   * @param useProductCode Whether to use product code instead of ID
   * @returns Promise with stock item or null if not found
   */
  static async getStockItem(id: string, useProductCode = false): Promise<StockItem | null> {
    try {
      let stockDoc;
      
      if (useProductCode) {
        // Query by product code
        const q = query(
          collection(firestore, StockService.COLLECTION),
          where('productCode', '==', id)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return null;
        }
        
        stockDoc = querySnapshot.docs[0];
      } else {
        // Query by document ID
        const docRef = doc(firestore, StockService.COLLECTION, id);
        stockDoc = await getDoc(docRef);
        
        if (!stockDoc.exists()) {
          return null;
        }
      }
        const data = stockDoc.data();
      if (!data) {
        return null;
      }
      
      return {
        id: stockDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as StockItem;
    } catch (error) {
      console.error('Error getting stock item:', error);
      throw error;
    }
  }

  /**
   * Add new stock item (admin only)
   * @param item Stock item details
   * @returns Promise with the new item ID
   */
  static async addStockItem(item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const stockRef = collection(firestore, StockService.COLLECTION);
      
      // Check if item with this product code already exists
      const existing = await this.getStockItem(item.productCode, true);
      
      if (existing) {
        // Update existing item instead of creating a new one
        await updateDoc(doc(firestore, StockService.COLLECTION, existing.id!), {
          ...item,
          stock: item.stock + existing.stock, // Add to existing stock
          updatedAt: Timestamp.now()
        });
        
        return existing.id!;
      }
      
      // Create new item
      const newItem = {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(stockRef, newItem);
      return docRef.id;
    } catch (error) {
      console.error('Error adding stock item:', error);
      throw error;
    }
  }

  /**
   * Update stock item (admin only)
   * @param id Stock item ID
   * @param data Updated data
   * @returns Promise with success
   */
  static async updateStockItem(id: string, data: Partial<StockItem>): Promise<void> {
    try {
      const itemRef = doc(firestore, StockService.COLLECTION, id);
      
      await updateDoc(itemRef, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating stock item:', error);
      throw error;
    }
  }

  /**
   * Delete stock item (admin only)
   * @param id Stock item ID
   * @returns Promise with success
   */
  static async deleteStockItem(id: string): Promise<void> {
    try {
      const itemRef = doc(firestore, StockService.COLLECTION, id);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Error deleting stock item:', error);
      throw error;
    }
  }

  /**
   * Process stock purchase by a seller
   * @param sellerId The seller's user ID
   * @param stockItemId The stock item ID
   * @param quantity The quantity to purchase
   * @returns Promise with success status
   */  static async processStockPurchase(userId: string, stockId: string, quantity: number): Promise<PurchaseResult> {
    try {
      return await runTransaction(firestore, async (t: Transaction): Promise<PurchaseResult> => {
        // Get references
        const stockRef = doc(firestore, StockService.COLLECTION, stockId);
        const userRef = doc(firestore, 'users', userId);

        // Get current data
        const stockDoc = await t.get(stockRef);
        const userDoc = await t.get(userRef);

        if (!stockDoc.exists() || !userDoc.exists()) {
          return {
            success: false,
            message: 'Stock item or user not found',
            quantity: 0,
            totalCost: 0
          };
        }

        const stockData = stockDoc.data() as DocumentData;
        const userData = userDoc.data() as DocumentData;

        // Validate stock data
        if (!stockData.productCode || !stockData.name || 
            typeof stockData.price !== 'number' || 
            typeof stockData.stock !== 'number' || 
            stockData.stock < quantity || 
            !stockData.listed) {
          return {
            success: false,
            message: 'Invalid stock data or insufficient stock',
            quantity: 0,
            totalCost: 0
          };
        }        // Check user's balance
        const totalCost = stockData.price * quantity;
        if (userData.balance < totalCost) {
          return {
            success: false,
            message: 'Insufficient balance',
            quantity: 0,
            totalCost
          };
        }

        // Update user balance
        t.update(userRef, {
          balance: userData.balance - totalCost,
          updatedAt: Timestamp.now()
        });

        // Update stock quantity
        t.update(stockRef, {
          stock: stockData.stock - quantity,
          updatedAt: Timestamp.now()
        });

        // Handle inventory
        const inventoryRef = collection(firestore, StockService.INVENTORY_COLLECTION);
        const inventoryQuery = query(
          inventoryRef,
          where('userId', '==', userId),
          where('productCode', '==', stockData.productCode)
        );
        
        const inventorySnapshot = await getDocs(inventoryQuery);

        if (inventorySnapshot.docs.length > 0) {
          // Update existing inventory item
          const inventoryItemDoc = inventorySnapshot.docs[0];
          const inventoryData = inventoryItemDoc.data();
          t.update(doc(firestore, StockService.INVENTORY_COLLECTION, inventoryItemDoc.id), {
            quantity: (inventoryData.quantity || 0) + quantity,
            updatedAt: Timestamp.now()
          });
        } else {
          // Create new inventory item
          const newInventoryDoc = doc(inventoryRef);
          t.set(newInventoryDoc, {
            userId,
            productId: stockData.productId,
            productCode: stockData.productCode,
            name: stockData.name,
            description: stockData.description || '',
            image: stockData.image || '/images/placeholders/t-shirt.svg',
            category: stockData.category || 'general',
            quantity,
            purchasePrice: stockData.price,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }

        // Record the purchase
        const purchaseRef = collection(firestore, StockService.PURCHASES_COLLECTION);
        const newPurchaseDoc = doc(purchaseRef);
        t.set(newPurchaseDoc, {
          userId,
          productId: stockData.productId,
          stockId,
          quantity,
          pricePerUnit: stockData.price,
          totalPrice: totalCost,
          createdAt: Timestamp.now()
        });

        return {
          success: true,
          message: 'Purchase successful',
          quantity,
          totalCost
        };
      });
    } catch (error: unknown) {
      console.error('Error processing purchase:', error);
      throw error;
    }
  }

  /**
   * Create a product listing from inventory
   * @param sellerId The seller's ID
   * @param productId The product ID from inventory
   * @param quantity Quantity to list
   * @param price Price per unit
   * @returns Promise with success status
   */
  static async createListing(
    sellerId: string,
    productId: string,
    quantity: number,
    price: number
  ): Promise<PurchaseResult> {
    try {
      return await runTransaction(firestore, async (t: Transaction): Promise<PurchaseResult> => {
        // Get the inventory product
        const inventoryRef = doc(
          firestore, 
          `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${productId}`
        );
        const inventoryDoc = await t.get(inventoryRef);
        
        if (!inventoryDoc.exists()) {
          return {
            success: false,
            message: 'Product not found in inventory',
            quantity: 0,
            totalCost: 0
          };
        }

        const inventoryData = inventoryDoc.data();
        
        // Validate stock availability
        if (inventoryData.quantity < quantity) {
          return {
            success: false,
            message: 'Insufficient stock in inventory',
            quantity: 0,
            totalCost: 0
          };
        }

        // Update inventory quantity
        t.update(inventoryRef, {
          quantity: inventoryData.quantity - quantity,
          updatedAt: Timestamp.now()        });  // Create or update listing
        const listingQuery = query(
          collection(firestore, StockService.LISTINGS_COLLECTION),
          where('sellerId', '==', sellerId),
          where('productId', '==', productId)
        );
      
        const listingSnapshot = await getDocs(listingQuery);

        if (!listingSnapshot.empty) {
          // Update existing listing
          const listingDoc = listingSnapshot.docs[0];
          const listingData = listingDoc.data();
          t.update(doc(firestore, StockService.LISTINGS_COLLECTION, listingDoc.id), {
            quantity: listingData.quantity + quantity,
            price: price, // Update to new price
            updatedAt: Timestamp.now()
          });
        } else {
          // Create new listing
          const listingRef = doc(collection(firestore, StockService.LISTINGS_COLLECTION));
          t.set(listingRef, {
            sellerId,
            productId,
            name: inventoryData.name,
            description: inventoryData.description,
            image: inventoryData.image,
            category: inventoryData.category,
            quantity,
            price,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }

        return {
          success: true,
          message: 'Listing created successfully',
          quantity,
          totalCost: price * quantity
        };
      });
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Update a product listing
   * @param listingId The listing ID
   * @param sellerId The seller's ID for verification
   * @param updates Partial updates for the listing
   * @returns Promise with success status
   */
  static async updateListing(
    listingId: string,
    sellerId: string,
    updates: Partial<{
      price: number;
      quantity: number;
      description: string;
    }>
  ): Promise<PurchaseResult> {
    try {
      return await runTransaction(firestore, async (t: Transaction): Promise<PurchaseResult> => {
        const listingRef = doc(firestore, StockService.LISTINGS_COLLECTION, listingId);
        const listingDoc = await t.get(listingRef);

        if (!listingDoc.exists() || listingDoc.data().sellerId !== sellerId) {
          return {
            success: false,
            message: 'Listing not found or unauthorized',
            quantity: 0,
            totalCost: 0
          };
        }

        const listingData = listingDoc.data();

        // If updating quantity, validate inventory
        if (updates.quantity && updates.quantity > listingData.quantity) {
          const additionalQuantity = updates.quantity - listingData.quantity;

          // Check inventory
          const inventoryRef = doc(
            firestore,
            `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${listingData.productId}`
          );
          const inventoryDoc = await t.get(inventoryRef);

          if (!inventoryDoc.exists() || inventoryDoc.data().quantity < additionalQuantity) {
            return {
              success: false,
              message: 'Insufficient inventory for quantity update',
              quantity: 0,
              totalCost: 0
            };
          }

          // Update inventory
          t.update(inventoryRef, {
            quantity: inventoryDoc.data().quantity - additionalQuantity,
            updatedAt: Timestamp.now()
          });
        }

        // Update listing
        t.update(listingRef, {
          ...updates,
          updatedAt: Timestamp.now()
        });

        return {
          success: true,
          message: 'Listing updated successfully',
          quantity: updates.quantity || listingData.quantity,
          totalCost: (updates.price || listingData.price) * (updates.quantity || listingData.quantity)
        };
      });
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Delete a product listing and return stock to inventory
   * @param listingId The listing ID
   * @param sellerId The seller's ID for verification
   * @returns Promise with success status
   */
  static async deleteListing(listingId: string, sellerId: string): Promise<PurchaseResult> {
    try {
      return await runTransaction(firestore, async (t: Transaction): Promise<PurchaseResult> => {
        // Get listing
        const listingRef = doc(firestore, StockService.LISTINGS_COLLECTION, listingId);
        const listingDoc = await t.get(listingRef);

        if (!listingDoc.exists() || listingDoc.data().sellerId !== sellerId) {
          return {
            success: false,
            message: 'Listing not found or unauthorized',
            quantity: 0,
            totalCost: 0
          };
        }

        const listingData = listingDoc.data();

        // Return stock to inventory
        const inventoryRef = doc(
          firestore,
          `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${listingData.productId}`
        );
        const inventoryDoc = await t.get(inventoryRef);

        if (inventoryDoc.exists()) {
          t.update(inventoryRef, {
            quantity: inventoryDoc.data().quantity + listingData.quantity,
            updatedAt: Timestamp.now()
          });
        } else {
          // Create new inventory entry if it doesn't exist
          t.set(inventoryRef, {
            sellerId,
            productId: listingData.productId,
            name: listingData.name,
            description: listingData.description,
            image: listingData.image,
            category: listingData.category,
            quantity: listingData.quantity,
            purchasePrice: listingData.price,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }

        // Delete listing
        t.delete(listingRef);

        return {
          success: true,
          message: 'Listing deleted and stock returned to inventory',
          quantity: listingData.quantity,
          totalCost: listingData.price * listingData.quantity
        };
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }  /**
   * Upload image to Firebase Storage
   * @param file The image file to upload
   * @param path Storage path (e.g., 'stock/product-images')
   * @returns Promise with download URL
   */
  static async uploadImage(file: File, path: string = 'stock/product-images'): Promise<string> {
    try {
      if (!storage) {
        throw new Error('Firebase Storage is not initialized');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `${path}/${fileName}`);

      // Upload file with CORS error handling
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'uploadedBy': 'ticktok-shop',
          'uploadTimestamp': timestamp.toString()
        }
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Progress monitoring (optional)
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error('Upload failed:', error);
            
            // Check if it's a CORS error and provide fallback
            if (error.code === 'storage/unauthorized' || 
                error.message.includes('CORS') || 
                error.message.includes('cross-origin')) {
              console.warn('CORS error detected, using placeholder image');
              // Return a placeholder image URL instead of failing
              resolve('/images/placeholders/t-shirt.svg');
              return;
            }
            
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error('Error getting download URL:', error);
              // Fallback to placeholder if download URL fails
              resolve('/images/placeholders/t-shirt.svg');
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Check if it's a CORS-related error
      if (error instanceof Error && 
          (error.message.includes('CORS') || 
           error.message.includes('cross-origin') ||
           error.message.includes('unauthorized'))) {
        console.warn('CORS error in upload setup, using placeholder image');
        return '/images/placeholders/t-shirt.svg';
      }
      
      throw error;
    }
  }

  /**
   * Subscribe to admin stock changes in real-time
   * @param onUpdate Callback function for stock updates
   * @param onError Optional error callback
   * @returns Unsubscribe function
   */
  static subscribeToAdminStock(
    onUpdate: (stocks: StockItem[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const listenerKey = 'admin_stock';
      
      // Unsubscribe existing listener if any
      this.unsubscribeListener(listenerKey);
      
      const stockQuery = query(
        collection(firestore, this.COLLECTION),
        where('listed', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        stockQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const stocks: StockItem[] = [];
          snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (data && data.productCode && data.name && typeof data.price === 'number') {
              stocks.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
              } as StockItem);
            }
          });
          onUpdate(stocks);
        },
        (error: Error) => {
          console.error('Error in admin stock subscription:', error);
          if (onError) onError(error);
        }
      );
      
      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);
      
      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error('Error setting up admin stock subscription:', error);
      throw error;
    }
  }

  /**
   * Get seller's inventory items
   * @param sellerId The seller's ID
   * @returns Promise with inventory items
   */
  static async getInventoryItems(sellerId: string): Promise<StockItem[]> {
    try {
      const inventoryQuery = query(
        collection(firestore, `${this.INVENTORY_COLLECTION}/${sellerId}/products`),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(inventoryQuery);
      const items: StockItem[] = [];      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          items.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as StockItem);
        }
      });

      return items;
    } catch (error) {
      console.error('Error getting inventory items:', error);
      throw error;
    }
  }
}

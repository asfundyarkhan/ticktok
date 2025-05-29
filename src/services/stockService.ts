// Firestore service for admin stock management
/**
 * StockService - Manages stock items, inventory, and listings
 *
 * IMPORTANT: Zero-quantity handling
 * This service now automatically deletes stock items when their quantity reaches zero.
 * This applies to:
 * - Admin stock items that reach zero quantity
 * - Seller listings that reach zero quantity
 * - Inventory items that reach zero quantity
 *
 * This ensures that when stock is depleted, it is removed from the database,
 * allowing users to create new stock with the same details later.
 *
 * Automatic cleanup runs periodically through the StockCleanupService component.
 */
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
  DocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../lib/firebase/firebase";
import { StockItem, PurchaseResult, StockListing } from "../types/marketplace";

// Re-export types for convenience
export type {
  StockItem,
  PurchaseResult,
  StockListing,
} from "../types/marketplace";

// Error types
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientBalanceError";
  }
}

export class StockService {
  private static COLLECTION = "adminStock";
  private static INVENTORY_COLLECTION = "inventory";
  private static PURCHASES_COLLECTION = "purchases";
  private static LISTINGS_COLLECTION = "listings";

  // Active listeners store
  private static activeListeners: Map<string, Unsubscribe> = new Map();

  // Track cleanup interval
  private static cleanupInterval: NodeJS.Timeout | null = null;

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
        where("sellerId", "==", sellerId),
        orderBy("updatedAt", "desc")
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
                updatedAt: data.updatedAt?.toDate(),
              } as StockListing);
            }
          });
          onUpdate(listings);
        },
        (error: Error) => {
          console.error("Error in listings subscription:", error);
          if (onError) onError(error);
        }
      );

      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);

      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error("Error setting up listings subscription:", error);
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
      console.log(`Setting up inventory subscription for user: ${sellerId}`);

      // Unsubscribe existing listener if any
      this.unsubscribeListener(listenerKey);

      // Path structure following the updated pattern in processStockPurchase
      const inventoryPath = `${this.INVENTORY_COLLECTION}/${sellerId}/products`;
      console.log(`Querying inventory path: ${inventoryPath}`);

      const inventoryQuery = query(
        collection(firestore, inventoryPath),
        orderBy("updatedAt", "desc")
      );

      const unsubscribe = onSnapshot(
        inventoryQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          console.log(
            `Got inventory data for user ${sellerId}:`,
            snapshot.size,
            "items"
          );

          // Debug: print first few document IDs for debugging
          if (snapshot.size > 0) {
            const firstFew = snapshot.docs.slice(0, 3);
            console.log(
              "Sample document IDs:",
              firstFew.map((d) => d.id)
            );
            console.log(
              "Sample data:",
              firstFew.map((d) => d.data())
            );
          }

          const items: StockItem[] = [];
          snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (data) {
              items.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
              } as StockItem);
            }
          });
          onUpdate(items);
        },
        (error: Error) => {
          console.error("Error in inventory subscription:", error);
          if (onError) onError(error);
        }
      );

      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);

      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error("Error setting up inventory subscription:", error);
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
      return await runTransaction(firestore, operation);
    } catch (error: Error | unknown) {
      const e = error as { code?: string };
      if (e.code === "failed-precondition") {
        throw new Error("Another operation is in progress. Please try again.");
      } else if (e.code === "not-found") {
        throw new Error(
          "Required data not found. The operation cannot be completed."
        );
      } else if (e.code === "permission-denied") {
        throw new Error(
          "You do not have permission to perform this operation."
        );
      }
      throw error;
    }
  }

  /**
   * Get all stock items available for sellers
   * @returns Promise with array of stock items
   */
  static async getAllStockItems(): Promise<StockItem[]> {
    try {
      const q = query(
        collection(firestore, StockService.COLLECTION),
        where("stock", ">", 0), // Only show items with available stock
        where("listed", "==", true), // Only show items that are listed
        orderBy("stock", "desc"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const items: StockItem[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        // Validate required fields exist and ensure stock > 0
        if (
          data.productCode &&
          data.name &&
          typeof data.price === "number" &&
          typeof data.stock === "number" &&
          data.stock > 0 // Double-check stock is greater than zero
        ) {
          // Ensure all fields are properly formatted
          const item: StockItem = {
            id: docSnapshot.id,
            productId: data.productId,
            productCode: data.productCode,
            name: data.name,
            description: data.description || "",
            features: data.features,
            price: Number(data.price),
            stock: Number(data.stock),
            images: data.images || ["/images/placeholders/t-shirt.svg"],
            mainImage:
              data.mainImage ||
              data.images?.[0] ||
              "/images/placeholders/t-shirt.svg",
            category: data.category || "general",
            listed: data.listed ?? true,
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            isSale: data.isSale || false,
            salePercentage: data.salePercentage || 0,
            salePrice: data.salePrice,
            sellerId: data.sellerId,
            sellerName: data.sellerName,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
          items.push(item);
        }
      }

      return items;
    } catch (error: unknown) {
      console.error("Error getting stock items:", error);
      throw error;
    }
  }

  /**
   * Get a specific stock item
   * @param id Item ID or product code
   * @param useProductCode Whether to use product code instead of ID
   * @returns Promise with stock item or null if not found
   */
  static async getStockItem(
    id: string,
    useProductCode = false
  ): Promise<StockItem | null> {
    try {
      let stockDoc;

      if (useProductCode) {
        // Query by product code
        const q = query(
          collection(firestore, StockService.COLLECTION),
          where("productCode", "==", id)
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
        updatedAt: data.updatedAt?.toDate(),
      } as StockItem;
    } catch (error) {
      console.error("Error getting stock item:", error);
      throw error;
    }
  }

  /**
   * Add new stock item (admin only)
   * @param item Stock item details
   * @returns Promise with the new item ID
   */
  static async addStockItem(
    item: Omit<StockItem, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const stockRef = collection(firestore, StockService.COLLECTION);

      // Check if item with this product code already exists
      const existing = await this.getStockItem(item.productCode, true);

      if (existing) {
        // Update existing item instead of creating a new one
        await updateDoc(doc(firestore, StockService.COLLECTION, existing.id!), {
          ...item,
          stock: item.stock + existing.stock, // Add to existing stock
          updatedAt: Timestamp.now(),
        });

        return existing.id!;
      }

      // Create new item
      const newItem = {
        ...item,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(stockRef, newItem);
      return docRef.id;
    } catch (error) {
      console.error("Error adding stock item:", error);
      throw error;
    }
  }

  /**
   * Update stock item (admin only)
   * @param id Stock item ID
   * @param data Updated data
   * @returns Promise with success
   */
  static async updateStockItem(
    id: string,
    data: Partial<StockItem>
  ): Promise<void> {
    try {
      const itemRef = doc(firestore, StockService.COLLECTION, id);

      // Check if the update would result in zero quantity
      if (data.stock === 0) {
        // Delete the item instead of updating it
        await deleteDoc(itemRef);
        console.log(`Stock item ${id} deleted because quantity reached zero`);
      } else {
        // Perform normal update
        await updateDoc(itemRef, {
          ...data,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error updating stock item:", error);
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
      console.error("Error deleting stock item:", error);
      throw error;
    }
  }

  /**
   * Process stock purchase by a seller
   * @param sellerId The seller's user ID
   * @param stockItemId The stock item ID
   * @param quantity The quantity to purchase
   * @returns Promise with success status
   */ static async processStockPurchase(
    userId: string,
    stockId: string,
    quantity: number
  ): Promise<PurchaseResult> {
    try {
      return await this.runSecureTransaction(
        async (t: Transaction): Promise<PurchaseResult> => {
          // Get all references
          const stockRef = doc(firestore, StockService.COLLECTION, stockId);
          const userRef = doc(firestore, "users", userId);

          // Prepare inventory path and reference
          const inventoryCollectionPath = `${StockService.INVENTORY_COLLECTION}/${userId}/products`;
          const inventoryRef = collection(firestore, inventoryCollectionPath);

          // Get current data - ALL READS FIRST
          const stockDoc = await t.get(stockRef);
          const userDoc = await t.get(userRef);

          if (!stockDoc.exists() || !userDoc.exists()) {
            return {
              success: false,
              message: "Stock item or user not found",
              quantity: 0,
              totalCost: 0,
            };
          }

          const stockData = stockDoc.data() as DocumentData;
          const userData = userDoc.data() as DocumentData;
          // Also check if product already exists in seller's inventory - READ OPERATION
          // Use the product ID from admin stock, not the document ID
          const productId = stockData.productId || stockId;
          console.log(`Looking for inventory product with ID: ${productId}`);
          const productRef = doc(inventoryRef, productId);
          const productDoc = await t.get(productRef);

          // Validate stock data
          if (
            !stockData.productCode ||
            !stockData.name ||
            typeof stockData.price !== "number" ||
            typeof stockData.stock !== "number" ||
            stockData.stock < quantity ||
            !stockData.listed
          ) {
            return {
              success: false,
              message: "Invalid stock data or insufficient stock",
              quantity: 0,
              totalCost: 0,
            };
          }

          // Check user's balance
          const totalCost = stockData.price * quantity;
          if (userData.balance < totalCost) {
            return {
              success: false,
              message: "Insufficient balance",
              quantity: 0,
              totalCost,
            };
          }

          // Now perform all write operations

          // Update user balance
          t.update(userRef, {
            balance: userData.balance - totalCost,
            updatedAt: Timestamp.now(),
          });

          // Calculate new stock quantity
          const newStockQuantity = stockData.stock - quantity;

          // Check if stock will be zero after purchase
          if (newStockQuantity === 0) {
            // Delete the admin stock item
            t.delete(stockRef);
          } else {
            // Update stock quantity
            t.update(stockRef, {
              stock: newStockQuantity,
              updatedAt: Timestamp.now(),
            });
          }

          // Handle inventory - all read operations have been completed
          console.log(
            `Processing inventory update for user ${userId}, product ${
              stockData.productId || stockId
            }`
          );
          console.log(`Inventory path: ${inventoryCollectionPath}`);
          console.log(`Product exists in inventory: ${productDoc.exists()}`);

          if (productDoc.exists()) {
            // Update existing inventory item
            const productData = productDoc.data();
            console.log(`Existing product data:`, productData);
            console.log(
              `Updating quantity from ${productData.stock || 0} to ${
                (productData.stock || 0) + quantity
              }`
            );
            t.update(productRef, {
              stock: (productData.stock || 0) + quantity,
              features: stockData.features || productData.features || "", // Preserve existing features or use new ones
              rating: stockData.rating || productData.rating || 0,
              reviews: stockData.reviews || productData.reviews || [],
              updatedAt: Timestamp.now(),
            });
          } else {
            // Create new inventory item
            console.log(`Creating new inventory item for ${stockData.name}`);
            t.set(productRef, {
              productId: stockData.productId || stockId,
              productCode: stockData.productCode,
              name: stockData.name,
              description: stockData.description || "",
              // Include both mainImage and images array for better compatibility
              mainImage:
                stockData.mainImage ||
                (stockData.images && stockData.images.length > 0
                  ? stockData.images[0]
                  : "/images/placeholders/t-shirt.svg"),
              images: stockData.images || [],
              image:
                stockData.mainImage ||
                (stockData.images && stockData.images.length > 0
                  ? stockData.images[0]
                  : "/images/placeholders/t-shirt.svg"),
              category: stockData.category || "general",
              stock: quantity,
              price: stockData.price,
              features: stockData.features || "",
              rating: stockData.rating || 0,
              reviews: stockData.reviews || [],
              purchasePrice: stockData.price,
              listed: false, // Initially not listed in marketplace
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          }

          // Record the purchase
          const purchaseRef = collection(
            firestore,
            StockService.PURCHASES_COLLECTION
          );
          const newPurchaseDoc = doc(purchaseRef);
          t.set(newPurchaseDoc, {
            userId,
            productId: stockData.productId,
            stockId,
            quantity,
            pricePerUnit: stockData.price,
            totalPrice: totalCost,
            createdAt: Timestamp.now(),
          });

          return {
            success: true,
            message: "Purchase successful",
            quantity,
            totalCost,
          };
        }
      );
    } catch (error: unknown) {
      console.error("Error processing purchase:", error);
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
      return await runTransaction(
        firestore,
        async (t: Transaction): Promise<PurchaseResult> => {
          // Get the inventory product
          const inventoryRef = doc(
            firestore,
            `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${productId}`
          );
          const inventoryDoc = await t.get(inventoryRef);

          if (!inventoryDoc.exists()) {
            return {
              success: false,
              message: "Product not found in inventory",
              quantity: 0,
              totalCost: 0,
            };
          }

          const inventoryData = inventoryDoc.data();

          // Validate stock availability
          if (inventoryData.stock < quantity) {
            return {
              success: false,
              message: "Insufficient stock in inventory",
              quantity: 0,
              totalCost: 0,
            };
          }

          // Check if product is already listed
          const listingQuery = query(
            collection(firestore, StockService.LISTINGS_COLLECTION),
            where("sellerId", "==", sellerId),
            where("productId", "==", productId)
          );

          const listingSnapshot = await getDocs(listingQuery);

          // Update inventory first
          t.update(inventoryRef, {
            stock: inventoryData.stock - quantity,
            updatedAt: Timestamp.now(),
          });

          if (!listingSnapshot.empty) {
            // Update existing listing
            const listingDoc = listingSnapshot.docs[0];
            const listingData = listingDoc.data();
            t.update(
              doc(firestore, StockService.LISTINGS_COLLECTION, listingDoc.id),
              {
                quantity: listingData.quantity + quantity,
                price: price, // Update to new price
                updatedAt: Timestamp.now(),
              }
            );
          } else {
            // Create new listing
            const listingRef = doc(
              collection(firestore, StockService.LISTINGS_COLLECTION)
            );
            t.set(listingRef, {
              sellerId,
              productId,
              name: inventoryData.name,
              description: inventoryData.description,
              features: inventoryData.features || "", // Copy features from inventory as string
              image:
                inventoryData.mainImage ||
                inventoryData.image ||
                (inventoryData.images && inventoryData.images.length > 0
                  ? inventoryData.images[0]
                  : ""),
              // Store the full images array and ensure we preserve all image fields
              images:
                inventoryData.images ||
                (inventoryData.image ? [inventoryData.image] : []),
              mainImage:
                inventoryData.mainImage ||
                inventoryData.image ||
                (inventoryData.images && inventoryData.images.length > 0
                  ? inventoryData.images[0]
                  : ""),
              imageUrl: inventoryData.imageUrl || inventoryData.imageURL || "",
              imageURL: inventoryData.imageURL || inventoryData.imageUrl || "",
              category: inventoryData.category,
              reviews: Array.isArray(inventoryData.reviews)
                ? inventoryData.reviews
                : typeof inventoryData.reviews === "number"
                ? Array(inventoryData.reviews).fill({
                    rating: inventoryData.rating || 0,
                    content: "Legacy review",
                    date: new Date().toISOString(),
                  })
                : [],
              rating: inventoryData.rating || 0,
              reviewCount: Array.isArray(inventoryData.reviews)
                ? inventoryData.reviews.length
                : typeof inventoryData.reviews === "number"
                ? inventoryData.reviews
                : 0,
              quantity,
              price,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          }

          return {
            success: true,
            message: "Listing created successfully",
            quantity,
            totalCost: price * quantity,
          };
        }
      );
    } catch (error) {
      console.error("Error creating listing:", error);
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
      return await runTransaction(
        firestore,
        async (t: Transaction): Promise<PurchaseResult> => {
          const listingRef = doc(
            firestore,
            StockService.LISTINGS_COLLECTION,
            listingId
          );
          const listingDoc = await t.get(listingRef);

          if (!listingDoc.exists() || listingDoc.data().sellerId !== sellerId) {
            return {
              success: false,
              message: "Listing not found or unauthorized",
              quantity: 0,
              totalCost: 0,
            };
          }

          const listingData = listingDoc.data();

          // If updating quantity to zero, delete the listing instead
          if (updates.quantity === 0) {
            // Delete the listing
            t.delete(listingRef);

            return {
              success: true,
              message: "Listing deleted because quantity reached zero",
              quantity: 0,
              totalCost: 0,
            };
          }

          // If updating quantity, validate inventory
          if (updates.quantity && updates.quantity > listingData.quantity) {
            const additionalQuantity = updates.quantity - listingData.quantity;

            // Check inventory
            const inventoryRef = doc(
              firestore,
              `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${listingData.productId}`
            );
            const inventoryDoc = await t.get(inventoryRef);

            if (
              !inventoryDoc.exists() ||
              inventoryDoc.data().quantity < additionalQuantity
            ) {
              return {
                success: false,
                message: "Insufficient inventory for quantity update",
                quantity: 0,
                totalCost: 0,
              };
            }

            // Update inventory
            t.update(inventoryRef, {
              quantity: inventoryDoc.data().quantity - additionalQuantity,
              updatedAt: Timestamp.now(),
            });
          }

          // Update listing
          t.update(listingRef, {
            ...updates,
            updatedAt: Timestamp.now(),
          });

          return {
            success: true,
            message: "Listing updated successfully",
            quantity: updates.quantity || listingData.quantity,
            totalCost:
              (updates.price || listingData.price) *
              (updates.quantity || listingData.quantity),
          };
        }
      );
    } catch (error) {
      console.error("Error updating listing:", error);
      throw error;
    }
  }

  /**
   * Delete a product listing and return stock to inventory
   * @param listingId The listing ID
   * @param sellerId The seller's ID for verification
   * @returns Promise with success status
   */
  static async deleteListing(
    listingId: string,
    sellerId: string
  ): Promise<PurchaseResult> {
    try {
      return await runTransaction(
        firestore,
        async (t: Transaction): Promise<PurchaseResult> => {
          // Get listing
          const listingRef = doc(
            firestore,
            StockService.LISTINGS_COLLECTION,
            listingId
          );
          const listingDoc = await t.get(listingRef);

          if (!listingDoc.exists() || listingDoc.data().sellerId !== sellerId) {
            return {
              success: false,
              message: "Listing not found or unauthorized",
              quantity: 0,
              totalCost: 0,
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
            // Update existing inventory with returned stock
            t.update(inventoryRef, {
              stock: (inventoryDoc.data().stock || 0) + listingData.quantity,
              updatedAt: Timestamp.now(),
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
              stock: listingData.quantity,
              price: listingData.price,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          }

          // Delete listing
          t.delete(listingRef);

          return {
            success: true,
            message: "Listing deleted and stock returned to inventory",
            quantity: listingData.quantity,
            totalCost: listingData.price * listingData.quantity,
          };
        }
      );
    } catch (error) {
      console.error("Error deleting listing:", error);
      throw error;
    }
  }
  /**
   * Upload image to Firebase Storage
   * @param file The image file to upload
   * @param path Storage path (e.g., 'stock/product-images')
   * @returns Promise with download URL
   */
  static async uploadImage(
    file: File,
    path: string = "stock/product-images"
  ): Promise<string> {
    try {
      if (!storage) {
        throw new Error("Firebase Storage is not initialized");
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(
        /[^a-zA-Z0-9.]/g,
        "_"
      )}`;
      const storageRef = ref(storage, `${path}/${fileName}`);

      // Upload file with CORS error handling
      const uploadTask = uploadBytesResumable(storageRef, file, {
        customMetadata: {
          "Access-Control-Allow-Origin": "*",
          uploadedBy: "ticktok-shop",
          uploadTimestamp: timestamp.toString(),
        },
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress monitoring (optional)
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            console.error("Upload failed:", error);

            // Check if it's a CORS error and provide fallback
            if (
              error.code === "storage/unauthorized" ||
              error.message.includes("CORS") ||
              error.message.includes("cross-origin")
            ) {
              console.warn("CORS error detected, using placeholder image");
              // Return a placeholder image URL instead of failing
              resolve("/images/placeholders/t-shirt.svg");
              return;
            }

            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              console.error("Error getting download URL:", error);
              // Fallback to placeholder if download URL fails
              resolve("/images/placeholders/t-shirt.svg");
            }
          }
        );
      });
    } catch (error) {
      console.error("Error uploading image:", error);

      // Check if it's a CORS-related error
      if (
        error instanceof Error &&
        (error.message.includes("CORS") ||
          error.message.includes("cross-origin") ||
          error.message.includes("unauthorized"))
      ) {
        console.warn("CORS error in upload setup, using placeholder image");
        return "/images/placeholders/t-shirt.svg";
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
      const listenerKey = "admin_stock";

      // Unsubscribe existing listener if any
      this.unsubscribeListener(listenerKey);

      const stockQuery = query(
        collection(firestore, this.COLLECTION),
        where("listed", "==", true),
        where("stock", ">", 0), // Only listen for items with stock > 0
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        stockQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const stocks: StockItem[] = [];
          snapshot.forEach((doc: DocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            if (
              data &&
              data.productCode &&
              data.name &&
              typeof data.price === "number" &&
              typeof data.stock === "number" &&
              data.stock > 0 // Double-check stock is greater than zero
            ) {
              stocks.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
              } as StockItem);
            }
          });
          onUpdate(stocks);
        },
        (error: Error) => {
          console.error("Error in admin stock subscription:", error);
          if (onError) onError(error);
        }
      );

      // Store the unsubscribe function
      this.activeListeners.set(listenerKey, unsubscribe);

      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error("Error setting up admin stock subscription:", error);
      throw error;
    }
  }

  /**
   * Subscribe to all active listings across sellers
   * @param onUpdate Callback function for listings updates
   * @param onError Optional error callback
   * @returns Unsubscribe function
   */
  static subscribeToAllListings(
    onUpdate: (listings: StockListing[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const listenerKey = "all_listings";
      this.unsubscribeListener(listenerKey);

      const listingsQuery = query(
        collection(firestore, this.LISTINGS_COLLECTION),
        where("quantity", ">", 0),
        orderBy("quantity"),
        orderBy("updatedAt", "desc")
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
                updatedAt: data.updatedAt?.toDate(),
              } as StockListing);
            }
          });
          onUpdate(listings);
        },
        (error: Error) => {
          console.error("Error in all listings subscription:", error);
          if (onError) onError(error);
        }
      );

      this.activeListeners.set(listenerKey, unsubscribe);
      return () => this.unsubscribeListener(listenerKey);
    } catch (error) {
      console.error("Error setting up all listings subscription:", error);
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
        collection(
          firestore,
          `${this.INVENTORY_COLLECTION}/${sellerId}/products`
        ),
        orderBy("updatedAt", "desc")
      );

      const querySnapshot = await getDocs(inventoryQuery);
      const items: StockItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          items.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as StockItem);
        }
      });
      return items;
    } catch (error) {
      console.error("Error getting inventory items:", error);
      throw error;
    }
  }

  /**
   * Check and remove any stock items with zero quantity
   * @returns Promise with count of removed items
   */
  static async cleanupZeroQuantityItems(): Promise<{
    adminItemsRemoved: number;
    listingsRemoved: number;
  }> {
    try {
      let adminItemsRemoved = 0;
      let listingsRemoved = 0;

      // Find and remove admin stock items with zero quantity
      const adminStockQuery = query(
        collection(firestore, this.COLLECTION),
        where("stock", "==", 0)
      );

      const adminStockSnapshot = await getDocs(adminStockQuery);

      for (const doc of adminStockSnapshot.docs) {
        await deleteDoc(doc.ref);
        adminItemsRemoved++;
      }

      // Find and remove listings with zero quantity
      const listingsQuery = query(
        collection(firestore, this.LISTINGS_COLLECTION),
        where("quantity", "==", 0)
      );

      const listingsSnapshot = await getDocs(listingsQuery);

      for (const doc of listingsSnapshot.docs) {
        await deleteDoc(doc.ref);
        listingsRemoved++;
      }

      console.log(
        `Cleanup completed: Removed ${adminItemsRemoved} admin stock items and ${listingsRemoved} listings with zero quantity`
      );

      return { adminItemsRemoved, listingsRemoved };
    } catch (error) {
      console.error("Error cleaning up zero quantity items:", error);
      throw error;
    }
  }

  /**
   * Initialize periodic cleanup of zero-quantity items
   * @param intervalMinutes How often to run cleanup (in minutes)
   * @returns Cleanup function to cancel the periodic task
   */
  static initializePeriodicCleanup(intervalMinutes: number = 60): () => void {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    console.log(
      `Initializing periodic cleanup every ${intervalMinutes} minutes`
    );

    // Convert minutes to milliseconds
    const intervalMs = intervalMinutes * 60 * 1000;

    // Set up periodic cleanup
    this.cleanupInterval = setInterval(async () => {
      try {
        console.log("Running scheduled zero-quantity cleanup...");
        // Clean up admin stock and listings
        const stockResult = await this.cleanupZeroQuantityItems();
        console.log(
          `Scheduled cleanup removed ${stockResult.adminItemsRemoved} admin items and ${stockResult.listingsRemoved} listings`
        );

        // Clean up all sellers' inventory items (less frequently - every 3 cycles)
        // This is to avoid excessive operations on the database
        if (Math.random() < 0.33) {
          // ~33% chance to run on each cycle
          console.log(
            "Running comprehensive inventory cleanup for all sellers..."
          );
          const inventoryResult = await this.cleanupAllSellersZeroInventory();
          console.log(
            `Comprehensive inventory cleanup removed ${inventoryResult.itemsRemoved} items across ${inventoryResult.sellersAffected} sellers`
          );
        }
      } catch (error) {
        console.error("Error in periodic cleanup:", error);
      }
    }, intervalMs);

    // Do NOT run an immediate cleanup here as the StockCleanupService
    // component now handles the initial cleanup

    // Return a function to cancel the interval
    return () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
    };
  }

  /**
   * Delete zero-quantity items from a seller's inventory
   * @param sellerId The seller's ID
   * @returns Promise with number of items removed
   */
  static async deleteZeroQuantityInventoryItems(
    sellerId: string
  ): Promise<number> {
    try {
      let itemsRemoved = 0;

      // Get inventory items with zero quantity
      const inventoryPath = `${this.INVENTORY_COLLECTION}/${sellerId}/products`;
      const inventoryQuery = query(
        collection(firestore, inventoryPath),
        where("stock", "==", 0)
      );

      const snapshot = await getDocs(inventoryQuery);

      // Delete each item with zero quantity
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        itemsRemoved++;
      }

      console.log(
        `Removed ${itemsRemoved} zero-quantity items from seller ${sellerId}'s inventory`
      );
      return itemsRemoved;
    } catch (error) {
      console.error("Error deleting zero-quantity inventory items:", error);
      throw error;
    }
  }

  /**
   * Clean up zero-quantity inventory items for all sellers
   * @returns Promise with count of removed items and affected sellers
   */
  static async cleanupAllSellersZeroInventory(): Promise<{
    itemsRemoved: number;
    sellersAffected: number;
  }> {
    try {
      // Get all inventory collections
      const inventoryCollections = await getDocs(
        collection(firestore, this.INVENTORY_COLLECTION)
      );

      let itemsRemoved = 0;
      let sellersAffected = 0;

      // Process each seller's inventory
      for (const sellerDoc of inventoryCollections.docs) {
        const sellerId = sellerDoc.id;

        // Skip any non-folder documents
        if (!sellerId) continue;

        try {
          // Delete zero-quantity items for this seller
          const removed = await this.deleteZeroQuantityInventoryItems(sellerId);

          if (removed > 0) {
            itemsRemoved += removed;
            sellersAffected++;
          }
        } catch (error) {
          console.error(
            `Error cleaning up inventory for seller ${sellerId}:`,
            error
          );
          // Continue with other sellers even if one fails
        }
      }

      console.log(
        `Global inventory cleanup: Removed ${itemsRemoved} zero-quantity items across ${sellersAffected} sellers`
      );
      return { itemsRemoved, sellersAffected };
    } catch (error) {
      console.error("Error in global inventory cleanup:", error);
      throw error;
    }
  }

  /**
   * Search for listings by product ID
   * @param productId The product ID to search for
   * @returns Promise with array of listings
   */ static async searchListingsByProductId(
    productId: string
  ): Promise<StockListing[]> {
    try {
      const listingsQuery = query(
        collection(firestore, this.LISTINGS_COLLECTION),
        where("productId", "==", productId),
        where("quantity", ">", 0), // Only get active listings
        orderBy("quantity", "desc"),
        orderBy("price", "asc") // Get best deals first
      );

      const snapshot = await getDocs(listingsQuery);
      const listings: StockListing[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data) {
          // Convert reviews field to consistently be an array
          const reviews = Array.isArray(data.reviews)
            ? data.reviews
            : typeof data.reviews === "number"
            ? Array(data.reviews).fill({})
            : [];

          listings.push({
            id: doc.id,
            ...data,
            reviews,
            reviewCount: reviews.length,
            rating: data.rating || 0,
            features: data.features || [],
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          } as StockListing);
        }
      });

      return listings;
    } catch (error) {
      console.error("Error searching listings by product ID:", error);
      throw error;
    }
  }
}

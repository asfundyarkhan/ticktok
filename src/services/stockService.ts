// Firestore service for admin stock management
/**
 * StockService - Manages stock items, inventory, and listings
 *
 * IMPORTANT: Zero-quantity handling (UPDATED BEHAVIOR)
 * As of June 2025, this service NO LONGER automatically deletes stock items when their quantity reaches zero.
 * Items now remain visible with "Out of Stock" status and "Restock Needed" functionality.
 *
 * This change applies to:
 * - Admin stock items that reach zero quantity
 * - Seller listings that reach zero quantity
 * - Inventory items that reach zero quantity
 *
 * This ensures that when stock is depleted, product information is preserved,
 * allowing users to easily restock items and maintain data consistency.
 *
 * The StockCleanupService component has been disabled to prevent automatic cleanup.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
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
        where("listed", "==", true), // Only show items that are listed
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const items: StockItem[] = [];
      
      // Cache for seller data to avoid repeated lookups
      const sellerCache: Record<string, {name: string, email: string}> = {};

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data(); // Validate required fields exist
        if (
          data.productCode &&
          data.name &&
          typeof data.price === "number" &&
          (typeof data.stock === "number" ||
            data.stock === 0 ||
            data.stock === null ||
            data.stock === undefined)
        ) {
          // Ensure stock is always a number (default to 0 for null/undefined)
          const stockValue = typeof data.stock === "number" ? data.stock : 0;
          
          // Get seller name if we have a seller ID
          let sellerName = data.sellerName || "Unknown Seller";
          
          if (data.sellerId && !data.sellerName) {
            // Check cache first to avoid redundant lookups
            if (sellerCache[data.sellerId]) {
              sellerName = sellerCache[data.sellerId].name;
            } else {
              try {
                // Fetch seller info from users collection
                const sellerDoc = await getDoc(doc(firestore, "users", data.sellerId));
                if (sellerDoc.exists()) {
                  const sellerData = sellerDoc.data();
                  sellerName = sellerData.displayName || sellerData.name || 
                              (sellerData.firstName && sellerData.lastName ? 
                               `${sellerData.firstName} ${sellerData.lastName}` : "Unknown Seller");
                  
                  // Cache the seller data for future use
                  sellerCache[data.sellerId] = {
                    name: sellerName,
                    email: sellerData.email || ""
                  };
                }
              } catch (error) {
                console.error(`Error fetching seller details for ${data.sellerId}:`, error);
              }
            }
          }

          // Ensure all fields are properly formatted
          const item: StockItem = {
            id: docSnapshot.id,
            productId: data.productId,
            productCode: data.productCode,
            name: data.name,
            description: data.description || "",
            features: data.features,
            price: Number(data.price),
            stock: stockValue, // Use normalized stock value
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
            sellerName: sellerName, // Use the resolved seller name
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
   */ static async updateStockItem(
    id: string,
    data: Partial<StockItem>
  ): Promise<void> {
    try {
      const itemRef = doc(firestore, StockService.COLLECTION, id);

      // Ensure stock value is always a number if provided
      const updateData = { ...data };
      if ("stock" in updateData && updateData.stock !== undefined) {
        updateData.stock =
          typeof updateData.stock === "number" ? updateData.stock : 0;
      }

      // Perform normal update (no longer delete when stock reaches zero)
      await updateDoc(itemRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
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
          // 1. PREPARE ALL REFERENCES
          const stockRef = doc(firestore, StockService.COLLECTION, stockId);
          const userRef = doc(firestore, "users", userId);
          const inventoryCollectionPath = `${StockService.INVENTORY_COLLECTION}/${userId}/products`;
          const inventoryRef = collection(firestore, inventoryCollectionPath);

          // 2. PERFORM ALL READS FIRST
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

          // Check inventory for existing product
          const productId = stockData.productId || stockId;
          const productRef = doc(inventoryRef, productId);
          const productDoc = await t.get(productRef);
          const productExists = productDoc.exists();
          const productData = productExists ? productDoc.data() : null;

          // 3. PERFORM ALL WRITES
          // Update user balance
          t.update(userRef, {
            balance: userData.balance - totalCost,
            updatedAt: Timestamp.now(),
          }); // Calculate new stock quantity
          const newStockQuantity = stockData.stock - quantity;

          // Always update admin stock (no longer delete when reaching zero)
          t.update(stockRef, {
            stock: newStockQuantity,
            updatedAt: Timestamp.now(),
          });

          // Update or create inventory item
          if (productExists && productData) {
            t.update(productRef, {
              stock: (productData.stock || 0) + quantity,
              features: stockData.features || productData.features || "",
              rating: stockData.rating || productData.rating || 0,
              reviews: stockData.reviews || productData.reviews || [],
              // Ensure original cost is preserved or set
              originalCost: productData.originalCost || productData.cost || stockData.price,
              cost: productData.cost || productData.originalCost || stockData.price,
              updatedAt: Timestamp.now(),
            });
          } else {
            t.set(productRef, {
              productId: stockData.productId || stockId,
              productCode: stockData.productCode,
              name: stockData.name,
              description: stockData.description || "",
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
              purchasePrice: stockData.price,
              originalCost: stockData.price, // Track original cost for pending deposit calculation
              cost: stockData.price, // Alternative field name for original cost
              features: stockData.features || "",
              rating: stockData.rating || 0,
              reviews: stockData.reviews || [],
              listed: false,
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
            productId: stockData.productId || stockId,
            productCode: stockData.productCode || `STOCK-${stockId}`,
            productName: stockData.name || "Unknown Product",
            stockId,
            quantity,
            pricePerUnit: stockData.price,
            totalPrice: totalCost,
            createdAt: Timestamp.now(),
          });

          // Log the activity
          const activityRef = collection(firestore, "activities");
          const newActivityDoc = doc(activityRef);
          t.set(newActivityDoc, {
            userId,
            userDisplayName:
              userData.displayName || userData.email || "Unknown User",
            type: "stock_purchased",
            details: {
              quantity,
              productName: stockData.name,
            },
            status: "completed",
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
   * Process admin purchase of a listing
   * @param adminId The admin's ID
   * @param listingId The listing ID to purchase from
   * @param quantity Quantity to purchase (typically 1)
   * @param sellerId The seller's ID
   * @param price Price per unit
   * @returns Promise with purchase result
   */
  static async processAdminPurchase(
    adminId: string,
    listingId: string,
    quantity: number,
    sellerId: string,
    price: number
  ): Promise<PurchaseResult> {
    try {
      // First, get listing data to check product ID
      const listingRef = doc(firestore, this.LISTINGS_COLLECTION, listingId);
      const listingDoc = await getDoc(listingRef);

      if (!listingDoc.exists()) {
        return {
          success: false,
          message: "Listing not found",
          quantity: 0,
          totalCost: 0,
        };
      }

      const listingData = listingDoc.data() as DocumentData;
      const productId = listingData.productId || `listing-${listingId}`;

      console.log(
        `Admin purchase attempt - productId: ${productId}, sellerId: ${sellerId}`
      );

      // Check if this product has a pending deposit entry (new system)
      const { PendingDepositService } = await import("./pendingDepositService");
      let { deposit, found } =
        await PendingDepositService.findPendingDepositByProduct(
          sellerId,
          productId
        );

      console.log(
        `Pending deposit search result - found: ${found}, deposit:`,
        deposit
      );

      // If no pending deposit exists, create one now
      if (!found || !deposit) {
        console.log(
          `No pending deposit found for product ${productId}. Creating one now.`
        );

        // Get listing data to calculate deposit requirements
        const listingRef = doc(firestore, this.LISTINGS_COLLECTION, listingId);
        const listingDoc = await getDoc(listingRef);

        if (!listingDoc.exists()) {
          return {
            success: false,
            message: "Listing not found",
            quantity: 0,
            totalCost: price * quantity,
          };
        }

        const listingData = listingDoc.data();

        // Get original cost from inventory
        const inventoryRef = doc(
          firestore,
          `${this.INVENTORY_COLLECTION}/${sellerId}/products/${productId}`
        );
        const inventoryDoc = await getDoc(inventoryRef);

        if (!inventoryDoc.exists()) {
          return {
            success: false,
            message: "Product not found in seller's inventory",
            quantity: 0,
            totalCost: price * quantity,
          };
        }

        const inventoryData = inventoryDoc.data();
        const originalCost =
          inventoryData.originalCost || inventoryData.cost || 0;

        // Create pending deposit
        const createResult = await PendingDepositService.createPendingDeposit(
          sellerId,
          productId,
          listingData.name || "Unknown Product",
          listingId,
          quantity,
          originalCost,
          price,
          listingData.mainImage || listingData.image || (listingData.images && listingData.images[0]) || "", // Product image
          listingData.images || (listingData.mainImage ? [listingData.mainImage] : []) || (listingData.image ? [listingData.image] : []) // Product images array
        );

        if (!createResult.success) {
          return {
            success: false,
            message: `Failed to create pending deposit: ${createResult.message}`,
            quantity: 0,
            totalCost: price * quantity,
          };
        }

        // Refetch the created deposit
        const refetchResult =
          await PendingDepositService.findPendingDepositByProduct(
            sellerId,
            productId
          );

        deposit = refetchResult.deposit;
        found = refetchResult.found;

        console.log(
          `Created pending deposit with ID: ${createResult.depositId}`
        );
      }

      if (found && deposit) {
        console.log(
          `Using pending deposit system for admin purchase of product ${productId}`
        );

        // Use new pending deposit system - process the sale properly
        try {
          // First update the listing quantity in a transaction
          await runTransaction(firestore, async (t: Transaction) => {
            const listingRefTx = doc(
              firestore,
              this.LISTINGS_COLLECTION,
              listingId
            );
            const listingDocTx = await t.get(listingRefTx);

            if (!listingDocTx.exists()) {
              throw new Error("Listing not found in transaction");
            }

            const listingDataTx = listingDocTx.data() as DocumentData;

            // Validate listing quantity
            if (listingDataTx.quantity < quantity) {
              throw new Error("Insufficient stock in listing");
            }

            // Update listing quantity
            const newQuantity = listingDataTx.quantity - quantity;
            t.update(listingRefTx, {
              quantity: newQuantity,
              updatedAt: Timestamp.now(),
            });
          });

          // Admin purchase: DO NOT mark as sold yet - just record the admin taking the item
          // The item should only be marked as sold when a real customer buys it
          console.log(
            `Admin took item from product pool - NOT marking as sold (item stays pending until real customer purchase)`
          );

          const saleResult = { success: true, message: "Admin took item from pool" }; // Mock success since we're not marking as sold

          if (saleResult.success) {
            console.log(
              `Successfully processed admin purchase with pending deposit system`
            );

            // Record the admin purchase for tracking
            const purchaseRef = collection(
              firestore,
              StockService.PURCHASES_COLLECTION
            );
            const newPurchaseDoc = doc(purchaseRef);
            await setDoc(newPurchaseDoc, {
              userId: adminId,
              sellerId: sellerId,
              listingId: listingId,
              productId: productId,
              productCode: listingData.productCode || `LISTING-${listingId}`,
              productName: listingData.name || "Unknown Product",
              quantity,
              pricePerUnit: price,
              totalPrice: price * quantity,
              isAdminPurchase: true,
              usesPendingDepositSystem: true,
              adminTookFromPool: true, // Flag to indicate this was admin taking from pool
              createdAt: Timestamp.now(),
            });

            // Also create pending product entry for receipt upload workflow
            const { PendingProductService } = await import(
              "./pendingProductService"
            );
            const { UserService } = await import("./userService");

            // Fetch seller information
            let sellerName = "Unknown Seller";
            let sellerEmail = "";
            try {
              const sellerProfile = await UserService.getUserProfile(sellerId);
              if (sellerProfile) {
                sellerName =
                  sellerProfile.displayName ||
                  sellerProfile.email?.split("@")[0] ||
                  "Unknown Seller";
                sellerEmail = sellerProfile.email || "";
              }
            } catch (error) {
              console.warn(
                "Could not fetch seller profile for pending product:",
                error
              );
            }

            await PendingProductService.createPendingProduct(
              sellerId,
              productId,
              listingData.name || "Unknown Product",
              quantity,
              price,
              adminId, // buyerId (admin)
              listingData.mainImage || listingData.images?.[0], // productImage
              sellerName,
              sellerEmail,
              "Admin", // buyerName
              "" // buyerEmail (admin email not needed)
            );

            return {
              success: true,
              message:
                "Admin purchase successful (using pending deposit system)",
              quantity,
              totalCost: price * quantity,
            };
          } else {
            console.error(
              "Failed to process sale through pending deposit system:",
              saleResult.message
            );
            return {
              success: false,
              message: `Sale processing failed: ${saleResult.message}`,
              quantity: 0,
              totalCost: price * quantity,
            };
          }
        } catch (error) {
          console.error(
            "Error processing admin purchase with pending deposit system:",
            error
          );
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to process admin purchase",
            quantity: 0,
            totalCost: price * quantity,
          };
        }
      } else {
        console.log(
          `Failed to create or find pending deposit for product ${productId} - using old system as fallback`
        );

        // Fall back to existing system for products without pending deposits
        return await runTransaction(
          firestore,
          async (t: Transaction): Promise<PurchaseResult> => {
            // Get all references
            const listingRefTx = doc(
              firestore,
              this.LISTINGS_COLLECTION,
              listingId
            );
            const adminRef = doc(firestore, "users", adminId);
            const sellerRef = doc(firestore, "users", sellerId);

            // Get current data - ALL READS FIRST
            const listingDocTx = await t.get(listingRefTx);
            const adminDoc = await t.get(adminRef);
            const sellerDoc = await t.get(sellerRef);

            if (
              !listingDocTx.exists() ||
              !adminDoc.exists() ||
              !sellerDoc.exists()
            ) {
              return {
                success: false,
                message: "Listing, admin, or seller not found",
                quantity: 0,
                totalCost: 0,
              };
            }

            const listingDataTx = listingDocTx.data() as DocumentData;
            const adminData = adminDoc.data() as DocumentData;
            const sellerData = sellerDoc.data() as DocumentData;

            // Validate listing data
            if (listingDataTx.quantity < quantity) {
              return {
                success: false,
                message: "Insufficient stock in listing",
                quantity: 0,
                totalCost: price * quantity,
              };
            }

            const totalCost = price * quantity;

            // Check admin's balance
            if (adminData.balance < totalCost) {
              return {
                success: false,
                message: "Insufficient admin balance",
                quantity: 0,
                totalCost,
              };
            }

            // Now perform all write operations

            // Deduct from admin balance
            t.update(adminRef, {
              balance: adminData.balance - totalCost,
              updatedAt: Timestamp.now(),
            });

            // Add to seller balance (direct transfer, no fees)
            t.update(sellerRef, {
              balance: (sellerData.balance || 0) + totalCost,
              updatedAt: Timestamp.now(),
            });

            // Update listing quantity
            const newQuantity = listingDataTx.quantity - quantity;
            t.update(listingRefTx, {
              quantity: newQuantity,
              updatedAt: Timestamp.now(),
            });

            // Record the admin purchase
            const purchaseRef = collection(
              firestore,
              StockService.PURCHASES_COLLECTION
            );
            const newPurchaseDoc = doc(purchaseRef);
            t.set(newPurchaseDoc, {
              userId: adminId,
              sellerId: sellerId,
              listingId: listingId,
              productId: productId,
              productCode: listingDataTx.productCode || `LISTING-${listingId}`,
              productName: listingDataTx.name || "Unknown Product",
              quantity,
              pricePerUnit: price,
              totalPrice: totalCost,
              isAdminPurchase: true,
              usesPendingDepositSystem: false, // Flag for old system
              createdAt: Timestamp.now(),
            });

            return {
              success: true,
              message: "Admin purchase successful (using legacy system)",
              quantity,
              totalCost,
            };
          }
        );
      }
    } catch (error: unknown) {
      console.error("Error processing admin purchase:", error);
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
          // 1. GATHER ALL REQUIRED DATA FIRST
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

          // Check if product is already listed - READ OPERATION
          const listingQuery = query(
            collection(firestore, StockService.LISTINGS_COLLECTION),
            where("sellerId", "==", sellerId),
            where("productId", "==", productId)
          );
          const listingSnapshot = await getDocs(listingQuery);

          // 2. PREPARE THE DATA
          const listingData = {
            sellerId,
            productId,
            name: inventoryData.name,
            description: inventoryData.description || "",
            features: inventoryData.features || "",
            image:
              inventoryData.mainImage ||
              inventoryData.image ||
              (inventoryData.images && inventoryData.images.length > 0
                ? inventoryData.images[0]
                : ""),
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
          };

          // 3. PERFORM ALL WRITES
          // Update inventory first
          t.update(inventoryRef, {
            stock: inventoryData.stock - quantity,
            updatedAt: Timestamp.now(),
          });

          if (!listingSnapshot.empty) {
            // Update existing listing
            const listingDoc = listingSnapshot.docs[0];
            const existingData = listingDoc.data();
            t.update(
              doc(firestore, StockService.LISTINGS_COLLECTION, listingDoc.id),
              {
                quantity: existingData.quantity + quantity,
                price: price, // Update to new price
                updatedAt: Timestamp.now(),
              }
            );
          } else {
            // Create new listing
            const listingRef = doc(
              collection(firestore, StockService.LISTINGS_COLLECTION)
            );
            t.set(listingRef, listingData);
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

          const listingData = listingDoc.data(); // If updating quantity, validate inventory
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
          // 1. PERFORM ALL READS FIRST
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

          // Get inventory reference
          const inventoryRef = doc(
            firestore,
            `${StockService.INVENTORY_COLLECTION}/${sellerId}/products/${listingData.productId}`
          );
          const inventoryDoc = await t.get(inventoryRef);

          // 2. PERFORM ALL WRITES
          // Delete listing first
          t.delete(listingRef);

          // Return stock to inventory
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
              (typeof data.stock === "number" ||
                data.stock === 0 ||
                data.stock === null ||
                data.stock === undefined)
            ) {
              // Ensure stock is always a number (default to 0 for null/undefined)
              const stockValue =
                typeof data.stock === "number" ? data.stock : 0;

              stocks.push({
                id: doc.id,
                ...data,
                stock: stockValue, // Normalize stock value
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
   */
  static async searchListingsByProductId(
    productId: string
  ): Promise<StockListing[]> {
    try {
      const listingsQuery = query(
        collection(firestore, this.LISTINGS_COLLECTION),
        where("productId", "==", productId),
        orderBy("price", "asc") // Get best deals first
      );

      const snapshot = await getDocs(listingsQuery);
      const listings: StockListing[] = [];
      snapshot.forEach((doc) => {
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

      return listings;
    } catch (error) {
      console.error("Error searching listings by product ID:", error);
      throw error;
    }
  }

  /**
   * Create a listing from admin stock without upfront payment (seller workflow)
   * This adds the product to inventory, creates a listing, and tracks pending deposit
   * @param sellerId The seller's user ID
   * @param stockId The admin stock item ID
   * @param quantity The quantity to list
   * @param listingPrice The price to list at (with markup)
   * @returns Promise with success status and listing details
   */
  static async createListingFromAdminStock(
    sellerId: string,
    stockId: string,
    quantity: number,
    listingPrice: number
  ): Promise<PurchaseResult & { listingId?: string; productId?: string }> {
    try {
      console.log(
        `Creating listing from admin stock - sellerId: ${sellerId}, stockId: ${stockId}, quantity: ${quantity}`
      );

      return await this.runSecureTransaction(
        async (
          t: Transaction
        ): Promise<
          PurchaseResult & { listingId?: string; productId?: string }
        > => {
          // 1. PREPARE ALL REFERENCES
          const stockRef = doc(firestore, StockService.COLLECTION, stockId);
          const inventoryCollectionPath = `${StockService.INVENTORY_COLLECTION}/${sellerId}/products`;
          const inventoryRef = collection(firestore, inventoryCollectionPath);

          console.log(
            `Stock reference path: ${StockService.COLLECTION}/${stockId}`
          );

          // 2. PERFORM ALL READS FIRST
          const stockDoc = await t.get(stockRef);

          if (!stockDoc.exists()) {
            console.log(`Stock document not found for ID: ${stockId}`);
            return {
              success: false,
              message: "Stock item not found",
              quantity: 0,
              totalCost: 0,
            };
          }

          console.log(`Stock document found, data:`, stockDoc.data());

          const stockData = stockDoc.data() as DocumentData;

          // Validate stock data with detailed error messages
          if (!stockData.productCode) {
            return {
              success: false,
              message: "Stock item missing product code",
              quantity: 0,
              totalCost: 0,
            };
          }

          if (!stockData.name) {
            return {
              success: false,
              message: "Stock item missing name",
              quantity: 0,
              totalCost: 0,
            };
          }

          if (typeof stockData.price !== "number") {
            return {
              success: false,
              message: "Stock item has invalid price",
              quantity: 0,
              totalCost: 0,
            };
          }

          if (typeof stockData.stock !== "number") {
            return {
              success: false,
              message: "Stock item has invalid stock quantity",
              quantity: 0,
              totalCost: 0,
            };
          }

          if (stockData.stock < quantity) {
            return {
              success: false,
              message: `Insufficient stock. Available: ${stockData.stock}, Requested: ${quantity}`,
              quantity: 0,
              totalCost: 0,
            };
          }

          if (!stockData.listed) {
            return {
              success: false,
              message: "Stock item is not listed for sale",
              quantity: 0,
              totalCost: 0,
            };
          }

          // Check inventory for existing product
          const productId = stockData.productId || stockId;
          const productRef = doc(inventoryRef, productId);
          const productDoc = await t.get(productRef);
          const productExists = productDoc.exists();
          const productData = productExists ? productDoc.data() : null;

          // 3. PERFORM ALL WRITES
          // Update admin stock quantity
          const newStockQuantity = stockData.stock - quantity;
          t.update(stockRef, {
            stock: newStockQuantity,
            updatedAt: Timestamp.now(),
          });

          // Add/update inventory item (no balance deduction)
          if (productExists && productData) {
            t.update(productRef, {
              stock: (productData.stock || 0) + quantity,
              features: stockData.features || productData.features || "",
              rating: stockData.rating || productData.rating || 0,
              reviews: stockData.reviews || productData.reviews || [],
              // Ensure original cost is preserved or set
              originalCost: productData.originalCost || productData.cost || stockData.price,
              cost: productData.cost || productData.originalCost || stockData.price,
              updatedAt: Timestamp.now(),
            });
          } else {
            t.set(productRef, {
              productId: stockData.productId || stockId,
              productCode: stockData.productCode,
              name: stockData.name,
              description: stockData.description || "",
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
              price: stockData.price, // Original admin price
              purchasePrice: stockData.price,
              originalCost: stockData.price, // Track original cost for pending deposit calculation
              cost: stockData.price, // Alternative field name for original cost
              features: stockData.features || "",
              rating: stockData.rating || 0,
              reviews: stockData.reviews || [],
              listed: false,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
          }

          // 4. Create the listing
          const listingData = {
            sellerId,
            productId: productId,
            name: stockData.name,
            description: stockData.description || "",
            features: stockData.features || "",
            image:
              stockData.mainImage ||
              stockData.image ||
              (stockData.images && stockData.images.length > 0
                ? stockData.images[0]
                : ""),
            images:
              stockData.images || (stockData.image ? [stockData.image] : []),
            mainImage:
              stockData.mainImage ||
              stockData.image ||
              (stockData.images && stockData.images.length > 0
                ? stockData.images[0]
                : ""),
            imageUrl: stockData.imageUrl || stockData.imageURL || "",
            imageURL: stockData.imageURL || stockData.imageUrl || "",
            category: stockData.category,
            reviews: Array.isArray(stockData.reviews)
              ? stockData.reviews
              : typeof stockData.reviews === "number"
              ? Array(stockData.reviews).fill({
                  rating: stockData.rating || 0,
                  content: "Legacy review",
                  date: new Date().toISOString(),
                })
              : [],
            rating: stockData.rating || 0,
            reviewCount: Array.isArray(stockData.reviews)
              ? stockData.reviews.length
              : typeof stockData.reviews === "number"
              ? stockData.reviews
              : 0,
            quantity,
            price: listingPrice, // Marked up price
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          // Check if listing already exists
          const existingListingQuery = query(
            collection(firestore, StockService.LISTINGS_COLLECTION),
            where("sellerId", "==", sellerId),
            where("productId", "==", productId)
          );
          const existingListingSnapshot = await getDocs(existingListingQuery);

          let listingId: string;

          if (!existingListingSnapshot.empty) {
            // Update existing listing
            const listingDoc = existingListingSnapshot.docs[0];
            listingId = listingDoc.id;
            const existingData = listingDoc.data();
            t.update(
              doc(firestore, StockService.LISTINGS_COLLECTION, listingId),
              {
                quantity: existingData.quantity + quantity,
                price: listingPrice, // Update to new price
                updatedAt: Timestamp.now(),
              }
            );
          } else {
            // Create new listing
            const listingRef = doc(
              collection(firestore, StockService.LISTINGS_COLLECTION)
            );
            listingId = listingRef.id;
            t.set(listingRef, listingData);
          }

          return {
            success: true,
            message: "Listing created from admin stock without payment",
            quantity,
            totalCost: stockData.price * quantity, // Original cost for pending deposit
            listingId,
            productId,
          };
        }
      );
    } catch (error) {
      console.error("Error creating listing from admin stock:", error);
      throw error;
    }
  }

  /**
   * Fetch real seller names for listings and update them in real-time
   * 
   * @param listings The listings to update with real seller names
   * @param onUpdate Callback when listings are updated with real seller names
   */
  static async fetchSellerNamesForListings(
    listings: StockListing[],
    onUpdate: (updatedListings: StockListing[]) => void
  ): Promise<void> {
    try {
      // Create a map of seller IDs to track which ones we need to fetch
      const sellerIds = new Set<string>();
      
      // Collect all seller IDs that don't already have names
      listings.forEach(listing => {
        if (listing.sellerId && (!listing.sellerName || listing.sellerName === "Unknown Seller" || listing.sellerName === "Loading...")) {
          sellerIds.add(listing.sellerId);
        }
      });
      
      // If we don't have any sellers to fetch, just return
      if (sellerIds.size === 0) {
        return;
      }
      
      // Create a map to cache seller data as we fetch it
      const sellerData: Record<string, string> = {};
      
      // Fetch all seller information in parallel
      await Promise.all(
        Array.from(sellerIds).map(async (sellerId) => {
          try {
            const sellerDoc = await getDoc(doc(firestore, "users", sellerId));
            if (sellerDoc.exists()) {
              const data = sellerDoc.data();
              sellerData[sellerId] = data.displayName || 
                                     data.name || 
                                    (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : "Unknown Seller");
            } else {
              sellerData[sellerId] = "Unknown Seller";
            }
          } catch (error) {
            console.error(`Error fetching seller name for ID ${sellerId}:`, error);
            sellerData[sellerId] = "Unknown Seller";
          }
        })
      );
      
      // Update the listings with real seller names
      const updatedListings = listings.map(listing => {
        if (listing.sellerId && sellerData[listing.sellerId]) {
          return {
            ...listing,
            sellerName: sellerData[listing.sellerId]
          };
        }
        return listing;
      });
      
      // Call the update callback with the updated listings
      onUpdate(updatedListings);
    } catch (error) {
      console.error("Error fetching seller names:", error);
    }
  }
}

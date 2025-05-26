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
          console.error(`Error cleaning up inventory for seller ${sellerId}:`, error);
          // Continue with other sellers even if one fails
        }
      }
      
      console.log(`Global inventory cleanup: Removed ${itemsRemoved} zero-quantity items across ${sellersAffected} sellers`);
      return { itemsRemoved, sellersAffected };
    } catch (error) {
      console.error("Error in global inventory cleanup:", error);
      throw error;
    }
  }

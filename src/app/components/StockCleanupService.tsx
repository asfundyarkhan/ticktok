"use client";

import { useEffect } from "react";
import { StockService } from "../../services/stockService";

export default function StockCleanupService() {
  useEffect(() => {
    // Run initial cleanup of all systems
    const runInitialCleanup = async () => {
      try {
        // Clean up admin stocks and listings
        const stockCleanup = await StockService.cleanupZeroQuantityItems();
        console.log(
          `Initial cleanup removed ${stockCleanup.adminItemsRemoved} admin items and ${stockCleanup.listingsRemoved} listings with zero quantity`
        );

        // Clean up all sellers' inventory items
        const inventoryCleanup = await StockService.cleanupAllSellersZeroInventory();
        console.log(
          `Initial inventory cleanup removed ${inventoryCleanup.itemsRemoved} items across ${inventoryCleanup.sellersAffected} sellers`
        );
      } catch (error) {
        console.error("Error during initial cleanup:", error);
      }
    };

    // Run initial cleanup
    runInitialCleanup();

    // Initialize periodic cleanup every 15 minutes
    const cleanupCancellation = StockService.initializePeriodicCleanup(15);

    // Cleanup function to stop the periodic task when component unmounts
    return () => {
      cleanupCancellation();
    };
  }, []);

  // This is a service component with no UI
  return null;
}

"use client";

import { useState } from "react";
import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  where,
  Timestamp 
} from "firebase/firestore";
import { firestore } from "../../lib/firebase/firebase";
import toast from "react-hot-toast";

interface MigrationStats {
  totalProductsProcessed: number;
  totalInstancesCreated: number;
  migratedProducts: string[];
}

export default function ProductInstanceMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStats, setMigrationStats] = useState<MigrationStats | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Generate unique ID for each product instance
  const generateUniqueInstanceId = (baseProductId: string, instanceNumber: number): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${baseProductId}-inst-${instanceNumber}-${timestamp}-${random}`;
  };

  // Generate unique product code for each instance
  const generateUniqueProductCode = (baseProductCode: string, instanceNumber: number): string => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${baseProductCode}-${instanceNumber}-${random}`;
  };

  const runMigration = async () => {
    setIsMigrating(true);
    setShowConfirmation(false);
    
    const loadingToast = toast.loading("Migrating products to unique instances...");
    
    try {
      // Get all stock items with quantity > 1
      const stockRef = collection(firestore, "stock_items");
      const stockSnapshot = await getDocs(stockRef);
      
      let totalProductsProcessed = 0;
      let totalInstancesCreated = 0;
      const migratedProducts: string[] = [];
      
      for (const docSnapshot of stockSnapshot.docs) {
        const data = docSnapshot.data();
        const quantity = data.stock || data.quantity || 1;
        
        // Skip if already migrated or if quantity is 1
        if (data.migrated === true || quantity <= 1) {
          continue;
        }
        
        console.log(`Processing product: ${data.name} (${quantity} units)`);
        
        // Create batch for atomic operations
        const batch = writeBatch(firestore);
        
        // Create individual instances for each unit
        for (let i = 1; i <= quantity; i++) {
          const uniqueInstanceId = generateUniqueInstanceId(docSnapshot.id, i);
          const uniqueProductCode = generateUniqueProductCode(data.productCode || docSnapshot.id, i);
          
          const instanceData = {
            ...data,
            // Each instance has quantity of 1
            stock: 1,
            quantity: 1,
            
            // Unique identifiers for each instance
            productId: uniqueInstanceId,
            productCode: uniqueProductCode,
            originalProductId: docSnapshot.id, // Keep reference to original
            originalProductCode: data.productCode, // Keep reference to original
            instanceNumber: i,
            totalInstances: quantity,
            
            // Reset status fields for each instance
            depositReceiptApproved: false,
            depositReceiptUrl: null,
            pendingDepositId: null,
            
            // Instance metadata
            isInstance: true,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
            migratedAt: Timestamp.now(),
          };
          
          const newDocRef = doc(stockRef, uniqueInstanceId);
          batch.set(newDocRef, instanceData);
        }
        
        // Mark original as migrated (don't delete to preserve history)
        batch.update(docSnapshot.ref, {
          migrated: true,
          migratedAt: Timestamp.now(),
          originalQuantity: quantity,
          // Keep the original product but mark it as unlisted
          listed: false,
        });
        
        await batch.commit();
        
        console.log(`Created ${quantity} instances for ${data.name}`);
        totalProductsProcessed++;
        totalInstancesCreated += quantity;
        migratedProducts.push(data.name);
      }
      
      const stats: MigrationStats = {
        totalProductsProcessed,
        totalInstancesCreated,
        migratedProducts,
      };
      
      setMigrationStats(stats);
      
      toast.dismiss(loadingToast);
      toast.success(
        `Migration completed! Processed ${totalProductsProcessed} products and created ${totalInstancesCreated} unique instances.`,
        { duration: 5000 }
      );
      
    } catch (error) {
      console.error("Migration failed:", error);
      toast.dismiss(loadingToast);
      toast.error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      const stockRef = collection(firestore, "stock_items");
      
      // Check for products with quantity > 1 that haven't been migrated
      const nonMigratedQuery = query(
        stockRef,
        where("migrated", "!=", true)
      );
      const nonMigratedSnapshot = await getDocs(nonMigratedQuery);
      
      const productsNeedingMigration = nonMigratedSnapshot.docs.filter(doc => {
        const data = doc.data();
        const quantity = data.stock || data.quantity || 1;
        return quantity > 1;
      });
      
      // Check for existing instances
      const instancesQuery = query(
        stockRef,
        where("isInstance", "==", true)
      );
      const instancesSnapshot = await getDocs(instancesQuery);
      
      toast(
        `Status: ${productsNeedingMigration.length} products need migration, ${instancesSnapshot.size} instances already exist.`,
        { icon: "ℹ️" }
      );
      
    } catch (error) {
      console.error("Status check failed:", error);
      toast.error("Failed to check migration status");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Product Instance Migration
        </h2>
        <p className="text-sm text-gray-600">
          This tool creates unique instances for each product unit to prevent deposit receipt data sharing.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={checkMigrationStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            disabled={isMigrating}
          >
            Check Status
          </button>
          
          <button
            onClick={() => setShowConfirmation(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            disabled={isMigrating}
          >
            {isMigrating ? "Migrating..." : "Start Migration"}
          </button>
        </div>

        {migrationStats && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-green-900 mb-2">Migration Completed!</h3>
            <div className="text-sm text-green-800">
              <p>Products processed: <strong>{migrationStats.totalProductsProcessed}</strong></p>
              <p>Instances created: <strong>{migrationStats.totalInstancesCreated}</strong></p>
              {migrationStats.migratedProducts.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Migrated products:</summary>
                  <ul className="mt-1 ml-4 list-disc">
                    {migrationStats.migratedProducts.map((productName, index) => (
                      <li key={index}>{productName}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              Confirm Migration
            </h3>
            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-2">
                This will create unique instances for all products with quantity &gt; 1.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800">
                  <strong>Important:</strong> This operation cannot be undone easily. 
                  Make sure you have a backup of your data.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isMigrating}
              >
                Cancel
              </button>
              <button
                onClick={runMigration}
                className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                disabled={isMigrating}
              >
                {isMigrating ? "Migrating..." : "Start Migration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

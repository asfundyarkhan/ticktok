/**
 * Product Instance Migration Script
 *
 * This script fixes the issue where multiple quantities of the same product
 * share the same productId, causing deposit receipts and other data to be
 * shared between different instances.
 *
 * What it does:
 * 1. Finds products with quantity > 1
 * 2. Creates unique instances for each unit
 * 3. Updates the system to prevent future issues
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require("./serviceAccountKey.json"); // You'll need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com", // Replace with your project URL
});

const db = admin.firestore();

// Generate unique ID for each product instance
function generateUniqueInstanceId(baseProductId, instanceNumber) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseProductId}-inst-${instanceNumber}-${timestamp}-${random}`;
}

// Generate unique product code for each instance
function generateUniqueProductCode(baseProductCode, instanceNumber) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${baseProductCode}-${instanceNumber}-${random}`;
}

async function migrateProductInstances() {
  console.log("🚀 Starting product instance migration...");

  try {
    // Step 1: Get all stock items with quantity > 1
    const stockRef = db.collection("stock_items");
    const stockSnapshot = await stockRef.get();

    let totalProductsProcessed = 0;
    let totalInstancesCreated = 0;

    for (const doc of stockSnapshot.docs) {
      const data = doc.data();
      const quantity = data.stock || data.quantity || 1;

      if (quantity > 1) {
        console.log(`📦 Processing product: ${data.name} (${quantity} units)`);

        // Create individual instances for each unit
        const instances = [];
        for (let i = 1; i <= quantity; i++) {
          const uniqueInstanceId = generateUniqueInstanceId(doc.id, i);
          const uniqueProductCode = generateUniqueProductCode(
            data.productCode || doc.id,
            i
          );

          const instanceData = {
            ...data,
            // Each instance has quantity of 1
            stock: 1,
            quantity: 1,

            // Unique identifiers for each instance
            productId: uniqueInstanceId,
            productCode: uniqueProductCode,
            originalProductId: doc.id, // Keep reference to original
            instanceNumber: i,
            totalInstances: quantity,

            // Reset status fields for each instance
            depositReceiptApproved: false,
            depositReceiptUrl: null,
            pendingDepositId: null,

            // Instance metadata
            isInstance: true,
            createdAt: data.createdAt || admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            migratedAt: admin.firestore.Timestamp.now(),
          };

          instances.push({
            id: uniqueInstanceId,
            data: instanceData,
          });
        }

        // Batch write all instances
        const batch = db.batch();

        instances.forEach((instance) => {
          const newDocRef = stockRef.doc(instance.id);
          batch.set(newDocRef, instance.data);
        });

        // Mark original as migrated (don't delete to preserve history)
        batch.update(doc.ref, {
          migrated: true,
          migratedAt: admin.firestore.Timestamp.now(),
          instanceIds: instances.map((i) => i.id),
          originalQuantity: quantity,
        });

        await batch.commit();

        console.log(
          `✅ Created ${instances.length} instances for ${data.name}`
        );
        totalProductsProcessed++;
        totalInstancesCreated += instances.length;

        // Also update inventory collection if it exists
        if (data.sellerId) {
          await migrateInventoryInstances(data.sellerId, doc.id, instances);
        }

        // Also update listings collection if it exists
        await migrateListingInstances(doc.id, instances);
      }
    }

    console.log(`🎉 Migration completed!`);
    console.log(`📊 Products processed: ${totalProductsProcessed}`);
    console.log(`📊 Instances created: ${totalInstancesCreated}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function migrateInventoryInstances(
  sellerId,
  originalProductId,
  instances
) {
  try {
    const inventoryRef = db
      .collection("inventory")
      .doc(sellerId)
      .collection("products");
    const inventorySnapshot = await inventoryRef
      .where("productId", "==", originalProductId)
      .get();

    if (!inventorySnapshot.empty) {
      const batch = db.batch();

      inventorySnapshot.forEach((doc) => {
        const data = doc.data();

        instances.forEach((instance) => {
          const newDocRef = inventoryRef.doc(instance.id);
          batch.set(newDocRef, {
            ...data,
            productId: instance.id,
            productCode: instance.data.productCode,
            stock: 1,
            quantity: 1,
            originalProductId: originalProductId,
            instanceNumber: instance.data.instanceNumber,
            isInstance: true,
            migratedAt: admin.firestore.Timestamp.now(),
          });
        });

        // Mark original as migrated
        batch.update(doc.ref, {
          migrated: true,
          migratedAt: admin.firestore.Timestamp.now(),
        });
      });

      await batch.commit();
      console.log(`  📦 Updated inventory for seller ${sellerId}`);
    }
  } catch (error) {
    console.warn(
      `⚠️  Failed to migrate inventory for seller ${sellerId}:`,
      error
    );
  }
}

async function migrateListingInstances(originalProductId, instances) {
  try {
    const listingsRef = db.collection("listings");
    const listingsSnapshot = await listingsRef
      .where("productId", "==", originalProductId)
      .get();

    if (!listingsSnapshot.empty) {
      const batch = db.batch();

      listingsSnapshot.forEach((doc) => {
        const data = doc.data();

        instances.forEach((instance) => {
          const newDocRef = listingsRef.doc(instance.id);
          batch.set(newDocRef, {
            ...data,
            productId: instance.id,
            productCode: instance.data.productCode,
            quantity: 1,
            originalProductId: originalProductId,
            instanceNumber: instance.data.instanceNumber,
            isInstance: true,
            migratedAt: admin.firestore.Timestamp.now(),
          });
        });

        // Mark original as migrated
        batch.update(doc.ref, {
          migrated: true,
          migratedAt: admin.firestore.Timestamp.now(),
        });
      });

      await batch.commit();
      console.log(`  📋 Updated listings`);
    }
  } catch (error) {
    console.warn(`⚠️  Failed to migrate listings:`, error);
  }
}

// Verification function to check the migration
async function verifyMigration() {
  console.log("🔍 Verifying migration...");

  const stockRef = db.collection("stock_items");
  const migratedQuery = stockRef.where("isInstance", "==", true);
  const migratedSnapshot = await migratedQuery.get();

  console.log(`✅ Found ${migratedSnapshot.size} product instances`);

  // Group by original product
  const groupedInstances = {};
  migratedSnapshot.forEach((doc) => {
    const data = doc.data();
    const originalId = data.originalProductId;
    if (!groupedInstances[originalId]) {
      groupedInstances[originalId] = [];
    }
    groupedInstances[originalId].push(data);
  });

  console.log(
    `📊 Original products split into instances: ${
      Object.keys(groupedInstances).length
    }`
  );

  // Show summary
  Object.entries(groupedInstances).forEach(([originalId, instances]) => {
    console.log(
      `  ${instances[0]?.name || originalId}: ${instances.length} instances`
    );
  });
}

// Run the migration
async function main() {
  try {
    console.log("🔧 Product Instance Migration Tool");
    console.log("=====================================");

    // Ask for confirmation
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question(
        "⚠️  This will create unique instances for all products with quantity > 1. Continue? (yes/no): ",
        resolve
      );
    });

    rl.close();

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Migration cancelled");
      return;
    }

    await migrateProductInstances();
    await verifyMigration();

    console.log("🎉 All done! Your products now have unique instances.");
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  migrateProductInstances,
  verifyMigration,
};

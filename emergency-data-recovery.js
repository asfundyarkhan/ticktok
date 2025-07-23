// EMERGENCY DATA RECOVERY SCRIPT
// ===========================
// This script attempts to recover data in receipts_v2 collection
// by checking for missing fields or inconsistent values

const admin = require("firebase-admin");
const fs = require("fs");

// Check for service account file
if (!fs.existsSync("./serviceAccountKey.json")) {
  console.error("❌ ERROR: serviceAccountKey.json file not found!");
  console.error(
    "Please place your Firebase service account key in the project root."
  );
  process.exit(1);
}

const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function diagnoseAndRecover() {
  console.log("🔍 STARTING EMERGENCY DATA DIAGNOSIS AND RECOVERY");
  console.log("================================================");

  try {
    // First, let's get collection statistics
    const collections = ["receipts_v2", "users", "orders", "pending_deposits"];

    for (const collection of collections) {
      try {
        const snapshot = await db.collection(collection).limit(1).get();
        console.log(`✓ Collection '${collection}' exists and is accessible`);
      } catch (error) {
        console.error(
          `❌ Error accessing collection '${collection}':`,
          error.message
        );
      }
    }

    // Now check receipts specifically
    console.log("\n📝 Analyzing receipts_v2 collection...");
    const receiptsSnapshot = await db.collection("receipts_v2").get();

    if (receiptsSnapshot.empty) {
      console.error("❌ CRITICAL: receipts_v2 collection appears to be empty!");
      console.error(
        "This may indicate data loss. Please contact Firebase support immediately."
      );
    } else {
      console.log(`Found ${receiptsSnapshot.size} documents in receipts_v2`);

      // Analyze document structure
      const sampleSize = Math.min(receiptsSnapshot.size, 50);
      console.log(
        `\nAnalyzing ${sampleSize} sample documents for field presence:`
      );

      const fieldStats = {};
      const criticalFields = [
        "amount",
        "currency",
        "customerId",
        "sellerId",
        "status",
        "submittedAt",
      ];

      let i = 0;
      for (const doc of receiptsSnapshot.docs) {
        if (i >= sampleSize) break;

        const data = doc.data();
        Object.keys(data).forEach((field) => {
          fieldStats[field] = (fieldStats[field] || 0) + 1;
        });

        i++;
      }

      // Report on critical fields
      console.log("\nCritical field presence in sample:");
      criticalFields.forEach((field) => {
        const presence = fieldStats[field] || 0;
        const percentage = ((presence / sampleSize) * 100).toFixed(1);
        console.log(`- ${field}: ${presence}/${sampleSize} (${percentage}%)`);

        if (presence < sampleSize) {
          console.log(
            `  ❌ WARNING: Some documents are missing the '${field}' field!`
          );
        }
      });

      // Look for payment type fields
      const walletField = fieldStats["isWalletPayment"] || 0;
      const depositField = fieldStats["isDepositPayment"] || 0;

      console.log(`\nPayment type fields:`);
      console.log(
        `- isWalletPayment: ${walletField}/${sampleSize} (${(
          (walletField / sampleSize) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `- isDepositPayment: ${depositField}/${sampleSize} (${(
          (depositField / sampleSize) *
          100
        ).toFixed(1)}%)`
      );

      // Offer recovery options
      if (walletField < sampleSize || depositField < sampleSize) {
        console.log(
          "\n⚠️ Some payment type fields may be missing. Would you like to:"
        );
        console.log(
          "1. Attempt to restore missing fields based on payment types"
        );
        console.log("2. Exit without making changes");

        // In a real interactive script, we'd get input here
        // For now, we'll just offer the code that would run

        console.log("\n✅ To restore data, run:");
        console.log("node emergency-data-recovery.js --restore");
      }
    }
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  }
}

async function performDataRecovery() {
  console.log("🚑 STARTING EMERGENCY DATA RECOVERY");
  console.log("==================================");

  try {
    const receiptsSnapshot = await db.collection("receipts_v2").get();
    console.log(`Found ${receiptsSnapshot.size} documents to process`);

    let updatedCount = 0;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;

      // Check for critical fields and attempt to restore them
      if (data.paymentMethod === "USDT" && data.isWalletPayment === undefined) {
        updates.isWalletPayment = false;
        needsUpdate = true;
      }

      if (
        data.paymentMethod === "wallet" &&
        data.isWalletPayment === undefined
      ) {
        updates.isWalletPayment = true;
        needsUpdate = true;
      }

      // Check for deposit payment field
      if (data.type === "deposit" && data.isDepositPayment === undefined) {
        updates.isDepositPayment = true;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.restored = true;
        updates.restoredAt = admin.firestore.Timestamp.now();

        batch.update(doc.ref, updates);
        updatedCount++;
        batchCount++;

        if (batchCount >= 450) {
          // Firestore batch limit is 500
          console.log(`Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      console.log(`Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }

    console.log(`\n✅ Recovery complete! Updated ${updatedCount} documents.`);
  } catch (error) {
    console.error("❌ Error during recovery:", error);
  }
}

// Main execution
if (process.argv.includes("--restore")) {
  performDataRecovery().then(() => {
    console.log("\n🏁 Emergency recovery process completed.");
  });
} else {
  diagnoseAndRecover().then(() => {
    console.log(
      "\n🏁 Diagnosis completed. Run with --restore to perform recovery."
    );
  });
}

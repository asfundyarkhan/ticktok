/**
 * Debug script to check product IDs and their structure
 * Run this in the project root to diagnose product navigation issues
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL:
        process.env.FIREBASE_DATABASE_URL ||
        "https://ticktok-7b7b6-default-rtdb.firebaseio.com",
    });

    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function debugProductIds() {
  try {
    console.log("\n=== Debugging Product IDs ===\n");

    // Get all stock items
    console.log("1. Checking adminStock collection...");
    const stockSnapshot = await db.collection("adminStock").get();

    console.log(`Found ${stockSnapshot.size} items in adminStock collection\n`);

    stockSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Stock Item ${index + 1}:`);
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Product Code: ${data.productCode || "NONE"}`);
      console.log(`  Product ID: ${data.productId || "NONE"}`);
      console.log(`  Name: ${data.name || "NONE"}`);
      console.log(`  Listed: ${data.listed || false}`);
      console.log(`  Stock: ${data.stock || 0}`);
      console.log("");
    });

    // Check if there are any seller listings
    console.log("2. Checking sellerListings collection...");
    const listingsSnapshot = await db.collection("sellerListings").get();

    console.log(
      `Found ${listingsSnapshot.size} items in sellerListings collection\n`
    );

    listingsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Listing ${index + 1}:`);
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Product ID: ${data.productId || "NONE"}`);
      console.log(`  Name: ${data.name || "NONE"}`);
      console.log(`  Quantity: ${data.quantity || 0}`);
      console.log("");
    });

    // Test the specific getStockItem functionality
    console.log("3. Testing getStockItem functionality...");

    if (stockSnapshot.size > 0) {
      const firstDoc = stockSnapshot.docs[0];
      const firstData = firstDoc.data();

      console.log(`Testing with Document ID: ${firstDoc.id}`);
      console.log(`Testing with Product Code: ${firstData.productCode}`);

      // Test by document ID
      try {
        const byId = await db.collection("adminStock").doc(firstDoc.id).get();
        console.log(`  Found by ID: ${byId.exists}`);
      } catch (error) {
        console.log(`  Error finding by ID: ${error.message}`);
      }

      // Test by product code
      if (firstData.productCode) {
        try {
          const byCodeQuery = await db
            .collection("adminStock")
            .where("productCode", "==", firstData.productCode)
            .get();
          console.log(`  Found by product code: ${!byCodeQuery.empty}`);
        } catch (error) {
          console.log(`  Error finding by product code: ${error.message}`);
        }
      }
    }

    console.log("\n=== Debug Complete ===");
  } catch (error) {
    console.error("Error during debug:", error);
  } finally {
    process.exit(0);
  }
}

debugProductIds();

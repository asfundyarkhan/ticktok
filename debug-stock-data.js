const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} = require("firebase/firestore");

// Firebase config - you'll need to use your actual config
const firebaseConfig = {
  // Add your Firebase config here
  // This script is just for debugging - you can run it manually if needed
};

async function debugStockData() {
  try {
    console.log("Debugging stock data...");

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get all admin stock items
    const stockQuery = query(
      collection(db, "adminStock"),
      where("listed", "==", true),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(stockQuery);

    console.log(`Found ${snapshot.size} stock items`);

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- Product ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Product Code: ${data.productCode}`);
      console.log(`Stock: ${data.stock} (type: ${typeof data.stock})`);
      console.log(`Price: ${data.price}`);
      console.log(`Created: ${data.createdAt?.toDate()}`);

      // Check for any unusual properties
      if (data.stock === null || data.stock === undefined) {
        console.log("⚠️  Stock is null/undefined!");
      }
      if (typeof data.stock !== "number") {
        console.log("⚠️  Stock is not a number!");
      }
      if (data.stock <= 0) {
        console.log("⚠️  Stock is zero or negative!");
      }
    });
  } catch (error) {
    console.error("Error debugging stock data:", error);
  }
}

// Export for manual use
module.exports = { debugStockData };

// Note: This is a debug script. To use it:
// 1. Add your Firebase config
// 2. Run: node debug-stock-data.js

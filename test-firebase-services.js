// Comprehensive Firebase services test
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
} = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "tiktokshop.international",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId: "G-5BRMHTMXHR",
};

async function testAllFirebaseServices() {
  try {
    console.log("🧪 Testing all Firebase services...\n");

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log("✓ Firebase app initialized");

    // Test Auth
    const auth = getAuth(app);
    console.log("✓ Firebase Auth service initialized");

    // Test Firestore
    const firestore = getFirestore(app);
    console.log("✓ Firestore service initialized");

    // Test Storage
    const storage = getStorage(app);
    console.log("✓ Storage service initialized");

    // Test Firestore read access (crucial for store functionality)
    console.log("\n📚 Testing Firestore read access...");

    try {
      // Test reading from adminStock collection
      const adminStockRef = collection(firestore, "adminStock");
      const adminStockQuery = query(adminStockRef, limit(1));
      const adminStockSnapshot = await getDocs(adminStockQuery);
      console.log(
        `✓ adminStock collection accessible (${adminStockSnapshot.size} documents)`
      );

      // Test reading from listings collection
      const listingsRef = collection(firestore, "listings");
      const listingsQuery = query(listingsRef, limit(1));
      const listingsSnapshot = await getDocs(listingsQuery);
      console.log(
        `✓ listings collection accessible (${listingsSnapshot.size} documents)`
      );

      // Test reading from inventory collection
      const inventoryRef = collection(firestore, "inventory");
      const inventoryQuery = query(inventoryRef, limit(1));
      const inventorySnapshot = await getDocs(inventoryQuery);
      console.log(
        `✓ inventory collection accessible (${inventorySnapshot.size} documents)`
      );
    } catch (firestoreError) {
      console.error("✗ Firestore read test failed:", firestoreError);
      if (firestoreError.code === "permission-denied") {
        console.log(
          "⚠ This might indicate Firestore security rules need adjustment"
        );
      }
    }

    console.log("\n🎉 All Firebase services test completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Test the store page in browser");
    console.log("2. Check browser console for any client-side errors");
    console.log("3. Verify authentication flow works correctly");
  } catch (error) {
    console.error("✗ Firebase services test failed:", error);

    if (error.code === "auth/network-request-failed") {
      console.log("\n🔍 Network request failed - troubleshooting guide:");
      console.log("1. Check internet connectivity");
      console.log("2. Verify Firebase project is active");
      console.log("3. Check if corporate firewall blocks Firebase");
      console.log("4. Try running: npm run dev (in another terminal)");
      console.log("5. Access http://localhost:3000/store in browser");
    }
  }
}

testAllFirebaseServices();

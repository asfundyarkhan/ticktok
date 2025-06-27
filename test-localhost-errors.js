#!/usr/bin/env node

// Comprehensive localhost Firebase error testing script
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} = require("firebase/auth");
const {
  getFirestore,
  collection,
  getDocs,
  connectFirestoreEmulator,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId: "G-5BRMHTMXHR",
};

async function testFirebaseFromLocalhost() {
  console.log("🔥 Testing Firebase from localhost environment...\n");

  let app, auth, firestore;

  try {
    // Initialize Firebase
    console.log("1. Initializing Firebase...");
    app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app initialized successfully");

    // Initialize Auth
    console.log("\n2. Initializing Firebase Auth...");
    auth = getAuth(app);
    console.log("✅ Firebase Auth initialized");

    // Test auth state listener
    console.log("\n3. Testing Auth State Listener...");
    const authPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Auth state listener timeout"));
      }, 10000);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      });
    });

    const initialUser = await authPromise;
    console.log(
      "✅ Auth state listener working:",
      initialUser ? "User logged in" : "No user"
    );

    // Test Anonymous Sign In
    console.log("\n4. Testing Anonymous Authentication...");
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("✅ Anonymous sign-in successful");
      console.log("   User ID:", userCredential.user.uid);
      console.log("   Is Anonymous:", userCredential.user.isAnonymous);
    } catch (authError) {
      console.error(
        "❌ Anonymous sign-in failed:",
        authError.code,
        authError.message
      );
      if (authError.code === "auth/operation-not-allowed") {
        console.log(
          "💡 Hint: Enable Anonymous Authentication in Firebase Console"
        );
      }
    }

    // Initialize Firestore
    console.log("\n5. Initializing Firestore...");
    firestore = getFirestore(app);
    console.log("✅ Firestore initialized");

    // Test public data access
    console.log("\n6. Testing public data access (adminStock)...");
    try {
      const adminStockRef = collection(firestore, "adminStock");
      const snapshot = await getDocs(adminStockRef);
      console.log("✅ adminStock collection accessible");
      console.log("   Documents found:", snapshot.size);

      snapshot.forEach((doc) => {
        console.log("   Document ID:", doc.id);
        const data = doc.data();
        console.log("   Data:", {
          title: data.title,
          price: data.price,
          available: data.available,
        });
      });
    } catch (firestoreError) {
      console.error(
        "❌ Failed to access adminStock:",
        firestoreError.code,
        firestoreError.message
      );
      if (firestoreError.code === "permission-denied") {
        console.log(
          "💡 Hint: Check Firestore security rules for public read access"
        );
      }
    }

    // Test listings collection
    console.log("\n7. Testing listings collection access...");
    try {
      const listingsRef = collection(firestore, "listings");
      const snapshot = await getDocs(listingsRef);
      console.log("✅ listings collection accessible");
      console.log("   Documents found:", snapshot.size);
    } catch (firestoreError) {
      console.error(
        "❌ Failed to access listings:",
        firestoreError.code,
        firestoreError.message
      );
    }

    // Test user-specific data (should fail without proper auth)
    console.log("\n8. Testing user-specific data access...");
    try {
      const usersRef = collection(firestore, "users");
      const snapshot = await getDocs(usersRef);
      console.log("⚠️  users collection accessible (this might be unexpected)");
      console.log("   Documents found:", snapshot.size);
    } catch (firestoreError) {
      console.log(
        "✅ users collection properly protected:",
        firestoreError.code
      );
    }
  } catch (error) {
    console.error("❌ Critical Firebase error:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
  }

  console.log("\n🏁 Test completed");
}

// Check if running from localhost
const isLocalhost =
  process.env.NODE_ENV !== "production" &&
  (process.env.HOSTNAME === "localhost" ||
    process.env.HOSTNAME?.includes("localhost") ||
    !process.env.VERCEL);

console.log("Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- HOSTNAME:", process.env.HOSTNAME);
console.log("- VERCEL:", process.env.VERCEL);
console.log("- Is Localhost:", isLocalhost);
console.log("");

testFirebaseFromLocalhost().catch(console.error);

// Test Firebase Authentication connectivity
const { initializeApp } = require("firebase/app");
const { getAuth, connectAuthEmulator } = require("firebase/auth");

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

async function testFirebaseAuth() {
  try {
    console.log("Testing Firebase Authentication...");

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log("✓ Firebase app initialized successfully");

    // Initialize Auth
    const auth = getAuth(app);
    console.log("✓ Firebase Auth initialized successfully");

    // Test auth state listener
    const unsubscribe = auth.onAuthStateChanged(
      (user) => {
        if (user) {
          console.log("✓ User is signed in:", user.uid);
        } else {
          console.log("✓ No user signed in (expected for this test)");
        }

        // Clean up and exit
        unsubscribe();
        console.log("✓ Firebase Authentication test completed successfully");
        process.exit(0);
      },
      (error) => {
        console.error("✗ Auth state change error:", error);
        process.exit(1);
      }
    );

    // Timeout in case the listener doesn't fire
    setTimeout(() => {
      console.log("⚠ Test timed out - this might indicate a network issue");
      unsubscribe();
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("✗ Firebase test failed:", error);

    if (error.code === "auth/network-request-failed") {
      console.log("\n🔍 Network request failed - possible causes:");
      console.log("1. Internet connectivity issues");
      console.log("2. Firewall blocking Firebase domains");
      console.log("3. DNS resolution issues");
      console.log("4. Corporate proxy settings");
      console.log("5. Firebase project configuration issues");
    }

    process.exit(1);
  }
}

testFirebaseAuth();

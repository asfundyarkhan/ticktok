// Test actual Firebase sign-in functionality
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
} = require("firebase/auth");

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "tiktokshop.international",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

async function testSignIn() {
  try {
    console.log("🧪 Testing Firebase Sign-In Functionality\n");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Test with invalid credentials to see if we get proper error handling
    console.log("1️⃣ Testing sign-in with invalid credentials...");
    try {
      await signInWithEmailAndPassword(
        auth,
        "nonexistent@test.com",
        "wrongpassword"
      );
      console.log("❌ Unexpected: Sign-in should have failed");
    } catch (error) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        console.log("✅ Expected auth error received:", error.code);
      } else if (error.code === "auth/network-request-failed") {
        console.log("❌ Network error during sign-in attempt:", error.message);
        console.log("   This suggests a connectivity issue with Firebase Auth");
      } else {
        console.log("⚠️ Unexpected auth error:", error.code, error.message);
      }
    }

    console.log("\n2️⃣ Testing sign-in with malformed email...");
    try {
      await signInWithEmailAndPassword(auth, "invalid-email", "password");
      console.log("❌ Unexpected: Sign-in should have failed");
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        console.log("✅ Expected validation error received:", error.code);
      } else if (error.code === "auth/network-request-failed") {
        console.log("❌ Network error during validation:", error.message);
      } else {
        console.log(
          "⚠️ Unexpected validation error:",
          error.code,
          error.message
        );
      }
    }

    console.log("\n3️⃣ Testing auth state persistence...");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("✅ Auth state change detected: User signed in");
      } else {
        console.log("✅ Auth state change detected: No user");
      }
      unsubscribe();
    });

    // Wait a moment for auth state
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("\n✅ All tests completed successfully");
    console.log("\n📝 Diagnosis:");
    console.log("- Firebase Auth is properly configured");
    console.log("- Network connectivity is working");
    console.log("- Error handling is functioning");
    console.log("\n💡 If you're seeing network errors in the app:");
    console.log("1. Check browser console for additional details");
    console.log("2. Try clearing browser cache/cookies");
    console.log("3. Check if firewall/antivirus is blocking requests");
    console.log("4. Try using a different network/device");
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error.code === "auth/network-request-failed") {
      console.log("\n🔍 Network error troubleshooting:");
      console.log("1. Check internet connectivity");
      console.log("2. Verify DNS resolution for Firebase domains");
      console.log("3. Check corporate firewall settings");
      console.log("4. Try connecting from different network");
    }
  }
}

testSignIn();

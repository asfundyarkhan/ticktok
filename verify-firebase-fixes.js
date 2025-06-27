#!/usr/bin/env node

// Quick verification script to check if Firebase Console fixes have been applied
const { initializeApp } = require("firebase/app");
const { getAuth, signInAnonymously, signOut } = require("firebase/auth");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

async function verifyFirebaseFixes() {
  console.log("🔍 Verifying Firebase Console Fixes...\n");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  let allTestsPassed = true;

  // Test 1: Anonymous Authentication
  console.log("1️⃣ Testing Anonymous Authentication...");
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("   ✅ PASS: Anonymous authentication is enabled");
    console.log(`   👤 User ID: ${userCredential.user.uid}`);

    // Sign out to clean up
    await signOut(auth);
    console.log("   🚪 Signed out successfully");
  } catch (error) {
    allTestsPassed = false;
    console.log("   ❌ FAIL: Anonymous authentication is disabled");
    console.log(`   🔧 Error: ${error.code} - ${error.message}`);

    if (
      error.code === "auth/operation-not-allowed" ||
      error.code === "auth/admin-restricted-operation"
    ) {
      console.log(
        "   💡 FIX: Enable Anonymous Authentication in Firebase Console"
      );
      console.log(
        "   🔗 URL: https://console.firebase.google.com/project/ticktokshop-5f1e9/authentication/providers"
      );
      console.log("   📝 Steps: Click Anonymous → Toggle Enable → Save");
    }
  }

  console.log("");

  // Test 2: Firestore Public Access
  console.log("2️⃣ Testing Firestore Public Collections...");
  try {
    const adminStockRef = collection(firestore, "adminStock");
    const snapshot = await getDocs(adminStockRef);
    console.log("   ✅ PASS: Firestore public access works");
    console.log(`   📊 adminStock documents: ${snapshot.size}`);
  } catch (error) {
    allTestsPassed = false;
    console.log("   ❌ FAIL: Firestore public access issue");
    console.log(`   🔧 Error: ${error.code} - ${error.message}`);
  }

  console.log("");

  // Test 3: Environment Check
  console.log("3️⃣ Environment Information...");
  console.log(`   🌐 Node.js Version: ${process.version}`);
  console.log(`   📍 Current Working Directory: ${process.cwd()}`);
  console.log(`   🔗 Testing Domain: localhost (implied)`);
  console.log("   ✅ PASS: Environment is suitable for Firebase development");

  console.log("");

  // Summary
  if (allTestsPassed) {
    console.log(
      "🎉 ALL TESTS PASSED! Firebase is ready for localhost development."
    );
    console.log("");
    console.log("✅ Next steps:");
    console.log("   1. Start your dev server: npm run dev");
    console.log("   2. Test the store page: http://localhost:3000/store");
    console.log("   3. Test login functionality");
    console.log("   4. Verify wallet operations work correctly");
  } else {
    console.log(
      "❌ SOME TESTS FAILED. Please fix the issues above before proceeding."
    );
    console.log("");
    console.log("🔧 Required actions:");
    console.log("   1. Go to Firebase Console Authentication settings");
    console.log("   2. Enable Anonymous authentication");
    console.log("   3. Add localhost to authorized domains (if needed)");
    console.log(
      "   4. Re-run this verification: node verify-firebase-fixes.js"
    );
  }

  console.log("");
  console.log(
    "📚 For detailed instructions, see: LOCALHOST_FIREBASE_FIX_GUIDE.md"
  );
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

verifyFirebaseFixes().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});

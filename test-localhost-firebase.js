// Comprehensive localhost Firebase diagnostic
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} = require("firebase/auth");
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  limit,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com", // Using standard domain
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

async function diagnosticTest() {
  console.log("🔍 Localhost Firebase Diagnostic Tool\n");
  console.log(
    "Environment: Node.js (simulating localhost browser environment)"
  );
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("---------------------------------------------------\n");

  try {
    // Initialize Firebase
    console.log("1️⃣ Testing Firebase Initialization...");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    console.log("✅ Firebase services initialized successfully\n");

    // Test Auth State Listener
    console.log("2️⃣ Testing Auth State Listener...");
    const authPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          console.log(`✅ Auth state: ${user ? "User signed in" : "No user"}`);
          unsubscribe();
          resolve();
        },
        (error) => {
          console.error("❌ Auth state error:", error.code, error.message);
          unsubscribe();
          reject(error);
        }
      );

      setTimeout(() => {
        unsubscribe();
        reject(new Error("Auth state listener timeout"));
      }, 5000);
    });

    await authPromise;
    console.log("✅ Auth state listener working\n");

    // Test Anonymous Sign In
    console.log("3️⃣ Testing Anonymous Sign In...");
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("✅ Anonymous sign in successful");
      console.log(`   User ID: ${userCredential.user.uid}`);
      console.log(`   Anonymous: ${userCredential.user.isAnonymous}\n`);
    } catch (error) {
      console.error("❌ Anonymous sign in failed:", error.code, error.message);
      if (error.code === "auth/network-request-failed") {
        console.log("   This suggests localhost network connectivity issues\n");
      }
    }

    // Test Firestore Collections
    console.log("4️⃣ Testing Firestore Collections...");

    const collections = ["adminStock", "listings", "users", "inventory"];

    for (const collectionName of collections) {
      try {
        const collectionRef = collection(firestore, collectionName);
        const querySnapshot = await getDocs(query(collectionRef, limit(1)));
        console.log(
          `✅ ${collectionName}: accessible (${querySnapshot.size} documents)`
        );
      } catch (error) {
        console.error(
          `❌ ${collectionName}: failed -`,
          error.code,
          error.message
        );
        if (error.code === "permission-denied") {
          console.log(
            `   Firestore rules may need localhost-specific configuration`
          );
        }
      }
    }

    // Test specific inventory path (the failing one)
    console.log("\n5️⃣ Testing Specific Inventory Path...");
    if (auth.currentUser) {
      try {
        const inventoryPath = `inventory/${auth.currentUser.uid}/products`;
        const inventoryRef = collection(firestore, inventoryPath);
        const inventorySnapshot = await getDocs(query(inventoryRef, limit(1)));
        console.log(
          `✅ User inventory accessible: ${inventoryPath} (${inventorySnapshot.size} documents)`
        );
      } catch (error) {
        console.error("❌ User inventory failed:", error.code, error.message);
        console.log("   This is the exact error users see on localhost");
      }
    }

    console.log("\n6️⃣ Testing Network Connectivity...");

    // Test direct Firebase API calls
    const testUrls = [
      `https://${firebaseConfig.authDomain}/.well-known/openid_configuration`,
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`,
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        console.log(
          `✅ ${new URL(url).hostname}: ${response.status} ${
            response.statusText
          }`
        );
      } catch (error) {
        console.error(`❌ ${new URL(url).hostname}: ${error.message}`);
      }
    }

    console.log("\n📋 DIAGNOSIS COMPLETE");
    console.log("==================");

    if (auth.currentUser) {
      console.log("✅ Authentication: Working");
    } else {
      console.log("⚠️ Authentication: Needs investigation");
    }

    console.log("\n💡 LOCALHOST-SPECIFIC RECOMMENDATIONS:");
    console.log(
      "1. Check if localhost is added to Firebase authorized domains"
    );
    console.log("2. Verify Firestore rules handle localhost requests properly");
    console.log("3. Check browser developer tools for additional errors");
    console.log("4. Consider using Firebase emulator for development");
  } catch (error) {
    console.error("\n💥 CRITICAL ERROR:", error);

    if (error.code === "auth/network-request-failed") {
      console.log("\n🔧 LOCALHOST NETWORK TROUBLESHOOTING:");
      console.log("- Check Windows Firewall settings");
      console.log("- Verify DNS resolution (try 8.8.8.8)");
      console.log("- Check if antivirus is blocking Firebase domains");
      console.log("- Try running as administrator");
      console.log("- Check proxy/VPN settings");
    }
  }
}

diagnosticTest()
  .then(() => {
    console.log("\n✅ Diagnostic complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Diagnostic failed:", error);
    process.exit(1);
  });

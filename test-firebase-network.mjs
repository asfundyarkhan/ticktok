// Simple network test for Firebase connectivity
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

console.log("🔍 Testing Firebase Network Connectivity...");

try {
  const app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialized");

  const auth = getAuth(app);
  console.log("✅ Auth service initialized");

  const firestore = getFirestore(app);
  console.log("✅ Firestore service initialized");

  // Test network connectivity
  console.log("🌐 Testing network request...");

  signInAnonymously(auth)
    .then((result) => {
      console.log("✅ Network request successful!");
      console.log("User ID:", result.user.uid);
    })
    .catch((error) => {
      console.error("❌ Network request failed:", error.code);
      console.error("Error details:", error.message);

      if (error.code === "auth/network-request-failed") {
        console.log("\n💡 POSSIBLE SOLUTIONS:");
        console.log("1. Check if Windows Firewall is blocking the connection");
        console.log("2. Check if antivirus software is interfering");
        console.log("3. Try disabling VPN if you're using one");
        console.log("4. Check corporate/school network restrictions");
        console.log("5. Try running from a different network (mobile hotspot)");
      }
    });
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
}

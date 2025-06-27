#!/usr/bin/env node

// Comprehensive localhost network and Firebase diagnostic tool
const { initializeApp } = require("firebase/app");
const {
  getAuth,
  signInAnonymously,
  connectAuthEmulator,
} = require("firebase/auth");
const {
  getFirestore,
  collection,
  getDocs,
  connectFirestoreEmulator,
} = require("firebase/firestore");
const https = require("https");
const http = require("http");
const dns = require("dns");

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

async function testNetworkConnectivity() {
  console.log("🌐 Testing Network Connectivity to Firebase Services...\n");

  const testEndpoints = [
    "identitytoolkit.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "www.googleapis.com",
    "accounts.google.com",
  ];

  for (const endpoint of testEndpoints) {
    try {
      // Test DNS resolution
      await new Promise((resolve, reject) => {
        dns.resolve4(endpoint, (err, addresses) => {
          if (err) reject(err);
          else {
            console.log(`✅ DNS: ${endpoint} resolves to ${addresses[0]}`);
            resolve(addresses);
          }
        });
      });

      // Test HTTPS connectivity
      await new Promise((resolve, reject) => {
        const req = https.request(
          {
            hostname: endpoint,
            port: 443,
            path: "/",
            method: "HEAD",
            timeout: 5000,
          },
          (res) => {
            console.log(
              `✅ HTTPS: ${endpoint} responded with ${res.statusCode}`
            );
            resolve(res);
          }
        );

        req.on("error", reject);
        req.on("timeout", () => reject(new Error("Timeout")));
        req.end();
      });
    } catch (error) {
      console.log(`❌ FAIL: ${endpoint} - ${error.message}`);
    }
  }
}

async function testFirebaseSpecific() {
  console.log("\n🔥 Testing Firebase-specific connectivity...\n");

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log("✅ Firebase app initialized");

    // Test Auth connectivity
    const auth = getAuth(app);
    console.log("✅ Firebase Auth service initialized");

    // Test Firestore connectivity
    const firestore = getFirestore(app);
    console.log("✅ Firestore service initialized");

    // Test actual Firebase Auth network request
    console.log("\n🔐 Testing Firebase Auth network request...");
    try {
      const userCredential = await signInAnonymously(auth);
      console.log("✅ Firebase Auth network request successful");
      console.log(`   User ID: ${userCredential.user.uid}`);
    } catch (authError) {
      console.log(`❌ Firebase Auth network failed: ${authError.code}`);
      console.log(`   Error: ${authError.message}`);

      if (authError.code === "auth/network-request-failed") {
        console.log("\n💡 NETWORK TROUBLESHOOTING:");
        console.log("   1. Check Windows Firewall settings");
        console.log("   2. Check antivirus software blocking requests");
        console.log("   3. Check corporate/school network restrictions");
        console.log("   4. Try different DNS servers (8.8.8.8, 1.1.1.1)");
        console.log("   5. Check proxy settings");
      }
    }

    // Test Firestore network request
    console.log("\n📊 Testing Firestore network request...");
    try {
      const adminStockRef = collection(firestore, "adminStock");
      const snapshot = await getDocs(adminStockRef);
      console.log("✅ Firestore network request successful");
      console.log(`   Documents retrieved: ${snapshot.size}`);
    } catch (firestoreError) {
      console.log(`❌ Firestore network failed: ${firestoreError.code}`);
      console.log(`   Error: ${firestoreError.message}`);
    }
  } catch (initError) {
    console.log(`❌ Firebase initialization failed: ${initError.message}`);
  }
}

async function testSystemConfiguration() {
  console.log("\n⚙️ System Configuration Check...\n");

  // Check Node.js version
  console.log(`Node.js Version: ${process.version}`);

  // Check environment variables
  console.log("Environment Variables:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
  console.log(`   HTTP_PROXY: ${process.env.HTTP_PROXY || "undefined"}`);
  console.log(`   HTTPS_PROXY: ${process.env.HTTPS_PROXY || "undefined"}`);
  console.log(`   NO_PROXY: ${process.env.NO_PROXY || "undefined"}`);

  // Check network interfaces
  const os = require("os");
  const interfaces = os.networkInterfaces();
  console.log("\nNetwork Interfaces:");
  Object.keys(interfaces).forEach((name) => {
    const iface = interfaces[name];
    iface?.forEach((details) => {
      if (details.family === "IPv4" && !details.internal) {
        console.log(`   ${name}: ${details.address}`);
      }
    });
  });

  // Check if running in WSL
  try {
    const fs = require("fs");
    if (fs.existsSync("/proc/version")) {
      const version = fs.readFileSync("/proc/version", "utf8");
      if (version.includes("Microsoft") || version.includes("WSL")) {
        console.log(
          "\n⚠️  WSL detected - may cause network issues with Firebase"
        );
        console.log("   Consider testing from Windows command prompt instead");
      }
    }
  } catch (e) {
    // Not running on Linux/WSL
  }
}

async function runDiagnostics() {
  console.log("🔍 Firebase Localhost Network Diagnostics\n");
  console.log("=========================================\n");

  await testSystemConfiguration();
  await testNetworkConnectivity();
  await testFirebaseSpecific();

  console.log("\n🏁 Diagnostic Complete");
  console.log("\nIf auth/network-request-failed persists:");
  console.log("1. Try running from Windows Command Prompt (not WSL)");
  console.log("2. Temporarily disable Windows Firewall/Antivirus");
  console.log("3. Check corporate network restrictions");
  console.log("4. Try different network (mobile hotspot)");
  console.log("5. Contact your network administrator");
}

runDiagnostics().catch(console.error);

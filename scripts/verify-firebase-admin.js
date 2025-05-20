// verify-firebase-admin.js
// Script to verify Firebase Admin SDK is working correctly

// Check if running on Vercel
const isVercel = process.env.VERCEL === "1";
const environment = process.env.NODE_ENV || "development";
const vercelEnv = process.env.VERCEL_ENV || "unknown";

console.log(`Environment: ${environment}`);
console.log(`Vercel: ${isVercel ? "yes" : "no"}`);
if (isVercel) {
  console.log(`Vercel Environment: ${vercelEnv}`);
}

// Check Firebase Admin environment variables
console.log("\nChecking Firebase Admin environment variables:");
const adminEnvVars = {
  projectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
  clientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
  privateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
};

console.log(
  "FIREBASE_ADMIN_PROJECT_ID:",
  adminEnvVars.projectId ? "✅ Found" : "❌ Missing"
);
console.log(
  "FIREBASE_ADMIN_CLIENT_EMAIL:",
  adminEnvVars.clientEmail ? "✅ Found" : "❌ Missing"
);
console.log(
  "FIREBASE_ADMIN_PRIVATE_KEY:",
  adminEnvVars.privateKey ? "✅ Found" : "❌ Missing"
);

// Import Firebase Admin (this will attempt initialization)
console.log("\nAttempting to initialize Firebase Admin SDK...");

try {
  const admin = require("../src/lib/firebase/firebase-admin-init");

  console.log("✅ Firebase Admin SDK initialized successfully");

  // Check admin auth
  const auth = admin.auth();
  console.log("✅ Firebase Admin Auth is available");

  // Check admin firestore
  const firestore = admin.firestore();
  console.log("✅ Firebase Admin Firestore is available");

  // Check admin storage
  const storage = admin.storage();
  console.log("✅ Firebase Admin Storage is available");
} catch (error) {
  console.error("❌ Firebase Admin SDK initialization failed:");
  console.error({
    message: error.message,
    stack: error.stack,
    environment,
    vercelEnvironment: vercelEnv,
    hasEnvVars: adminEnvVars,
  });
}

console.log("\nVerification complete");

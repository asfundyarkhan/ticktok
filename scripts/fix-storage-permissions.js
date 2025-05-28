// Firebase Storage Permission Helper
// This script helps diagnose and fix Firebase Storage permission issues
// Run with: node fix-storage-permissions.js

const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const fs = require("fs");
const path = require("path");

// Your Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

console.log(`
===========================
FIREBASE STORAGE PERMISSION HELPER
===========================
This script helps debug and fix Firebase Storage permission issues.

Current Storage Configuration:
- Bucket: ${firebaseConfig.storageBucket || "Not configured (check your .env)"}

Storage Rules:
${fs.readFileSync(path.join(__dirname, "storage.rules"), "utf8")}

CORS Configuration:
${fs.readFileSync(path.join(__dirname, "firebase-storage-cors.json"), "utf8")}

RECOMMENDATIONS:
1. Make sure your storage.rules allow read/write for receipt uploads
2. Check that CORS is properly configured for your domains
3. Ensure your Firebase Storage bucket name is correctly set in .env files
4. Deploy updated rules with: firebase deploy --only storage

To fix permission errors in the receipts system:
1. Update storage.rules to have public read permissions for receipts
2. Ensure the firebasestorage.app domain is used (not appspot.com)
3. Verify authentication is working correctly
4. Check user roles and custom claims if used for permissions
`);

// Display storage bucket info
console.log("Storage bucket:", storage.bucket);

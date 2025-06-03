// Firebase Storage CORS configuration script
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Service account key paths - we'll try both
const serviceAccountPaths = [
  path.join(
    __dirname,
    "ticktokshop-5f1e9-firebase-adminsdk-fbsvc-34fc84c417.json"
  ),
  path.join(
    __dirname,
    "ticktokshop-5f1e9-firebase-adminsdk-fbsvc-3120e0d35e.json"
  ),
];

// Define the CORS configuration
const corsConfiguration = [
  {
    // Allow specific origins for development and production
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",      "https://ticktok-*.vercel.app",
      "https://tiktok-*.vercel.app",
      "https://tiktok-git-*.vercel.app",      "https://*.vercel.app",
      "https://ticktokshop.vercel.app",
      "https://tiktokshop.international",
      "https://www.tiktokshop.international",
      "https://*.tiktokshop.international",
      "https://www.tiktokshophub.co",
      "https://tiktokshophub.co",
      "https://*.tiktokshophub.co",
      "https://ticktokshop.com",
      "https://www.ticktokshop.com",
      "https://*.ticktokshop.com",
      "https://ticktokshop.net",
      "https://www.ticktokshop.net",
      "https://*.ticktokshop.net",
      "https://ticktokshop.org",
      "https://www.ticktokshop.org",
      "https://*.ticktokshop.org",
      "https://ticktokshop.app",
      "https://www.ticktokshop.app",
      "https://*.ticktokshop.app",
      "https://ticktokshop.io",
      "https://www.ticktokshop.io",
      "https://*.ticktokshop.io",
      "https://ticktokshop.co",
      "https://www.ticktokshop.co",
      "https://*.ticktokshop.co",
      "https://ticktok-shop.com",
      "https://www.ticktok-shop.com",
      "https://*.ticktok-shop.com",
      "https://ticktok-shop.co",
      "https://www.ticktok-shop.co",
      "https://*.ticktok-shop.co",
      "https://tiktokshophub.co",
      "https://www.tiktokshophub.co",
      "https://*.tiktokshophub.co",
      "http://ticktokshop.com",
      "http://www.ticktokshop.com",
      "http://*.ticktokshop.com",
      "*",
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Content-Length",
      "Content-Disposition",
      "Access-Control-Allow-Origin",
      "Authorization",
    ],
  },
];

// Try to use service account files
let serviceAccount;
let serviceAccountFound = false;

for (const serviceAccountPath of serviceAccountPaths) {
  try {
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
      serviceAccountFound = true;
      console.log(`Using service account file: ${serviceAccountPath}`);
      break;
    }
  } catch (error) {
    console.error(
      `Error loading service account file ${serviceAccountPath}:`,
      error
    );
  }
}

if (!serviceAccountFound) {
  console.error(
    "No service account file found. Please ensure you have valid credentials."
  );
  process.exit(1);
}

// List of possible bucket names to try
const bucketNames = [
  "ticktokshop-5f1e9.appspot.com", // Primary bucket used by the app
  "gs://ticktokshop-5f1e9.appspot.com",
  "ticktokshop-5f1e9.firebasestorage.app", // Alternative format
  "ticktokshop-5f1e9",
];

// Initialize admin SDK with the service account
try {
  console.log("Initializing Firebase Admin SDK with service account...");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  // Function to try setting CORS with a specific bucket name
  const tryCorsWithBucketName = async (bucketName) => {
    try {
      console.log(`Trying with bucket name: ${bucketName}`);
      const bucket = admin.storage().bucket(bucketName);

      console.log("Setting CORS configuration...");
      await bucket.setCorsConfiguration(corsConfiguration);
      console.log(
        `CORS configuration successfully applied to bucket: ${bucketName}`
      );
      console.log("Configuration:", JSON.stringify(corsConfiguration, null, 2));
      return true;
    } catch (error) {
      console.error(
        `Failed to set CORS for bucket ${bucketName}:`,
        error.message
      );
      return false;
    }
  };

  // Try each bucket name in sequence
  (async () => {
    let success = false;
    for (const bucketName of bucketNames) {
      success = await tryCorsWithBucketName(bucketName);
      if (success) break;
    }

    if (!success) {
      console.error("All attempts to set CORS configuration failed");
      console.log("Please verify your Firebase project setup and credentials");
      console.log(
        "Consider setting CORS manually through the Firebase Console"
      );
    }
  })();
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error);
  process.exit(1);
}

const fs = require("fs");
const path = require("path");

// Ensure Vercel environment is properly set up
function validateEnvironment() {
  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_PRIVATE_KEY",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error("Error: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`- ${varName}`));
    process.exit(1);
  }
}

// Check for required files
function validateRequiredFiles() {
  const requiredFiles = [
    "next.config.js",
    "vercel.json",
    "package.json",
    "src/middleware.ts",
  ];

  const missingFiles = requiredFiles.filter(
    (file) => !fs.existsSync(path.join(process.cwd(), file))
  );

  if (missingFiles.length > 0) {
    console.error("Error: Missing required files:");
    missingFiles.forEach((file) => console.error(`- ${file}`));
    process.exit(1);
  }
}

// Format Firebase Admin private key for Vercel
function formatFirebasePrivateKey() {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    process.env.FIREBASE_ADMIN_PRIVATE_KEY =
      process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").replace(
        /"/g,
        ""
      );
  }
}

// Run preparation steps
function main() {
  console.log("Preparing for Vercel deployment...");

  validateEnvironment();
  validateRequiredFiles();
  formatFirebasePrivateKey();

  console.log("Preparation complete! Ready for deployment.");
}

main();

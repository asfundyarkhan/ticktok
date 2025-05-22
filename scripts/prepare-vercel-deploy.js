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
    console.error("\nError: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`- ${varName}`));
    console.error("\nTo fix this:");
    console.error("1. Go to your Vercel project settings");
    console.error("2. Navigate to the 'Environment Variables' tab");
    console.error("3. Add the following environment variables:");
    missingVars.forEach((varName) => {
      if (varName.startsWith("NEXT_PUBLIC_FIREBASE_")) {
        console.error(
          `   ${varName}: Get this from your Firebase project settings > General > Web app`
        );
      } else if (varName.startsWith("FIREBASE_ADMIN_")) {
        console.error(
          `   ${varName}: Get this from your Firebase service account JSON file`
        );
      }
    });
    console.error("\nFor Firebase Admin credentials:");
    console.error(
      "1. Go to Firebase Console > Project Settings > Service Accounts"
    );
    console.error("2. Click 'Generate New Private Key'");
    console.error("3. Use the values from the downloaded JSON file");
    console.error("\nIMPORTANT: For FIREBASE_ADMIN_PRIVATE_KEY:");
    console.error(
      "- Copy the entire private key including '-----BEGIN PRIVATE KEY-----' and '-----END PRIVATE KEY-----'"
    );
    console.error(
      "- In Vercel, paste the key as is, Vercel will handle the formatting"
    );
    console.error("\nFor more details, see FIREBASE_DEPLOYMENT_SOLUTION.md");
    process.exit(1);
  }

  // Validate firebase admin private key format
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes("PRIVATE KEY")) {
      console.error(
        "\nError: FIREBASE_ADMIN_PRIVATE_KEY appears to be incorrectly formatted"
      );
      console.error(
        "It should include the '-----BEGIN PRIVATE KEY-----' and '-----END PRIVATE KEY-----' markers"
      );
      console.error(
        "Please check the value in your Vercel environment variables"
      );
      process.exit(1);
    }
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
    // Only format if it's not already properly formatted
    if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY.includes("\n")) {
      process.env.FIREBASE_ADMIN_PRIVATE_KEY =
        process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").replace(
          /"/g,
          ""
        );
      console.log("Firebase Admin private key formatted successfully");
    }
  }
}

// Check environment type
function checkEnvironment() {
  const environment = process.env.VERCEL_ENV || "development";
  console.log(`Deploying to environment: ${environment}`);

  if (environment === "production") {
    console.log(
      "⚠️  Production deployment detected - ensuring all security measures are in place..."
    );
    // Add any production-specific checks here
  }
}

// Run preparation steps
function main() {
  console.log("Preparing for Vercel deployment...");

  checkEnvironment();
  validateEnvironment();
  validateRequiredFiles();
  formatFirebasePrivateKey();

  console.log("\n✅ Preparation complete! Ready for deployment.");
  console.log(
    "Make sure all required environment variables are set in your Vercel project settings."
  );
}

main();

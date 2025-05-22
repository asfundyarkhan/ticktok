#!/usr/bin/env node

/**
 * This script helps fix common Vercel deployment issues with environment variables
 * Run this script before deployment to ensure your environment is correctly set up
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Colors for better terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

console.log(
  `${colors.cyan}=== Vercel Deployment Fix Tool ===${colors.reset}\n`
);
console.log(
  `${colors.yellow}This script will help fix environment variable issues with Vercel deployments${colors.reset}\n`
);

// Check for Vercel CLI
let hasVercelCLI = false;
try {
  execSync("vercel --version", { stdio: "ignore" });
  hasVercelCLI = true;
  console.log(`${colors.green}✓ Vercel CLI is installed${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Vercel CLI is not installed${colors.reset}`);
  console.log(
    `${colors.yellow}Please install it with: npm install -g vercel${colors.reset}\n`
  );
}

// Look for Firebase credentials
let firebaseCredentialsFile = null;
const possibleCredentialFiles = [
  path.join(process.cwd(), "firebase-credentials.json"),
  path.join(process.cwd(), "firebase-admin-credentials.json"),
  path.join(
    process.cwd(),
    "ticktokshop-5f1e9-firebase-adminsdk-fbsvc-34fc84c417.json"
  ),
  ...fs
    .readdirSync(process.cwd())
    .filter((file) => file.includes("firebase") && file.includes(".json"))
    .map((file) => path.join(process.cwd(), file)),
];

for (const file of possibleCredentialFiles) {
  if (fs.existsSync(file)) {
    try {
      const fileContent = JSON.parse(fs.readFileSync(file, "utf8"));
      if (fileContent.type === "service_account") {
        firebaseCredentialsFile = file;
        console.log(
          `${colors.green}✓ Found Firebase credentials: ${path.basename(file)}${
            colors.reset
          }`
        );
        break;
      }
    } catch (error) {
      // Not a valid JSON or not a service account file
    }
  }
}

if (!firebaseCredentialsFile) {
  console.log(
    `${colors.yellow}⚠️ No Firebase admin credentials file found${colors.reset}`
  );
}

// Create .env file for Vercel
console.log(
  `\n${colors.cyan}Creating .env.local file for Vercel...${colors.reset}`
);

const envVariables = {
  // Check for existing .env files to copy values from
  ...getExistingEnvVariables([
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ]),

  // Default values (only used if not found in existing env files)
  NEXT_PUBLIC_FIREBASE_API_KEY:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "YOUR_MESSAGING_SENDER_ID",
  NEXT_PUBLIC_FIREBASE_APP_ID:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// If we found Firebase admin credentials, add them to the env variables
if (firebaseCredentialsFile) {
  const firebaseCredentials = JSON.parse(
    fs.readFileSync(firebaseCredentialsFile, "utf8")
  );

  envVariables.FIREBASE_ADMIN_PROJECT_ID = firebaseCredentials.project_id;
  envVariables.FIREBASE_ADMIN_CLIENT_EMAIL = firebaseCredentials.client_email;

  // Format private key correctly for environment variable
  let privateKey = firebaseCredentials.private_key;
  envVariables.FIREBASE_ADMIN_PRIVATE_KEY = privateKey;

  console.log(
    `${colors.green}✓ Added Firebase admin credentials to .env.local${colors.reset}`
  );
}

// Write .env.local file
const envFileContent = Object.entries(envVariables)
  .map(([key, value]) => `${key}="${value}"`)
  .join("\n");

fs.writeFileSync(path.join(process.cwd(), ".env.local"), envFileContent);
console.log(`${colors.green}✓ Created .env.local file${colors.reset}`);

// Create vercel.json if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), "vercel.json"))) {
  const vercelConfig = {
    env: Object.keys(envVariables).reduce((acc, key) => {
      acc[key] = `@${key.toLowerCase().replace(/_/g, "-")}`;
      return acc;
    }, {}),
    buildCommand: "npm run build",
    framework: "nextjs",
  };

  fs.writeFileSync(
    path.join(process.cwd(), "vercel.json"),
    JSON.stringify(vercelConfig, null, 2)
  );
  console.log(`${colors.green}✓ Created vercel.json file${colors.reset}`);
}

console.log(
  `\n${colors.magenta}=== Manual Setup Instructions ===${colors.reset}`
);
console.log(
  `${colors.yellow}1. Go to your Vercel dashboard: https://vercel.com/dashboard${colors.reset}`
);
console.log(`${colors.yellow}2. Select your project${colors.reset}`);
console.log(
  `${colors.yellow}3. Go to Settings > Environment Variables${colors.reset}`
);
console.log(
  `${colors.yellow}4. Add the following environment variables:${colors.reset}\n`
);

Object.entries(envVariables).forEach(([key, value]) => {
  console.log(`   ${colors.green}${key}${colors.reset}`);
});

console.log(
  `\n${colors.yellow}5. For FIREBASE_ADMIN_PRIVATE_KEY:${colors.reset}`
);
console.log(
  `   ${colors.yellow}- Copy the entire key including "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----"${colors.reset}`
);
console.log(
  `   ${colors.yellow}- When pasting in Vercel, paste it as is, Vercel will handle the formatting${colors.reset}\n`
);

console.log(
  `${colors.cyan}=== Alternative Quick Setup (if Vercel CLI is installed) ===${colors.reset}`
);
if (hasVercelCLI) {
  console.log(
    `${colors.yellow}Run this command to add all environment variables at once:${colors.reset}\n`
  );
  console.log(
    `${colors.green}vercel env pull .env.production.local${colors.reset}`
  );
  console.log(`${colors.green}vercel env push .env.local${colors.reset}\n`);
} else {
  console.log(
    `${colors.yellow}Install Vercel CLI first with: npm install -g vercel${colors.reset}\n`
  );
}

console.log(`${colors.magenta}=== Next Steps ===${colors.reset}`);
console.log(
  `${colors.yellow}1. Verify your environment variables are set correctly in Vercel${colors.reset}`
);
console.log(
  `${colors.yellow}2. Deploy again with: vercel --prod${colors.reset}\n`
);

console.log(
  `${colors.green}Done! Your Vercel deployment should now work correctly.${colors.reset}`
);

// Helper function to get existing env variables
function getExistingEnvVariables(fileNames) {
  const variables = {};

  for (const fileName of fileNames) {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      console.log(`${colors.green}✓ Found ${fileName}${colors.reset}`);
      const fileContent = fs.readFileSync(filePath, "utf8");

      fileContent.split("\n").forEach((line) => {
        const match = line.match(/^([A-Za-z0-9_]+)=["']?(.+?)["']?$/);
        if (match) {
          variables[match[1]] = match[2];
        }
      });
    }
  }

  return variables;
}

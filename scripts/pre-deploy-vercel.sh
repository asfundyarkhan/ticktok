#!/bin/bash
# Pre-deployment checks for Vercel

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting pre-deployment checks for Vercel...${NC}"
echo 

# Check for environment variables
echo -e "${YELLOW}Checking for required environment variables...${NC}"

# Array of required env vars
REQUIRED_VARS=(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  "NEXT_PUBLIC_FIREBASE_APP_ID"
  "FIREBASE_ADMIN_PROJECT_ID"
  "FIREBASE_ADMIN_CLIENT_EMAIL"
  "FIREBASE_ADMIN_PRIVATE_KEY"
)

# Array of optional vars (warn if not set, but don't fail)
OPTIONAL_VARS=(
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
)

# Check if variables are set in environment
ENV_ISSUES=0
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo -e "${RED}✗ $VAR is not set${NC}"
    ENV_ISSUES=$((ENV_ISSUES+1))
  else
    # Specific validation for private key
    if [ "$VAR" == "FIREBASE_ADMIN_PRIVATE_KEY" ]; then
      if [[ "${!VAR}" == *"-----BEGIN PRIVATE KEY-----"* ]] && [[ "${!VAR}" == *"-----END PRIVATE KEY-----"* ]]; then
        echo -e "${GREEN}✓ $VAR is set and appears to be properly formatted${NC}"
      else
        echo -e "${RED}✗ $VAR is set but does not appear to be properly formatted${NC}"
        echo -e "${YELLOW}   Private key should include BEGIN/END PRIVATE KEY markers${NC}"
        ENV_ISSUES=$((ENV_ISSUES+1))
      fi
    else
      echo -e "${GREEN}✓ $VAR is set${NC}"
    fi
  fi
done

# Check optional variables
for VAR in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo -e "${YELLOW}⚠ $VAR is not set (optional)${NC}"
  else
    echo -e "${GREEN}✓ $VAR is set${NC}"
  fi
done

if [ $ENV_ISSUES -gt 0 ]; then
  echo -e "${RED}Found $ENV_ISSUES environment variable issues that may affect deployment${NC}"
fi

# Check for Firebase credentials file
echo 
echo -e "${YELLOW}Checking Firebase credentials...${NC}"

CREDENTIALS_PATH="./src/lib/firebase/credentials/service-account.json"
if [ -f "$CREDENTIALS_PATH" ]; then
  echo -e "${GREEN}✓ Firebase credentials file exists${NC}"
  
  # Check if the file is in .gitignore and .vercelignore
  if grep -q "service-account.json" .gitignore && grep -q "service-account.json" .vercelignore; then
    echo -e "${GREEN}✓ Firebase credentials are properly excluded from git and Vercel${NC}"
  else
    echo -e "${RED}✗ WARNING: Firebase credentials might not be properly excluded in .gitignore or .vercelignore${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Firebase credentials file not found, will need to use environment variables${NC}"
fi

# Check for build issues
echo 
echo -e "${YELLOW}Running test build...${NC}"

npm run build --no-lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful${NC}"
else
  echo -e "${RED}✗ Build failed, check for errors${NC}"
  echo -e "${YELLOW}Re-running build with detailed output...${NC}"
  npm run build --no-lint
  exit 1
fi

# Final check summary
echo 
echo -e "${GREEN}Pre-deployment checks complete${NC}"
if [ $ENV_ISSUES -gt 0 ]; then
  echo -e "${YELLOW}⚠ Some environment variables may be missing. Consider setting them in Vercel.${NC}"
else
  echo -e "${GREEN}✓ All required environment variables are set${NC}"
fi

echo -e "${GREEN}You are ready to deploy to Vercel!${NC}"
echo -e "Run ${YELLOW}vercel --prod${NC} to deploy, or push to your Github repository."

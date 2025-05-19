# Setup Firebase Environment Variables for Vercel Deployment
# This script helps you set up Firebase environment variables for Vercel deployment

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BLUE}${BOLD}Firebase Environment Variables Setup for Vercel${RESET}\n"
echo -e "This script will help you prepare your Firebase environment variables for Vercel deployment.\n"

# Check if service account file exists
SERVICE_ACCOUNT_PATH="./src/lib/firebase/credentials/service-account.json"
if [ -f "$SERVICE_ACCOUNT_PATH" ]; then
  echo -e "${GREEN}Found service account file at $SERVICE_ACCOUNT_PATH${RESET}"
  
  # Extract values from service account JSON
  PROJECT_ID=$(grep -o '"project_id": "[^"]*' "$SERVICE_ACCOUNT_PATH" | cut -d'"' -f4)
  CLIENT_EMAIL=$(grep -o '"client_email": "[^"]*' "$SERVICE_ACCOUNT_PATH" | cut -d'"' -f4)
  
  # Extract private key (more complex, may contain newlines)
  # We'll create a formatted version for display purposes
  PRIVATE_KEY_FIRST_LINE=$(grep -o '"private_key": "-----BEGIN PRIVATE KEY-----' "$SERVICE_ACCOUNT_PATH")
  PRIVATE_KEY_LAST_LINE=$(grep -o '-----END PRIVATE KEY-----[^"]*' "$SERVICE_ACCOUNT_PATH")
  
  if [ -n "$PRIVATE_KEY_FIRST_LINE" ] && [ -n "$PRIVATE_KEY_LAST_LINE" ]; then
    echo -e "\n${BLUE}${BOLD}Firebase Admin SDK Values:${RESET}"
    echo -e "PROJECT_ID: ${GREEN}$PROJECT_ID${RESET}"
    echo -e "CLIENT_EMAIL: ${GREEN}$CLIENT_EMAIL${RESET}"
    echo -e "PRIVATE_KEY: ${GREEN}[Valid key found with BEGIN/END markers]${RESET}"
    PRIVATE_KEY_VALID="YES"
  else
    echo -e "\n${BLUE}${BOLD}Firebase Admin SDK Values:${RESET}"
    echo -e "PROJECT_ID: ${GREEN}$PROJECT_ID${RESET}"
    echo -e "CLIENT_EMAIL: ${GREEN}$CLIENT_EMAIL${RESET}"
    echo -e "PRIVATE_KEY: ${RED}[Warning: Key found but may be missing BEGIN/END markers]${RESET}"
    PRIVATE_KEY_VALID="NO"
  fi
  
  # Create Vercel CLI command
  echo -e "\n${BLUE}${BOLD}To set these in Vercel via CLI, run:${RESET}"
  echo -e "${GREEN}vercel env add FIREBASE_ADMIN_PROJECT_ID${RESET}"
  echo -e "${GREEN}vercel env add FIREBASE_ADMIN_CLIENT_EMAIL${RESET}"
  echo -e "${GREEN}vercel env add FIREBASE_ADMIN_PRIVATE_KEY${RESET}"
  
  echo -e "\n${BLUE}${BOLD}For Vercel Dashboard:${RESET}"
  echo -e "1. Go to your Vercel project dashboard"
  echo -e "2. Navigate to Settings > Environment Variables"
  echo -e "3. Add the following variables:"
  echo -e "   - Name: ${GREEN}FIREBASE_ADMIN_PROJECT_ID${RESET}"
  echo -e "     Value: ${GREEN}$PROJECT_ID${RESET}"
  echo -e "   - Name: ${GREEN}FIREBASE_ADMIN_CLIENT_EMAIL${RESET}" 
  echo -e "     Value: ${GREEN}$CLIENT_EMAIL${RESET}"
  echo -e "   - Name: ${GREEN}FIREBASE_ADMIN_PRIVATE_KEY${RESET}"
  echo -e "     Value: Copy the private key from your service account file (including BEGIN/END markers)"
  
else
  echo -e "${RED}No service account file found at $SERVICE_ACCOUNT_PATH${RESET}"
  echo -e "Please download your service account key from Firebase and place it at the path above."
  echo -e "Or manually set the environment variables in your Vercel dashboard."
fi

# Get Firebase Web Config
WEB_CONFIG_FILE="./src/lib/firebase/firebase.ts"
if [ -f "$WEB_CONFIG_FILE" ]; then
  echo -e "\n${BLUE}${BOLD}Firebase Web Configuration:${RESET}"
  echo -e "Found Firebase web config at $WEB_CONFIG_FILE"
  echo -e "Extract these values for your NEXT_PUBLIC environment variables:"
  
  # Extract web config values
  API_KEY=$(grep -o "apiKey: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  AUTH_DOMAIN=$(grep -o "authDomain: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  PROJECT_ID=$(grep -o "projectId: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  STORAGE_BUCKET=$(grep -o "storageBucket: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  MESSAGING_SENDER_ID=$(grep -o "messagingSenderId: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  APP_ID=$(grep -o "appId: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  MEASUREMENT_ID=$(grep -o "measurementId: \"[^\"]*" "$WEB_CONFIG_FILE" | cut -d'"' -f2)
  
  echo -e "NEXT_PUBLIC_FIREBASE_API_KEY: ${GREEN}$API_KEY${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${GREEN}$AUTH_DOMAIN${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${GREEN}$PROJECT_ID${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${GREEN}$STORAGE_BUCKET${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${GREEN}$MESSAGING_SENDER_ID${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_APP_ID: ${GREEN}$APP_ID${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${GREEN}$MEASUREMENT_ID${RESET}"
else
  echo -e "\n${RED}No Firebase web config found at $WEB_CONFIG_FILE${RESET}"
fi

echo -e "\n${BLUE}${BOLD}After Setting Environment Variables:${RESET}"
echo -e "1. Deploy your application to Vercel:"
echo -e "   ${GREEN}vercel --prod${RESET}"
echo -e "2. Test authentication in the deployed application"
echo -e "3. Check Vercel Function Logs if you encounter any issues"

echo -e "\n\n${BLUE}${BOLD}=============================================================${RESET}"
echo -e "${BLUE}${BOLD}CLIENT-SIDE FIREBASE CONFIGURATION${RESET}"
echo -e "${BLUE}${BOLD}=============================================================${RESET}"

# Check if .env.production file exists
ENV_PRODUCTION_PATH="./.env.production"
ENV_PRODUCTION_EXAMPLE_PATH="./.env.production.example"

if [ -f "$ENV_PRODUCTION_PATH" ]; then
  echo -e "${GREEN}Found .env.production file. Reading Firebase client configuration...${RESET}"
  
  # Parse environment variables from .env.production
  API_KEY=$(grep "NEXT_PUBLIC_FIREBASE_API_KEY" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  AUTH_DOMAIN=$(grep "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  PROJECT_ID_CLIENT=$(grep "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  STORAGE_BUCKET=$(grep "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  MESSAGING_SENDER_ID=$(grep "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  APP_ID=$(grep "NEXT_PUBLIC_FIREBASE_APP_ID" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)
  MEASUREMENT_ID=$(grep "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "$ENV_PRODUCTION_PATH" | cut -d "=" -f2)

  # Display client config
  echo -e "\n${BLUE}${BOLD}Client-side Firebase configuration found:${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_API_KEY = ${GREEN}$API_KEY${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = ${GREEN}$AUTH_DOMAIN${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_PROJECT_ID = ${GREEN}$PROJECT_ID_CLIENT${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = ${GREEN}$STORAGE_BUCKET${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = ${GREEN}$MESSAGING_SENDER_ID${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_APP_ID = ${GREEN}$APP_ID${RESET}"
  echo -e "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = ${GREEN}$MEASUREMENT_ID${RESET}"
  
  # Instructions for Vercel
  echo -e "\n${BLUE}${BOLD}To set these in Vercel via CLI:${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_API_KEY${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_APP_ID${RESET}"
  echo -e "${GREEN}vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID${RESET}"
  
  echo -e "\n${YELLOW}Note: These values will be visible in client-side code, which is safe for Firebase client configuration${RESET}"
elif [ -f "$ENV_PRODUCTION_EXAMPLE_PATH" ]; then
  echo -e "${YELLOW}.env.production not found, but found .env.production.example${RESET}"
  echo -e "${YELLOW}Please copy .env.production.example to .env.production and update with your Firebase configuration${RESET}"
  echo -e "${GREEN}Command: cp .env.production.example .env.production${RESET}"
else
  echo -e "${RED}Could not find Firebase client configuration files (.env.production or .env.production.example)${RESET}"
  echo -e "${YELLOW}Please create these files with your Firebase configuration${RESET}"
fi

# Offer to update firebase.js file
echo -e "\n${BLUE}${BOLD}=============================================================${RESET}"
echo -e "${BLUE}${BOLD}VERIFY FIREBASE STORAGE BUCKET FORMAT${RESET}"
echo -e "${BLUE}${BOLD}=============================================================${RESET}"
echo -e "${BLUE}Make sure your Firebase storage bucket URL has the correct format:${RESET}"
echo -e "${YELLOW}It should be: projectId.appspot.com (not projectId.firebasestorage.app)${RESET}"

FIREBASE_CONFIG_PATH="./src/lib/firebase/firebase.ts"
if [ -f "$FIREBASE_CONFIG_PATH" ]; then
  if grep -q "firebasestorage\.app" "$FIREBASE_CONFIG_PATH"; then
    echo -e "\n${RED}Warning: Your firebase.ts file may be using the wrong storage bucket format!${RESET}"
    echo -e "${YELLOW}Consider updating to the 'projectId.appspot.com' format for Vercel compatibility${RESET}"
  fi
fi

#!/bin/bash
# setup-firebase-admin-vercel.sh
# Script to automate setting up Firebase Admin credentials in Vercel

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BLUE}${BOLD}Firebase Admin Credentials Setup for Vercel${RESET}\n"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI is not installed. Please install it with 'npm i -g vercel'${RESET}"
    exit 1
fi

# Check if logged in to Vercel
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to log in to Vercel first${RESET}"
    vercel login
fi

# Check if service account file exists
SERVICE_ACCOUNT_PATH="./src/lib/firebase/credentials/service-account.json"
if [ ! -f "$SERVICE_ACCOUNT_PATH" ]; then
    echo -e "${RED}Service account file not found at $SERVICE_ACCOUNT_PATH${RESET}"
    echo -e "${YELLOW}Please download your service account key from Firebase Console:${RESET}"
    echo -e "1. Go to Firebase Console > Project Settings > Service Accounts"
    echo -e "2. Click 'Generate New Private Key'"
    echo -e "3. Save the file as $SERVICE_ACCOUNT_PATH"
    
    # Ask if user wants to continue with manual input
    read -p "Do you want to enter the values manually instead? (y/n): " MANUAL_INPUT
    if [[ $MANUAL_INPUT != "y" && $MANUAL_INPUT != "Y" ]]; then
        exit 1
    fi
    
    # Manual input
    echo -e "\n${BLUE}${BOLD}Manual input of Firebase Admin credentials${RESET}"
    read -p "Enter Firebase Project ID: " PROJECT_ID
    read -p "Enter Firebase Client Email: " CLIENT_EMAIL
    echo "Enter Firebase Private Key (paste the entire key including BEGIN/END markers):"
    read -d '' PRIVATE_KEY
else
    # Extract values from service account JSON
    echo -e "${GREEN}Found service account file at $SERVICE_ACCOUNT_PATH${RESET}"
    PROJECT_ID=$(grep -o '"project_id": "[^"]*' "$SERVICE_ACCOUNT_PATH" | cut -d'"' -f4)
    CLIENT_EMAIL=$(grep -o '"client_email": "[^"]*' "$SERVICE_ACCOUNT_PATH" | cut -d'"' -f4)
    
    # Extract private key - this is complex as it spans multiple lines and has special characters
    # First remove all newlines from the file to make it easier to extract the key
    TEMP_FILE=$(mktemp)
    tr -d '\n' < "$SERVICE_ACCOUNT_PATH" > "$TEMP_FILE"
    
    # Extract the private key using sed
    PRIVATE_KEY_RAW=$(sed -n 's/.*"private_key": "\(.*\)",\s*"client_email".*/\1/p' "$TEMP_FILE")
    PRIVATE_KEY=$(echo "$PRIVATE_KEY_RAW" | sed 's/\\n/\n/g')
    
    # Clean up
    rm "$TEMP_FILE"
fi

# Display the values
echo -e "\n${BLUE}${BOLD}Firebase Admin SDK Values:${RESET}"
echo -e "PROJECT_ID: ${GREEN}$PROJECT_ID${RESET}"
echo -e "CLIENT_EMAIL: ${GREEN}$CLIENT_EMAIL${RESET}"
echo -e "PRIVATE_KEY: ${GREEN}[Found - first/last characters: ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -10}]${RESET}"

# Ask for confirmation before setting Vercel environment variables
echo -e "\n${YELLOW}Ready to set these values as Vercel environment variables.${RESET}"
read -p "Continue? (y/n): " CONTINUE
if [[ $CONTINUE != "y" && $CONTINUE != "Y" ]]; then
    exit 0
fi

# Set environment variables in Vercel
echo -e "\n${BLUE}Setting up Vercel environment variables...${RESET}"

# Write values to temporary files
PROJECT_ID_FILE=$(mktemp)
CLIENT_EMAIL_FILE=$(mktemp)
PRIVATE_KEY_FILE=$(mktemp)

echo "$PROJECT_ID" > "$PROJECT_ID_FILE"
echo "$CLIENT_EMAIL" > "$CLIENT_EMAIL_FILE"
echo "$PRIVATE_KEY" > "$PRIVATE_KEY_FILE"

# Add environment variables
echo -e "${YELLOW}Adding FIREBASE_ADMIN_PROJECT_ID...${RESET}"
vercel env add FIREBASE_ADMIN_PROJECT_ID < "$PROJECT_ID_FILE"

echo -e "${YELLOW}Adding FIREBASE_ADMIN_CLIENT_EMAIL...${RESET}"
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL < "$CLIENT_EMAIL_FILE"

echo -e "${YELLOW}Adding FIREBASE_ADMIN_PRIVATE_KEY...${RESET}"
vercel env add FIREBASE_ADMIN_PRIVATE_KEY < "$PRIVATE_KEY_FILE"

# Clean up temporary files
rm "$PROJECT_ID_FILE" "$CLIENT_EMAIL_FILE" "$PRIVATE_KEY_FILE"

echo -e "\n${GREEN}${BOLD}Firebase Admin credentials have been added to Vercel!${RESET}"
echo -e "${BLUE}You can verify them in your Vercel project dashboard under Settings > Environment Variables${RESET}"

# Ask if the user wants to deploy now
read -p "Do you want to deploy to Vercel now? (y/n): " DEPLOY_NOW
if [[ $DEPLOY_NOW == "y" || $DEPLOY_NOW == "Y" ]]; then
    echo -e "\n${BLUE}${BOLD}Deploying to Vercel...${RESET}"
    vercel --prod
else
    echo -e "\n${BLUE}You can deploy later using 'vercel --prod'${RESET}"
fi

echo -e "\n${GREEN}${BOLD}Setup complete!${RESET}"

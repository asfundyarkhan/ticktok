#!/bin/bash

echo -e "\033[0;32mDeploying Firestore rules for admin and superadmin purchase permissions...\033[0m"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "\033[0;31mFirebase CLI not found. Please install it using 'npm install -g firebase-tools'\033[0m"
    exit 1
fi

# Check if user is logged in
firebase login:list | grep -q "No authorized accounts"
if [ $? -eq 0 ]; then
    echo -e "\033[0;33mYou're not logged in to Firebase. Please run 'firebase login' first.\033[0m"
    firebase login
fi

# Deploy Firestore rules
echo -e "\033[0;34mDeploying Firestore rules...\033[0m"
firebase deploy --only firestore:rules

echo -e "\033[0;32mFirestore rules deployment complete!\033[0m"
echo -e "\033[0;32mAdmins and superadmins can now buy seller products.\033[0m"

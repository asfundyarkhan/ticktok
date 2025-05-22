#!/bin/bash
# Bash script to verify SuperAdmin route protection

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "\033[0;31m❌ Node.js is not installed. Please install Node.js to run this script.\033[0m"
    exit 1
fi

echo -e "\033[0;36m🔍 Verifying SuperAdminRoute protection...\033[0m"
echo -e "\033[0;33mRunning verification script to test access permissions for different user roles...\033[0m"

# Run the verification script
node ./scripts/verify-superadmin-routes.js

# Check if there are any files that need to be manually tested
echo -e "\n\033[0;32m📋 To manually verify the fix:\033[0m"
echo "1. Log in as an admin user"
echo "2. Verify the 'Seller Credit' menu item doesn't appear in the sidebar" 
echo "3. Try navigating directly to /dashboard/admin"
echo "4. Confirm you're redirected to /dashboard instead"
echo "5. Log in as a superadmin user"
echo "6. Verify you can access the seller credit page without issues"

echo -e "\n\033[0;32m✅ Verification script completed.\033[0m"

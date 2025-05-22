#!/bin/bash
# Admin Redirection Fix Deployment Script
# This script deploys the Ticktok application to Vercel
# and provides verification steps for the admin redirection fix

CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}===================================================="
echo -e "  ADMIN REDIRECTION FIX DEPLOYMENT & VERIFICATION   "
echo -e "====================================================${NC}"
echo ""

# Ensure all changes are committed before deployment
echo -e "${YELLOW}Checking for uncommitted changes...${NC}"
git status --porcelain

if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}You have uncommitted changes. Please commit them before deploying.${NC}"
    echo -e "Changes:"
    git status --porcelain
    
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
fi

# Run the pre-deployment verification
echo -e "${YELLOW}Running pre-deployment verification...${NC}"
echo -e "${YELLOW}Checking that all auth redirection logic uses window.location.href:${NC}"

# Count the number of redirections using router.push/replace vs window.location.href
ROUTER_PUSH_COUNT=$(grep -r "router\.push(" --include="*.tsx" src/app/ | wc -l)
ROUTER_REPLACE_COUNT=$(grep -r "router\.replace(" --include="*.tsx" src/app/ | wc -l)
WINDOW_LOCATION_COUNT=$(grep -r "window\.location\.href" --include="*.tsx" src/app/ | wc -l)

if [ $ROUTER_PUSH_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Found $ROUTER_PUSH_COUNT router.push() calls${NC}"
else
    echo -e "${GREEN}Found $ROUTER_PUSH_COUNT router.push() calls${NC}"
fi

if [ $ROUTER_REPLACE_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Found $ROUTER_REPLACE_COUNT router.replace() calls${NC}"
else
    echo -e "${GREEN}Found $ROUTER_REPLACE_COUNT router.replace() calls${NC}"
fi

echo -e "${GREEN}Found $WINDOW_LOCATION_COUNT window.location.href calls${NC}"

# Execute the deployment to Vercel
echo -e "\n${YELLOW}Deploying to Vercel...${NC}"
# Call the existing deployment script
"$(dirname "$0")/pre-deploy-vercel.sh"
"$(dirname "$0")/deploy-to-vercel.sh"

echo -e "\n${GREEN}Deployment completed!${NC}"

# Verification instructions
echo -e "\n${CYAN}===================================================="
echo -e "  VERIFICATION STEPS FOR ADMIN REDIRECTION FIX   "
echo -e "====================================================${NC}"
echo ""
echo -e "${WHITE}1. Open your deployed Vercel URL in an incognito/private window${NC}"
echo -e "${WHITE}2. Log in with an admin user account${NC}"
echo -e "${WHITE}3. Check if you're automatically redirected to /dashboard/admin${NC}"
echo -e "${WHITE}4. If not, try running the verification script in browser console:${NC}"
echo -e "${WHITE}   - Open browser console (F12)${NC}"
echo -e "${WHITE}   - Copy and paste the contents of scripts/verify-admin-redirect.js${NC}"
echo -e "${WHITE}   - Press Enter to run the script${NC}"
echo ""
echo -e "${WHITE}5. If redirection is still failing, check browser console for errors${NC}"
echo -e "${WHITE}6. Try accessing these debug endpoints:${NC}"
echo -e "${WHITE}   - /api/debug/check-admin-redirect${NC}"
echo -e "${WHITE}   - /dashboard/debug/admin-redirect-test${NC}"
echo -e "${WHITE}   - /dashboard/debug/auth-debug${NC}"
echo ""
echo -e "${CYAN}====================================================${NC}"

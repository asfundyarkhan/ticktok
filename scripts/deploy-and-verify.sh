#!/bin/bash
# deploy-and-verify.sh
# A shell script to deploy to Vercel and verify CSP headers

set -e # Exit immediately if a command exits with non-zero status

echo "┌─────────────────────────────────────────┐"
echo "│   TikTok Shop Deployment & CSP Verify   │"
echo "└─────────────────────────────────────────┘"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it with 'npm install -g vercel'"
    exit 1
else
    VERCEL_VERSION=$(vercel --version)
    echo "✅ Vercel CLI detected: $VERCEL_VERSION"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js detected: $NODE_VERSION"
fi

# Check if axios is installed (needed for verify-csp.js)
if ! npm list axios | grep -q 'axios'; then
    echo "Installing axios package for CSP verification..."
    npm install axios --save-dev
else
    echo "✅ axios package detected"
fi

# Prepare environment for Vercel
echo "🔧 Preparing Firebase environment for Vercel..."
bash ./scripts/prepare-vercel-deploy.sh

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Wait for deployment to complete
echo "⏳ Waiting for deployment to propagate (30 seconds)..."
sleep 30

# Verify CSP headers
echo "🔍 Verifying CSP headers..."
node scripts/verify-csp.js

echo ""
echo "✅ Deployment and verification process complete!"
echo ""
echo "Next steps:"
echo "1. Check if verification found any missing CSP domains"
echo "2. Test Firebase authentication in production"
echo "3. Verify Firestore operations are working"
echo "4. Check Analytics events are being tracked"

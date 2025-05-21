#!/bin/bash
echo "Running Vercel deployment environment fix..."
node scripts/fix-vercel-env.js

echo ""
echo "Creating Vercel deployment..."
vercel --prod

echo ""
echo "If deployment failed, please fix your environment variables manually:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Environment Variables"
echo "4. Add all required Firebase environment variables"
echo ""
echo "For more help, see FIREBASE_DEPLOYMENT_SOLUTION.md"

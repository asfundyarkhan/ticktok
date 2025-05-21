@echo off
ECHO Running Vercel deployment environment fix...
node scripts/fix-vercel-env.js

ECHO.
ECHO Creating Vercel deployment...
vercel --prod

ECHO.
ECHO If deployment failed, please fix your environment variables manually:
ECHO 1. Go to https://vercel.com/dashboard
ECHO 2. Select your project
ECHO 3. Go to Settings > Environment Variables
ECHO 4. Add all required Firebase environment variables
ECHO.
ECHO For more help, see FIREBASE_DEPLOYMENT_SOLUTION.md

# Vercel Deployment Guide for TikTok Shop

This guide explains how to deploy the TikTok Shop application to Vercel while ensuring Firebase connectivity works correctly in production.

## Common Firebase Connection Issues

When deploying to Vercel or your production domain, you might encounter these Firebase connection issues:

1. **Environment Variables**: Missing or incorrect environment variables in the Vercel project settings
2. **Storage Bucket URL**: Incorrect format for the Firebase storage bucket URL
3. **Firebase Configuration**: Inconsistency between local and production Firebase settings
4. **CORS Issues**: Cross-origin restrictions preventing API calls

## Solution Overview

We've implemented a comprehensive solution with these components:

1. **Pre-deployment Scripts**: `prepare-vercel-deploy.sh` and `prepare-vercel-deploy.ps1` create necessary environment files
2. **Environment Templates**: `.env.production.example` provides a template for production settings
3. **Modified Build Command**: Custom Vercel build command that runs preparation steps
4. **Robust Firebase Initialization**: Enhanced error handling in Firebase setup code

## Setup Steps

### 1. Environment Variables in Vercel

Add these environment variables to your Vercel project:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ticktokshop-5f1e9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ticktokshop-5f1e9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ticktokshop-5f1e9.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=155434252666
NEXT_PUBLIC_FIREBASE_APP_ID=1:155434252666:web:fa5051f4cb33f3a784bec3
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-5BRMHTMXHR
```

### 2. Deployment Commands

For local testing of the production build:
```bash
# On Linux/Mac
npm run prepare:vercel && npm run build:vercel

# On Windows
npm run prepare:vercel:win && npm run build:vercel
```

### 3. Vercel Integration

If using GitHub integration:
1. Connect your GitHub repository to Vercel
2. Vercel will use the custom build command from `vercel.json`
3. The environment variables will be used during build and runtime

If deploying manually:
```bash
vercel deploy
```

## Troubleshooting

### Firebase Connection Still Failing

1. Check browser console for specific error messages
2. Verify CORS settings in your Firebase console
3. Confirm environment variables are correctly set in Vercel
4. Check the storage bucket URL format (should be `project-id.appspot.com`)

### Authentication Failures

1. Enable proper authentication methods in Firebase console
2. Check domain authorization settings in Firebase Auth console
3. Make sure cookies and redirects are working properly

## Testing Firebase Connection

Add this test page to verify Firebase connection:

1. Visit `/api/health` endpoint
2. Check console logs for Firebase initialization status

## Notes for Custom Domains

When using a custom domain:
1. Add your domain to authorized domains in Firebase Auth console
2. Update `NEXT_PUBLIC_APP_URL` to match your custom domain
3. Configure proper security headers for Firebase in `security-headers.js`

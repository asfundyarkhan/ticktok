# TikTok Shop Deployment Guide

This guide explains how to deploy the TikTok Shop application to Vercel or other hosting providers.

## Prerequisites

- Node.js 18+ installed
- Access to the Firebase project
- Vercel account (if deploying to Vercel)

## Environment Setup

1. **Prepare Environment Variables**:

   - Copy `.env.production.example` to `.env.production`
   - Update the values with your Firebase project details

   ```bash
   # For Windows:
   Copy-Item .env.production.example .env.production

   # For Linux/Mac:
   cp .env.production.example .env.production
   ```

2. **Configure Firebase Environment**:

   - Run the Firebase environment setup script:

   ```bash
   # For Windows:
   ./scripts/setup-firebase-env.ps1

   # For Linux/Mac:
   bash ./scripts/setup-firebase-env.sh
   ```

3. **Fix Firebase Storage Bucket Format**:
   - Ensure your storage bucket URL uses the `projectId.appspot.com` format
   - This format works best with Vercel deployments

## Deployment Methods

### Vercel Deployment (Recommended)

1. **Prepare for Vercel Deployment**:

   ```bash
   # For Windows:
   npm run prepare:vercel:win

   # For Linux/Mac:
   npm run prepare:vercel
   ```

2. **Deploy to Vercel**:

   - Option 1: Using Vercel CLI

     ```bash
     vercel
     ```

   - Option 2: Using GitHub Integration
     - Connect your GitHub repository to Vercel
     - Vercel will use the configuration from `vercel.json`

3. **Verify Deployment**:
   - Visit the health check endpoint to verify Firebase connectivity:
     `https://your-domain.vercel.app/api/health`

### Production Build for Other Providers

1. **Create Production Build**:

   ```bash
   npm run build:vercel
   ```

2. **Start Production Server**:
   ```bash
   npm run start
   ```

## Troubleshooting

### Firebase Connection Issues

- **Check Storage Bucket Format**: Make sure it's using `projectId.appspot.com`
- **Verify Environment Variables**: Ensure all required Firebase environment variables are set
- **CORS Issues**: Check Firebase Console to ensure your domain is allowed
- **Custom Domains**: Add your custom domain to authorized domains in Firebase Authentication settings

### Deployment Errors

- **Build Errors**: Check that all TypeScript errors are resolved with `npx tsc --noEmit`
- **Runtime Errors**: Check browser console for Firebase initialization errors
- **API Errors**: Check server logs for backend connection issues

## Additional Documentation

- [Firebase Vercel Deployment Guide](./docs/FIREBASE_VERCEL_DEPLOYMENT.md)
- [Firebase Auth Setup](./FIREBASE_AUTH_SETUP.md)
- [Firebase Auth Implementation](./FIREBASE_AUTH_IMPLEMENTATION.md)

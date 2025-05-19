# Firebase Admin SDK Setup for Vercel

## Problem

When deploying to Vercel, you might encounter this error:

```
Firebase admin initialization error: {
  message: 'Firebase Admin SDK: Service account credentials are required for production. Please set FIREBASE_ADMIN_* environment variables in Vercel.',
  stack: 'Error: Firebase Admin SDK: Service account credentials are required for production. Please set FIREBASE_ADMIN_* environment variables in Vercel.\n',
  environment: 'production',
  vercelEnvironment: 'production',
  hasEnvVars: { projectId: false, clientEmail: false, privateKey: false }
}
```

This occurs because the Firebase Admin SDK requires service account credentials to authenticate with Firebase services on the server side. These credentials are not properly configured in your Vercel environment.

## Solution

### Automatic Setup (Recommended)

We've created scripts that will automatically set up Firebase Admin SDK credentials in your Vercel project:

#### For Linux/Mac users:
```bash
npm run setup:firebase-admin
```

#### For Windows users:
```powershell
npm run setup:firebase-admin:win
```

This script will:
1. Check if you have a service account file at `src/lib/firebase/credentials/service-account.json`
2. Extract the necessary credentials from this file
3. Set up the required environment variables in your Vercel project:
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
4. Optionally deploy your project with the new environment variables

### Manual Setup

If you prefer to set up the environment variables manually:

1. **Get your service account key:**
   - Go to the [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to "Project settings" > "Service accounts"
   - Click "Generate new private key"
   - Save the JSON file

2. **Extract the required values from the JSON file:**
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep all newlines and formatting)

3. **Add these to your Vercel project:**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add each of the variables above
   - Make sure "Environment" is set to "Production" (or to all environments if needed)

4. **Redeploy your project:**
   ```bash
   vercel --prod
   ```

## Important Notes

### Private Key Formatting

The `private_key` value must maintain its formatting, including newlines. Vercel handles this automatically when you use the environment variable dashboard, but if you're using the CLI, make sure to:

- Enclose the key in double quotes
- Preserve all line breaks (including `\n` characters)

### Environment Variable Scope

Make sure your environment variables are set for the "Production" environment in Vercel, as the error specifically mentions the production environment.

### Testing Your Deployment

After setting up the environment variables, you can verify that the Firebase Admin SDK is working correctly by:

1. Deploying your application
2. Trying to log in or perform server-side Firebase operations
3. Checking the Vercel logs for any Firebase Admin initialization errors

## Troubleshooting

### Service Account Permissions

If you're still experiencing issues after setting up the environment variables, check that your service account has the necessary permissions:

1. Go to the Google Cloud Console
2. Navigate to IAM & Admin > Service Accounts
3. Find your service account
4. Ensure it has at least the following roles:
   - Firebase Admin SDK Administrator
   - Firebase Authentication Admin
   - Cloud Firestore Service Agent (if using Firestore)

### Environment Variable Verification

You can verify that your environment variables are correctly set in Vercel by checking:

1. Vercel Dashboard > Settings > Environment Variables
2. Vercel deployment logs (look for Firebase Admin SDK initialization messages)

### Local Development vs Production

Remember that in local development, the application can use the service account file directly, but in production (Vercel), it must use environment variables.

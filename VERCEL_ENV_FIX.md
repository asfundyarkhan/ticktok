# Fixing "Environment Variable References Secret Which Does Not Exist" Error in Vercel

This is a common issue when deploying to Vercel using environment variables that reference secrets that don't exist.

## Quick Solution

1. **Use our quick-deploy script**:

   ```bash
   # For Windows:
   .\scripts\quick-deploy.cmd

   # For Linux/Mac:
   bash scripts/quick-deploy.sh
   ```

2. **Or manually set environment variables in Vercel**:
   - Go to your Vercel dashboard: https://vercel.com/dashboard
   - Select your project
   - Navigate to "Settings" > "Environment Variables"
   - Delete any variables that use the format `@secret-name`
   - Add all required environment variables with their actual values:

## Required Environment Variables

### Firebase Web SDK (Client-side)

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin SDK (Server-side)

```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

## Getting Firebase Credentials

1. **For Web SDK variables**:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings (gear icon) > General tab
   - Scroll down to "Your apps" section
   - Select your web app or create one
   - Copy the configuration values

2. **For Admin SDK variables**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service accounts tab
   - Click "Generate new private key"
   - Use the values from the downloaded JSON file

## Important Notes for FIREBASE_ADMIN_PRIVATE_KEY

When setting the private key in Vercel:

1. Include the entire string with the `BEGIN PRIVATE KEY` and `END PRIVATE KEY` markers
2. Paste it exactly as is, Vercel will handle the formatting internally
3. Don't worry about newlines or quotes - Vercel handles this correctly

## References

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js on Vercel](https://nextjs.org/docs/deployment)

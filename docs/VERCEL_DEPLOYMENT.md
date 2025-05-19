# Vercel Deployment Guide for Ticktok E-Commerce

This guide will walk you through deploying the Ticktok E-Commerce application to Vercel and configuring a custom domain.

## Prerequisites

- A Vercel account - [Sign up here](https://vercel.com/signup) if you don't have one
- Custom domain name (optional, but recommended for production)
- Git repository with your project code

## Deployment Steps

### Method 1: Using the Deployment Script

We've provided a script to automate the deployment process:

**For Windows (PowerShell):**

```powershell
.\scripts\deploy-to-vercel.ps1
```

**For Linux/Mac:**

```bash
chmod +x ./scripts/deploy-to-vercel.sh
./scripts/deploy-to-vercel.sh
```

### Method 2: Manual Deployment

1. Install the Vercel CLI:

   ```
   npm install -g vercel
   ```

2. Login to your Vercel account:

   ```
   vercel login
   ```

3. Run the deployment command from your project root:

   ```
   vercel --prod
   ```

4. Follow the prompts to complete the deployment.

## Setting Up Custom Domain

1. Once deployed, go to your [Vercel Dashboard](https://vercel.com/dashboard)

2. Select your Ticktok project

3. Go to **Settings** → **Domains**

4. Click **Add** and enter your custom domain name

5. Follow Vercel's instructions to configure the DNS records:

   - For apex domains (e.g., yourdomain.com): Add A records pointing to Vercel's IP addresses
   - For subdomains (e.g., shop.yourdomain.com): Add a CNAME record pointing to your Vercel deployment URL

6. Wait for DNS propagation (can take up to 48 hours, but usually much faster)

## Environment Variables

Ensure these environment variables are set in your Vercel project:

### Required Firebase Environment Variables

| Variable                       | Purpose                               | Example Value                                                                |
| ------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------- |
| FIREBASE_ADMIN_PROJECT_ID      | Firebase project ID                   | ticktokshop-5f1e9                                                            |
| FIREBASE_ADMIN_CLIENT_EMAIL    | Firebase service account email        | firebase-adminsdk-fbsvc@ticktokshop-5f1e9.iam.gserviceaccount.com            |
| FIREBASE_ADMIN_PRIVATE_KEY     | Firebase service account private key  | -----BEGIN PRIVATE KEY-----\nMIIEvAIBADAN...\n-----END PRIVATE KEY-----\n    |
| NEXT_PUBLIC_FIREBASE_API_KEY   | Firebase Web API Key                  | AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8                                     |
| NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | Firebase Auth Domain                | ticktokshop-5f1e9.firebaseapp.com                                            |
| NEXT_PUBLIC_FIREBASE_PROJECT_ID | Firebase Project ID                  | ticktokshop-5f1e9                                                            |
| NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | Firebase Storage Bucket          | ticktokshop-5f1e9.firebasestorage.app                                        |
| NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | Firebase Messaging Sender ID | 155434252666                                                               |
| NEXT_PUBLIC_FIREBASE_APP_ID    | Firebase App ID                       | 1:155434252666:web:fa5051f4cb33f3a784bec3                                    |
| NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | Firebase Measurement ID          | G-5BRMHTMXHR                                                                 |
| NEXT_PUBLIC_SITE_URL           | Public URL of your site               | https://yourdomain.com                                                       |

### Firebase Admin Key Setup

The `FIREBASE_ADMIN_PRIVATE_KEY` requires special attention:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Copy the private key value from the downloaded JSON file
4. Paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` into Vercel

> **Important:** Vercel handles newlines in environment variables automatically, so you can paste the key as is.

To set these environment variables:

1. Go to your project in the Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable and its value

## SSL/TLS Configuration

Vercel automatically provisions SSL certificates for your custom domain using Let's Encrypt. There's nothing additional you need to configure.

## Troubleshooting

If you encounter issues during deployment:

1. Check the deployment logs in Vercel dashboard
2. Verify your DNS configuration
3. Ensure all required environment variables are set
4. Check that your project builds successfully locally:
   ```
   npm run build
   ```

### Common Firebase Authentication Issues

#### "auth/invalid-credential" Errors

If you encounter `FirebaseError: Firebase: Error (auth/invalid-credential)` in production:

1. **Check Firebase Console Settings:**
   - Verify Email/Password authentication is enabled in Firebase Console
   - Ensure your Firebase project doesn't have IP restrictions that block Vercel's servers
   - Check that your Vercel deployment domain is added to the authorized domains list

2. **Environment Variables Issues:**
   - Confirm that all Firebase environment variables are correctly set in Vercel
   - Make sure the Firebase API key is correct and not restricted
   - Verify the `FIREBASE_ADMIN_PRIVATE_KEY` includes the entire key with BEGIN/END markers
   - Make sure no quotes or escape characters are corrupting the private key

3. **Firestore Access Issues:**
   - Check Firestore security rules to ensure they allow the operations your app is performing
   - Verify that user documents exist in the Firestore 'users' collection
   - Test your security rules using the Firebase Emulator Suite

4. **Session Cookie Issues:**
   - The application uses session cookies for authentication which require proper HTTPS setup
   - Ensure your custom domain has proper SSL configuration
   - Check browser settings/extensions that might block cookies
   - Verify that cookies are being set correctly in the browser developer tools

#### Firebase Admin SDK Initialization Failures

If you see errors about Firebase Admin initialization in Vercel logs:

1. **Check Service Account Permissions:**
   - Ensure the service account has the required permissions (Auth Admin, Firestore Admin)
   - Verify the service account hasn't been deleted or disabled in the Google Cloud Console

2. **Environment Variable Format:**
   - Double-check the format of all Firebase Admin environment variables
   - Make sure the private key is correctly formatted with proper line breaks
   
3. **Project ID Mismatch:**
   - Verify that the Firebase Admin Project ID matches your client-side Project ID
   - Check that you're not mixing development and production Firebase projects

4. **Recovery Options:**
   - In emergencies, redeploy with new service account credentials
   - Check if the Firebase Admin fallback initialization is working
   - Review the server logs for specific initialization errors

#### User Authentication State Issues

If users are being unexpectedly logged out or authentication state is inconsistent:

1. **Session Cookie Duration:**
   - The session cookie is set to expire in 5 days by default
   - Check if users are active for longer periods without refreshing their token

2. **Multiple Devices/Browsers:**
   - If a user's credentials are revoked, all sessions will be invalidated
   - Password changes will invalidate existing sessions

3. **Cross-Origin Issues:**
   - Verify that authentication works across subdomains if applicable
   - Check CORS settings if accessing the API from different domains

## Post-Deployment Verification

After deploying:

1. Visit your site to ensure it loads correctly
2. Test core functionality (user login, cart, checkout, etc.)
3. Verify that all API endpoints are working
4. Check SSL certificate is valid by visiting https://yourdomain.com

## Firebase Authentication Setup for Vercel

### Pre-Deployment Firebase Configuration

Before deploying to Vercel, ensure your Firebase project is properly configured:

1. **Authorized Domains:**
   - In Firebase Console, go to Authentication > Settings > Authorized domains
   - Add your Vercel preview domains (`*.vercel.app`) and your custom domain
   - Without this, authentication won't work on deployed versions

2. **Service Account Key:**
   - Generate a new service account key specifically for Vercel
   - Consider creating a dedicated service account with limited permissions for better security
   - Never commit this key to your repository

3. **Firebase Rules Deployment:**
   - Deploy your Firebase Security Rules before or after your Vercel deployment:
     ```bash
     firebase deploy --only firestore:rules
     ```
   - Test your rules with the Firebase Emulator Suite first to avoid locking yourself out

### Firebase Initialization in Vercel Environments

The application is configured to handle different Vercel environments:

- **Production:** Uses environment variables for Firebase Admin initialization
- **Preview:** Limited functionality mode (some server operations may be restricted)
- **Development:** Uses local service account file with full functionality

### Session Cookie Security

For proper Firebase session cookie authentication:

1. **Domain Configuration:**
   - Cookies are configured for the proper domain in production environments
   - For Vercel preview deployments, cookies work on the `.vercel.app` domain

2. **HTTPS Requirements:**
   - Session cookies require HTTPS which Vercel provides automatically
   - Local development uses HTTP cookies with reduced security

### Testing Authentication on Deployed Versions

After deployment, verify authentication flow:

1. **Registration Flow:**
   - Create a new account to verify the full registration path
   - Check that verification emails are delivered properly
   - Verify user documents are created in Firestore

2. **Login Flow:**
   - Test login with existing credentials
   - Verify session persistence works across page refreshes
   - Test logout functionality

3. **Error Handling:**
   - Test wrong credentials to verify error messages
   - Check that server-side authentication errors are properly displayed

### Monitoring Firebase Authentication Issues

Set up monitoring for authentication-related issues:

1. **Firebase Console:**
   - Review Authentication > Users regularly
   - Monitor failed authentication attempts in Firebase Console logs

2. **Vercel Logs:**
   - Check function logs in the Vercel dashboard for auth-related errors
   - Look for errors related to Firebase Admin initialization

3. **Error Tracking:**
   - Consider integrating an error tracking service like Sentry for production deployments
   - Set up alerts for authentication failure patterns

## Need Help?

Contact our support team at support@ticktok.com or open an issue in the project repository.

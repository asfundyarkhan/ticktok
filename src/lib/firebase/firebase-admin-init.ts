// Firebase Admin SDK initialization - consolidated version
import * as admin from 'firebase-admin';
import { cert, ServiceAccount } from 'firebase-admin/app';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin and make sure it's only done once
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  try {
    // First try to use environment variables (for production environments)
    let credential;
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = Boolean(process.env.VERCEL);
    const vercelEnv = process.env.VERCEL_ENV || 'unknown';
    
    // Check if environment variables are available
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      console.log(`Initializing Firebase Admin SDK with environment variables (${isProduction ? 'production' : 'development'} mode, Vercel: ${isVercel ? vercelEnv : 'no'})`);
      
      // Ensure the private key is properly formatted with newlines
      // On Vercel, we shouldn't need to replace \n as they handle this automatically
      const privateKey = isVercel 
        ? process.env.FIREBASE_ADMIN_PRIVATE_KEY 
        : process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      credential = cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "ticktokshop-5f1e9",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey
      } as ServiceAccount);
    } else {
      // For local development, try using the service account key file
      console.log('Environment variables not found, attempting to use service account file');
      const serviceAccountPath = path.join(process.cwd(), 'src', 'lib', 'firebase', 'credentials', 'service-account.json');
      
      // Check if the service account file exists
      if (fs.existsSync(serviceAccountPath)) {
        console.log('Loading service account from file:', serviceAccountPath);
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8')
        );
        credential = cert(serviceAccount);      } else {
        console.warn('Firebase Admin SDK: Service account file not found at', serviceAccountPath);
        console.warn('Please create this file following the instructions in src/lib/firebase/credentials-example/README.md');
        
        // Check if we're in development mode and set up emulator credentials
        if (process.env.NODE_ENV === 'development') {
          // Initialize with emulator settings for local development without credentials
          console.log('Firebase Admin SDK: Initializing in emulator mode for development');
          admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ticktokshop-5f1e9"
          });
          console.log('Firebase Admin SDK initialized in emulator mode');
          return;        } else if (process.env.VERCEL_ENV === 'preview') {
          // For preview deployments on Vercel, initialize with minimal config but warn
          console.log('Firebase Admin SDK: Initializing in preview mode for Vercel preview deployment');
          
          // Try to use NEXT_PUBLIC variables as fallback for preview environments
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ticktokshop-5f1e9";
          
          // Initialize with minimal configuration for preview environments
          admin.initializeApp({
            projectId,
            // If available, we can also set these for better functionality:
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`
          });
          
          console.warn('Firebase Admin SDK initialized in preview mode with limited functionality');
          console.warn('Some server-side authentication features may not work properly');
          console.warn('For full functionality, add Firebase Admin credentials to environment variables');
          return;        } else {
          // More detailed error message with instructions
          console.error('Firebase Admin SDK: Service account credentials required for production.');
          console.error('To fix this issue:');
          console.error('1. Run the script: setup-firebase-admin-vercel.sh (Linux/Mac) or setup-firebase-admin-vercel.ps1 (Windows)');
          console.error('2. Or manually add FIREBASE_ADMIN_* environment variables in the Vercel dashboard');
          console.error('3. Deploy again after adding the environment variables');
          
          // Throw error with detailed message
          throw new Error('Firebase Admin SDK: Service account credentials are required for production. Please set FIREBASE_ADMIN_* environment variables in Vercel.');
        }
      }
    }
    
    // Initialize the app with the credential
    admin.initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ticktokshop-5f1e9.firebasestorage.app"
    });
      console.log('Firebase Admin SDK initialized successfully');  
  } catch (error) {
    // Enhanced error logging for better debugging in production
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Firebase admin initialization error:', {
      message: errorMessage,
      stack,
      environment: process.env.NODE_ENV || 'unknown',
      vercelEnvironment: process.env.VERCEL_ENV || 'not on Vercel',
      hasEnvVars: {
        projectId: Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID),
        clientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
        privateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY)
      }
    });
    
    // In production, we might want to initialize with a restricted app rather than crashing
    if (process.env.NODE_ENV === 'production') {
      console.warn('Attempting to initialize Firebase Admin with limited functionality for production');
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || "ticktokshop-5f1e9";
        const isVercel = Boolean(process.env.VERCEL);
        
        // Initialize with best available configuration
        admin.initializeApp({
          projectId,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
          // On Vercel, we can initialize with databaseURL for better fallback functionality
          ...(isVercel ? { 
            databaseURL: `https://${projectId}.firebaseio.com`
          } : {})
        });
        
        console.warn('Firebase Admin SDK initialized with limited functionality');
        console.warn('Authentication operations will not work correctly until proper credentials are provided');
        console.warn('-------------------------------------------------------------------');
        console.warn('IMPORTANT: To fix this issue, run:');
        console.warn('  npm run setup:firebase-admin');
        console.warn('Or manually add Firebase Admin credentials to Vercel environment variables');
        console.warn('-------------------------------------------------------------------');
      } catch (fallbackError) {
        console.error('Fatal: Even fallback initialization failed:', fallbackError);
      }
    }
  }
}

// Initialize on import
initializeFirebaseAdmin();

// Export the admin object
export default admin;

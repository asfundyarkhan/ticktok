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
    
    // Check if environment variables are available
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
      credential = cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "ticktokshop-5f1e9",
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Replace escaped newlines when using environment variables
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
      } as ServiceAccount);
    } else {
      // For local development, try using the service account key file
      const serviceAccountPath = path.join(process.cwd(), 'src', 'lib', 'firebase', 'credentials', 'service-account.json');
      
      // Check if the service account file exists
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8')
        );
        credential = cert(serviceAccount);
      } else {
        console.warn('Firebase Admin SDK: Service account file not found at', serviceAccountPath);
        console.warn('Please create this file following the instructions in src/lib/firebase/credentials-example/README.md');
        console.warn('Using environment emulator credentials as fallback');
        
        // Check if we're in development mode and set up emulator credentials
        if (process.env.NODE_ENV === 'development') {
          // Initialize with emulator settings for local development without credentials
          admin.initializeApp({
            projectId: "ticktokshop-5f1e9"
          });
          console.log('Firebase Admin SDK initialized in emulator mode');
          return;
        } else {
          throw new Error('Firebase Admin SDK: Service account credentials are required for production');
        }
      }
    }
    
    // Initialize the app with the credential
    admin.initializeApp({
      credential,
      storageBucket: "ticktokshop-5f1e9.firebasestorage.app"
    });
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Initialize on import
initializeFirebaseAdmin();

// Export the admin object
export default admin;

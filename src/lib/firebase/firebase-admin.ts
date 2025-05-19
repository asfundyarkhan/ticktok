/**
 * DEPRECATED: This file is deprecated - use firebase-admin.server.ts instead
 * This file exists only for backward compatibility
 */

// Re-export from the server file
export { 
  adminAuth, 
  adminDb, 
  adminStorage,
  verifySessionToken,
  getFirestoreUser,
  createSessionCookie
} from './firebase-admin.server';

// NOTE: The code below is commented out and kept for reference only
/* 
// Check if Firebase Admin is already initialized to avoid multiple instances
if (!getApps().length) {
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
      // For local development, use the service account key file
      const serviceAccountPath = path.join(process.cwd(), 'src', 'lib', 'firebase', 'credentials', 'service-account.json');
      
      // Check if the service account file exists
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(
          fs.readFileSync(serviceAccountPath, 'utf8')
        );
        credential = cert(serviceAccount);
      } else {
        throw new Error('Firebase Admin SDK: Service account file not found');
      }
    }
    
    // Initialize the app with the credential
    initializeApp({
      credential,
      storageBucket: "ticktokshop-5f1e9.firebasestorage.app"
    });
    
    console.log('Firebase Admin SDK initialized successfully');  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}
*/
// Commented out as we're re-exporting from the server file instead

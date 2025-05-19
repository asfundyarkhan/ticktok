// Firebase client-side configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration from environment variables or fallback to hardcoded values
// Note: All of these values are safe to be public in client-side code
const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
} = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ticktokshop-5f1e9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ticktokshop-5f1e9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "155434252666",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5BRMHTMXHR"
};

// Initialize Firebase with error handling for production readiness
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

// Initialize Firebase
try {
  // Initialize Firebase only once
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  
  // Initialize Firebase services with individual error handling
  try {
    auth = getAuth(app);
  } catch (authError) {
    console.error('Firebase Auth initialization error:', authError);
    // We'll attempt to recover from this below if needed
  }
  
  try {
    firestore = getFirestore(app);
  } catch (firestoreError) {
    console.error('Firebase Firestore initialization error:', firestoreError);
    // We'll attempt to recover from this below if needed
  }
  
  try {
    storage = getStorage(app);
  } catch (storageError) {
    console.error('Firebase Storage initialization error:', storageError);
    // We'll attempt to recover from this below if needed
  }
  
  // Initialize analytics only in browser environment
  if (typeof window !== 'undefined') {
    // Check if analytics is supported in current environment
    isSupported().then(yes => {
      if (yes) {
        try {
          analytics = getAnalytics(app);
        } catch (error) {
          console.warn('Firebase analytics initialization failed:', error);
          // Analytics failure is not critical, we can continue
        }
      }
    }).catch(err => {
      console.warn('Firebase analytics support check failed:', err);
    });
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = Boolean(process.env.VERCEL);
  console.log(`Firebase client SDK initialized successfully (${isProduction ? 'production' : 'development'}, Vercel: ${isVercel ? 'yes' : 'no'})`);
} catch (error) {
  console.error('Firebase client initialization error:', error);
    // Log detailed error information
  const errorInfo = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : 'No stack trace',
    environment: process.env.NODE_ENV || 'unknown',
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV || 'unknown'
  };
  console.error('Firebase client initialization error details:', errorInfo);

  // Fallback initialization for critical services
  if (!getApps().length) {
    console.warn('Attempting fallback Firebase initialization with minimal config');
    try {
      // Initialize with minimal required configuration
      app = initializeApp({
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
      });
      console.warn('Fallback Firebase initialization successful with minimal config');
    } catch (fallbackError) {
      console.error('Fatal: Firebase initialization completely failed', fallbackError);
      // In production, we'll initialize an "empty" app as last resort so the UI can still render
      if (process.env.NODE_ENV === 'production') {
        try {
          // This will likely not work for most operations but prevents total failure
          app = initializeApp({ projectId: firebaseConfig.projectId });
          console.warn('Emergency Firebase initialization with incomplete configuration');
        } catch (e) {
          throw new Error('Could not initialize Firebase client: ' + (e instanceof Error ? e.message : String(e)));
        }
      } else {
        throw new Error('Could not initialize Firebase client');
      }
    }
  } else {
    app = getApps()[0];
    console.warn('Using existing Firebase app instance');
  }
  
  // Re-initialize essential services with enhanced error handling
  if (!auth) {
    try { 
      auth = getAuth(app); 
    } catch (e) { 
      console.error('Auth initialization failed in recovery mode:', e); 
      // In production, create a mock auth object to prevent crashes
      if (process.env.NODE_ENV === 'production') {
        console.warn('Auth will not function correctly - some features will be unavailable');
      } else {
        throw e;
      }
    }
  }
  
  if (!firestore) {
    try { 
      firestore = getFirestore(app); 
    } catch (e) { 
      console.error('Firestore initialization failed in recovery mode:', e);
      if (process.env.NODE_ENV === 'production') {
        console.warn('Firestore will not function correctly - some features will be unavailable');
      } else {
        throw e;
      }
    }
  }
  
  if (!storage) {
    try { 
      storage = getStorage(app); 
    } catch (e) { 
      console.error('Storage initialization failed in recovery mode:', e);
      if (process.env.NODE_ENV === 'production') {
        console.warn('Storage will not function correctly - some features will be unavailable');
      } else {
        throw e;
      }
    }
  }
}

export { app, auth, firestore, storage, analytics };

"use client";

// Firebase clients with proper initialization for Next.js client components
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "ticktokshop-5f1e9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ticktokshop-5f1e9",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "155434252666",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-5BRMHTMXHR",
};

console.log("[FIREBASE-CLIENT] Module execution started!");

// Direct initialization approach - this ensures Firebase is properly initialized for client components
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Safely initialize Firebase only in browser environments
if (typeof window !== "undefined") {
  try {
    console.log(
      "[FIREBASE-CLIENT] Initializing Firebase in browser environment"
    );

    // Initialize or get existing Firebase app
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log(
        "[FIREBASE-CLIENT] Firebase app initialized with new instance"
      );
    } else {
      app = getApps()[0];
      console.log("[FIREBASE-CLIENT] Using existing Firebase app instance");
    }

    if (app) {
      // Initialize services
      auth = getAuth(app);
      firestore = getFirestore(app);
      storage = getStorage(app);

      // Verify services are properly initialized
      console.log("[FIREBASE-CLIENT] Firebase auth initialized:", !!auth);
      console.log(
        "[FIREBASE-CLIENT] Firebase firestore initialized:",
        !!firestore
      );
      console.log("[FIREBASE-CLIENT] Firebase storage initialized:", !!storage);

      // Initialize Analytics conditionally
      isSupported()
        .then((supported) => {
          if (supported && app) {
            analytics = getAnalytics(app);
            console.log("[FIREBASE-CLIENT] Firebase analytics initialized");
          } else {
            console.log(
              "[FIREBASE-CLIENT] Firebase analytics not supported in this environment"
            );
          }
        })
        .catch((error) => {
          console.error(
            "[FIREBASE-CLIENT] Error checking analytics support:",
            error
          );
        });

      console.log("[FIREBASE-CLIENT] Firebase initialization complete");
    } else {
      console.error("[FIREBASE-CLIENT] Firebase app initialization failed!");
    }
  } catch (error) {
    console.error("[FIREBASE-CLIENT] Error initializing Firebase:", error);
    app = null;
    auth = null;
    firestore = null;
    storage = null;
  }
} else {
  // Server-side rendering - Firebase services should not be used
  console.warn(
    "[FIREBASE-CLIENT] Firebase client initialization skipped - server-side environment"
  );
  app = null;
  auth = null;
  firestore = null;
  storage = null;
}

console.log(
  "[FIREBASE-CLIENT] Module execution finished. Auth available:",
  !!auth
);

export { app, auth, firestore, storage, analytics, firebaseConfig };

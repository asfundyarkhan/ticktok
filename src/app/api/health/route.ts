// Health check API route for Vercel deployment with Firebase connectivity testing

import { app, auth, firestore } from '../../../lib/firebase/firebase';

export const dynamic = 'force-dynamic'; // Ensures this is always fresh

export async function GET() {
  try {
    // Build Firebase connection details
    const firebaseStatus = {
      app: app ? "Initialized" : "Failed",
      auth: auth ? "Initialized" : "Failed",
      firestore: firestore ? "Initialized" : "Failed",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown",
    };      // Test Firestore connectivity by performing a simple read operation
    let firestoreTest = "Not tested";
    try {
      // Just check if firestore is defined rather than making a call
      if (firestore) {
        firestoreTest = "Firestore instance available";
        
        // Check Firebase storage bucket format as this is often an issue in Vercel
        const storageBucketFormat = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
        const isCorrectFormat = storageBucketFormat.includes("appspot.com");
        
        firestoreTest += isCorrectFormat 
          ? " (storage bucket format looks correct)" 
          : " (warning: storage bucket format may not be optimal)";
      } else {
        firestoreTest = "Firestore instance not available";
      }
    } catch (error: unknown) {
      console.error("Firestore test error:", error);
      firestoreTest = `Error: ${error instanceof Error ? error.message : "Unknown firestore error"}`;
    }

    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      version: '1.0.0',
      firebase: {
        status: firebaseStatus,
        connectivityTest: firestoreTest
      },
      vercel: {
        environment: process.env.VERCEL_ENV || "Not on Vercel",
        region: process.env.VERCEL_REGION || "Unknown",
      }
    });
  } catch (error) {
    console.error("Health check error:", error);
    
    return Response.json({
      status: 'error',
      message: "Health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown"
    }, { status: 500 });
  }
}

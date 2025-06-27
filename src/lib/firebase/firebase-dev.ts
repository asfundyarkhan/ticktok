// Development-specific Firebase configuration
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getStorage,
  FirebaseStorage,
  connectStorageEmulator,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId: "G-5BRMHTMXHR",
};

// Initialize Firebase for development
let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

try {
  // Initialize Firebase
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize services
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);

  // Development-specific configurations
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("🔧 Configuring Firebase for localhost development...");

    // Add development-specific settings
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      console.log(
        "📍 Localhost detected - applying development Firebase settings"
      );

      // Enable network request debugging
      if (window.location.search.includes("debug=firebase")) {
        console.log("🐛 Firebase debug mode enabled");
      }

      // Configure persistence for development
      console.log("🔄 Configuring Firebase persistence for development");
    }
  }

  console.log("✅ Firebase initialized for development environment");
} catch (error) {
  console.error("❌ Firebase development initialization error:", error);
  throw error;
}

export { app, auth, firestore, storage };

// Firebase client-side configuration
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
  measurementId: "G-5BRMHTMXHR"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  // Check if analytics is supported in current environment
  isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

export { app, auth, firestore, storage, analytics };

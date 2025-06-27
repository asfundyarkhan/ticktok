// Localhost Firefox browser authentication test
// Open this in a browser to test Firebase Auth and Firestore directly

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwqU1SU4jNWYKjhqkN1tEyyp64HXzmyG8",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.firebasestorage.app",
  messagingSenderId: "155434252666",
  appId: "1:155434252666:web:fa5051f4cb33f3a784bec3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Log all console messages to the page
const output = document.getElementById("output");
function log(message) {
  console.log(message);
  if (output) {
    output.innerHTML += message + "<br>";
  }
}

// Test functions
async function testFirebaseConnection() {
  log("🔥 Testing Firebase from browser...");

  // Test 1: Auth State
  log("1. Testing Auth State...");
  onAuthStateChanged(auth, (user) => {
    if (user) {
      log(`✅ User logged in: ${user.uid}`);
    } else {
      log("ℹ️ No user logged in");
    }
  });

  // Test 2: Anonymous Auth
  log("2. Testing Anonymous Authentication...");
  try {
    const result = await signInAnonymously(auth);
    log(`✅ Anonymous sign-in successful: ${result.user.uid}`);
  } catch (error) {
    log(`❌ Anonymous auth failed: ${error.code} - ${error.message}`);
    if (error.code === "auth/operation-not-allowed") {
      log("💡 Solution: Enable Anonymous Authentication in Firebase Console");
      log(
        "   Go to: https://console.firebase.google.com/project/ticktokshop-5f1e9/authentication/providers"
      );
    }
  }

  // Test 3: Firestore Public Access
  log("3. Testing Firestore public collections...");
  try {
    const adminStockRef = collection(firestore, "adminStock");
    const snapshot = await getDocs(adminStockRef);
    log(`✅ adminStock accessible: ${snapshot.size} documents`);
  } catch (error) {
    log(`❌ adminStock failed: ${error.code} - ${error.message}`);
  }

  try {
    const listingsRef = collection(firestore, "listings");
    const snapshot = await getDocs(listingsRef);
    log(`✅ listings accessible: ${snapshot.size} documents`);
  } catch (error) {
    log(`❌ listings failed: ${error.code} - ${error.message}`);
  }

  // Test 4: Browser Environment
  log("4. Browser Environment Check...");
  log(`   User Agent: ${navigator.userAgent}`);
  log(`   Location: ${window.location.href}`);
  log(`   Protocol: ${window.location.protocol}`);
  log(`   Origin: ${window.location.origin}`);

  // Test 5: Network Connectivity
  log("5. Testing Network Connectivity...");
  try {
    const response = await fetch("https://firestore.googleapis.com");
    log(`✅ Firestore API reachable: ${response.status}`);
  } catch (error) {
    log(`❌ Network error: ${error.message}`);
  }
}

// Run tests when page loads
document.addEventListener("DOMContentLoaded", testFirebaseConnection);

// Make functions globally available for manual testing
window.testFirebaseConnection = testFirebaseConnection;
window.firebaseAuth = auth;
window.firebaseFirestore = firestore;

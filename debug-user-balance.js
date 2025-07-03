// Debug script to check user balance
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc } = require("firebase/firestore");

// Initialize Firebase (using your existing config)
const firebaseConfig = {
  // Your Firebase config would go here
  // For now, this is just a template
};

// This is a debug script to manually check if user balance is stored correctly
console.log("Balance Debug Script");
console.log("===================");

// Function to check user balance
async function checkUserBalance(userId) {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`User ID: ${userId}`);
      console.log(`Balance: $${userData.balance || 0}`);
      console.log(`Email: ${userData.email}`);
      console.log(`Display Name: ${userData.displayName || "N/A"}`);
      console.log(`Role: ${userData.role || "N/A"}`);
    } else {
      console.log(`User document not found for ID: ${userId}`);
    }
  } catch (error) {
    console.error("Error checking user balance:", error);
  }
}

// Export the function for use in browser console or other scripts
if (typeof window !== "undefined") {
  window.checkUserBalance = checkUserBalance;
}

module.exports = { checkUserBalance };

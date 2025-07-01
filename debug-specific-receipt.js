// Debug specific receipt to see what went wrong
// Add your Firebase imports and config here
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// You'll need to add your Firebase config here
const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugSpecificReceipt() {
  try {
    const receiptId = "f5r6JIZrP791RyHixKcN";
    const receiptRef = doc(db, "receipts_v2", receiptId);
    const receiptDoc = await getDoc(receiptRef);

    if (receiptDoc.exists()) {
      const data = receiptDoc.data();
      console.log("Receipt data:", data);

      // Check for undefined values
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) {
          console.log(`❌ Found undefined value for field: ${key}`);
        }
      }
    } else {
      console.log("Receipt not found");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

debugSpecificReceipt();

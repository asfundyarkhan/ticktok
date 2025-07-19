// Debug script to check product data structure
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDjGEPEfgJrTzj5LdOz_M5GKwuJ3C8YQYU",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.appspot.com",
  messagingSenderId: "326872896726",
  appId: "1:326872896726:web:95b4bd9e3bd0ad14c2e8c1",
  measurementId: "G-TE9MR5E2TZ",
};

async function checkProductData() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("Checking stock collection...");
    const stockQuery = query(collection(db, "stock"), limit(5));
    const stockSnapshot = await getDocs(stockQuery);

    console.log(`Found ${stockSnapshot.size} stock items:`);
    stockSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nStock ID: ${doc.id}`);
      console.log(`Product Name: ${data.name}`);
      console.log(`Seller ID: ${data.sellerId || "NOT SET"}`);
      console.log(`Seller Name: ${data.sellerName || "NOT SET"}`);
      console.log(`Has sellerId: ${!!data.sellerId}`);
      console.log(`Has sellerName: ${!!data.sellerName}`);
      console.log("All fields:", Object.keys(data));
    });

    console.log("\n\nChecking listings collection...");
    const listingsQuery = query(collection(db, "listings"), limit(5));
    const listingsSnapshot = await getDocs(listingsQuery);

    console.log(`Found ${listingsSnapshot.size} listings:`);
    listingsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`\nListing ID: ${doc.id}`);
      console.log(`Product Name: ${data.name}`);
      console.log(`Seller ID: ${data.sellerId || "NOT SET"}`);
      console.log(`Seller Name: ${data.sellerName || "NOT SET"}`);
      console.log(`User ID: ${data.userId || "NOT SET"}`);
      console.log(`Has sellerId: ${!!data.sellerId}`);
      console.log(`Has sellerName: ${!!data.sellerName}`);
      console.log("All fields:", Object.keys(data));
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkProductData();

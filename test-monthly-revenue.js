// Test script to debug monthly revenue for superadmin
const { firestore } = require("./src/lib/firebase");
const {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} = require("firebase/firestore");

async function testMonthlyRevenue() {
  try {
    console.log("🔍 Testing Monthly Revenue for Superadmin...\n");

    // Test 1: Check receipts_v2 collection
    console.log("📋 Checking receipts_v2 collection...");
    const receiptsQuery = query(
      collection(firestore, "receipts_v2"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const receiptsSnapshot = await getDocs(receiptsQuery);
    console.log(`Found ${receiptsSnapshot.size} approved receipts`);

    let recentReceipts = 0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    receiptsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt.toDate() > oneMonthAgo) {
        recentReceipts++;
        console.log(
          `📄 Recent receipt: ${data.amount} on ${data.createdAt
            .toDate()
            .toDateString()}`
        );
      }
    });

    console.log(`Recent receipts (last month): ${recentReceipts}\n`);

    // Test 2: Check withdrawal_requests collection
    console.log("💸 Checking withdrawal_requests collection...");
    const withdrawalsQuery = query(
      collection(firestore, "withdrawal_requests"),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc")
    );

    const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
    console.log(
      `Found ${withdrawalsSnapshot.size} approved withdrawal requests`
    );

    let recentWithdrawals = 0;
    withdrawalsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt && data.createdAt.toDate() > oneMonthAgo) {
        recentWithdrawals++;
        console.log(
          `💰 Recent withdrawal: ${data.amount} on ${data.createdAt
            .toDate()
            .toDateString()}`
        );
      }
    });

    console.log(`Recent withdrawals (last month): ${recentWithdrawals}\n`);

    // Test 3: Simulate month key generation
    console.log("📅 Testing month key generation...");
    const currentDate = new Date();
    const monthKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;
    console.log(`Current month key: ${monthKey}`);

    const MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = MONTHS[currentDate.getMonth()];
    console.log(`Current month name: ${monthName}`);

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing monthly revenue:", error);
  }
}

// Run the test
testMonthlyRevenue();

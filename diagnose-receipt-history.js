// Diagnostic script to check what happens to approved USDT receipts
const admin = require("firebase-admin");
const fs = require("fs");

// Check for service account file
if (!fs.existsSync("./serviceAccountKey.json")) {
  console.error("❌ ERROR: serviceAccountKey.json file not found!");
  process.exit(1);
}

const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function diagnoseReceiptHistory() {
  console.log("🔍 DIAGNOSING RECEIPT HISTORY ISSUE");
  console.log("=====================================");

  try {
    // Get all receipts to analyze
    const receiptsSnapshot = await db
      .collection("receipts_v2")
      .orderBy("submittedAt", "desc")
      .get();

    if (receiptsSnapshot.empty) {
      console.log("❌ No receipts found in collection.");
      return;
    }

    console.log(`Found ${receiptsSnapshot.size} total receipts`);

    // Categorize receipts
    const receiptStats = {
      total: receiptsSnapshot.size,
      pending: 0,
      approved: 0,
      rejected: 0,
      autoProcessed: 0,
      walletPayments: 0,
      usdtPayments: 0,
      depositPayments: 0,
      approvedDeposits: 0,
      approvedUSDT: 0,
      recentlyApproved: 0,
    };

    const recentlyApprovedReceipts = [];
    const approvedUSDTReceipts = [];
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log("\n📊 Analyzing receipts...");

    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      const receipt = {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        processedAt: data.processedAt?.toDate?.() || undefined,
      };

      // Status counts
      if (receipt.status === "pending") receiptStats.pending++;
      else if (receipt.status === "approved") receiptStats.approved++;
      else if (receipt.status === "rejected") receiptStats.rejected++;

      // Payment type counts
      if (receipt.isAutoProcessed) receiptStats.autoProcessed++;
      if (receipt.isWalletPayment === true) receiptStats.walletPayments++;
      if (receipt.isWalletPayment === false) receiptStats.usdtPayments++;
      if (receipt.isDepositPayment) receiptStats.depositPayments++;

      // Special cases
      if (receipt.status === "approved" && receipt.isDepositPayment) {
        receiptStats.approvedDeposits++;
      }

      if (receipt.status === "approved" && receipt.isWalletPayment === false) {
        receiptStats.approvedUSDT++;
        approvedUSDTReceipts.push(receipt);
      }

      // Recently approved receipts (last 24 hours)
      if (
        receipt.status === "approved" &&
        receipt.processedAt &&
        receipt.processedAt > oneDayAgo
      ) {
        receiptStats.recentlyApproved++;
        recentlyApprovedReceipts.push(receipt);
      }
    }

    // Print statistics
    console.log(`\n📈 Receipt Statistics:`);
    console.log(`- Total receipts: ${receiptStats.total}`);
    console.log(`- Pending: ${receiptStats.pending}`);
    console.log(`- Approved: ${receiptStats.approved}`);
    console.log(`- Rejected: ${receiptStats.rejected}`);
    console.log(`- Auto-processed: ${receiptStats.autoProcessed}`);
    console.log(`- Wallet payments: ${receiptStats.walletPayments}`);
    console.log(`- USDT payments: ${receiptStats.usdtPayments}`);
    console.log(`- Deposit payments: ${receiptStats.depositPayments}`);
    console.log(`- Approved deposits: ${receiptStats.approvedDeposits}`);
    console.log(`- Approved USDT payments: ${receiptStats.approvedUSDT}`);
    console.log(`- Recently approved (24h): ${receiptStats.recentlyApproved}`);

    // Show recently approved receipts
    if (recentlyApprovedReceipts.length > 0) {
      console.log(`\n📋 Recently Approved Receipts (last 24 hours):`);
      recentlyApprovedReceipts.forEach((receipt, index) => {
        console.log(`${index + 1}. ID: ${receipt.id}`);
        console.log(`   Amount: $${receipt.amount}`);
        console.log(`   User: ${receipt.userName} (${receipt.userEmail})`);
        console.log(
          `   Type: ${receipt.isWalletPayment ? "Wallet" : "USDT"} ${
            receipt.isDepositPayment ? "Deposit" : "Payment"
          }`
        );
        console.log(`   Processed: ${receipt.processedAt?.toISOString()}`);
        console.log(`   Processed by: ${receipt.processedByName || "Unknown"}`);
        console.log("   ---");
      });
    }

    // Show approved USDT receipts
    if (approvedUSDTReceipts.length > 0) {
      console.log(
        `\n💰 All Approved USDT Payments (${approvedUSDTReceipts.length}):`
      );
      approvedUSDTReceipts.slice(0, 10).forEach((receipt, index) => {
        console.log(`${index + 1}. ID: ${receipt.id}`);
        console.log(`   Amount: $${receipt.amount}`);
        console.log(`   User: ${receipt.userName}`);
        console.log(`   Submitted: ${receipt.submittedAt?.toISOString()}`);
        console.log(`   Processed: ${receipt.processedAt?.toISOString()}`);
        console.log(`   Notes: ${receipt.notes || "None"}`);
        console.log("   ---");
      });

      if (approvedUSDTReceipts.length > 10) {
        console.log(`   ... and ${approvedUSDTReceipts.length - 10} more`);
      }
    }

    // Check for potential issues
    console.log(`\n⚠️  Potential Issues:`);

    if (receiptStats.approvedUSDT === 0) {
      console.log(
        `- No approved USDT payments found - this might be the issue!`
      );
    }

    if (receiptStats.approved > 0 && receiptStats.recentlyApproved === 0) {
      console.log(`- No recently approved receipts found in the last 24 hours`);
    }

    const disappearingReceipts =
      receiptStats.approved - receiptStats.autoProcessed;
    if (disappearingReceipts < receiptStats.pending * 0.1) {
      // Less than 10% of pending are approved manually
      console.log(
        `- Very few manually approved receipts compared to pending (${disappearingReceipts} approved vs ${receiptStats.pending} pending)`
      );
    }

    console.log(`\n✅ Diagnosis complete!`);
    console.log(
      `\nIf approved USDT receipts are not showing in the admin interface,`
    );
    console.log(
      `the issue is likely in the frontend filtering or display logic,`
    );
    console.log(`not in the database itself.`);
  } catch (error) {
    console.error("❌ Error during diagnosis:", error);
  }
}

// Run the diagnosis
diagnoseReceiptHistory().then(() => {
  console.log("\n🏁 Receipt history diagnosis completed.");
});

// Test and debug wallet payment bulk deposit processing
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugWalletBulkPayments() {
  console.log('🔍 Debugging wallet payment bulk deposits...');
  
  try {
    // Check for wallet payment receipts that are bulk payments
    const walletReceiptsSnapshot = await db.collection('receipts_v2')
      .where('isWalletPayment', '==', true)
      .limit(10)
      .get();
    
    console.log(`\n💳 Found ${walletReceiptsSnapshot.size} wallet payment receipts:`);
    
    let bulkWalletCount = 0;
    
    walletReceiptsSnapshot.forEach(doc => {
      const receipt = doc.data();
      
      console.log(`\n🧾 Wallet Receipt: ${doc.id}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Amount: $${receipt.amount}`);
      console.log(`   isWalletPayment: ${receipt.isWalletPayment}`);
      console.log(`   isBulkPayment: ${receipt.isBulkPayment || false}`);
      console.log(`   isAutoProcessed: ${receipt.isAutoProcessed || false}`);
      console.log(`   pendingDepositId: ${receipt.pendingDepositId || 'None'}`);
      console.log(`   pendingDepositIds: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.join(', ') : 'None'}`);
      console.log(`   Submitted: ${receipt.submittedAt?.toDate()}`);
      console.log(`   Processed: ${receipt.processedAt?.toDate() || 'Not processed'}`);
      
      if (receipt.isBulkPayment) {
        bulkWalletCount++;
        console.log(`   🚨 BULK WALLET PAYMENT DETECTED!`);
        
        if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 1) {
          console.log(`   ❌ ISSUE: Bulk wallet payment with ${receipt.pendingDepositIds.length} deposits`);
          console.log(`   🔧 NEEDS FIX: Wallet logic should process ALL deposits, not just first one`);
        }
      }
    });
    
    if (bulkWalletCount > 0) {
      console.log(`\n🚨 CRITICAL ISSUE FOUND:`);
      console.log(`   Found ${bulkWalletCount} bulk wallet payments`);
      console.log(`   Current wallet payment logic only processes single deposits`);
      console.log(`   Sellers lose money when paying bulk deposits via wallet`);
    } else {
      console.log(`\n✅ No bulk wallet payments found in recent receipts`);
      console.log(`   Either no bulk wallet payments have been made, or they're not being created properly`);
    }
    
    // Check for wallet payment deposits that might be stuck
    console.log(`\n🔍 Checking for wallet payment deposits that might be stuck...`);
    
    const stuckDepositsSnapshot = await db.collection('pending_deposits')
      .where('status', 'in', ['receipt_submitted', 'pending'])
      .limit(20)
      .get();
    
    let walletDepositIssues = 0;
    
    for (const doc of stuckDepositsSnapshot.docs) {
      const deposit = doc.data();
      
      // Check if this deposit has a receipt
      if (deposit.receiptId) {
        try {
          const receiptDoc = await db.collection('receipts_v2').doc(deposit.receiptId).get();
          
          if (receiptDoc.exists) {
            const receipt = receiptDoc.data();
            
            if (receipt.isWalletPayment && receipt.status === 'approved') {
              walletDepositIssues++;
              console.log(`\n⚠️  WALLET DEPOSIT ISSUE:`);
              console.log(`   Deposit: ${doc.id}`);
              console.log(`   Status: ${deposit.status} (should be deposit_paid)`);
              console.log(`   Product: ${deposit.productName}`);
              console.log(`   Receipt: ${deposit.receiptId} (wallet payment, approved)`);
              console.log(`   Amount: $${deposit.totalDepositRequired}`);
              
              if (receipt.isBulkPayment) {
                console.log(`   🚨 BULK WALLET ISSUE: This deposit is part of a bulk wallet payment`);
                console.log(`   📋 Bulk deposits: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.length : 0}`);
              }
            }
          }
        } catch (error) {
          // Ignore receipt lookup errors
        }
      }
    }
    
    if (walletDepositIssues > 0) {
      console.log(`\n🚨 FOUND ${walletDepositIssues} WALLET DEPOSIT ISSUES:`);
      console.log(`   These deposits were paid via wallet but not marked as paid`);
      console.log(`   Sellers paid money but didn't get their deposits processed`);
    }
    
    console.log(`\n📊 WALLET BULK PAYMENT ANALYSIS:`);
    console.log(`   • Total wallet receipts checked: ${walletReceiptsSnapshot.size}`);
    console.log(`   • Bulk wallet payments found: ${bulkWalletCount}`);
    console.log(`   • Stuck wallet deposits found: ${walletDepositIssues}`);
    
  } catch (error) {
    console.error('❌ Error during wallet debug:', error);
  }
}

// Execute the debug
debugWalletBulkPayments()
  .then(() => {
    console.log('\n✅ Wallet payment debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

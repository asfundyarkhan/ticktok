// Check if bulk receipts have isDepositPayment flag set correctly
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkBulkReceiptFlags() {
  console.log('🔍 Checking bulk receipt flags for UI visibility...');
  
  try {
    // Get the bulk receipts we know about
    const bulkReceiptIds = [
      'wjak67OuvEGpRiJSK9ac', // Wallet bulk with testing product + Three Generations
      'YNKOpLVqvi6qV5n14eA7', // Wallet bulk with Electroplating + Three Generations + testing product
      'UaZUMLMRxKGubjVrf0iB'  // USDT bulk that was approved
    ];
    
    console.log(`\n📋 Checking ${bulkReceiptIds.length} bulk receipts:`);
    
    for (const receiptId of bulkReceiptIds) {
      console.log(`\n🔍 Receipt: ${receiptId}`);
      
      const receiptDoc = await db.collection('receipts_v2').doc(receiptId).get();
      
      if (!receiptDoc.exists) {
        console.log(`   ❌ Receipt not found`);
        continue;
      }
      
      const receipt = receiptDoc.data();
      
      console.log(`   📊 Status: ${receipt.status}`);
      console.log(`   💳 Type: ${receipt.isWalletPayment ? 'Wallet' : 'USDT'}`);
      console.log(`   🔄 isBulkPayment: ${receipt.isBulkPayment}`);
      console.log(`   🏦 isDepositPayment: ${receipt.isDepositPayment}`);
      console.log(`   📦 Deposits: ${receipt.pendingDepositIds?.length || 0}`);
      
      // This is the key check - UI filters by isDepositPayment
      if (!receipt.isDepositPayment) {
        console.log(`   ❌ ISSUE: Receipt missing isDepositPayment flag!`);
        console.log(`   🚨 This receipt won't show in UI depositReceipts array`);
        console.log(`   🚨 getDepositReceiptStatus will return null for all deposits`);
      } else {
        console.log(`   ✅ Receipt has isDepositPayment flag`);
      }
      
      if (receipt.pendingDepositIds) {
        console.log(`   📦 Deposit IDs:`);
        receipt.pendingDepositIds.forEach((depositId, index) => {
          console.log(`      ${index + 1}. ${depositId}`);
        });
      }
      
      console.log(`   ${'='.repeat(60)}`);
    }
    
    // Check if any bulk receipts are missing the isDepositPayment flag
    console.log(`\n🔍 SEARCHING FOR BULK RECEIPTS WITHOUT isDepositPayment FLAG:`);
    
    const bulkReceiptsWithoutFlag = await db.collection('receipts_v2')
      .where('isBulkPayment', '==', true)
      .get();
    
    console.log(`📋 Found ${bulkReceiptsWithoutFlag.size} bulk receipts total`);
    
    let missingFlagCount = 0;
    
    bulkReceiptsWithoutFlag.forEach(doc => {
      const receipt = doc.data();
      
      if (!receipt.isDepositPayment) {
        missingFlagCount++;
        console.log(`   ❌ ${doc.id}: Missing isDepositPayment flag`);
      }
    });
    
    if (missingFlagCount > 0) {
      console.log(`\n🚨 FOUND ROOT CAUSE:`);
      console.log(`   ${missingFlagCount} bulk receipts are missing isDepositPayment flag`);
      console.log(`   This means they won't appear in the UI's depositReceipts array`);
      console.log(`   So getDepositReceiptStatus() returns null for their deposits`);
      console.log(`   Result: Checkboxes stay visible, "Pay Now" buttons stay visible`);
      console.log(`\n🔧 SOLUTION: Add isDepositPayment: true to these bulk receipts`);
    } else {
      console.log(`\n✅ All bulk receipts have proper isDepositPayment flags`);
      console.log(`   The UI issue might be due to browser caching or real-time sync delay`);
    }
    
  } catch (error) {
    console.error('❌ Error during flag check:', error);
  }
}

// Execute the check
checkBulkReceiptFlags()
  .then(() => {
    console.log('\n✅ Flag check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

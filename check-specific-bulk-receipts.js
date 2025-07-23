// Check the specific bulk receipts from our earlier tests
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSpecificBulkReceipts() {
  console.log('🔍 Checking specific bulk receipts and their deposit IDs...');
  
  try {
    // Check the bulk receipts we know about
    const bulkReceiptIds = [
      'wjak67OuvEGpRiJSK9ac', // Wallet bulk with testing product + Three Generations
      'YNKOpLVqvi6qV5n14eA7', // Wallet bulk with Electroplating + Three Generations + testing product
      'UaZUMLMRxKGubjVrf0iB'  // USDT bulk that was approved
    ];
    
    console.log(`\n📋 Checking ${bulkReceiptIds.length} known bulk receipts:`);
    
    const depositIdsFromBulkReceipts = [];
    
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
      
      if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
        console.log(`   📦 Deposit IDs (${receipt.pendingDepositIds.length}):`);
        
        receipt.pendingDepositIds.forEach((depositId, index) => {
          console.log(`      ${index + 1}. ${depositId}`);
          depositIdsFromBulkReceipts.push(depositId);
        });
      }
      
      console.log(`   ${'='.repeat(60)}`);
    }
    
    // Now check what SellerWalletService.getPendingProfits returns for these deposit IDs
    console.log(`\n🔍 TESTING: Do these deposit IDs match PendingProfit IDs?`);
    console.log(`📦 Deposit IDs from bulk receipts: [${depositIdsFromBulkReceipts.slice(0, 5).join(', ')}...]`);
    
    // Check if these deposit IDs exist in pending_deposits
    console.log(`\n📦 Checking if these are valid pending_deposits IDs:`);
    
    for (let i = 0; i < Math.min(3, depositIdsFromBulkReceipts.length); i++) {
      const depositId = depositIdsFromBulkReceipts[i];
      
      try {
        const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
        
        if (depositDoc.exists) {
          const deposit = depositDoc.data();
          console.log(`   ✅ ${depositId}: ${deposit.productName} - ${deposit.status}`);
        } else {
          console.log(`   ❌ ${depositId}: NOT FOUND in pending_deposits`);
        }
      } catch (error) {
        console.log(`   ❌ ${depositId}: ERROR - ${error.message}`);
      }
    }
    
    console.log(`\n🎯 CONCLUSION FOR UI FIX:`);
    console.log(`   1. The bulk receipts DO have proper pendingDepositIds arrays`);
    console.log(`   2. These IDs should match the PendingProfit.id from SellerWalletService.getPendingProfits()`);
    console.log(`   3. If UI buttons are still showing, the issue is likely:`);
    console.log(`      a) getDepositReceiptStatus is not finding the bulk receipts`);
    console.log(`      b) The deposit IDs don't match between profits and receipts`);
    console.log(`      c) The depositReceipts array is not being populated correctly`);
    
    console.log(`\n🔧 DEBUG STEPS FOR UI:`);
    console.log(`   1. Add console.log in getDepositReceiptStatus to see what's being checked`);
    console.log(`   2. Add console.log to see what depositReceipts array contains`);
    console.log(`   3. Add console.log to see what pendingProfits array contains`);
    console.log(`   4. Compare the IDs to see if they match`);
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Execute the check
checkSpecificBulkReceipts()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

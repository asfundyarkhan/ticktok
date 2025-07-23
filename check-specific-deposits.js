// Check specific deposits from bulk payments
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSpecificDeposits() {
  console.log('🔍 Checking specific deposits from bulk payments...');
  
  try {
    // Check some specific deposit IDs from the bulk payments
    const depositIds = [
      'myp4E98DJXi1BtA8un6W', // From approved bulk payment
      'WBk9U1bigYxr4TAuLHNQ', // From approved bulk payment  
      'I2B3mOr5QBi1cSfjYNIj', // From pending bulk payment
      '98FMIp5MtA1xLkw1TmYh'  // From pending bulk payment
    ];
    
    for (const depositId of depositIds) {
      console.log(`\n📦 Checking deposit: ${depositId}`);
      
      try {
        const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
        
        if (depositDoc.exists) {
          const deposit = depositDoc.data();
          console.log(`   ✅ Found deposit:`);
          console.log(`      Status: ${deposit.status}`);
          console.log(`      Product: ${deposit.productName}`);
          console.log(`      Amount: $${deposit.totalDepositRequired}`);
          console.log(`      Seller: ${deposit.sellerId}`);
          console.log(`      Receipt ID: ${deposit.receiptId || 'None'}`);
          console.log(`      Created: ${deposit.createdAt?.toDate()}`);
          console.log(`      Updated: ${deposit.updatedAt?.toDate() || 'Never'}`);
        } else {
          console.log(`   ❌ Deposit not found`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking deposit:`, error.message);
      }
    }
    
    // Check the specific bulk payment that's still pending
    console.log(`\n📋 Checking specific bulk payment: GjmIrzSCFllnHGOfNUaD`);
    
    const bulkPaymentDoc = await db.collection('bulk_deposit_payments').doc('GjmIrzSCFllnHGOfNUaD').get();
    
    if (bulkPaymentDoc.exists) {
      const bulkPayment = bulkPaymentDoc.data();
      console.log(`   Status: ${bulkPayment.status}`);
      console.log(`   Receipt ID: ${bulkPayment.receiptId}`);
      console.log(`   Deposit IDs: ${bulkPayment.pendingDepositIds.join(', ')}`);
      
      // Check the receipt for this bulk payment
      if (bulkPayment.receiptId) {
        console.log(`\n🧾 Checking receipt: ${bulkPayment.receiptId}`);
        
        const receiptDoc = await db.collection('receipts_v2').doc(bulkPayment.receiptId).get();
        
        if (receiptDoc.exists) {
          const receipt = receiptDoc.data();
          console.log(`     Receipt Status: ${receipt.status}`);
          console.log(`     isBulkPayment: ${receipt.isBulkPayment}`);
          console.log(`     pendingDepositIds: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.join(', ') : 'None'}`);
          console.log(`     Amount: $${receipt.amount}`);
          console.log(`     Submitted: ${receipt.submittedAt?.toDate()}`);
          console.log(`     Processed: ${receipt.processedAt?.toDate() || 'Not processed'}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Execute the check
checkSpecificDeposits()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

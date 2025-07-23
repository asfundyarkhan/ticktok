// Test a new bulk payment to see if the fix is working
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testLatestBulkPayment() {
  console.log('🔍 Testing if latest bulk payments have the fix...');
  
  try {
    // Get the most recent receipts 
    const recentReceiptsSnapshot = await db.collection('receipts_v2')
      .limit(20)
      .get();
    
    console.log(`\n📋 Checking ${recentReceiptsSnapshot.size} recent receipts:`);
    
    let bulkPaymentCount = 0;
    
    recentReceiptsSnapshot.forEach(doc => {
      const receipt = doc.data();
      
      // Check if this is a bulk payment receipt
      if (receipt.isBulkPayment) {
        bulkPaymentCount++;
        console.log(`\n🧾 Bulk Payment Receipt: ${doc.id}`);
        console.log(`   Status: ${receipt.status}`);
        console.log(`   Amount: $${receipt.amount}`);
        console.log(`   isBulkPayment: ${receipt.isBulkPayment}`);
        console.log(`   pendingDepositIds: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.join(', ') : 'MISSING!'}`);
        console.log(`   bulkOrderCount: ${receipt.bulkOrderCount || 'MISSING!'}`);
        console.log(`   Submitted: ${receipt.submittedAt?.toDate()}`);
        console.log(`   Processed: ${receipt.processedAt?.toDate() || 'Not processed'}`);
        
        // This indicates if the fix is working
        if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
          console.log(`   ✅ FIX WORKING: Receipt has pendingDepositIds array`);
        } else {
          console.log(`   ❌ FIX NOT WORKING: Receipt missing pendingDepositIds`);
        }
      }
    });
    
    if (bulkPaymentCount === 0) {
      console.log(`\n⚠️  No bulk payment receipts found in recent receipts`);
      console.log(`   This could mean:`);
      console.log(`   1. No recent bulk payments have been made`);
      console.log(`   2. All bulk payments are working correctly`);
      console.log(`   3. The fix is preventing new bulk payments`);
    }
    
    // Check current pending bulk payments
    console.log(`\n📋 Checking current bulk_deposit_payments status...`);
    
    const bulkPaymentsSnapshot = await db.collection('bulk_deposit_payments')
      .where('status', '==', 'receipt_submitted')
      .limit(5)
      .get();
    
    console.log(`\n💳 Found ${bulkPaymentsSnapshot.size} bulk payments awaiting approval:`);
    
    bulkPaymentsSnapshot.forEach(doc => {
      const bulkPayment = doc.data();
      console.log(`\n💳 Bulk Payment: ${doc.id}`);
      console.log(`   Status: ${bulkPayment.status}`);
      console.log(`   Total: $${bulkPayment.totalDepositAmount}`);
      console.log(`   Orders: ${bulkPayment.totalOrdersCount}`);
      console.log(`   Seller: ${bulkPayment.sellerName}`);
      console.log(`   Receipt ID: ${bulkPayment.receiptId}`);
      console.log(`   Deposit IDs Count: ${bulkPayment.pendingDepositIds ? bulkPayment.pendingDepositIds.length : 0}`);
    });
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Execute the test
testLatestBulkPayment()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

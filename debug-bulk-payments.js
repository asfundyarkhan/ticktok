// Debug script to check bulk payment status and deposit processing
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugBulkPayments() {
  console.log('🔍 Debugging bulk payment and deposit processing...');
  
  try {
    // Get recent bulk payment receipts
    const bulkReceiptsSnapshot = await db.collection('receipts_v2')
      .where('isBulkPayment', '==', true)
      .limit(5)
      .get();
    
    console.log(`\n📋 Found ${bulkReceiptsSnapshot.size} recent bulk payment receipts:`);
    
    for (const doc of bulkReceiptsSnapshot.docs) {
      const receipt = doc.data();
      console.log(`\n🧾 Receipt ID: ${doc.id}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   Amount: $${receipt.amount}`);
      console.log(`   Seller: ${receipt.sellerName}`);
      console.log(`   isBulkPayment: ${receipt.isBulkPayment}`);
      console.log(`   pendingDepositIds: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.join(', ') : 'None'}`);
      console.log(`   Submitted: ${receipt.submittedAt?.toDate()}`);
      console.log(`   Processed: ${receipt.processedAt?.toDate() || 'Not processed'}`);
      
      // Check the status of each deposit in this bulk payment
      if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
        console.log(`\n   📦 Checking ${receipt.pendingDepositIds.length} deposits:`);
        
        for (const depositId of receipt.pendingDepositIds) {
          try {
            const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
            if (depositDoc.exists()) {
              const deposit = depositDoc.data();
              console.log(`      💰 Deposit ${depositId}:`);
              console.log(`         Status: ${deposit.status}`);
              console.log(`         Product: ${deposit.productName}`);
              console.log(`         Amount: $${deposit.totalDepositRequired}`);
              console.log(`         Sold Qty: ${deposit.actualQuantitySold || deposit.quantityListed}`);
              console.log(`         Receipt ID: ${deposit.receiptId || 'None'}`);
            } else {
              console.log(`      ❌ Deposit ${depositId}: NOT FOUND`);
            }
          } catch (error) {
            console.log(`      ❌ Error checking deposit ${depositId}:`, error.message);
          }
        }
      }
      
      console.log(`   ${'='.repeat(60)}`);
    }
    
    // Check for any deposits that might be stuck
    console.log(`\n🔍 Checking for pending deposits that should be paid...`);
    
    const pendingDepositsSnapshot = await db.collection('pending_deposits')
      .where('status', '==', 'pending')
      .limit(10)
      .get();
    
    console.log(`\n📋 Found ${pendingDepositsSnapshot.size} pending deposits:`);
    
    pendingDepositsSnapshot.forEach(doc => {
      const deposit = doc.data();
      console.log(`\n💰 Deposit ID: ${doc.id}`);
      console.log(`   Status: ${deposit.status}`);
      console.log(`   Product: ${deposit.productName}`);
      console.log(`   Seller: ${deposit.sellerId}`);
      console.log(`   Amount: $${deposit.totalDepositRequired}`);
      console.log(`   Created: ${deposit.createdAt?.toDate()}`);
      console.log(`   Receipt ID: ${deposit.receiptId || 'None'}`);
    });
    
    // Check bulk payment collection
    console.log(`\n🔍 Checking bulk_deposit_payments collection...`);
    
    const bulkPaymentsSnapshot = await db.collection('bulk_deposit_payments')
      .limit(5)
      .get();
    
    console.log(`\n📋 Found ${bulkPaymentsSnapshot.size} recent bulk payments:`);
    
    bulkPaymentsSnapshot.forEach(doc => {
      const bulkPayment = doc.data();
      console.log(`\n💳 Bulk Payment ID: ${doc.id}`);
      console.log(`   Status: ${bulkPayment.status}`);
      console.log(`   Total Amount: $${bulkPayment.totalDepositAmount}`);
      console.log(`   Order Count: ${bulkPayment.totalOrdersCount}`);
      console.log(`   Seller: ${bulkPayment.sellerName}`);
      console.log(`   Deposit IDs: ${bulkPayment.pendingDepositIds ? bulkPayment.pendingDepositIds.join(', ') : 'None'}`);
      console.log(`   Receipt ID: ${bulkPayment.receiptId || 'None'}`);
      console.log(`   Created: ${bulkPayment.createdAt?.toDate()}`);
    });
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Execute the debug
debugBulkPayments()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

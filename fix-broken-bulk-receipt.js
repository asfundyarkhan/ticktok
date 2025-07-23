// Fix the broken bulk payment receipt that's missing bulk payment flags
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixBrokenBulkReceipt() {
  console.log('🔧 Fixing broken bulk payment receipt...');
  
  try {
    const receiptId = 'UaZUMLMRxKGubjVrf0iB';
    const bulkPaymentId = 'GjmIrzSCFllnHGOfNUaD';
    
    console.log(`\n📋 Fixing receipt: ${receiptId}`);
    
    // Get the bulk payment data
    const bulkPaymentDoc = await db.collection('bulk_deposit_payments').doc(bulkPaymentId).get();
    
    if (!bulkPaymentDoc.exists) {
      console.log('❌ Bulk payment not found');
      return;
    }
    
    const bulkPayment = bulkPaymentDoc.data();
    console.log(`💳 Bulk payment found:`);
    console.log(`   Deposit IDs: ${bulkPayment.pendingDepositIds.join(', ')}`);
    console.log(`   Order Count: ${bulkPayment.totalOrdersCount}`);
    
    // Update the receipt with the missing bulk payment flags
    const receiptRef = db.collection('receipts_v2').doc(receiptId);
    
    const updateData = {
      isBulkPayment: true,
      pendingDepositIds: bulkPayment.pendingDepositIds,
      bulkOrderCount: bulkPayment.totalOrdersCount,
      updatedAt: admin.firestore.Timestamp.now()
    };
    
    await receiptRef.update(updateData);
    
    console.log(`✅ Receipt updated with bulk payment flags:`);
    console.log(`   isBulkPayment: true`);
    console.log(`   pendingDepositIds: [${bulkPayment.pendingDepositIds.length} deposit IDs]`);
    console.log(`   bulkOrderCount: ${bulkPayment.totalOrdersCount}`);
    
    console.log(`\n🎯 Now the receipt is ready for proper bulk approval!`);
    console.log(`   When a superadmin approves receipt ${receiptId}:`);
    console.log(`   - It will detect isBulkPayment = true`);
    console.log(`   - It will process all ${bulkPayment.pendingDepositIds.length} deposits`);
    console.log(`   - All deposits will be marked as paid`);
    console.log(`   - All profits will be released`);
    
  } catch (error) {
    console.error('❌ Error fixing receipt:', error);
  }
}

// Execute the fix
fixBrokenBulkReceipt()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

// Test the UI logic for detecting bulk payment receipts
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Simulate the getDepositReceiptStatus function from the UI
function getDepositReceiptStatus(deposit, receipts) {
  return receipts.some(receipt => 
    receipt.pendingDepositId === deposit.id ||
    (receipt.pendingDepositIds && receipt.pendingDepositIds.includes(deposit.id))
  );
}

async function testUILogic() {
  console.log('🧪 Testing UI logic for bulk payment detection...');
  
  try {
    // Get the deposits that should be showing different statuses in UI
    const depositIds = [
      'WBk9U1bigYxr4TAuLHNQ', // Three Generations (should show Payment Transferred)
      'rqVTpl8uXEYiQNI2ektg', // testing product (should show Payment Transferred)
      'myp4E98DJXi1BtA8un6W'  // Electroplating (should show Payment Transferred)
    ];
    
    console.log(`\n📦 Testing ${depositIds.length} specific deposits from screenshot:`);
    
    // Get all receipts (simulate what the UI would fetch)
    const receiptsSnapshot = await db.collection('receipts_v2').get();
    const allReceipts = receiptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📋 Found ${allReceipts.length} total receipts in system`);
    
    // Filter for relevant receipts (approved/paid status)
    const relevantReceipts = allReceipts.filter(receipt => 
      receipt.status === 'approved' || receipt.status === 'paid'
    );
    
    console.log(`📋 Found ${relevantReceipts.length} approved/paid receipts`);
    
    // Test each deposit
    for (const depositId of depositIds) {
      console.log(`\n🔍 Testing deposit: ${depositId}`);
      
      // Get deposit details
      const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
      
      if (!depositDoc.exists) {
        console.log(`   ❌ Deposit not found`);
        continue;
      }
      
      const deposit = depositDoc.data();
      console.log(`   📦 Product: ${deposit.productName?.substring(0, 50)}...`);
      console.log(`   📊 Status: ${deposit.status}`);
      console.log(`   💰 Price: $${deposit.price}`);
      
      // Test UI detection logic
      const hasReceipt = getDepositReceiptStatus({ id: depositId }, relevantReceipts);
      
      console.log(`   🎯 UI Detection Result: ${hasReceipt ? '✅ HAS RECEIPT' : '❌ NO RECEIPT'}`);
      
      if (hasReceipt) {
        console.log(`   Expected UI: Checkbox hidden, deposit button hidden`);
      } else {
        console.log(`   Expected UI: Checkbox visible, "Pay Now" button visible`);
      }
      
      // Find which receipts match this deposit
      const matchingReceipts = relevantReceipts.filter(receipt => 
        receipt.pendingDepositId === depositId ||
        (receipt.pendingDepositIds && receipt.pendingDepositIds.includes(depositId))
      );
      
      if (matchingReceipts.length > 0) {
        console.log(`   📋 Matching receipts:`);
        matchingReceipts.forEach(receipt => {
          console.log(`      - ${receipt.id}: ${receipt.status} (${receipt.isWalletPayment ? 'wallet' : 'USDT'}) ${receipt.isBulkPayment ? '[BULK]' : '[SINGLE]'}`);
        });
      } else {
        console.log(`   ⚠️  No matching receipts found - this explains why UI shows "Payment Required"`);
      }
      
      console.log(`   ${'='.repeat(70)}`);
    }
    
    // Test the bulk receipt detection specifically
    console.log(`\n🔍 BULK RECEIPT DETECTION TEST:`);
    
    const bulkReceipts = allReceipts.filter(receipt => receipt.isBulkPayment);
    console.log(`📋 Found ${bulkReceipts.length} bulk receipts`);
    
    bulkReceipts.forEach(receipt => {
      console.log(`\n   📋 Bulk Receipt: ${receipt.id}`);
      console.log(`      Status: ${receipt.status}`);
      console.log(`      Type: ${receipt.isWalletPayment ? 'Wallet' : 'USDT'}`);
      console.log(`      Deposits: ${receipt.pendingDepositIds?.length || 0}`);
      
      if (receipt.pendingDepositIds) {
        receipt.pendingDepositIds.forEach((depositId, index) => {
          const position = index === 0 ? '1st' : index === 1 ? '2nd' : `${index+1}th`;
          console.log(`         ${position}: ${depositId}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error during UI logic test:', error);
  }
}

// Execute the test
testUILogic()
  .then(() => {
    console.log('\n✅ UI logic test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

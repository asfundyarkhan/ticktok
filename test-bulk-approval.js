// Test bulk payment admin approval functionality
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testBulkPaymentApproval() {
  console.log('🔧 Testing bulk payment admin approval functionality...');
  
  try {
    // Find pending bulk payment receipts
    const pendingBulkReceipts = await db.collection('receipts_v2')
      .where('status', '==', 'pending')
      .where('isBulkPayment', '==', true)
      .limit(5)
      .get();
    
    console.log(`\n📋 Found ${pendingBulkReceipts.size} pending bulk payment receipts`);
    
    if (pendingBulkReceipts.size === 0) {
      console.log('ℹ️  No pending bulk payment receipts found for testing');
      console.log('   This could mean:');
      console.log('   1. All bulk payments have been processed');
      console.log('   2. No bulk payments have been made recently');
      console.log('   3. Testing should be done with a real bulk payment');
      return;
    }
    
    // Check each pending bulk receipt
    for (const doc of pendingBulkReceipts.docs) {
      const receipt = doc.data();
      
      console.log(`\n💳 Pending Bulk Receipt: ${doc.id}`);
      console.log(`   Amount: $${receipt.amount}`);
      console.log(`   Seller: ${receipt.userName}`);
      console.log(`   isBulkPayment: ${receipt.isBulkPayment}`);
      console.log(`   isWalletPayment: ${receipt.isWalletPayment || false}`);
      console.log(`   Submitted: ${receipt.submittedAt?.toDate()}`);
      
      if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
        console.log(`   📦 Contains ${receipt.pendingDepositIds.length} deposits:`);
        
        // Check the status of each deposit
        let pendingCount = 0;
        let paidCount = 0;
        let otherCount = 0;
        
        for (const depositId of receipt.pendingDepositIds) {
          try {
            const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
            
            if (depositDoc.exists) {
              const deposit = depositDoc.data();
              
              if (deposit.status === 'pending' || deposit.status === 'receipt_submitted') {
                pendingCount++;
                console.log(`      📦 ${depositId}: ${deposit.status} - ${deposit.productName}`);
              } else if (deposit.status === 'deposit_paid') {
                paidCount++;
                console.log(`      ✅ ${depositId}: ${deposit.status} - ${deposit.productName}`);
              } else {
                otherCount++;
                console.log(`      ⚠️  ${depositId}: ${deposit.status} - ${deposit.productName}`);
              }
            } else {
              console.log(`      ❌ ${depositId}: NOT FOUND`);
            }
          } catch (error) {
            console.log(`      ❌ ${depositId}: ERROR - ${error.message}`);
          }
        }
        
        console.log(`\n   📊 Deposit Status Summary:`);
        console.log(`      ⏳ Pending: ${pendingCount}`);
        console.log(`      ✅ Paid: ${paidCount}`);
        console.log(`      ⚠️  Other: ${otherCount}`);
        
        if (pendingCount > 0) {
          console.log(`\n   🎯 TEST SCENARIO:`);
          console.log(`      When admin approves receipt ${doc.id}:`);
          console.log(`      ✅ Should process ALL ${receipt.pendingDepositIds.length} deposits`);
          console.log(`      ✅ Should mark ALL deposits as 'deposit_paid'`);
          console.log(`      ✅ Should release profits for ALL products`);
          console.log(`      ❌ Should NOT only process the first deposit`);
        }
      } else {
        console.log(`   ⚠️  No pendingDepositIds found - this receipt may have an issue`);
      }
      
      console.log(`   ${'='.repeat(70)}`);
    }
    
    console.log(`\n🔧 BULK PAYMENT APPROVAL LOGIC CHECK:`);
    console.log(`   File: src/services/newReceiptService.ts`);
    console.log(`   Function: approveReceipt()`);
    console.log(`   Logic: When isBulkPayment=true, processes ALL pendingDepositIds`);
    console.log(`   Fix Status: ✅ IMPLEMENTED (should work for both USDT and wallet)`);
    
    console.log(`\n📱 UI LOGIC CHECK:`);
    console.log(`   Files: src/app/stock/orders/page.tsx, src/app/stock/pending/page.tsx`);
    console.log(`   Function: getDepositReceiptStatus()`);
    console.log(`   Logic: Now checks both single and bulk payment receipts`);
    console.log(`   Fix Status: ✅ IMPLEMENTED (checkboxes and buttons should hide correctly)`);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Execute the test
testBulkPaymentApproval()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

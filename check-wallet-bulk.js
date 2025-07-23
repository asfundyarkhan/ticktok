// Simple test for wallet payment bulk deposit issues
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkWalletBulkIssue() {
  console.log('🔍 Checking wallet payment bulk deposit issue...');
  
  try {
    // Check for wallet payment receipts
    const walletReceiptsSnapshot = await db.collection('receipts_v2')
      .where('isWalletPayment', '==', true)
      .limit(5)
      .get();
    
    console.log(`\n💳 Found ${walletReceiptsSnapshot.size} wallet payment receipts:`);
    
    walletReceiptsSnapshot.forEach(doc => {
      const receipt = doc.data();
      
      console.log(`\n🧾 Wallet Receipt: ${doc.id}`);
      console.log(`   Amount: $${receipt.amount}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   isBulkPayment: ${receipt.isBulkPayment || false}`);
      console.log(`   pendingDepositIds: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.length + ' deposits' : 'Single deposit'}`);
      console.log(`   isAutoProcessed: ${receipt.isAutoProcessed || false}`);
      
      if (receipt.isBulkPayment && receipt.pendingDepositIds) {
        console.log(`   🚨 BULK WALLET PAYMENT DETECTED!`);
        console.log(`   📊 This receipt should process ${receipt.pendingDepositIds.length} deposits`);
        console.log(`   🔧 Current logic may only process first deposit`);
      }
    });
    
    console.log(`\n📋 ISSUE SUMMARY:`);
    console.log(`   The wallet payment logic in newReceiptService.ts only handles:`);
    console.log(`   ✅ Single deposits: depositInfo.pendingDepositId`);
    console.log(`   ❌ Bulk deposits: depositInfo.pendingDepositIds (MISSING)`);
    console.log(`   `);
    console.log(`   🔧 FIX NEEDED:`);
    console.log(`   When isWalletPayment=true AND isBulkPayment=true:`);
    console.log(`   - Process ALL deposits in pendingDepositIds array`);
    console.log(`   - Mark ALL deposits as deposit_paid`);
    console.log(`   - Release profits for ALL products`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWalletBulkIssue()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

// Check specific bulk wallet payment deposit processing
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSpecificBulkWallet() {
  console.log('🔍 Checking specific bulk wallet payment processing...');
  
  try {
    const receiptId = '17WS5RXdsrMpPHQkZSt4';
    
    // Get the bulk wallet receipt
    const receiptDoc = await db.collection('receipts_v2').doc(receiptId).get();
    
    if (receiptDoc.exists) {
      const receipt = receiptDoc.data();
      
      console.log(`\n💳 Bulk Wallet Receipt: ${receiptId}`);
      console.log(`   Amount: $${receipt.amount}`);
      console.log(`   Status: ${receipt.status}`);
      console.log(`   isWalletPayment: ${receipt.isWalletPayment}`);
      console.log(`   isBulkPayment: ${receipt.isBulkPayment}`);
      console.log(`   isAutoProcessed: ${receipt.isAutoProcessed}`);
      console.log(`   Deposit Count: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.length : 0}`);
      
      if (receipt.pendingDepositIds) {
        console.log(`\n📦 Checking ${receipt.pendingDepositIds.length} deposits from this bulk wallet payment:`);
        
        let processedCount = 0;
        let unprocessedCount = 0;
        
        for (const depositId of receipt.pendingDepositIds) {
          try {
            const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
            
            if (depositDoc.exists) {
              const deposit = depositDoc.data();
              
              if (deposit.status === 'deposit_paid') {
                processedCount++;
                console.log(`   ✅ ${depositId}: ${deposit.status} - ${deposit.productName}`);
              } else {
                unprocessedCount++;
                console.log(`   ❌ ${depositId}: ${deposit.status} - ${deposit.productName} (NOT PROCESSED)`);
              }
            } else {
              console.log(`   ⚠️  ${depositId}: NOT FOUND`);
            }
          } catch (error) {
            console.log(`   ❌ ${depositId}: ERROR - ${error.message}`);
          }
        }
        
        console.log(`\n📊 RESULTS:`);
        console.log(`   ✅ Processed deposits: ${processedCount}`);
        console.log(`   ❌ Unprocessed deposits: ${unprocessedCount}`);
        console.log(`   💰 Total paid: $${receipt.amount}`);
        
        if (unprocessedCount > 0) {
          console.log(`\n🚨 CRITICAL ISSUE CONFIRMED:`);
          console.log(`   Seller paid $${receipt.amount} via wallet`);
          console.log(`   But only ${processedCount}/${processedCount + unprocessedCount} deposits were processed`);
          console.log(`   ${unprocessedCount} deposits remain unprocessed`);
          console.log(`   Seller lost money and didn't get full service!`);
        } else {
          console.log(`\n✅ All deposits processed correctly`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificBulkWallet()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

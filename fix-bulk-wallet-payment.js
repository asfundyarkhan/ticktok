// Fix the existing broken bulk wallet payment
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixBrokenBulkWalletPayment() {
  console.log('🔧 Fixing broken bulk wallet payment...');
  
  try {
    const receiptId = '17WS5RXdsrMpPHQkZSt4';
    
    // Get the receipt details
    const receiptDoc = await db.collection('receipts_v2').doc(receiptId).get();
    
    if (!receiptDoc.exists) {
      console.log('❌ Receipt not found');
      return;
    }
    
    const receipt = receiptDoc.data();
    
    console.log(`\n💳 Processing bulk wallet payment fix:`);
    console.log(`   Receipt: ${receiptId}`);
    console.log(`   Amount: $${receipt.amount}`);
    console.log(`   Status: ${receipt.status}`);
    console.log(`   isWalletPayment: ${receipt.isWalletPayment}`);
    console.log(`   isBulkPayment: ${receipt.isBulkPayment}`);
    console.log(`   Deposit count: ${receipt.pendingDepositIds ? receipt.pendingDepositIds.length : 0}`);
    
    if (!receipt.pendingDepositIds || receipt.pendingDepositIds.length === 0) {
      console.log('❌ No pendingDepositIds found in receipt');
      return;
    }
    
    // Process each deposit that should have been paid via wallet
    let processedCount = 0;
    let alreadyProcessedCount = 0;
    let errorCount = 0;
    
    console.log(`\n🔧 Processing ${receipt.pendingDepositIds.length} deposits...`);
    
    for (const depositId of receipt.pendingDepositIds) {
      try {
        console.log(`\n📦 Processing deposit: ${depositId}`);
        
        // Check current status
        const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
        
        if (!depositDoc.exists) {
          console.log(`   ❌ Deposit not found`);
          errorCount++;
          continue;
        }
        
        const deposit = depositDoc.data();
        console.log(`   Current status: ${deposit.status}`);
        console.log(`   Product: ${deposit.productName}`);
        console.log(`   Amount: $${deposit.totalDepositRequired}`);
        
        if (deposit.status === 'deposit_paid') {
          console.log(`   ✅ Already processed, skipping`);
          alreadyProcessedCount++;
          continue;
        }
        
        // Update the deposit to paid status since wallet payment was already processed
        const updateData = {
          status: 'deposit_paid',
          receiptId: receiptId,
          paidAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
          paymentMethod: 'wallet',
          notes: 'Fixed bulk wallet payment - deposit should have been paid when wallet was charged'
        };
        
        await db.collection('pending_deposits').doc(depositId).update(updateData);
        
        console.log(`   ✅ Updated to deposit_paid`);
        processedCount++;
        
        // Also check if there's profit to release
        if (deposit.profitAmount && deposit.profitAmount > 0) {
          try {
            // Add profit to seller's wallet
            const sellerRef = db.collection('users').doc(deposit.sellerId);
            const sellerDoc = await sellerRef.get();
            
            if (sellerDoc.exists) {
              const sellerData = sellerDoc.data();
              const currentBalance = sellerData.walletBalance || 0;
              const newBalance = currentBalance + deposit.profitAmount;
              
              await sellerRef.update({
                walletBalance: newBalance,
                updatedAt: admin.firestore.Timestamp.now()
              });
              
              console.log(`   💰 Released profit: $${deposit.profitAmount} (new balance: $${newBalance})`);
            }
          } catch (profitError) {
            console.log(`   ⚠️  Deposit updated but profit release failed:`, profitError.message);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing deposit:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 BULK WALLET PAYMENT FIX RESULTS:`);
    console.log(`   ✅ Newly processed: ${processedCount}`);
    console.log(`   ✅ Already processed: ${alreadyProcessedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   💰 Total amount charged: $${receipt.amount}`);
    
    if (processedCount > 0) {
      console.log(`\n🎉 SUCCESS: Fixed ${processedCount} deposits that were incorrectly unpaid`);
      console.log(`   The seller's wallet was charged $${receipt.amount} but only 1 deposit was processed`);
      console.log(`   Now all ${processedCount + alreadyProcessedCount} deposits are properly paid`);
      console.log(`   Seller will receive profits for all their sold items`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing bulk wallet payment:', error);
  }
}

// Execute the fix
fixBrokenBulkWalletPayment()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

// Script to fix USDT receipts not showing in history
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixReceiptPaymentTypes() {
  console.log('🔧 Starting to fix receipt payment types...');
  
  try {
    // Get all receipts
    const receiptsSnapshot = await db.collection('receipts_v2')
      .get();
    
    console.log(`Found ${receiptsSnapshot.size} receipts to check`);
    
    let updatedCount = 0;
    let walletCount = 0;
    let usdtCount = 0;
    const batch = db.batch();
    let currentBatch = batch;
    let operationsCount = 0;
    
    // Process receipts in batches
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      const isWalletPayment = data.isWalletPayment === true;
      const isAutoProcessed = data.isAutoProcessed === true;
      
      // If payment method isn't explicitly set, we need to fix it
      if (isWalletPayment) {
        walletCount++;
      } else {
        // Explicitly mark as not a wallet payment to ensure it shows in USDT history
        usdtCount++;
        
        // Only update if the field is missing or undefined
        if (data.isWalletPayment === undefined) {
          currentBatch.update(doc.ref, {
            isWalletPayment: false,
            paymentMethod: 'USDT', // Explicitly mark payment method
            updatedAt: admin.firestore.Timestamp.now()
          });
          operationsCount++;
          updatedCount++;
          
          // Firebase has a limit of 500 operations per batch
          if (operationsCount >= 400) {
            console.log(`Committing batch of ${operationsCount} updates...`);
            await currentBatch.commit();
            currentBatch = db.batch();
            operationsCount = 0;
          }
        }
      }
    }
    
    // Commit any remaining updates
    if (operationsCount > 0) {
      await currentBatch.commit();
      console.log(`Committed final batch of ${operationsCount} updates`);
    }
    
    console.log(`📊 Receipt payment types summary:`);
    console.log(`✅ Total receipts checked: ${receiptsSnapshot.size}`);
    console.log(`💰 Wallet payments: ${walletCount}`);
    console.log(`💵 USDT payments: ${usdtCount}`);
    console.log(`🔄 Updated receipts: ${updatedCount}`);
    
    return {
      success: true,
      message: `Successfully updated ${updatedCount} receipts`
    };
  } catch (error) {
    console.error('❌ Error fixing receipt payment types:', error);
    return {
      success: false,
      message: error.message || 'Failed to fix receipt payment types'
    };
  }
}

// Execute the fix
fixReceiptPaymentTypes()
  .then(result => {
    console.log(result.message);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

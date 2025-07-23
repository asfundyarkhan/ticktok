// Safe USDT Payment Tracking Fix
// This script ensures USDT payments are properly tagged for superadmin tracking
// WITHOUT deleting any existing fields

const admin = require('firebase-admin');
const fs = require('fs');

// Check for service account file
if (!fs.existsSync('./serviceAccountKey.json')) {
  console.error('❌ ERROR: serviceAccountKey.json file not found!');
  console.error('Please place your Firebase service account key in the project root.');
  process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function safelyFixUSDTTracking() {
  console.log('🔧 Starting safe USDT payment tracking fix...');
  console.log('This script ONLY ADDS missing fields, never removes existing data.');
  
  try {
    // Get all receipts to analyze
    const receiptsSnapshot = await db.collection('receipts_v2').get();
    
    if (receiptsSnapshot.empty) {
      console.log('❌ No receipts found in collection.');
      return;
    }

    console.log(`Found ${receiptsSnapshot.size} receipts to analyze`);
    
    let needsUpdateCount = 0;
    let alreadyTaggedCount = 0;
    let walletPaymentCount = 0;
    let depositPaymentCount = 0;
    
    // First pass: analyze the data
    console.log('\n📊 Analyzing receipt data...');
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      
      // Count existing properly tagged receipts
      if (data.isWalletPayment === true) {
        walletPaymentCount++;
        alreadyTaggedCount++;
      } else if (data.isWalletPayment === false) {
        alreadyTaggedCount++;
      } else if (data.isDepositPayment === true) {
        depositPaymentCount++;
        if (data.isWalletPayment === undefined) {
          needsUpdateCount++;
        }
      } else {
        // Receipt with no payment type tags
        needsUpdateCount++;
      }
    }
    
    console.log(`\n📈 Analysis Results:`);
    console.log(`- Wallet payments already tagged: ${walletPaymentCount}`);
    console.log(`- Deposit payments found: ${depositPaymentCount}`);
    console.log(`- Receipts already properly tagged: ${alreadyTaggedCount}`);
    console.log(`- Receipts that need payment type tagging: ${needsUpdateCount}`);
    
    if (needsUpdateCount === 0) {
      console.log('✅ All receipts are already properly tagged!');
      return;
    }
    
    // Second pass: safely add missing tags
    console.log(`\n🔄 Adding missing payment type tags to ${needsUpdateCount} receipts...`);
    
    let batch = db.batch();
    let batchCount = 0;
    let updatedCount = 0;
    
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      const updates = {};
      let needsUpdate = false;
      
      // Only add fields that are missing, never overwrite existing ones
      if (data.isWalletPayment === undefined) {
        if (data.isAutoProcessed === true || data.walletBalanceUsed > 0) {
          // This is a wallet payment
          updates.isWalletPayment = true;
          if (!data.paymentMethod) {
            updates.paymentMethod = 'wallet';
          }
          needsUpdate = true;
        } else {
          // This is a USDT payment (manual receipt submission)
          updates.isWalletPayment = false;
          if (!data.paymentMethod) {
            updates.paymentMethod = 'USDT';
          }
          needsUpdate = true;
        }
      }
      
      // Ensure deposit payments are properly tagged
      if (data.isDepositPayment === undefined && 
          (data.pendingDepositId || data.productName || data.description?.includes('deposit'))) {
        updates.isDepositPayment = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        // Add metadata about this update
        updates.trackingFixed = true;
        updates.trackingFixedAt = admin.firestore.Timestamp.now();
        
        batch.update(doc.ref, updates);
        batchCount++;
        updatedCount++;
        
        if (batchCount >= 450) { // Firestore batch limit is 500
          console.log(`Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }
    
    if (batchCount > 0) {
      console.log(`Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }
    
    console.log(`\n✅ Safe tracking fix complete!`);
    console.log(`- Updated ${updatedCount} receipts with missing payment type tags`);
    console.log(`- All existing data preserved`);
    console.log(`- USDT payments should now appear in superadmin tracking`);
    
  } catch (error) {
    console.error('❌ Error during safe tracking fix:', error);
  }
}

// Run the fix
safelyFixUSDTTracking().then(() => {
  console.log('\n🏁 Safe USDT tracking fix completed.');
  console.log('Your superadmin receipt tracking should now show both wallet and USDT payments.');
});

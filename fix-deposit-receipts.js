// Script to fix deposit receipts not showing in history for superadmins
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixDepositReceipts() {
  console.log('🔧 Starting to fix deposit receipts for history tracking...');
  
  try {
    // Get all deposit receipts
    const depositReceiptsSnapshot = await db.collection('receipts_v2')
      .where('isDepositPayment', '==', true)
      .get();
    
    console.log(`Found ${depositReceiptsSnapshot.size} deposit receipts`);
    
    let updatedCount = 0;
    const batch = db.batch();
    
    // Process receipts in batches
    depositReceiptsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure the receipt has all fields properly set for superadmin history tracking
      const updates = {
        // Make sure these fields are set correctly
        isDepositPayment: true,
        
        // Add a history tracking field if it doesn't exist
        historyTrackingEnabled: true,
        
        // Make sure timestamp formats are correct
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      // Apply updates
      batch.update(doc.ref, updates);
      updatedCount++;
      
      // Firebase has a limit of 500 operations per batch
      if (updatedCount % 400 === 0) {
        console.log(`Committing batch of ${updatedCount} updates...`);
        batch.commit();
        batch = db.batch();
      }
    });
    
    // Commit any remaining updates
    if (updatedCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully updated ${updatedCount} deposit receipts`);
    
    // Fix any pending deposits that might not be showing correctly
    const pendingDepositsSnapshot = await db.collection('pending_deposits')
      .get();
      
    console.log(`Found ${pendingDepositsSnapshot.size} pending deposits`);
    
    let depositUpdatedCount = 0;
    const depositBatch = db.batch();
    
    pendingDepositsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure the deposit has history tracking fields
      const updates = {
        // Add a history tracking field if it doesn't exist
        historyTrackingEnabled: true,
        
        // Make sure timestamp formats are correct
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      // Apply updates
      depositBatch.update(doc.ref, updates);
      depositUpdatedCount++;
      
      // Firebase has a limit of 500 operations per batch
      if (depositUpdatedCount % 400 === 0) {
        console.log(`Committing batch of ${depositUpdatedCount} deposit updates...`);
        depositBatch.commit();
        depositBatch = db.batch();
      }
    });
    
    // Commit any remaining updates
    if (depositUpdatedCount % 400 !== 0) {
      await depositBatch.commit();
    }
    
    console.log(`✅ Successfully updated ${depositUpdatedCount} pending deposits`);
    
    return {
      success: true,
      message: `Successfully fixed ${updatedCount} deposit receipts and ${depositUpdatedCount} pending deposits for history tracking.`
    };
  } catch (error) {
    console.error('❌ Error fixing deposit receipts:', error);
    return {
      success: false,
      message: error.message || 'Failed to fix deposit receipts'
    };
  }
}

// Execute the fix
fixDepositReceipts()
  .then(result => {
    console.log(result.message);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

// Script to restore deleted receipt data
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';

// Read the service account file
const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function restoreReceiptData() {
  console.log('🔄 Starting restoration of receipt data...');
  
  try {
    // Get all receipts
    const receiptsSnapshot = await db.collection('receipts_v2')
      .get();
    
    console.log(`Found ${receiptsSnapshot.size} receipts to process`);
    
    let updatedCount = 0;
    const batch = db.batch();
    let currentBatch = batch;
    let operationsCount = 0;
    
    // Process receipts in batches
    for (const doc of receiptsSnapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Restore isWalletPayment field if it was changed incorrectly
      if (data.paymentMethod === 'USDT' && data.isWalletPayment === false) {
        // USDT payments can remain false, but we'll make sure the paymentMethod field is correctly set
        updates.paymentMethod = 'USDT';
        needsUpdate = true;
      }
      
      if (data.paymentMethod === 'wallet' && data.isWalletPayment !== true) {
        // Restore wallet payments
        updates.isWalletPayment = true;
        updates.paymentMethod = 'wallet';
        needsUpdate = true;
      }
      
      // If fields were removed during the previous operation, check common fields that should be present
      const commonFields = ['amount', 'currency', 'customerId', 'sellerId', 'status', 'submittedAt'];
      for (const field of commonFields) {
        if (data[field] === undefined && doc.id) {
          console.log(`❗ Receipt ${doc.id} is missing field ${field}`);
        }
      }
      
      if (needsUpdate) {
        updates.updatedAt = Timestamp.now();
        updates.restored = true; // Mark as restored
        
        currentBatch.update(doc.ref, updates);
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
    
    // Commit remaining updates
    if (operationsCount > 0) {
      console.log(`Committing final batch of ${operationsCount} updates...`);
      await currentBatch.commit();
    }
    
    console.log(`✅ Restoration complete! Updated ${updatedCount} receipts.`);
    console.log('⚠️ If you had completely deleted records, they cannot be automatically restored.');
    console.log('⚠️ Please contact Firebase support for data recovery options if needed.');
    
  } catch (error) {
    console.error('❌ Error restoring receipt data:', error);
  }
}

// Run the restoration function
restoreReceiptData().then(() => {
  console.log('📊 Data restoration process completed.');
}).catch(err => {
  console.error('Failed to complete restoration:', err);
});

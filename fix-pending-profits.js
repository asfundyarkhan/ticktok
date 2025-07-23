// Script to fix pending profit amounts for sold items
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixPendingProfitAmounts() {
  console.log('🔧 Fixing pending profit amounts for sold items...');
  
  try {
    // Get all sold deposits that have pendingProfitAmount = 0
    const depositsSnapshot = await db.collection('pending_deposits')
      .where('status', '==', 'sold')
      .where('pendingProfitAmount', '==', 0)
      .get();
    
    console.log(`Found ${depositsSnapshot.size} sold deposits with zero profit to fix`);
    
    let fixedCount = 0;
    
    // Process in smaller batches to avoid issues
    const batchSize = 100;
    const docs = depositsSnapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = db.batch();
      const batchDocs = docs.slice(i, i + batchSize);
      
      for (const doc of batchDocs) {
        const data = doc.data();
        
        // Calculate correct profit
        const originalCost = data.originalCostPerUnit;
        const salePrice = data.salePrice || data.listingPrice;
        const quantity = data.actualQuantitySold || data.quantityListed || 1;
        
        if (originalCost && salePrice) {
          const expectedProfit = (salePrice - originalCost) * quantity;
          
          console.log(`Fixing ${data.productName}: Setting profit to $${expectedProfit.toFixed(2)}`);
          
          batch.update(doc.ref, {
            pendingProfitAmount: expectedProfit,
            updatedAt: admin.firestore.Timestamp.now()
          });
          
          fixedCount++;
        }
      }
      
      if (batchDocs.length > 0) {
        await batch.commit();
        console.log(`Batch ${Math.floor(i/batchSize) + 1} committed (${batchDocs.length} items)`);
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} pending profit amounts`);
    
    return {
      success: true,
      message: `Successfully fixed ${fixedCount} pending profit amounts`
    };
    
  } catch (error) {
    console.error('❌ Error fixing pending profit amounts:', error);
    return {
      success: false,
      message: error.message || 'Failed to fix pending profit amounts'
    };
  }
}

// Execute the fix
fixPendingProfitAmounts()
  .then(result => {
    console.log('\n' + result.message);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

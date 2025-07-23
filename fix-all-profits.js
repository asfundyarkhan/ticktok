// Script to check and fix pending profit amounts
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
  console.log('🔧 Checking and fixing pending profit amounts...');
  
  try {
    // Get all sold deposits
    const depositsSnapshot = await db.collection('pending_deposits')
      .where('status', '==', 'sold')
      .get();
    
    console.log(`Found ${depositsSnapshot.size} sold deposits to check`);
    
    let needsFixCount = 0;
    let fixedCount = 0;
    
    // Check each deposit
    for (const doc of depositsSnapshot.docs) {
      const data = doc.data();
      const currentProfit = data.pendingProfitAmount;
      
      // Calculate what the profit should be
      const originalCost = data.originalCostPerUnit;
      const salePrice = data.salePrice || data.listingPrice;
      const quantity = data.actualQuantitySold || data.quantityListed || 1;
      
      if (originalCost && salePrice) {
        const expectedProfit = (salePrice - originalCost) * quantity;
        
        // Check if profit is missing, null, undefined, or incorrect
        if (currentProfit === null || currentProfit === undefined || 
            Math.abs((currentProfit || 0) - expectedProfit) > 0.01) {
          
          needsFixCount++;
          console.log(`${data.productName}:`);
          console.log(`  Current profit: ${currentProfit}`);
          console.log(`  Expected profit: ${expectedProfit.toFixed(2)}`);
          console.log(`  Sale price: ${salePrice}, Original cost: ${originalCost}, Qty: ${quantity}`);
          
          // Fix it
          try {
            await doc.ref.update({
              pendingProfitAmount: expectedProfit,
              updatedAt: admin.firestore.Timestamp.now()
            });
            fixedCount++;
            console.log(`  ✅ Fixed!`);
          } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
          }
          
          console.log('');
          
          // Add small delay to avoid overwhelming Firestore
          if (fixedCount % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`Total sold deposits: ${depositsSnapshot.size}`);
    console.log(`Needed fixing: ${needsFixCount}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    
    return {
      success: true,
      message: `Successfully checked ${depositsSnapshot.size} deposits and fixed ${fixedCount} profit amounts`
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
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

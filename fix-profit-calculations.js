// Script to fix profit calculations and ensure 30% markup consistency
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixProfitCalculations() {
  console.log('🔧 Starting to fix profit calculations...');
  
  try {
    // Get all pending deposits
    const depositsSnapshot = await db.collection('pending_deposits').get();
    console.log(`Found ${depositsSnapshot.size} pending deposits to check`);
    
    let fixedCount = 0;
    let correctCount = 0;
    const batch = db.batch();
    
    for (const doc of depositsSnapshot.docs) {
      const data = doc.data();
      const depositRef = doc.ref;
      
      // Skip if missing essential data
      if (!data.originalCostPerUnit || !data.listingPrice) {
        console.log(`⚠️ Skipping ${data.productName} - missing cost or price data`);
        continue;
      }
      
      // Calculate what the values should be with 30% markup
      const expectedListingPrice = data.originalCostPerUnit * 1.3; // 30% markup
      const expectedProfitPerUnit = expectedListingPrice - data.originalCostPerUnit;
      const quantity = data.actualQuantitySold || data.quantityListed || 1;
      const expectedTotalDeposit = data.originalCostPerUnit * quantity;
      const expectedTotalProfit = expectedProfitPerUnit * quantity;
      
      // Check if current values are correct (with small tolerance for floating point)
      const listingPriceCorrect = Math.abs(data.listingPrice - expectedListingPrice) < 0.01;
      const depositCorrect = Math.abs((data.totalDepositRequired || 0) - expectedTotalDeposit) < 0.01;
      const profitCorrect = Math.abs((data.pendingProfitAmount || 0) - expectedTotalProfit) < 0.01;
      
      if (listingPriceCorrect && depositCorrect && profitCorrect) {
        correctCount++;
        continue;
      }
      
      // Log what needs to be fixed
      console.log(`\n🔧 Fixing ${data.productName}:`);
      console.log(`  Original Cost: $${data.originalCostPerUnit}`);
      console.log(`  Current Listing Price: $${data.listingPrice} → Should be: $${expectedListingPrice.toFixed(2)}`);
      console.log(`  Current Deposit: $${data.totalDepositRequired} → Should be: $${expectedTotalDeposit.toFixed(2)}`);
      console.log(`  Current Profit: $${data.pendingProfitAmount || 0} → Should be: $${expectedTotalProfit.toFixed(2)}`);
      
      // Prepare updates
      const updates = {
        listingPrice: expectedListingPrice,
        profitPerUnit: expectedProfitPerUnit,
        totalDepositRequired: expectedTotalDeposit,
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      // Only update profit if the item has been sold
      if (data.status === 'sold' || data.status === 'deposit_paid') {
        updates.pendingProfitAmount = expectedTotalProfit;
        updates.salePrice = expectedListingPrice; // Ensure sale price matches listing price
      }
      
      batch.update(depositRef, updates);
      fixedCount++;
      
      // Commit batch in chunks to avoid limits
      if (fixedCount % 400 === 0) {
        console.log(`Committing batch of ${fixedCount} updates...`);
        await batch.commit();
        // Create new batch
        const newBatch = db.batch();
        Object.assign(batch, newBatch);
      }
    }
    
    // Commit any remaining updates
    if (fixedCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`\n✅ Fix Summary:`);
    console.log(`📊 Total deposits checked: ${depositsSnapshot.size}`);
    console.log(`✅ Already correct: ${correctCount}`);
    console.log(`🔧 Fixed: ${fixedCount}`);
    
    // Now check and fix any product listings that might have wrong prices
    console.log(`\n🏪 Checking product listings...`);
    const listingsSnapshot = await db.collection('listings').get();
    console.log(`Found ${listingsSnapshot.size} listings to check`);
    
    let listingFixedCount = 0;
    let listingCorrectCount = 0;
    const listingBatch = db.batch();
    
    for (const doc of listingsSnapshot.docs) {
      const listingData = doc.data();
      
      // Get the original product cost
      if (!listingData.productId) continue;
      
      try {
        const productDoc = await db.collection('products').doc(listingData.productId).get();
        if (!productDoc.exists()) continue;
        
        const productData = productDoc.data();
        const originalCost = productData.price;
        
        if (!originalCost) continue;
        
        const expectedListingPrice = originalCost * 1.3; // 30% markup
        const currentPrice = listingData.price;
        
        if (Math.abs(currentPrice - expectedListingPrice) < 0.01) {
          listingCorrectCount++;
          continue;
        }
        
        console.log(`🔧 Fixing listing for ${listingData.name}:`);
        console.log(`  Current Price: $${currentPrice} → Should be: $${expectedListingPrice.toFixed(2)}`);
        
        listingBatch.update(doc.ref, {
          price: expectedListingPrice,
          updatedAt: admin.firestore.Timestamp.now()
        });
        
        listingFixedCount++;
        
        if (listingFixedCount % 400 === 0) {
          console.log(`Committing listing batch of ${listingFixedCount} updates...`);
          await listingBatch.commit();
          // Create new batch
          const newListingBatch = db.batch();
          Object.assign(listingBatch, newListingBatch);
        }
        
      } catch (error) {
        console.error(`Error checking listing ${doc.id}:`, error);
      }
    }
    
    // Commit any remaining listing updates
    if (listingFixedCount % 400 !== 0) {
      await listingBatch.commit();
    }
    
    console.log(`\n✅ Listings Fix Summary:`);
    console.log(`📊 Total listings checked: ${listingsSnapshot.size}`);
    console.log(`✅ Already correct: ${listingCorrectCount}`);
    console.log(`🔧 Fixed: ${listingFixedCount}`);
    
    return {
      success: true,
      message: `Successfully fixed profit calculations. Deposits: ${fixedCount} fixed, ${correctCount} already correct. Listings: ${listingFixedCount} fixed, ${listingCorrectCount} already correct.`
    };
    
  } catch (error) {
    console.error('❌ Error fixing profit calculations:', error);
    return {
      success: false,
      message: error.message || 'Failed to fix profit calculations'
    };
  }
}

// Execute the fix
fixProfitCalculations()
  .then(result => {
    console.log('\n' + result.message);
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

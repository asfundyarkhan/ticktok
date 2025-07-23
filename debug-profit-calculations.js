// Script to debug and fix profit calculations in orders
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugProfitCalculations() {
  console.log('🔍 Debugging profit calculations...');
  
  try {
    // Get all pending deposits to see current profit calculations
    const depositsSnapshot = await db.collection('pending_deposits')
      .where('status', '==', 'sold')
      .limit(5)
      .get();
    
    console.log(`Found ${depositsSnapshot.size} sold deposits to analyze`);
    
    depositsSnapshot.forEach(doc => {
      const data = doc.data();
      
      console.log('\n--- Deposit Analysis ---');
      console.log(`Product: ${data.productName}`);
      console.log(`Original Cost Per Unit: $${data.originalCostPerUnit}`);
      console.log(`Listing Price: $${data.listingPrice}`);
      console.log(`Sale Price: $${data.salePrice}`);
      console.log(`Quantity Sold: ${data.actualQuantitySold || data.quantityListed}`);
      console.log(`Expected Profit Per Unit: $${data.listingPrice - data.originalCostPerUnit}`);
      console.log(`Actual Pending Profit: $${data.pendingProfitAmount}`);
      console.log(`Total Deposit Required: $${data.totalDepositRequired}`);
      
      // Calculate what the profit should be with 30% markup
      const expectedListingPrice = data.originalCostPerUnit * 1.3; // 30% markup
      const expectedProfitPerUnit = expectedListingPrice - data.originalCostPerUnit;
      const quantity = data.actualQuantitySold || data.quantityListed;
      const expectedTotalProfit = expectedProfitPerUnit * quantity;
      
      console.log('\n--- Expected with 30% markup ---');
      console.log(`Expected Listing Price: $${expectedListingPrice.toFixed(2)}`);
      console.log(`Expected Profit Per Unit: $${expectedProfitPerUnit.toFixed(2)}`);
      console.log(`Expected Total Profit: $${expectedTotalProfit.toFixed(2)}`);
      
      // Check if current values match expected
      const profitMatch = Math.abs((data.pendingProfitAmount || 0) - expectedTotalProfit) < 0.01;
      const priceMatch = Math.abs((data.listingPrice || 0) - expectedListingPrice) < 0.01;
      
      console.log(`\n✅ Profit calculation correct: ${profitMatch}`);
      console.log(`✅ Listing price correct: ${priceMatch}`);
      console.log('----------------------------');
    });
    
    // Also check products collection to see admin stock prices
    console.log('\n🏪 Checking admin stock prices...');
    const productsSnapshot = await db.collection('products')
      .limit(3)
      .get();
    
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Product: ${data.name} - Admin Price: $${data.price}`);
      console.log(`Expected Seller Listing Price: $${(data.price * 1.3).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging profit calculations:', error);
  }
}

// Execute the debug
debugProfitCalculations()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

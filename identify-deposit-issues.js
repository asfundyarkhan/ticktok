// Script to identify bulk payment and deposit calculation issues
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function identifyDepositIssues() {
  console.log('🔧 Identifying Deposit and Bulk Payment Issues...');
  
  try {
    // Find deposits where listed quantity > sold quantity (potential overpayment issue)
    console.log('\n📋 Looking for deposits with quantity mismatches...');
    
    const depositsSnapshot = await db.collection('pending_deposits')
      .where('status', 'in', ['sold', 'receipt_submitted'])
      .get();
    
    let issuesFound = 0;
    
    depositsSnapshot.forEach(doc => {
      const data = doc.data();
      const quantityListed = data.quantityListed || 1;
      const quantitySold = data.actualQuantitySold || quantityListed;
      const originalCostPerUnit = data.originalCostPerUnit || 0;
      const totalDepositRequired = data.totalDepositRequired || 0;
      
      // Check if there's a mismatch
      if (quantityListed > quantitySold) {
        const expectedDeposit = originalCostPerUnit * quantityListed; // What they're paying
        const correctDeposit = originalCostPerUnit * quantitySold;    // What they should pay
        
        if (Math.abs(totalDepositRequired - expectedDeposit) < 0.01) {
          console.log(`\n⚠️  ISSUE FOUND: ${data.productName}`);
          console.log(`   Seller ID: ${data.sellerId}`);
          console.log(`   Listed: ${quantityListed}, Sold: ${quantitySold}`);
          console.log(`   Paying: $${totalDepositRequired} (for ${quantityListed} units)`);
          console.log(`   Should pay: $${correctDeposit} (for ${quantitySold} units)`);
          console.log(`   Overpayment: $${(totalDepositRequired - correctDeposit).toFixed(2)}`);
          issuesFound++;
        }
      }
    });
    
    console.log(`\n📊 Found ${issuesFound} deposits with overpayment issues`);
    
    // Check bulk payment receipts
    console.log('\n📋 Checking bulk payment receipts...');
    
    const receiptsSnapshot = await db.collection('receipts_v2')
      .where('isBulkPayment', '==', true)
      .get();
    
    console.log(`Found ${receiptsSnapshot.size} bulk payment receipts`);
    
    receiptsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n📦 Bulk Receipt: ${doc.id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Has pendingDepositIds: ${!!data.pendingDepositIds}`);
      console.log(`   Number of deposits: ${data.pendingDepositIds?.length || 0}`);
      console.log(`   Amount: $${data.amount}`);
      
      if (!data.pendingDepositIds || data.pendingDepositIds.length === 0) {
        console.log(`   ❌ ISSUE: Bulk receipt missing pendingDepositIds`);
      } else {
        console.log(`   ✅ Bulk receipt properly configured`);
      }
    });
    
    // Check for pending deposits that should be in 'sold' status but might not be
    console.log('\n📋 Checking deposit status accuracy...');
    
    const allDepositsSnapshot = await db.collection('pending_deposits')
      .where('actualQuantitySold', '>', 0)
      .where('status', '!=', 'sold')
      .get();
    
    console.log(`Found ${allDepositsSnapshot.size} deposits with sold quantity but wrong status`);
    
    allDepositsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n📦 Status Issue: ${data.productName}`);
      console.log(`   Current Status: ${data.status}`);
      console.log(`   Sold Quantity: ${data.actualQuantitySold}`);
      console.log(`   Should be status: 'sold'`);
    });
    
    console.log('\n🎯 Issues Summary:');
    console.log(`   💰 Deposit overpayment issues: ${issuesFound}`);
    console.log(`   📦 Bulk payment receipts analyzed: ${receiptsSnapshot.size}`);
    console.log(`   📊 Status mismatches: ${allDepositsSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

// Execute the analysis
identifyDepositIssues()
  .then(() => {
    console.log('\n✅ Analysis completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

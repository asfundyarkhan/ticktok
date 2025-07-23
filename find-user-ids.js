// Find the correct user ID and check the ID structure
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findUserAndCheckIds() {
  console.log('🔍 Finding user with pending deposits and checking ID structure...');
  
  try {
    // First, find users with pending deposits
    const pendingDepositsSnapshot = await db.collection('pending_deposits')
      .limit(10)
      .get();
    
    console.log(`\n📦 Found ${pendingDepositsSnapshot.size} pending deposits total`);
    
    const userIds = new Set();
    const sampleDeposits = [];
    
    pendingDepositsSnapshot.forEach(doc => {
      const deposit = doc.data();
      userIds.add(deposit.sellerId);
      
      if (sampleDeposits.length < 3) {
        sampleDeposits.push({
          id: doc.id,
          sellerId: deposit.sellerId,
          productName: deposit.productName,
          status: deposit.status,
          price: deposit.price
        });
      }
    });
    
    console.log(`👤 Found deposits for ${userIds.size} different sellers`);
    console.log(`📦 Sample deposits:`);
    
    sampleDeposits.forEach(deposit => {
      console.log(`   📦 ${deposit.id}: ${deposit.productName} - ${deposit.status} ($${deposit.price})`);
      console.log(`      Seller: ${deposit.sellerId}`);
    });
    
    // Pick the first user and check their receipts
    const firstUserId = sampleDeposits[0]?.sellerId;
    if (!firstUserId) {
      console.log('❌ No pending deposits found');
      return;
    }
    
    console.log(`\n🔍 Checking receipts for user: ${firstUserId}`);
    
    // Get user's deposit receipts
    const receiptsSnapshot = await db.collection('receipts_v2')
      .where('userId', '==', firstUserId)
      .where('isDepositPayment', '==', true)
      .get();
    
    console.log(`📋 Found ${receiptsSnapshot.size} deposit receipts for this user`);
    
    if (receiptsSnapshot.size > 0) {
      receiptsSnapshot.forEach(doc => {
        const receipt = doc.data();
        
        console.log(`\n   📋 Receipt: ${doc.id}`);
        console.log(`      Status: ${receipt.status}`);
        console.log(`      isBulkPayment: ${receipt.isBulkPayment}`);
        
        if (receipt.pendingDepositId) {
          console.log(`      pendingDepositId: ${receipt.pendingDepositId}`);
        }
        
        if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
          console.log(`      pendingDepositIds: [${receipt.pendingDepositIds.join(', ')}]`);
          
          // Check if these deposit IDs exist
          console.log(`      Checking if these deposit IDs exist:`);
          receipt.pendingDepositIds.forEach(async (depositId) => {
            try {
              const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
              if (depositDoc.exists) {
                const deposit = depositDoc.data();
                console.log(`         ✅ ${depositId}: ${deposit.productName} - ${deposit.status}`);
              } else {
                console.log(`         ❌ ${depositId}: NOT FOUND`);
              }
            } catch (error) {
              console.log(`         ❌ ${depositId}: ERROR - ${error.message}`);
            }
          });
        }
      });
    }
    
    // Now check how the SellerWalletService.getPendingProfits works
    console.log(`\n🎯 KEY INSIGHT:`);
    console.log(`   The UI calls SellerWalletService.getPendingProfits(userId)`);
    console.log(`   This returns PendingProfit objects with .id property`);
    console.log(`   But receipts reference pendingDepositId/pendingDepositIds`);
    console.log(`   These IDs MUST match for the UI logic to work`);
    console.log(`\n   LIKELY ISSUE: PendingProfit.id !== pending_deposits document ID`);
    console.log(`   FIX: Check what SellerWalletService.getPendingProfits actually returns`);
    
  } catch (error) {
    console.error('❌ Error during search:', error);
  }
}

// Execute the search
findUserAndCheckIds()
  .then(() => {
    console.log('\n✅ Search completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

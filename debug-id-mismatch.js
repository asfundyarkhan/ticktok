// Debug the ID mismatch between pending profits and receipts
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugIdMismatch() {
  console.log('🔍 Debugging ID mismatch between pending profits and receipts...');
  
  try {
    // Get some pending profits for the user
    const pendingProfitsSnapshot = await db.collection('pending_deposits')
      .where('sellerId', '==', 'hUYZhQLpSPfJhU5EoaQmqUYPGLN2') // Asfund Khan's user ID
      .limit(5)
      .get();
    
    console.log(`\n📦 Found ${pendingProfitsSnapshot.size} pending deposits:`);
    
    const depositIds = [];
    
    pendingProfitsSnapshot.forEach(doc => {
      const deposit = doc.data();
      depositIds.push(doc.id);
      console.log(`   📦 Deposit ID: ${doc.id}`);
      console.log(`      Product: ${deposit.productName}`);
      console.log(`      Status: ${deposit.status}`);
      console.log(`      Price: ${deposit.price}`);
      console.log(`   ${'='.repeat(50)}`);
    });
    
    // Now check receipts that reference these deposit IDs
    console.log(`\n📋 Checking receipts for these deposit IDs:`);
    
    const receiptsSnapshot = await db.collection('receipts_v2')
      .where('userId', '==', 'hUYZhQLpSPfJhU5EoaQmqUYPGLN2')
      .where('isDepositPayment', '==', true)
      .get();
    
    console.log(`📋 Found ${receiptsSnapshot.size} deposit receipts for user`);
    
    receiptsSnapshot.forEach(doc => {
      const receipt = doc.data();
      
      console.log(`\n   📋 Receipt: ${doc.id}`);
      console.log(`      Status: ${receipt.status}`);
      console.log(`      Type: ${receipt.isWalletPayment ? 'Wallet' : 'USDT'}`);
      console.log(`      isBulkPayment: ${receipt.isBulkPayment}`);
      
      if (receipt.pendingDepositId) {
        console.log(`      pendingDepositId: ${receipt.pendingDepositId}`);
        
        // Check if this matches any of our deposit IDs
        if (depositIds.includes(receipt.pendingDepositId)) {
          console.log(`      ✅ MATCHES deposit from our list`);
        } else {
          console.log(`      ❌ Does NOT match any deposit from our list`);
        }
      }
      
      if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
        console.log(`      pendingDepositIds: [${receipt.pendingDepositIds.join(', ')}]`);
        
        // Check if any of these match our deposit IDs
        const matches = receipt.pendingDepositIds.filter(id => depositIds.includes(id));
        if (matches.length > 0) {
          console.log(`      ✅ MATCHES ${matches.length} deposits: [${matches.join(', ')}]`);
        } else {
          console.log(`      ❌ Does NOT match any deposits from our list`);
        }
      }
      
      console.log(`   ${'='.repeat(50)}`);
    });
    
    // Check the difference between pending_deposits and pending profits
    console.log(`\n🔍 Checking difference between collections:`);
    console.log(`   pending_deposits: Contains actual deposit records with price, status, etc.`);
    console.log(`   This is what receipts reference via pendingDepositId/pendingDepositIds`);
    
    // Check if there's a pending_profits collection or if it's calculated dynamically
    const pendingProfitsCollectionSnapshot = await db.collection('pending_profits').limit(1).get();
    
    if (pendingProfitsCollectionSnapshot.size > 0) {
      console.log(`   pending_profits: Separate collection exists`);
    } else {
      console.log(`   pending_profits: Likely calculated dynamically from pending_deposits`);
    }
    
    console.log(`\n🎯 CONCLUSION:`);
    console.log(`   The UI should be checking pending_deposits.id (deposit ID)`);
    console.log(`   NOT pending_profits.id (profit ID) - these are likely the same in this case`);
    console.log(`   But let's verify by testing with the actual IDs from the screenshot`);
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Execute the debug
debugIdMismatch()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

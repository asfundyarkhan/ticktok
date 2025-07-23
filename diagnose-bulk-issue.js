// Diagnose the specific bulk payment issue shown in screenshot
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function diagnoseBulkPaymentIssue() {
  console.log('🔍 Diagnosing bulk payment issue from screenshot...');
  
  try {
    // Look for recent receipts from July 23, 2025
    const today = new Date('2025-07-23');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`\n📅 Searching for receipts from ${startOfDay.toDateString()}`);
    
    // Get all receipts from today
    const receiptsSnapshot = await db.collection('receipts_v2')
      .where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
      .where('submittedAt', '<', admin.firestore.Timestamp.fromDate(endOfDay))
      .orderBy('submittedAt', 'desc')
      .get();
    
    console.log(`📋 Found ${receiptsSnapshot.size} receipts from today`);
    
    if (receiptsSnapshot.size === 0) {
      console.log('⚠️  No receipts found for today. Checking recent receipts...');
      
      // Check last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentReceipts = await db.collection('receipts_v2')
        .where('submittedAt', '>=', admin.firestore.Timestamp.fromDate(yesterday))
        .orderBy('submittedAt', 'desc')
        .limit(10)
        .get();
        
      console.log(`📋 Found ${recentReceipts.size} recent receipts`);
      receiptsSnapshot = recentReceipts;
    }
    
    // Look for bulk payment receipts specifically
    const bulkReceipts = [];
    const walletBulkReceipts = [];
    const usdtBulkReceipts = [];
    
    receiptsSnapshot.forEach(doc => {
      const receipt = doc.data();
      
      if (receipt.isBulkPayment) {
        bulkReceipts.push({ id: doc.id, ...receipt });
        
        if (receipt.isWalletPayment) {
          walletBulkReceipts.push({ id: doc.id, ...receipt });
        } else {
          usdtBulkReceipts.push({ id: doc.id, ...receipt });
        }
      }
    });
    
    console.log(`\n🔍 BULK PAYMENT ANALYSIS:`);
    console.log(`   Total bulk receipts: ${bulkReceipts.length}`);
    console.log(`   Wallet bulk receipts: ${walletBulkReceipts.length}`);
    console.log(`   USDT bulk receipts: ${usdtBulkReceipts.length}`);
    
    // Analyze wallet bulk payments (should be auto-approved)
    if (walletBulkReceipts.length > 0) {
      console.log(`\n💳 WALLET BULK PAYMENTS:`);
      
      for (const receipt of walletBulkReceipts) {
        console.log(`\n   📋 Receipt: ${receipt.id}`);
        console.log(`      Status: ${receipt.status}`);
        console.log(`      Amount: $${receipt.amount}`);
        console.log(`      Seller: ${receipt.userName}`);
        console.log(`      Submitted: ${receipt.submittedAt?.toDate()}`);
        
        if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
          console.log(`      📦 Deposits (${receipt.pendingDepositIds.length}):`);
          
          // Check each deposit status
          for (let i = 0; i < receipt.pendingDepositIds.length; i++) {
            const depositId = receipt.pendingDepositIds[i];
            
            try {
              const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
              
              if (depositDoc.exists) {
                const deposit = depositDoc.data();
                const position = i === 0 ? '1st' : i === 1 ? '2nd' : `${i+1}th`;
                
                console.log(`         ${position}: ${depositId} - Status: ${deposit.status} - ${deposit.productName?.substring(0, 30)}...`);
                
                if (deposit.status !== 'deposit_paid' && receipt.status === 'approved') {
                  console.log(`         ❌ ISSUE: Receipt approved but deposit not paid!`);
                }
              } else {
                console.log(`         ❌ ${depositId}: NOT FOUND`);
              }
            } catch (error) {
              console.log(`         ❌ ${depositId}: ERROR - ${error.message}`);
            }
          }
        }
      }
    }
    
    // Analyze USDT bulk payments (need admin approval)
    if (usdtBulkReceipts.length > 0) {
      console.log(`\n💰 USDT BULK PAYMENTS:`);
      
      for (const receipt of usdtBulkReceipts) {
        console.log(`\n   📋 Receipt: ${receipt.id}`);
        console.log(`      Status: ${receipt.status}`);
        console.log(`      Amount: $${receipt.amount}`);
        console.log(`      Seller: ${receipt.userName}`);
        console.log(`      Submitted: ${receipt.submittedAt?.toDate()}`);
        
        if (receipt.pendingDepositIds && receipt.pendingDepositIds.length > 0) {
          console.log(`      📦 Deposits (${receipt.pendingDepositIds.length}):`);
          
          // Check each deposit status
          for (let i = 0; i < receipt.pendingDepositIds.length; i++) {
            const depositId = receipt.pendingDepositIds[i];
            
            try {
              const depositDoc = await db.collection('pending_deposits').doc(depositId).get();
              
              if (depositDoc.exists) {
                const deposit = depositDoc.data();
                const position = i === 0 ? '1st' : i === 1 ? '2nd' : `${i+1}th`;
                
                console.log(`         ${position}: ${depositId} - Status: ${deposit.status} - ${deposit.productName?.substring(0, 30)}...`);
                
                if (receipt.status === 'pending' && deposit.status !== 'receipt_submitted') {
                  console.log(`         ⚠️  ISSUE: Receipt pending but deposit status inconsistent!`);
                }
              } else {
                console.log(`         ❌ ${depositId}: NOT FOUND`);
              }
            } catch (error) {
              console.log(`         ❌ ${depositId}: ERROR - ${error.message}`);
            }
          }
        }
      }
    }
    
    console.log(`\n🎯 SCREENSHOT ANALYSIS:`);
    console.log(`   Looking for pattern matching screenshot description:`);
    console.log(`   1. First & second items = wallet bulk payment`);
    console.log(`   2. Third & fourth items = USDT bulk payment`);
    console.log(`   Expected: First item processed, second item not processed in each pair`);
    
  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Execute the diagnosis
diagnoseBulkPaymentIssue()
  .then(() => {
    console.log('\n✅ Diagnosis completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

// Test script to verify admin receipt fetching
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAdminReceiptFetching() {
  console.log('🧪 TESTING ADMIN RECEIPT FETCHING');
  console.log('=================================');
  
  try {
    // Test 1: Direct query like subscribeToAllReceipts
    console.log('\n📋 Test 1: Direct query (like subscribeToAllReceipts)');
    const allReceiptsQuery = db.collection('receipts_v2')
      .orderBy('submittedAt', 'desc');
    
    const allReceiptsSnapshot = await allReceiptsQuery.get();
    console.log(`Found ${allReceiptsSnapshot.size} receipts total`);
    
    // Check first 10 receipts and count types
    const recentReceipts = [];
    let count = 0;
    let walletCount = 0;
    let usdtCount = 0;
    for (const doc of allReceiptsSnapshot.docs) {
      if (count < 10) {
        const data = doc.data();
        const isWallet = !!data.isWalletPayment;
        const isDeposit = !!data.isDepositPayment;
        recentReceipts.push({
          id: doc.id,
          status: data.status,
          amount: data.amount,
          userName: data.userName,
          isWalletPayment: isWallet,
          isDepositPayment: isDeposit,
          submittedAt: data.submittedAt?.toDate?.(),
          processedAt: data.processedAt?.toDate?.()
        });
        if (isWallet) walletCount++;
        else usdtCount++;
        count++;
      } else {
        // Still count types for all receipts
        const data = doc.data();
        if (!!data.isWalletPayment) walletCount++;
        else usdtCount++;
      }
    }

    console.log('\n📊 Recent receipts (first 10):');
    recentReceipts.forEach((receipt, index) => {
      const typeLabel = receipt.isWalletPayment ? 'Wallet' : 'USDT';
      const depositLabel = receipt.isDepositPayment ? 'Deposit' : 'Payment';
      console.log(`${index + 1}. [${receipt.status}] $${receipt.amount} - ${receipt.userName}`);
      console.log(`   Type: ${typeLabel} ${depositLabel}`);
      console.log(`   Submitted: ${receipt.submittedAt?.toISOString()}`);
      if (receipt.processedAt) {
        console.log(`   Processed: ${receipt.processedAt?.toISOString()}`);
      }
      console.log('   ---');
    });

    // Show total counts for both types
    console.log(`\n🧾 Total Wallet Receipts: ${walletCount}`);
    console.log(`🧾 Total USDT Receipts: ${usdtCount}`);

    // Test 2: Check specific status counts
    console.log('\n📈 Status breakdown of recent receipts:');
    const statusCounts = { pending: 0, approved: 0, rejected: 0 };
    recentReceipts.forEach(receipt => {
      statusCounts[receipt.status]++;
    });
    console.log(`- Pending: ${statusCounts.pending}`);
    console.log(`- Approved: ${statusCounts.approved}`);
    console.log(`- Rejected: ${statusCounts.rejected}`);

    // Test 3: Check if the query supports required fields
    console.log('\n🔍 Test 3: Check field availability');
    const sampleReceipt = recentReceipts[0];
    if (sampleReceipt) {
      console.log('Sample receipt fields:');
      console.log(`- id: ${sampleReceipt.id ? '✅' : '❌'}`);
      console.log(`- status: ${sampleReceipt.status ? '✅' : '❌'}`);
      console.log(`- amount: ${sampleReceipt.amount !== undefined ? '✅' : '❌'}`);
      console.log(`- userName: ${sampleReceipt.userName ? '✅' : '❌'}`);
      console.log(`- isWalletPayment: ${sampleReceipt.isWalletPayment !== undefined ? '✅' : '❌'}`);
      console.log(`- isDepositPayment: ${sampleReceipt.isDepositPayment !== undefined ? '✅' : '❌'}`);
      console.log(`- submittedAt: ${sampleReceipt.submittedAt ? '✅' : '❌'}`);
      console.log(`- processedAt: ${sampleReceipt.processedAt ? '✅' : '❌'}`);
    }
    
    // Test 4: Query specifically for approved receipts
    console.log('\n✅ Test 4: Query approved receipts only');
    const approvedQuery = db.collection('receipts_v2')
      .where('status', '==', 'approved')
      .orderBy('submittedAt', 'desc')
      .limit(5);
    
    const approvedSnapshot = await approvedQuery.get();
    console.log(`Found ${approvedSnapshot.size} approved receipts (showing first 5)`);
    
    approvedSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. [APPROVED] $${data.amount} - ${data.userName}`);
      console.log(`   Type: ${data.isWalletPayment ? 'Wallet' : 'USDT'} ${data.isDepositPayment ? 'Deposit' : 'Payment'}`);
      console.log(`   Processed: ${data.processedAt?.toDate?.()?.toISOString()}`);
      console.log('   ---');
    });
    
    console.log('\n✅ All tests completed!');
    console.log('\nIf you can see approved receipts here but not in the admin interface,');
    console.log('the issue is in the React component or real-time subscription logic.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    
    if (error.code === 'failed-precondition') {
      console.log('\n💡 This error suggests missing Firestore indexes.');
      console.log('Try running: firebase deploy --only firestore:indexes');
    }
  }
}

// Run the test
testAdminReceiptFetching().then(() => {
  console.log('\n🏁 Admin receipt fetching test completed.');
});

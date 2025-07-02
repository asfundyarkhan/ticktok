// Diagnostic script to check deposit status consistency
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWoAgLOcqzRGZwwpomxlhWvbITHKEaQME",
  authDomain: "ticktok-e8ed3.firebaseapp.com",
  projectId: "ticktok-e8ed3",
  storageBucket: "ticktok-e8ed3.appspot.com",
  messagingSenderId: "1037042540831",
  appId: "1:1037042540831:web:0c7fd91a0e5e5e9b16d9e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnoseDepositStatus() {
  console.log('🔍 Diagnosing deposit status consistency...\n');

  try {
    // Get all pending deposits
    const depositsSnapshot = await getDocs(collection(db, 'pending_deposits'));
    const deposits = [];
    
    depositsSnapshot.forEach(doc => {
      deposits.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📊 Found ${deposits.length} total deposits\n`);

    // Get all new receipts
    const receiptsSnapshot = await getDocs(collection(db, 'new_receipts'));
    const receipts = [];
    
    receiptsSnapshot.forEach(doc => {
      receipts.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📊 Found ${receipts.length} total receipts\n`);

    // Check for deposits marked as "deposit_paid" without corresponding approved receipts
    const depositPaidWithoutReceipt = [];
    const depositPaidWithPendingReceipt = [];

    for (const deposit of deposits) {
      if (deposit.status === 'deposit_paid') {
        // Find corresponding receipt
        const relatedReceipts = receipts.filter(receipt => 
          receipt.pendingDepositId === deposit.id
        );

        if (relatedReceipts.length === 0) {
          depositPaidWithoutReceipt.push(deposit);
        } else {
          const pendingReceipts = relatedReceipts.filter(receipt => 
            receipt.status === 'pending'
          );
          
          if (pendingReceipts.length > 0) {
            depositPaidWithPendingReceipt.push({
              deposit,
              pendingReceipts
            });
          }
        }
      }
    }

    // Report findings
    console.log('📋 DIAGNOSIS RESULTS:\n');
    
    if (depositPaidWithoutReceipt.length > 0) {
      console.log(`❌ ISSUE FOUND: ${depositPaidWithoutReceipt.length} deposits marked as "deposit_paid" without any receipt:`);
      depositPaidWithoutReceipt.forEach(deposit => {
        console.log(`   - Deposit ID: ${deposit.id}`);
        console.log(`     Product: ${deposit.productName || 'Unknown'}`);
        console.log(`     Seller: ${deposit.sellerId}`);
        console.log(`     Status: ${deposit.status}`);
        console.log(`     Created: ${deposit.createdAt?.toDate?.() || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('✅ All deposits marked as "deposit_paid" have corresponding receipts');
    }

    if (depositPaidWithPendingReceipt.length > 0) {
      console.log(`❌ MAJOR ISSUE: ${depositPaidWithPendingReceipt.length} deposits marked as "deposit_paid" but their receipts are still pending admin approval:`);
      depositPaidWithPendingReceipt.forEach(item => {
        console.log(`   - Deposit ID: ${item.deposit.id}`);
        console.log(`     Product: ${item.deposit.productName || 'Unknown'}`);
        console.log(`     Seller: ${item.deposit.sellerId}`);
        console.log(`     Deposit Status: ${item.deposit.status}`);
        console.log(`     Pending Receipts: ${item.pendingReceipts.length}`);
        item.pendingReceipts.forEach(receipt => {
          console.log(`       * Receipt ID: ${receipt.id}, Status: ${receipt.status}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ All deposits marked as "deposit_paid" have approved receipts');
    }

    // Status breakdown
    const statusBreakdown = {};
    deposits.forEach(deposit => {
      statusBreakdown[deposit.status] = (statusBreakdown[deposit.status] || 0) + 1;
    });

    console.log('\n📈 DEPOSIT STATUS BREAKDOWN:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Receipt status breakdown
    const receiptStatusBreakdown = {};
    receipts.forEach(receipt => {
      receiptStatusBreakdown[receipt.status] = (receiptStatusBreakdown[receipt.status] || 0) + 1;
    });

    console.log('\n📈 RECEIPT STATUS BREAKDOWN:');
    Object.entries(receiptStatusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

diagnoseDepositStatus().then(() => {
  console.log('\n✅ Diagnosis complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Diagnosis failed:', error);
  process.exit(1);
});

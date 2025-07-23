#!/usr/bin/env node

// Test real-time subscription to all receipts
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot, query, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC6WH1lCYDPOyLYcI4PMVY_AJaJN_CfvHU",
  authDomain: "ticktokshop-5f1e9.firebaseapp.com",
  projectId: "ticktokshop-5f1e9",
  storageBucket: "ticktokshop-5f1e9.appspot.com",
  messagingSenderId: "1013430777742",
  appId: "1:1013430777742:web:6e5c39c6a7e2f0e2e2f8fb"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

console.log('🔄 Testing real-time subscription to all receipts...');

const q = query(
  collection(firestore, "receipts_v2"),
  orderBy("submittedAt", "desc")
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  console.log(`📡 Real-time update received: ${snapshot.docs.length} receipts`);
  
  const receipts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      status: data.status,
      isWalletPayment: data.isWalletPayment,
      isDepositPayment: data.isDepositPayment,
      amount: data.amount,
      userName: data.userName,
      submittedAt: data.submittedAt?.toDate?.() || new Date(),
    };
  });

  // Group by type
  const walletReceipts = receipts.filter(r => !!r.isWalletPayment);
  const usdtReceipts = receipts.filter(r => !!r.isDepositPayment && !r.isWalletPayment);
  const manualReceipts = receipts.filter(r => !r.isDepositPayment && !r.isWalletPayment);

  console.log('📊 Breakdown:');
  console.log(`  💜 Wallet Payments: ${walletReceipts.length}`);
  console.log(`  💛 USDT Deposits: ${usdtReceipts.length}`);
  console.log(`  ⚪ Manual/Other: ${manualReceipts.length}`);

  // Show first few of each type
  console.log('\n📋 Sample receipts:');
  
  if (walletReceipts.length > 0) {
    console.log('💜 First wallet receipt:');
    const wallet = walletReceipts[0];
    console.log(`   ${wallet.status} - $${wallet.amount} - ${wallet.userName} - ${wallet.submittedAt.toLocaleDateString()}`);
  }
  
  if (usdtReceipts.length > 0) {
    console.log('💛 First USDT receipt:');
    const usdt = usdtReceipts[0];
    console.log(`   ${usdt.status} - $${usdt.amount} - ${usdt.userName} - ${usdt.submittedAt.toLocaleDateString()}`);
  }
  
  if (manualReceipts.length > 0) {
    console.log('⚪ First manual receipt:');
    const manual = manualReceipts[0];
    console.log(`   ${manual.status} - $${manual.amount} - ${manual.userName} - ${manual.submittedAt.toLocaleDateString()}`);
  }

  console.log('\n✅ Real-time subscription test completed');
  console.log('If this shows all types but the UI doesn\'t, the issue is in React rendering');
  
  // Clean up after 3 seconds
  setTimeout(() => {
    unsubscribe();
    process.exit(0);
  }, 3000);
});

console.log('⏳ Listening for 3 seconds...');

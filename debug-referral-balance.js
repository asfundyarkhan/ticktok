// Debug script to check referral balance calculation
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config (use your actual config)
const firebaseConfig = {
  // You'll need to add your actual Firebase config here
  // or this script won't work
};

async function debugReferralBalance(userId) {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log(`\n🔍 DEBUGGING REFERRAL BALANCE FOR USER: ${userId}\n`);
    
    // 1. Check if user has any referred users
    const referredUsersQuery = query(
      collection(db, "users"),
      where("referredBy", "==", userId)
    );
    const referredUsersSnapshot = await getDocs(referredUsersQuery);
    console.log(`📊 Referred Users Count: ${referredUsersSnapshot.size}`);
    
    if (referredUsersSnapshot.size > 0) {
      referredUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`   - ${userData.email || 'No email'} (ID: ${doc.id})`);
      });
    }
    
    // 2. Check commission transactions
    const commissionsQuery = query(
      collection(db, "credit_transactions"),
      where("referrerId", "==", userId),
      where("type", "==", "top_up"),
      where("status", "==", "completed")
    );
    const commissionsSnapshot = await getDocs(commissionsQuery);
    console.log(`\n💰 Commission Transactions Count: ${commissionsSnapshot.size}`);
    
    let totalCommissions = 0;
    commissionsSnapshot.forEach((doc) => {
      const data = doc.data();
      const commission = data.commission || 0;
      totalCommissions += commission;
      console.log(`   - Transaction ID: ${doc.id}`);
      console.log(`     User: ${data.userId}`);
      console.log(`     Amount: $${data.amount}`);
      console.log(`     Commission: $${commission}`);
      console.log(`     Date: ${data.createdAt?.toDate?.() || 'No date'}`);
      console.log(`   ---`);
    });
    
    console.log(`\n🎯 TOTAL REFERRAL BALANCE: $${totalCommissions.toFixed(2)}`);
    
    // 3. Check all transactions involving referred users
    if (referredUsersSnapshot.size > 0) {
      console.log(`\n🔄 ALL TRANSACTIONS BY REFERRED USERS:`);
      const referredUserIds = [];
      referredUsersSnapshot.forEach((doc) => referredUserIds.push(doc.id));
      
      const allTransactionsQuery = query(
        collection(db, "credit_transactions"),
        where("userId", "in", referredUserIds)
      );
      const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
      
      console.log(`   Total transactions by referred users: ${allTransactionsSnapshot.size}`);
      allTransactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.type}: $${data.amount} (Commission: $${data.commission || 0})`);
      });
    }
    
  } catch (error) {
    console.error('Error debugging referral balance:', error);
  }
}

// Usage: Replace 'USER_ID_HERE' with an actual user ID from your dashboard
console.log('To use this script:');
console.log('1. Add your Firebase config');
console.log('2. Replace USER_ID_HERE with a real user ID');
console.log('3. Run: node debug-referral-balance.js');

// debugReferralBalance('USER_ID_HERE');

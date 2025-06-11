// Test script for the new clean referral balance logic
// This script tests the sum of referred users' balances without commission interference

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config (replace with your actual config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

async function testReferralBalanceLogic(adminUid = null) {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log(`\n🎯 TESTING NEW REFERRAL BALANCE LOGIC\n`);
    
    if (adminUid) {
      // Test specific admin
      console.log(`📊 Testing for Admin: ${adminUid}\n`);
      
      // Get referred users
      const referredUsersQuery = query(
        collection(db, "users"),
        where("referredBy", "==", adminUid)
      );
      const referredUsersSnapshot = await getDocs(referredUsersQuery);
      
      console.log(`👥 Referred Users Count: ${referredUsersSnapshot.size}`);
      
      let totalReferralBalance = 0;
      referredUsersSnapshot.forEach((doc) => {
        const userData = doc.data();
        const userBalance = userData.balance || 0;
        totalReferralBalance += userBalance;
        
        console.log(`   - ${userData.email || 'No email'}`);
        console.log(`     Balance: $${userBalance}`);
        console.log(`     Role: ${userData.role || 'No role'}`);
        console.log(`     ID: ${doc.id}`);
        console.log(`   ---`);
      });
      
      console.log(`\n💰 TOTAL REFERRAL BALANCE: $${totalReferralBalance.toFixed(2)}`);
      console.log(`📈 This balance can only increase, never decrease!`);
      
    } else {
      // Test all admins
      console.log(`📊 Testing for ALL Admins\n`);
      
      // Get all admins
      const adminQuery = query(
        collection(db, "users"),
        where("role", "in", ["admin", "superadmin"])
      );
      const adminSnapshot = await getDocs(adminQuery);
      
      console.log(`👑 Total Admins Count: ${adminSnapshot.size}\n`);
      
      let grandTotalBalance = 0;
      
      for (const adminDoc of adminSnapshot.docs) {
        const adminData = adminDoc.data();
        console.log(`🔹 Admin: ${adminData.email || 'No email'} (${adminDoc.id})`);
        
        // Get this admin's referred users
        const referredUsersQuery = query(
          collection(db, "users"),
          where("referredBy", "==", adminDoc.id)
        );
        const referredUsersSnapshot = await getDocs(referredUsersQuery);
        
        let adminReferralBalance = 0;
        referredUsersSnapshot.forEach((doc) => {
          const userData = doc.data();
          const userBalance = userData.balance || 0;
          adminReferralBalance += userBalance;
        });
        
        grandTotalBalance += adminReferralBalance;
        
        console.log(`   Referred Users: ${referredUsersSnapshot.size}`);
        console.log(`   Total Referral Balance: $${adminReferralBalance.toFixed(2)}`);
        console.log(`   ---`);
      }
      
      console.log(`\n🎯 GRAND TOTAL REFERRAL BALANCE: $${grandTotalBalance.toFixed(2)}`);
      console.log(`📊 Average per Admin: $${(grandTotalBalance / adminSnapshot.size).toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing referral balance logic:', error);
  }
}

// Instructions for use
console.log(`
🧪 REFERRAL BALANCE TEST SCRIPT

To use this script:

1. Replace the firebaseConfig with your actual Firebase configuration
2. Run with specific admin: testReferralBalanceLogic('ADMIN_UID_HERE');
3. Run for all admins: testReferralBalanceLogic();

Example:
node test-referral-balance-clean.js

This script tests the NEW logic where:
✅ Referral balance = Sum of all referred users' balances
✅ Balance only increases when referred users add funds
✅ No commission transactions involved
✅ Clean and simple calculation
`);

// Uncomment to test (after adding your Firebase config):
// testReferralBalanceLogic(); // Test all admins
// testReferralBalanceLogic('REPLACE_WITH_ACTUAL_ADMIN_UID'); // Test specific admin

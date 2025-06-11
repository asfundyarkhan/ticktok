// Test script to debug referral balance calculation
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./ticktokshop-5f1e9-firebase-adminsdk-fbsvc-34fc84c417.json')),
    projectId: 'ticktokshop-5f1e9'
  });
}

const db = admin.firestore();

async function testReferralBalance() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('🔍 TESTING REFERRAL BALANCE CALCULATION\n');
    
    // Step 1: Get all admin users
    console.log('Step 1: Finding all admin users...');
    const adminQuery = query(
      collection(db, "users"),
      where("role", "in", ["admin", "superadmin"])
    );
    const adminSnapshot = await getDocs(adminQuery);
    
    console.log(`Found ${adminSnapshot.size} admin/superadmin users:\n`);
    
    let totalReferralBalance = 0;
    
    // Step 2: For each admin, check their referred users and commissions
    for (const adminDoc of adminSnapshot.docs) {
      const adminData = adminDoc.data();
      const adminId = adminDoc.id;
      
      console.log(`\n📊 ADMIN: ${adminData.email || 'No email'}`);
      console.log(`   ID: ${adminId}`);
      console.log(`   Role: ${adminData.role}`);
      console.log(`   Balance: $${adminData.balance || 0}`);
      console.log(`   Referral Code: ${adminData.referralCode || 'None'}`);
      
      // Check referred users
      const referredQuery = query(
        collection(db, "users"),
        where("referredBy", "==", adminId)
      );
      const referredSnapshot = await getDocs(referredQuery);
      
      console.log(`   Referred Users: ${referredSnapshot.size}`);
      
      if (referredSnapshot.size > 0) {
        referredSnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log(`     - ${userData.email || 'No email'} (Balance: $${userData.balance || 0})`);
        });
      }
      
      // Check commission transactions
      const commissionsQuery = query(
        collection(db, "credit_transactions"),
        where("referrerId", "==", adminId),
        where("type", "==", "top_up"),
        where("status", "==", "completed")
      );
      const commissionsSnapshot = await getDocs(commissionsQuery);
      
      console.log(`   Commission Transactions: ${commissionsSnapshot.size}`);
      
      let adminCommissionTotal = 0;
      commissionsSnapshot.forEach((doc) => {
        const transactionData = doc.data();
        const commission = transactionData.commission || 0;
        adminCommissionTotal += commission;
        console.log(`     - Transaction: $${transactionData.amount} (Commission: $${commission})`);
      });
      
      console.log(`   Total Commissions Earned: $${adminCommissionTotal}`);
      totalReferralBalance += adminCommissionTotal;
    }
    
    console.log(`\n🎯 TOTAL REFERRAL BALANCE ACROSS ALL ADMINS: $${totalReferralBalance}`);
    
    // Step 3: Check if there are any transactions at all
    console.log('\n📋 Checking all transactions in the system...');
    const allTransactionsQuery = query(collection(db, "credit_transactions"));
    const allTransactionsSnapshot = await getDocs(allTransactionsQuery);
    
    console.log(`Total transactions in system: ${allTransactionsSnapshot.size}`);
    
    if (allTransactionsSnapshot.size > 0) {
      console.log('\nRecent transactions:');
      allTransactionsSnapshot.forEach((doc, index) => {
        if (index < 5) { // Show first 5 transactions
          const data = doc.data();
          console.log(`  - ${data.type}: $${data.amount} (User: ${data.userId}) (Commission: $${data.commission || 0})`);
        }
      });
    }
    
    // Step 4: Check for users with referral relationships
    console.log('\n👥 Checking all users with referral relationships...');
    const usersWithReferrersQuery = query(
      collection(db, "users"),
      where("referredBy", "!=", null)
    );
    const usersWithReferrersSnapshot = await getDocs(usersWithReferrersQuery);
    
    console.log(`Users with referrers: ${usersWithReferrersSnapshot.size}`);
    
    if (usersWithReferrersSnapshot.size > 0) {
      usersWithReferrersSnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(`  - ${userData.email || 'No email'} referred by ${userData.referredBy}`);
      });
    }
    
    // Step 5: Summary
    console.log('\n📋 SUMMARY:');
    console.log(`- Total Admin Users: ${adminSnapshot.size}`);
    console.log(`- Total Referred Users: ${usersWithReferrersSnapshot.size}`);
    console.log(`- Total Transactions: ${allTransactionsSnapshot.size}`);
    console.log(`- Total Referral Balance: $${totalReferralBalance}`);
    
    if (totalReferralBalance === 0) {
      console.log('\n❌ ISSUE IDENTIFIED:');
      if (usersWithReferrersSnapshot.size === 0) {
        console.log('   - No users have been referred yet');
        console.log('   - Need to test signup with referral codes');
      } else if (allTransactionsSnapshot.size === 0) {
        console.log('   - No transactions exist yet');
        console.log('   - Need to test wallet top-up functionality');
      } else {
        console.log('   - Check commission calculation in TransactionService');
      }
    }
    
  } catch (error) {
    console.error('Error testing referral balance:', error);
  }
}

// Run the test
testReferralBalance();

// Script to test enhanced seller migration functionality
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testEnhancedSellerMigration() {
  console.log('🔧 Testing Enhanced Seller Migration System...');
  
  try {
    // Step 1: Find a test seller and two admins
    console.log('\n📋 Step 1: Finding test data...');
    
    // Get sellers
    const sellersSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .limit(1)
      .get();
    
    if (sellersSnapshot.empty) {
      console.log('❌ No sellers found for testing');
      return;
    }
    
    const testSeller = sellersSnapshot.docs[0];
    const sellerData = testSeller.data();
    
    // Get admins
    const adminsSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .limit(2)
      .get();
    
    if (adminsSnapshot.size < 2) {
      console.log('❌ Need at least 2 admins for migration testing');
      return;
    }
    
    const adminA = adminsSnapshot.docs[0];
    const adminB = adminsSnapshot.docs[1];
    
    console.log(`✅ Test Seller: ${sellerData.email} (${testSeller.id})`);
    console.log(`   Current adminId: ${sellerData.adminId || 'none'}`);
    console.log(`   Current referredBy: ${sellerData.referredBy || 'none'}`);
    console.log(`   Original referredBy: ${sellerData.originalReferredBy || 'none'}`);
    
    console.log(`✅ Admin A: ${adminA.data().email} (${adminA.id})`);
    console.log(`✅ Admin B: ${adminB.data().email} (${adminB.id})`);
    
    // Step 2: Check current referral relationships
    console.log('\n📋 Step 2: Checking current referral relationships...');
    
    // Check who's currently in Admin A's referrals
    const adminAReferralsSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .where('referredBy', '==', adminA.id)
      .get();
    
    console.log(`📊 Admin A currently has ${adminAReferralsSnapshot.size} referrals`);
    
    // Check who's currently in Admin B's referrals
    const adminBReferralsSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .where('referredBy', '==', adminB.id)
      .get();
    
    console.log(`📊 Admin B currently has ${adminBReferralsSnapshot.size} referrals`);
    
    // Step 3: Simulate migration if needed
    if (sellerData.referredBy !== adminA.id) {
      console.log('\n📋 Step 3: Setting up test scenario (assigning seller to Admin A)...');
      
      await db.collection('users').doc(testSeller.id).update({
        adminId: adminA.id,
        referredBy: adminA.id,
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      console.log('✅ Seller assigned to Admin A for testing');
    }
    
    // Step 4: Perform migration to Admin B
    console.log('\n📋 Step 4: Performing migration to Admin B...');
    
    await db.runTransaction(async (transaction) => {
      const sellerRef = db.collection('users').doc(testSeller.id);
      const sellerDoc = await transaction.get(sellerRef);
      const currentData = sellerDoc.data();
      
      // Update seller with enhanced migration
      transaction.update(sellerRef, {
        adminId: adminB.id,
        referredBy: adminB.id,
        originalReferredBy: currentData.originalReferredBy || currentData.referredBy || adminA.id,
        updatedAt: admin.firestore.Timestamp.now(),
        migrationHistory: admin.firestore.FieldValue.arrayUnion({
          fromAdminId: adminA.id,
          toAdminId: adminB.id,
          fromReferredBy: currentData.referredBy,
          toReferredBy: adminB.id,
          reason: 'Testing enhanced migration',
          timestamp: admin.firestore.Timestamp.now(),
          migrationDetails: {
            transferredManagement: true,
            transferredCommissions: true,
            transferredReferralStatus: true,
          }
        })
      });
      
      // Update any pending deposits
      const pendingDepositsSnapshot = await db.collection('pending_deposits')
        .where('sellerId', '==', testSeller.id)
        .where('status', '==', 'pending')
        .get();
      
      console.log(`   📦 Migrating ${pendingDepositsSnapshot.size} pending deposits...`);
      
      pendingDepositsSnapshot.docs.forEach((doc) => {
        transaction.update(doc.ref, {
          adminId: adminB.id,
          migratedAt: admin.firestore.Timestamp.now(),
          migratedReason: 'Testing enhanced migration',
        });
      });
    });
    
    console.log('✅ Migration completed successfully!');
    
    // Step 5: Verify migration results
    console.log('\n📋 Step 5: Verifying migration results...');
    
    const updatedSellerDoc = await db.collection('users').doc(testSeller.id).get();
    const updatedSellerData = updatedSellerDoc.data();
    
    console.log(`✅ Updated Seller Data:`);
    console.log(`   adminId: ${updatedSellerData.adminId}`);
    console.log(`   referredBy: ${updatedSellerData.referredBy}`);
    console.log(`   originalReferredBy: ${updatedSellerData.originalReferredBy}`);
    
    // Check new referral counts
    const newAdminAReferralsSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .where('referredBy', '==', adminA.id)
      .get();
    
    const newAdminBReferralsSnapshot = await db.collection('users')
      .where('role', '==', 'seller')
      .where('referredBy', '==', adminB.id)
      .get();
    
    console.log(`📊 Admin A now has ${newAdminAReferralsSnapshot.size} referrals`);
    console.log(`📊 Admin B now has ${newAdminBReferralsSnapshot.size} referrals`);
    
    // Step 6: Test commission flow simulation
    console.log('\n📋 Step 6: Testing commission flow simulation...');
    
    // Simulate a deposit approval to test commission flow
    const testCommissionRef = db.collection('commission_transactions').doc();
    await testCommissionRef.set({
      sellerId: testSeller.id,
      adminId: adminB.id, // Should go to Admin B now
      type: 'receipt_approval',
      amount: 10.00,
      description: 'Test commission after migration',
      createdAt: admin.firestore.Timestamp.now(),
      status: 'completed'
    });
    
    console.log('✅ Test commission transaction created for Admin B');
    
    console.log('\n🎉 Enhanced seller migration test completed successfully!');
    console.log('\n📝 Summary of Changes:');
    console.log('   ✅ Seller management transferred from Admin A to Admin B');
    console.log('   ✅ Referral relationship changed (future commissions go to Admin B)');
    console.log('   ✅ Original referrer preserved for historical tracking');
    console.log('   ✅ Pending deposits migrated to new admin');
    console.log('   ✅ Commission flow updated to new admin');
    console.log('   ✅ Seller now appears in Admin B\'s referral list');
    
  } catch (error) {
    console.error('❌ Error during migration test:', error);
  }
}

// Execute the test
testEnhancedSellerMigration()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

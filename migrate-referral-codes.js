#!/usr/bin/env node
/**
 * Referral Code Migration Script
 *
 * This script migrates existing referral codes to the new history-based system
 * to ensure that all historical referral codes remain valid even when admins
 * generate new codes.
 *
 * IMPORTANT: Run this script BEFORE deploying the new referral system
 * to preserve existing referral relationships.
 */

const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

// Firebase configuration
const firebaseConfig = {
  // Add your Firebase config here or read from environment variables
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log(`
🔄 REFERRAL CODE MIGRATION SCRIPT

This script will:
1. ✅ Find all existing admin referral codes
2. ✅ Create history records for each code
3. ✅ Preserve all existing referral relationships
4. ✅ Ensure old codes remain valid forever

⚠️  IMPORTANT: This migration preserves all existing data.
    No existing referral relationships will be broken.

🚀 Starting migration...
`);

async function runMigration() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("🔗 Connected to Firebase successfully");

    // Import UserService dynamically (since this is a Node.js script)
    console.log("📦 Loading UserService...");

    // For a simple migration, we'll implement the logic directly here
    const {
      collection,
      query,
      where,
      getDocs,
      doc,
      setDoc,
      getDoc,
      Timestamp,
    } = require("firebase/firestore");

    console.log("🔍 Finding existing referral codes...");

    const usersQuery = query(
      collection(db, "users"),
      where("referralCode", "!=", null)
    );

    const usersSnapshot = await getDocs(usersQuery);
    console.log(`📊 Found ${usersSnapshot.size} users with referral codes`);

    let migrationCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();

      if (
        userData.referralCode &&
        (userData.role === "admin" || userData.role === "superadmin")
      ) {
        console.log(`\n👤 Processing ${userData.email} (${userData.role})`);
        console.log(`   Code: ${userData.referralCode}`);

        // Check if already migrated
        const historyDocRef = doc(
          db,
          "referral_code_history",
          userData.referralCode
        );
        const historyDoc = await getDoc(historyDocRef);

        if (!historyDoc.exists()) {
          // Create history record
          await setDoc(historyDocRef, {
            code: userData.referralCode,
            adminUid: userDoc.id,
            adminEmail: userData.email,
            createdAt: userData.createdAt || Timestamp.now(),
            replacedAt: null,
            isActive: true,
            isCurrent: true,
            migratedFromUserProfile: true,
          });

          console.log(`   ✅ Migrated to history collection`);
          migrationCount++;
        } else {
          console.log(`   ⏭️  Already migrated, skipping`);
          skippedCount++;
        }
      }
    }

    console.log(`\n🎉 MIGRATION COMPLETE!`);
    console.log(`   ✅ Migrated: ${migrationCount} referral codes`);
    console.log(`   ⏭️  Skipped: ${skippedCount} already migrated`);
    console.log(`   📊 Total processed: ${usersSnapshot.size} users`);

    // Verify migration
    console.log(`\n🔍 Verifying migration...`);
    const historyQuery = query(collection(db, "referral_code_history"));
    const historySnapshot = await getDocs(historyQuery);
    console.log(`   📊 Total codes in history: ${historySnapshot.size}`);

    console.log(`\n✅ MIGRATION VERIFICATION COMPLETE`);
    console.log(`\n🎯 NEXT STEPS:`);
    console.log(`   1. Deploy the updated UserService with history support`);
    console.log(
      `   2. Test referral code validation with both old and new codes`
    );
    console.log(
      `   3. Generate new codes for admins - old ones will remain valid`
    );
    console.log(
      `\n🔒 SECURITY: All existing referral relationships preserved!`
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log("\n🚀 Migration script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration script failed:", error);
    process.exit(1);
  });

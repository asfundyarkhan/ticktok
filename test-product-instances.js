/**
 * Test script for the new Product Instance System
 * This script tests the creation and management of product instances
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyBuNY5xCt5mDvKVNHGW6HgO_u4lBKhOQ6s",
  authDomain: "ticktok-8b4a4.firebaseapp.com",
  projectId: "ticktok-8b4a4",
  storageBucket: "ticktok-8b4a4.firebasestorage.app",
  messagingSenderId: "994430696708",
  appId: "1:994430696708:web:ae7a1d7a5e4f3b123c45d6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Test Instance Creation and Grouping
 */
async function testInstanceSystem() {
  console.log('🧪 Testing Product Instance System...\n');

  try {
    // 1. Get all listings
    console.log('📋 Fetching all listings...');
    const listingsRef = collection(db, 'listings');
    const snapshot = await getDocs(listingsRef);
    
    const allListings = [];
    snapshot.forEach(doc => {
      allListings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${allListings.length} total listings\n`);

    // 2. Separate instances from regular listings
    const instances = allListings.filter(listing => listing.isInstance);
    const regularListings = allListings.filter(listing => !listing.isInstance);

    console.log(`🔍 Analysis:`);
    console.log(`   - Regular listings: ${regularListings.length}`);
    console.log(`   - Product instances: ${instances.length}\n`);

    if (instances.length > 0) {
      // 3. Group instances by original product
      const instanceGroups = {};
      instances.forEach(instance => {
        const key = instance.originalProductId || instance.productId;
        if (!instanceGroups[key]) {
          instanceGroups[key] = [];
        }
        instanceGroups[key].push(instance);
      });

      console.log(`📦 Instance Groups:`);
      Object.keys(instanceGroups).forEach(productId => {
        const group = instanceGroups[productId];
        const available = group.filter(i => i.status === 'available').length;
        const sold = group.filter(i => i.status === 'sold').length;
        const pending = group.filter(i => i.status === 'pending_payment').length;

        console.log(`   🏷️  Product: ${productId}`);
        console.log(`      - Total instances: ${group.length}`);
        console.log(`      - Available: ${available}`);
        console.log(`      - Sold: ${sold}`);
        console.log(`      - Pending: ${pending}`);
        console.log(`      - Name: ${group[0]?.name || 'Unknown'}`);
        console.log(`      - Seller: ${group[0]?.sellerId || 'Unknown'}\n`);
      });

      // 4. Test grouping function simulation
      console.log(`🔄 Simulating grouping function...`);
      const grouped = groupProductInstances(allListings);
      console.log(`   - Original listings: ${allListings.length}`);
      console.log(`   - Grouped listings: ${grouped.length}`);
      console.log(`   - Compression ratio: ${((allListings.length - grouped.length) / allListings.length * 100).toFixed(1)}%\n`);

      // 5. Show sample grouped listing
      const sampleGrouped = grouped.find(g => g.instances && g.instances.length > 1);
      if (sampleGrouped) {
        console.log(`📋 Sample Grouped Listing:`);
        console.log(`   - Product: ${sampleGrouped.name}`);
        console.log(`   - Total Quantity: ${sampleGrouped.totalQuantity}`);
        console.log(`   - Available Quantity: ${sampleGrouped.availableQuantity}`);
        console.log(`   - Instance Count: ${sampleGrouped.instances.length}`);
        console.log(`   - Price: $${sampleGrouped.price}`);
        console.log(`   - Seller: ${sampleGrouped.sellerId}\n`);
      }

    } else {
      console.log(`ℹ️  No product instances found. The system will create instances when new products are listed.\n`);
    }

    // 6. Check for potential conflicts
    console.log(`🔍 Checking for potential conflicts...`);
    const productIds = new Set();
    const conflicts = [];
    
    allListings.forEach(listing => {
      if (productIds.has(listing.productId)) {
        conflicts.push(listing.productId);
      }
      productIds.add(listing.productId);
    });

    if (conflicts.length > 0) {
      console.log(`⚠️  Found ${conflicts.length} potential product ID conflicts:`);
      conflicts.forEach(id => console.log(`     - ${id}`));
    } else {
      console.log(`✅ No product ID conflicts detected.`);
    }

    console.log(`\n✅ Product Instance System test completed successfully!`);

  } catch (error) {
    console.error('❌ Error testing instance system:', error);
  }
}

/**
 * Simulate the grouping function
 */
function groupProductInstances(listings) {
  const grouped = new Map();

  for (const listing of listings) {
    const groupKey = listing.isInstance ? listing.originalProductId || listing.productId : listing.productId;
    
    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
      
      if (listing.isInstance) {
        existing.instances = existing.instances || [];
        existing.instances.push(listing);
        existing.totalQuantity = (existing.totalQuantity || 0) + listing.quantity;
        
        if (listing.status === 'available') {
          existing.availableQuantity = (existing.availableQuantity || 0) + listing.quantity;
        }
      } else {
        existing.totalQuantity = (existing.totalQuantity || 0) + listing.quantity;
        existing.availableQuantity = (existing.availableQuantity || 0) + listing.quantity;
      }
    } else {
      const groupedListing = {
        ...listing,
        totalQuantity: listing.quantity,
        availableQuantity: listing.status === 'available' ? listing.quantity : 0,
        instances: listing.isInstance ? [listing] : undefined,
      };
      grouped.set(groupKey, groupedListing);
    }
  }

  return Array.from(grouped.values());
}

// Run the test
testInstanceSystem().catch(console.error);
